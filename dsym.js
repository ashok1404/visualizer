// ── dSYM Symbolication ───────────────────────────────────────────────────────
// Everything runs in the browser: an uploaded dSYM (folder, .zip, or the bare
// DWARF binary inside Contents/Resources/DWARF) is parsed here — Mach-O load
// commands, DWARF 4/5 debug info + line tables, and the symbol table — into a
// compact per-UUID index that's kept in IndexedDB, so every payload loaded
// afterwards whose frames carry a matching image UUID (bId) gets function
// names and file:line, the same way Firebase Crashlytics matches uploaded dSYMs.
const DSYM = (() => {

  // ── byte reader ────────────────────────────────────────────────────────────
  const utf8 = new TextDecoder('utf-8');

  class Reader {
    constructor(bytes, pos = 0) {
      this.b = bytes;
      this.dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      this.pos = pos;
    }
    u8()  { return this.b[this.pos++]; }
    u16() { const v = this.dv.getUint16(this.pos, true); this.pos += 2; return v; }
    u24() { const v = this.b[this.pos] | (this.b[this.pos + 1] << 8) | (this.b[this.pos + 2] << 16); this.pos += 3; return v; }
    u32() { const v = this.dv.getUint32(this.pos, true); this.pos += 4; return v; }
    // addresses in an app image stay well under 2^53, so a Number is exact
    u64() { const lo = this.dv.getUint32(this.pos, true), hi = this.dv.getUint32(this.pos + 4, true); this.pos += 8; return hi * 4294967296 + lo; }
    uN(n) { return n === 8 ? this.u64() : n === 4 ? this.u32() : n === 2 ? this.u16() : n === 1 ? this.u8() : this.u24(); }
    s8()  { const v = this.dv.getInt8(this.pos); this.pos += 1; return v; }
    uleb() {
      let result = 0, mul = 1, byte;
      do { byte = this.b[this.pos++]; result += (byte & 0x7f) * mul; mul *= 128; } while (byte & 0x80);
      return result;
    }
    sleb() {
      let result = 0, mul = 1, byte;
      do { byte = this.b[this.pos++]; result += (byte & 0x7f) * mul; mul *= 128; } while (byte & 0x80);
      if (byte & 0x40) result -= mul;
      return result;
    }
    cstr() {
      let end = this.pos;
      while (end < this.b.length && this.b[end] !== 0) end++;
      const s = utf8.decode(this.b.subarray(this.pos, end));
      this.pos = end + 1;
      return s;
    }
  }

  function cstrAt(bytes, off) {
    if (!bytes || off >= bytes.length) return '';
    let end = off;
    while (end < bytes.length && bytes[end] !== 0) end++;
    return utf8.decode(bytes.subarray(off, end));
  }

  function fixedStr(bytes, off, len) {
    let end = off;
    while (end < off + len && bytes[end] !== 0) end++;
    return utf8.decode(bytes.subarray(off, end));
  }

  function formatUUID(bytes) {
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function normalizeUUID(uuid) {
    const hex = String(uuid || '').replace(/[^0-9a-fA-F]/g, '').toUpperCase();
    return hex.length === 32 ? formatUUID(hex.match(/../g).map(h => parseInt(h, 16))) : null;
  }

  // ── Mach-O ─────────────────────────────────────────────────────────────────
  const CPU_NAMES = { 0x0100000c: 'arm64', 0x0200000c: 'arm64_32', 0x01000007: 'x86_64', 12: 'arm', 7: 'i386' };

  function isMachO(bytes) {
    if (bytes.length < 8) return false;
    const be = (bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3]) >>> 0;
    return be === 0xcafebabe || be === 0xcafebabf || be === 0xcffaedfe || be === 0xcefaedfe;
  }

  // returns one entry per architecture slice (a thin file is a single slice)
  function machOSlices(bytes) {
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const magic = dv.getUint32(0, false);
    if (magic === 0xcafebabe || magic === 0xcafebabf) {
      const is64 = magic === 0xcafebabf;
      const n = dv.getUint32(4, false);
      const slices = [];
      for (let i = 0; i < n; i++) {
        const at = 8 + i * (is64 ? 32 : 20);
        const off  = is64 ? Number(dv.getBigUint64(at + 8, false))  : dv.getUint32(at + 8, false);
        const size = is64 ? Number(dv.getBigUint64(at + 16, false)) : dv.getUint32(at + 12, false);
        const slice = parseThinMachO(bytes.subarray(off, off + size));
        if (slice) slices.push(slice);
      }
      return slices;
    }
    const thin = parseThinMachO(bytes);
    return thin ? [thin] : [];
  }

  function parseThinMachO(bytes) {
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const magic = dv.getUint32(0, true);
    const is64 = magic === 0xfeedfacf;
    if (!is64 && magic !== 0xfeedface) return null;

    const cputype = dv.getUint32(4, true);
    const ncmds   = dv.getUint32(16, true);
    let pos = is64 ? 32 : 28;

    const slice = { bytes, arch: CPU_NAMES[cputype] || `cpu ${cputype}`, uuid: null, textVmaddr: 0, sections: {}, symtab: null };

    for (let i = 0; i < ncmds; i++) {
      const cmd = dv.getUint32(pos, true), cmdsize = dv.getUint32(pos + 4, true);
      if (cmd === 0x1b) { // LC_UUID
        slice.uuid = formatUUID(bytes.subarray(pos + 8, pos + 24));
      } else if (cmd === 0x2) { // LC_SYMTAB
        slice.symtab = { symoff: dv.getUint32(pos + 8, true), nsyms: dv.getUint32(pos + 12, true), stroff: dv.getUint32(pos + 16, true), strsize: dv.getUint32(pos + 20, true) };
      } else if (cmd === 0x19 || cmd === 0x1) { // LC_SEGMENT_64 / LC_SEGMENT
        const seg64 = cmd === 0x19;
        const segname = fixedStr(bytes, pos + 8, 16);
        const r = new Reader(bytes, pos + 24);
        const vmaddr = seg64 ? r.u64() : r.u32();
        if (segname === '__TEXT') slice.textVmaddr = vmaddr;
        const nsects = dv.getUint32(pos + (seg64 ? 64 : 48), true);
        let spos = pos + (seg64 ? 72 : 56);
        for (let s = 0; s < nsects; s++) {
          const sectname = fixedStr(bytes, spos, 16);
          const sr = new Reader(bytes, spos + 32);
          const addr = seg64 ? sr.u64() : sr.u32();
          const size = seg64 ? sr.u64() : sr.u32();
          const offset = sr.u32();
          if (segname === '__DWARF' && offset) slice.sections[sectname] = bytes.subarray(offset, offset + size);
          if (segname === '__TEXT' && sectname === '__text') slice.text = { addr, size };
          spos += seg64 ? 80 : 68;
        }
      }
      pos += cmdsize;
    }
    slice.is64 = is64;
    return slice.uuid ? slice : null;
  }

  // ── DWARF constants ────────────────────────────────────────────────────────
  const TAG_COMPILE_UNIT = 0x11, TAG_PARTIAL_UNIT = 0x3c, TAG_SUBPROGRAM = 0x2e, TAG_INLINED = 0x1d;
  // DIEs whose name becomes part of a function's qualified name (Type.method)
  const SCOPE_TAGS = new Set([0x02 /*class*/, 0x13 /*struct*/, 0x17 /*union*/, 0x04 /*enum*/, 0x39 /*namespace*/, 0x38 /*interface*/, 0x2e /*subprogram*/]);

  const AT = { name: 0x03, stmt_list: 0x10, low_pc: 0x11, high_pc: 0x12, comp_dir: 0x1b, abstract_origin: 0x31,
    specification: 0x47, ranges: 0x55, call_file: 0x58, call_line: 0x59, linkage_name: 0x6e, mips_linkage_name: 0x2007,
    str_offsets_base: 0x72, addr_base: 0x73, rnglists_base: 0x74 };

  // "address class" forms — for DW_AT_high_pc these mean an absolute address, any other form is an offset from low_pc
  const ADDR_FORMS = new Set([0x01, 0x1b, 0x29, 0x2a, 0x2b, 0x2c, 0x1f01]);
  const STRX_FORMS = new Set([0x1a, 0x25, 0x26, 0x27, 0x28, 0x1f02]);
  const REF_LOCAL_FORMS = new Set([0x11, 0x12, 0x13, 0x14, 0x15]);

  function parseAbbrevs(abbrevSec, offset, cache) {
    if (cache.has(offset)) return cache.get(offset);
    const table = new Map();
    const r = new Reader(abbrevSec, offset);
    for (;;) {
      const code = r.uleb();
      if (!code) break;
      const tag = r.uleb();
      const children = r.u8() === 1;
      const attrs = [];
      for (;;) {
        const at = r.uleb(), form = r.uleb();
        if (!at && !form) break;
        attrs.push({ at, form, implicit: form === 0x21 ? r.sleb() : 0 });
      }
      table.set(code, { tag, children, attrs });
    }
    cache.set(offset, table);
    return table;
  }

  // reads one attribute value; only numbers/strings needed downstream are
  // decoded, blocks are skipped. cu carries addrSize/offSize/version/base.
  function readForm(r, form, cu, implicit) {
    switch (form) {
      case 0x01: return r.uN(cu.addrSize);
      case 0x03: { const n = r.u16(); r.pos += n; return null; }
      case 0x04: { const n = r.u32(); r.pos += n; return null; }
      case 0x05: return r.u16();
      case 0x06: return r.u32();
      case 0x07: return r.u64();
      case 0x08: return r.cstr();
      case 0x09: case 0x18: { const n = r.uleb(); r.pos += n; return null; }
      case 0x0a: { const n = r.u8(); r.pos += n; return null; }
      case 0x0b: return r.u8();
      case 0x0c: return r.u8();
      case 0x0d: return r.sleb();
      case 0x0e: case 0x1f: case 0x17: case 0x1d: case 0x1f21: return r.uN(cu.offSize);
      case 0x0f: return r.uleb();
      case 0x10: case 0x1f20: return r.uN(cu.version <= 2 ? cu.addrSize : cu.offSize);
      case 0x11: return r.u8();
      case 0x12: return r.u16();
      case 0x13: return r.u32();
      case 0x14: return r.u64();
      case 0x15: return r.uleb();
      case 0x16: return readForm(r, r.uleb(), cu, 0);
      case 0x19: return 1;
      case 0x1a: case 0x1b: case 0x22: case 0x23: case 0x1f01: case 0x1f02: return r.uleb();
      case 0x1c: return r.u32();
      case 0x1e: r.pos += 16; return null;
      case 0x20: case 0x24: return r.u64();
      case 0x21: return implicit;
      case 0x25: case 0x29: return r.u8();
      case 0x26: case 0x2a: return r.u16();
      case 0x27: case 0x2b: return r.u24();
      case 0x28: case 0x2c: return r.u32();
      default: throw new Error(`Unsupported DWARF form 0x${form.toString(16)}`);
    }
  }

  // ── DWARF debug_info walk ──────────────────────────────────────────────────
  // collects every subprogram / inlined subroutine with code ranges, plus the
  // naming info (name, parent scope, specification/abstract_origin) needed to
  // turn "count.get" into "Array.count.get" — keyed by global DIE offset so
  // cross-CU references (dsymutil dedups types across CUs) still resolve.
  function walkDebugInfo(sec) {
    const info = sec['__debug_info'];
    const abbrevSec = sec['__debug_abbrev'];
    if (!info || !abbrevSec) return { ranges: [], dies: new Map(), cus: [] };

    const strSec = sec['__debug_str'], lineStrSec = sec['__debug_line_str'];
    const strOffSec = sec['__debug_str_offs'] || sec['__debug_str_offsets'];
    const addrSec = sec['__debug_addr'];
    const rangesSec = sec['__debug_ranges'], rnglistsSec = sec['__debug_rnglists'];

    const abbrevCache = new Map();
    const dies = new Map();   // offset → { name, parent, ref }
    const ranges = [];        // { lo, hi, die, depth }
    const cus = [];           // { stmtList, compDir, cu } — ranges point back here by index for call_file lookup

    const readAddrX = (cu, idx) => {
      if (!addrSec) return 0;
      const r = new Reader(addrSec, cu.addrBase + idx * cu.addrSize);
      return r.uN(cu.addrSize);
    };
    const strFrom = (cu, form, v) => {
      if (form === 0x08) return v;
      if (form === 0x0e) return cstrAt(strSec, v);
      if (form === 0x1f) return cstrAt(lineStrSec, v);
      if (STRX_FORMS.has(form)) {
        if (!strOffSec) return '';
        const r = new Reader(strOffSec, cu.strOffBase + v * cu.offSize);
        return cstrAt(strSec, r.uN(cu.offSize));
      }
      return null;
    };
    const addrFrom = (cu, form, v) => ([0x1b, 0x29, 0x2a, 0x2b, 0x2c, 0x1f01].includes(form) ? readAddrX(cu, v) : v);

    const readRanges = (cu, form, v) => {
      const out = [];
      if (cu.version >= 5) {
        if (!rnglistsSec) return out;
        let off = v;
        if (form === 0x23) { // rnglistx: index into the offsets table at rnglists_base
          off = cu.rnglistsBase + new Reader(rnglistsSec, cu.rnglistsBase + v * cu.offSize).uN(cu.offSize);
        }
        const r = new Reader(rnglistsSec, off);
        let base = cu.lowPc;
        for (;;) {
          const kind = r.u8();
          if (kind === 0) break;
          if (kind === 1) base = readAddrX(cu, r.uleb());
          else if (kind === 2) { const a = readAddrX(cu, r.uleb()), b = readAddrX(cu, r.uleb()); out.push([a, b]); }
          else if (kind === 3) { const a = readAddrX(cu, r.uleb()); out.push([a, a + r.uleb()]); }
          else if (kind === 4) { const a = r.uleb(), b = r.uleb(); out.push([base + a, base + b]); }
          else if (kind === 5) base = r.uN(cu.addrSize);
          else if (kind === 6) { const a = r.uN(cu.addrSize), b = r.uN(cu.addrSize); out.push([a, b]); }
          else if (kind === 7) { const a = r.uN(cu.addrSize); out.push([a, a + r.uleb()]); }
          else break;
        }
        return out;
      }
      if (!rangesSec) return out;
      const r = new Reader(rangesSec, v);
      const maxAddr = cu.addrSize === 8 ? 0xffffffffffffffff : 0xffffffff;
      let base = cu.lowPc;
      while (r.pos + cu.addrSize * 2 <= rangesSec.length) {
        const a = r.uN(cu.addrSize), b = r.uN(cu.addrSize);
        if (a === 0 && b === 0) break;
        if (a >= maxAddr) { base = b; continue; }
        out.push([base + a, base + b]);
      }
      return out;
    };

    let pos = 0;
    while (pos + 11 <= info.length) {
      const unitStart = pos;
      const r = new Reader(info, pos);
      let unitLength = r.u32(), offSize = 4;
      if (unitLength === 0xffffffff) { unitLength = r.u64(); offSize = 8; }
      const unitEnd = r.pos + unitLength;
      const version = r.u16();
      let addrSize, abbrevOff, unitType = 1;
      if (version >= 5) {
        unitType = r.u8();
        addrSize = r.u8();
        abbrevOff = r.uN(offSize);
        if (unitType === 4 || unitType === 5) r.pos += 8;               // skeleton / split_compile: dwo_id
        else if (unitType === 2 || unitType === 6) r.pos += 8 + offSize; // type units: signature + type offset
      } else {
        abbrevOff = r.uN(offSize);
        addrSize = r.u8();
      }
      pos = unitEnd;
      if (version < 2 || version > 5 || unitType === 2 || unitType === 6) continue;

      const abbrevs = parseAbbrevs(abbrevSec, abbrevOff, abbrevCache);
      const cu = { version, addrSize, offSize, lowPc: 0, strOffBase: 8, addrBase: 8, rnglistsBase: 12, start: unitStart };
      const stack = []; // parent DIE offsets for the current nesting
      let first = true;

      while (r.pos < unitEnd) {
        const dieOff = r.pos;
        const code = r.uleb();
        if (!code) { stack.pop(); continue; }
        const ab = abbrevs.get(code);
        if (!ab) break;

        const raw = [];
        for (const a of ab.attrs) {
          let form = a.form;
          if (form === 0x16) form = r.uleb(); // indirect
          raw.push([a.at, form, readForm(r, form, cu, a.implicit)]);
        }

        if (first) {
          first = false;
          // bases first — earlier strx/addrx attributes on this same DIE depend on them
          for (const [at, , v] of raw) {
            if (at === AT.str_offsets_base) cu.strOffBase = v;
            else if (at === AT.addr_base) cu.addrBase = v;
            else if (at === AT.rnglists_base) cu.rnglistsBase = v;
          }
          let stmtList = null, compDir = '';
          for (const [at, form, v] of raw) {
            if (at === AT.low_pc) cu.lowPc = addrFrom(cu, form, v);
            else if (at === AT.stmt_list) stmtList = v;
            else if (at === AT.comp_dir) compDir = strFrom(cu, form, v) || '';
          }
          if (ab.tag === TAG_COMPILE_UNIT || ab.tag === TAG_PARTIAL_UNIT) {
            cu.index = cus.length;
            cus.push({ stmtList, compDir, cu });
          }
        } else if (ab.tag === TAG_SUBPROGRAM || ab.tag === TAG_INLINED || SCOPE_TAGS.has(ab.tag)) {
          let name = null, linkage = null, ref = null, lowPc = null, highPc = null, highForm = 0, rangesAttr = null, callFile = 0, callLine = 0;
          for (const [at, form, v] of raw) {
            if (at === AT.name) name = strFrom(cu, form, v);
            else if (at === AT.linkage_name || at === AT.mips_linkage_name) linkage = strFrom(cu, form, v);
            else if (at === AT.specification || at === AT.abstract_origin) ref = REF_LOCAL_FORMS.has(form) ? unitStart + v : v;
            else if (at === AT.low_pc) lowPc = addrFrom(cu, form, v);
            else if (at === AT.high_pc) { highPc = v; highForm = form; }
            else if (at === AT.ranges) rangesAttr = [form, v];
            else if (at === AT.call_file) callFile = v;
            else if (at === AT.call_line) callLine = v;
          }
          dies.set(dieOff, { tag: ab.tag, name, linkage, ref, parent: stack.length ? stack[stack.length - 1] : null });

          if (ab.tag === TAG_SUBPROGRAM || ab.tag === TAG_INLINED) {
            const common = { die: dieOff, depth: stack.length, inlined: ab.tag === TAG_INLINED, cu: cu.index, callFile, callLine };
            if (lowPc != null && highPc != null) {
              const hi = ADDR_FORMS.has(highForm) ? addrFrom(cu, highForm, highPc) : lowPc + highPc;
              if (hi > lowPc && lowPc) ranges.push({ lo: lowPc, hi, ...common });
            } else if (rangesAttr) {
              for (const [lo, hi] of readRanges(cu, rangesAttr[0], rangesAttr[1])) {
                if (hi > lo && lo) ranges.push({ lo, hi, ...common });
              }
            }
          }
        }

        if (ab.children) stack.push(dieOff);
      }
    }
    return { ranges, dies, cus };
  }

  // naming for a code-range DIE: follow abstract_origin / specification to
  // whichever DIE carries the name, prefixing enclosing type/namespace names
  // ("count.get" → "Array.count.get"). the linkage (mangled) name is kept too
  // — when a Swift demangler is available it gives the fuller Xcode-style
  // name ("closure #1 in ContentView.body.getter"), which DWARF alone lacks.
  function dieNames(dies, off, cache) {
    if (cache.has(off)) return cache.get(off);
    let cur = dies.get(off), named = null, linkage = null, guard = 0;
    while (cur && guard++ < 16) {
      if (!linkage && cur.linkage) linkage = cur.linkage;
      if (cur.name && !named) named = cur;
      if (named && linkage) break;
      if (cur.ref == null) break;
      cur = dies.get(cur.ref);
    }
    let name = null;
    if (named) {
      const objc = /^[-+]\[/.test(named.name);
      const parts = [named.name];
      let p = named.parent != null ? dies.get(named.parent) : null, depth = 0;
      while (!objc && p && p.tag !== TAG_SUBPROGRAM && depth++ < 12) {
        if (p.name) parts.unshift(p.name);
        p = p.parent != null ? dies.get(p.parent) : null;
      }
      name = parts.join('.');
    }
    const result = { name: name || linkage || '', linkage: linkage || '' };
    cache.set(off, result);
    return result;
  }

  // ── DWARF line tables ──────────────────────────────────────────────────────
  function readLineTable(sec, stmtList, compDir, addFile) {
    const lineSec = sec['__debug_line'];
    const strSec = sec['__debug_str'], lineStrSec = sec['__debug_line_str'];
    if (!lineSec || stmtList == null || stmtList >= lineSec.length) return { sequences: [], fileIds: [] };

    const r = new Reader(lineSec, stmtList);
    let unitLength = r.u32(), offSize = 4;
    if (unitLength === 0xffffffff) { unitLength = r.u64(); offSize = 8; }
    const end = r.pos + unitLength;
    const version = r.u16();
    let addrSize = 8;
    if (version >= 5) { addrSize = r.u8(); r.u8(); }
    const headerLength = r.uN(offSize);
    const progStart = r.pos + headerLength;
    const minInst = r.u8();
    const maxOps = version >= 4 ? r.u8() : 1; void maxOps;
    const defaultIsStmt = r.u8(); void defaultIsStmt;
    const lineBase = r.s8();
    const lineRange = r.u8();
    const opcodeBase = r.u8();
    const stdLens = [];
    for (let i = 1; i < opcodeBase; i++) stdLens.push(r.u8());

    const dirs = [];
    const files = []; // resolved path strings
    const cuStub = { addrSize, offSize, version };

    const joinPath = (dir, name) => {
      if (!name) return '';
      if (name.startsWith('/') || !dir) return name;
      return dir.endsWith('/') ? dir + name : `${dir}/${name}`;
    };

    if (version >= 5) {
      const readEntries = () => {
        const fmtCount = r.u8();
        const fmt = [];
        for (let i = 0; i < fmtCount; i++) fmt.push([r.uleb(), r.uleb()]);
        const count = r.uleb();
        const out = [];
        for (let i = 0; i < count; i++) {
          const e = { path: '', dir: 0 };
          for (const [ct, form] of fmt) {
            const v = readForm(r, form, cuStub, 0);
            if (ct === 1) e.path = form === 0x08 ? v : form === 0x1f ? cstrAt(lineStrSec, v) : form === 0x0e ? cstrAt(strSec, v) : '';
            else if (ct === 2) e.dir = v;
          }
          out.push(e);
        }
        return out;
      };
      for (const d of readEntries()) dirs.push(d.path);
      for (const f of readEntries()) files.push(joinPath(joinPath(compDir, dirs[f.dir] || ''), f.path));
    } else {
      dirs.push(compDir);
      for (;;) { const d = r.cstr(); if (!d) break; dirs.push(d.startsWith('/') ? d : joinPath(compDir, d)); }
      files.push(''); // v2-4 file indexes are 1-based
      for (;;) {
        const name = r.cstr();
        if (!name) break;
        const dir = r.uleb(); r.uleb(); r.uleb();
        files.push(joinPath(dirs[dir] || '', name));
      }
    }

    const fileIds = files.map(f => (f ? addFile(f) : -1));
    const defineFile = (name, dir) => { files.push(joinPath(dirs[dir] || '', name)); fileIds.push(addFile(files[files.length - 1])); };

    const sequences = [];
    let rows = [];
    let address = 0, file = 1, line = 1;
    const reset = () => { address = 0; file = 1; line = 1; };
    const emit = () => { rows.push(address, fileIds[file] != null ? fileIds[file] : -1, line); };

    r.pos = progStart;
    while (r.pos < end) {
      const op = r.u8();
      if (op >= opcodeBase) {
        const adj = op - opcodeBase;
        address += Math.floor(adj / lineRange) * minInst;
        line += lineBase + (adj % lineRange);
        emit();
      } else if (op === 0) {
        const len = r.uleb();
        const next = r.pos + len;
        const sub = r.u8();
        if (sub === 1) { emit(); if (rows.length) sequences.push(rows); rows = []; reset(); }
        else if (sub === 2) address = r.uN(len - 1);
        else if (sub === 3) { const n = r.cstr(); const d = r.uleb(); r.uleb(); r.uleb(); defineFile(n, d); }
        r.pos = next;
      } else if (op === 1) emit();
      else if (op === 2) address += r.uleb() * minInst;
      else if (op === 3) line += r.sleb();
      else if (op === 4) file = r.uleb();
      else if (op === 5) r.uleb();
      else if (op === 8) address += Math.floor((255 - opcodeBase) / lineRange) * minInst;
      else if (op === 9) address += r.u16();
      else if (op === 12) r.uleb();
      else if (op === 6 || op === 7 || op === 10 || op === 11) { /* flags only */ }
      else for (let i = 0; i < stdLens[op - 1]; i++) r.uleb();
    }
    return { sequences, fileIds };
  }

  // ── Symbol table (fallback when DWARF has no range for an address) ─────────
  function readSymtab(slice) {
    const st = slice.symtab;
    if (!st || !st.nsyms) return [];
    const b = slice.bytes;
    const entSize = slice.is64 ? 16 : 12;
    if (st.symoff + st.nsyms * entSize > b.length) return [];
    const r = new Reader(b);
    const out = [];
    for (let i = 0; i < st.nsyms; i++) {
      r.pos = st.symoff + i * entSize;
      const strx = r.u32(), type = r.u8(); r.u8(); r.u16();
      const value = slice.is64 ? r.u64() : r.u32();
      if (type & 0xe0) continue;            // stabs
      if ((type & 0x0e) !== 0x0e) continue; // N_SECT only
      let name = cstrAt(b.subarray(st.stroff, st.stroff + st.strsize), strx);
      if (!name) continue;
      if (name.startsWith('_')) name = name.slice(1); // C/ObjC/Swift symbols carry a leading underscore
      out.push([value, name]);
    }
    out.sort((a, b2) => a[0] - b2[0]);
    return out;
  }

  // ── Index build ────────────────────────────────────────────────────────────
  const INDEX_VERSION = 2;
  const NO_FILE = 0xffffffff, END_SEQ = 0xfffffffe;

  // turns nested (possibly overlapping) code ranges into flat, sorted,
  // non-overlapping segments; each carries the stack of ranges covering it,
  // outermost first — the concrete function followed by its inline chain
  function flattenRanges(ranges, chainOf) {
    ranges.sort((a, b) => a.lo - b.lo || b.hi - a.hi || a.depth - b.depth);
    const out = [];
    const stack = [];
    let cursor = 0;
    const emitTo = to => {
      if (stack.length && to > cursor) {
        const chain = chainOf(stack);
        const last = out.length ? out[out.length - 1] : null;
        if (last && last[1] === cursor && last[2] === chain) last[1] = to;
        else out.push([cursor, to, chain]);
      }
      if (to > cursor) cursor = to;
    };
    for (const rg of ranges) {
      while (stack.length && stack[stack.length - 1].hi <= rg.lo) { emitTo(stack[stack.length - 1].hi); stack.pop(); }
      emitTo(rg.lo);
      cursor = Math.max(cursor, rg.lo);
      stack.push(rg);
    }
    while (stack.length) { emitTo(stack[stack.length - 1].hi); stack.pop(); }
    return out;
  }

  // builds a structured-cloneable index for one arch slice. addresses are
  // stored relative to the image's __TEXT vmaddr, which is exactly the
  // "Binary + <offset>" number an unsymbolicated frame carries.
  //   funcs:  [lo, hi, chainOffset] per segment
  //   chains: [count, (nameId, linkageId, callFileId, callLine) × count] —
  //           entry k's call site is where it was inlined into entry k-1
  //   lines:  [offset, fileId, line]; fileId END_SEQ closes a sequence
  //   syms:   [offset, nameId] from the symbol table, a fallback for code DWARF doesn't cover
  function buildIndex(slice, binaryName) {
    const base = slice.textVmaddr;
    const strings = [''];
    const stringIds = new Map([['', 0]]);
    const intern = s => {
      let id = stringIds.get(s);
      if (id === undefined) { id = strings.length; strings.push(s); stringIds.set(s, id); }
      return id;
    };

    const { ranges, dies, cus } = walkDebugInfo(slice.sections);

    // line tables first — inlined call sites name their file by the CU's line-table file index
    const seqs = [];
    const tables = new Map();
    const cuFiles = cus.map(c => {
      if (!tables.has(c.stmtList)) {
        const t = readLineTable(slice.sections, c.stmtList, c.compDir, intern);
        tables.set(c.stmtList, t.fileIds);
        for (const seq of t.sequences) if (seq.length && seq[0] >= base) seqs.push(seq);
      }
      return tables.get(c.stmtList);
    });

    const nameCache = new Map();
    const chainData = [];
    const chainIds = new Map();
    const chainOf = stack => {
      // start at the innermost real (non-inlined) function in the stack
      let start = stack.length - 1;
      while (start > 0 && stack[start].inlined) start--;
      const parts = [];
      for (let i = start; i < stack.length; i++) {
        const rg = stack[i];
        const n = dieNames(dies, rg.die, nameCache);
        const files = cuFiles[rg.cu] || [];
        const callFile = i > start && files[rg.callFile] >= 0 ? files[rg.callFile] : NO_FILE;
        parts.push(intern(n.name), intern(n.linkage), callFile, i > start ? rg.callLine : 0);
      }
      const key = parts.join(',');
      let id = chainIds.get(key);
      if (id === undefined) {
        id = chainData.length;
        chainData.push(parts.length / 4, ...parts);
        chainIds.set(key, id);
      }
      return id;
    };
    const segs = flattenRanges(ranges, chainOf);
    const funcs = new Uint32Array(segs.length * 3);
    segs.forEach(([lo, hi, chain], i) => { funcs[i * 3] = lo - base; funcs[i * 3 + 1] = hi - base; funcs[i * 3 + 2] = chain; });

    seqs.sort((a, b) => a[0] - b[0]);
    let total = 0;
    for (const s of seqs) total += s.length;
    const lines = new Uint32Array(total);
    let at = 0;
    for (const s of seqs) {
      for (let i = 0; i < s.length; i += 3) {
        lines[at++] = s[i] - base;
        lines[at++] = i === s.length - 3 ? END_SEQ : (s[i + 1] < 0 ? NO_FILE : s[i + 1]);
        lines[at++] = s[i + 2];
      }
    }

    const symRows = readSymtab(slice);
    const syms = new Uint32Array(symRows.length * 2);
    symRows.forEach(([value, name], i) => { syms[i * 2] = value - base; syms[i * 2 + 1] = intern(name); });

    return {
      version: INDEX_VERSION,
      uuid: slice.uuid,
      arch: slice.arch,
      name: binaryName,
      textVmaddr: base,
      textEnd: slice.text ? slice.text.addr + slice.text.size - base : 0,
      strings,
      funcs,
      chains: new Uint32Array(chainData),
      lines,
      syms,
      hasDwarf: funcs.length > 0 || lines.length > 0,
      uploadedAt: Date.now(),
    };
  }

  // ── Lookup ─────────────────────────────────────────────────────────────────
  // last row i with arr[i*stride] <= off, or -1
  function bsearch(arr, stride, off) {
    let lo = 0, hi = arr.length / stride - 1, ans = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (arr[mid * stride] <= off) { ans = mid; lo = mid + 1; } else hi = mid - 1;
    }
    return ans;
  }

  const demangle = name => {
    if (!name) return '';
    const d = typeof swiftDemangle === 'function' ? swiftDemangle(name) : null;
    return d || name;
  };

  // returns { func, file, line, inlined: [{ func, file, line }] } where
  // func/file/line describe the concrete function at the point it calls into
  // any inlined code (what atos prints by default), and inlined lists the
  // inlined functions innermost-first with their own locations (atos -i)
  function lookup(index, off) {
    const symName = symbolAt(index, off);
    let loc = null;
    const li = bsearch(index.lines, 3, off);
    if (li >= 0 && index.lines[li * 3 + 1] !== END_SEQ) {
      const fileId = index.lines[li * 3 + 1];
      loc = { file: fileId === NO_FILE ? null : index.strings[fileId], line: index.lines[li * 3 + 2] };
    }

    const fi = bsearch(index.funcs, 3, off);
    if (fi >= 0 && off < index.funcs[fi * 3 + 1]) {
      const c = index.chains, at = index.funcs[fi * 3 + 2], n = c[at];
      const entries = [];
      for (let k = 0; k < n; k++) {
        const p = at + 1 + k * 4;
        const linkage = index.strings[c[p + 1]], dwarfName = index.strings[c[p]];
        const demangled = linkage ? demangle(linkage) : '';
        entries.push({
          func: demangled && demangled !== linkage ? demangled : (dwarfName || linkage),
          callFile: c[p + 2] === NO_FILE ? null : index.strings[c[p + 2]],
          callLine: c[p + 3],
        });
      }
      // walk innermost → outermost: each function's location is the call site of the one inlined into it
      const frames = [];
      let cur = loc || { file: null, line: null };
      for (let k = n - 1; k >= 0; k--) {
        frames.push({ func: entries[k].func, file: cur.file, line: cur.line });
        if (k > 0) cur = { file: entries[k].callFile, line: entries[k].callLine };
      }
      const outer = frames.pop();
      // the symbol table names the concrete function the way atos/Xcode do
      // (full Swift signature) — DWARF's own name is only a short fallback
      if (symName && !isMangled(symName) && symName[0] !== '<') outer.func = symName;
      return { ...outer, inlined: frames };
    }

    if (!symName && !loc) return null;
    return { func: symName, file: loc && loc.file, line: loc && loc.line, inlined: [] };
  }

  const isMangled = name => /^(\$[sS]|_T0|\$e)/.test(name);

  function symbolAt(index, off) {
    if (!index.syms.length) return null;
    const si = bsearch(index.syms, 2, off);
    if (si < 0) return null;
    // symbols carry no size; the next symbol's start bounds this one
    const next = si + 1 < index.syms.length / 2 ? index.syms[(si + 1) * 2] : (index.textEnd || Infinity);
    return off < next ? demangle(index.strings[index.syms[si * 2 + 1]]) : null;
  }

  // ── Persistence (IndexedDB) ────────────────────────────────────────────────
  const DB_NAME = 'error-visualizer-dsym', STORE = 'images';
  const loaded = new Map(); // uuid → index

  function openDb() {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB unavailable')); return; }
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'uuid' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function withStore(mode, fn) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const result = fn(tx.objectStore(STORE));
      tx.oncomplete = () => { db.close(); resolve(result && 'result' in result ? result.result : result); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  }

  async function loadAll() {
    try {
      const all = await withStore('readonly', s => s.getAll());
      // an index from an older build of this parser may be missing fields — skip it, re-uploading rebuilds it
      (all || []).forEach(idx => { if (idx.version === INDEX_VERSION) loaded.set(idx.uuid, idx); });
    } catch (e) { /* storage blocked (private window etc.) — symbolication still works for this visit */ }
    return list();
  }

  // usable right away from memory; the IndexedDB write (a few MB of typed
  // arrays) finishes in the background so it never delays symbolication
  function save(index) {
    loaded.set(index.uuid, index);
    return withStore('readwrite', s => s.put(index)).catch(() => { /* in-memory only for this visit */ });
  }

  async function remove(uuid) {
    loaded.delete(uuid);
    try { await withStore('readwrite', s => s.delete(uuid)); } catch (e) { /* in-memory only */ }
  }

  function list() {
    return Array.from(loaded.values())
      .map(i => ({ uuid: i.uuid, name: i.name, arch: i.arch, uploadedAt: i.uploadedAt, fileName: i.fileName, hasDwarf: i.hasDwarf,
        appVersion: i.appVersion || null, buildVersion: i.buildVersion || null }))
      .sort((a, b) => b.uploadedAt - a.uploadedAt);
  }

  function has(uuid) { const u = normalizeUUID(uuid); return !!(u && loaded.has(u)); }

  // ── Frame symbolication ────────────────────────────────────────────────────
  // an unsymbolicated iOS frame reads "Binary  0xADDR Binary + 55968" — the
  // number after "+" is the offset from the image's load address, which is
  // also the offset from __TEXT's vmaddr in the dSYM. non-leaf frames hold a
  // return address, so look up one byte earlier to land on the call itself
  // (same adjustment Crashlytics/Xcode make), otherwise a call at the very end
  // of a function would resolve to whatever comes next.
  function symbolicate(uuid, binary, symbolText, isLeaf) {
    const u = normalizeUUID(uuid);
    const index = u && loaded.get(u);
    if (!index) return null;
    const m = String(symbolText || '').match(/^(.+?)\s*\+\s*(\d+)\s*$/);
    if (!m) return null;
    if (m[1].trim() !== binary && m[1].trim() !== index.name) return null; // already symbolicated
    const off = parseInt(m[2], 10);
    const hit = lookup(index, isLeaf || off === 0 ? off : off - 1);
    return hit ? { ...hit, offset: off } : null;
  }

  // ── Input handling (folders, zips, bare DWARF files) ───────────────────────
  async function unzip(bytes) {
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let eocd = -1;
    for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('Not a valid .zip file');
    let count = dv.getUint16(eocd + 10, true);
    let cdOff = dv.getUint32(eocd + 16, true);
    // zip64 end-of-central-directory locator
    if ((cdOff === 0xffffffff || count === 0xffff) && eocd >= 20 && dv.getUint32(eocd - 20, true) === 0x07064b50) {
      const z64 = Number(dv.getBigUint64(eocd - 12, true));
      count = Number(dv.getBigUint64(z64 + 32, true));
      cdOff = Number(dv.getBigUint64(z64 + 48, true));
    }
    const entries = [];
    let p = cdOff;
    for (let i = 0; i < count; i++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      const method = dv.getUint16(p + 10, true);
      let csize = dv.getUint32(p + 20, true), usize = dv.getUint32(p + 24, true);
      const nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true);
      let lho = dv.getUint32(p + 42, true);
      const name = utf8.decode(bytes.subarray(p + 46, p + 46 + nlen));
      // zip64 extra field carries the real sizes/offset when the 32-bit ones are maxed out
      let x = p + 46 + nlen;
      const xEnd = x + xlen;
      while (x + 4 <= xEnd) {
        const id = dv.getUint16(x, true), sz = dv.getUint16(x + 2, true);
        if (id === 0x0001) {
          let q = x + 4;
          if (usize === 0xffffffff) { usize = Number(dv.getBigUint64(q, true)); q += 8; }
          if (csize === 0xffffffff) { csize = Number(dv.getBigUint64(q, true)); q += 8; }
          if (lho === 0xffffffff) { lho = Number(dv.getBigUint64(q, true)); }
        }
        x += 4 + sz;
      }
      entries.push({ name, method, csize, usize, lho });
      p += 46 + nlen + xlen + clen;
    }

    const out = [];
    for (const e of entries) {
      if (e.name.endsWith('/') || e.name.includes('__MACOSX/')) continue;
      // only DWARF payloads matter — skip Info.plist, Relocations yml, swiftinterfaces, etc.
      if (!/\/DWARF\/[^/]+$/.test(e.name) && !isBundlePlist(e.name) && /\.(plist|yml|yaml|swiftinterface|txt|json)$/i.test(e.name)) continue;
      const nl = dv.getUint16(e.lho + 26, true), xl = dv.getUint16(e.lho + 28, true);
      const start = e.lho + 30 + nl + xl;
      const comp = bytes.subarray(start, start + e.csize);
      let data;
      if (e.method === 0) data = comp;
      else if (e.method === 8) {
        if (typeof DecompressionStream === 'undefined') throw new Error('This browser cannot unzip files — upload the .dSYM folder instead');
        const stream = new Blob([comp]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        data = new Uint8Array(await new Response(stream).arrayBuffer());
      } else continue;
      out.push({ name: e.name, bytes: data });
    }
    return out;
  }

  // <Name>.dSYM/Contents/Info.plist — carries the app version/build the dSYM was built for
  const isBundlePlist = path => /(^|\/)Contents\/Info\.plist$/.test(path);

  function plistString(xml, key) {
    const m = xml.match(new RegExp(`<key>${key}</key>\\s*<string>([^<]*)</string>`));
    return m ? m[1].trim() : null;
  }

  // folder containing Contents/ — the .dSYM bundle root a DWARF file or plist belongs to
  const bundleRoot = path => {
    const at = String(path || '').lastIndexOf('Contents/');
    return at >= 0 ? path.slice(0, at) : null;
  };

  function binaryNameFromPath(path, fallback) {
    const parts = String(path || '').split('/');
    const dwarfAt = parts.lastIndexOf('DWARF');
    if (dwarfAt >= 0 && parts[dwarfAt + 1]) return parts[dwarfAt + 1];
    return parts[parts.length - 1] || fallback;
  }

  // files: [{ name/path, bytes }] — returns [{ uuid, name, arch, ok, error }]
  async function ingest(files, onProgress) {
    const expanded = [];
    for (const f of files) {
      const b = f.bytes;
      if (b.length > 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04) {
        onProgress && onProgress(`Unzipping ${f.name}…`);
        (await unzip(b)).forEach(e => expanded.push({ name: e.name, bytes: e.bytes, source: f.name }));
      } else {
        expanded.push({ ...f, source: f.name });
      }
    }

    // version info per bundle root, from each bundle's Info.plist (XML — what Xcode writes)
    const versions = new Map();
    for (const f of expanded) {
      if (!isBundlePlist(f.name)) continue;
      const xml = utf8.decode(f.bytes);
      versions.set(bundleRoot(f.name), {
        appVersion: plistString(xml, 'CFBundleShortVersionString'),
        buildVersion: plistString(xml, 'CFBundleVersion'),
      });
    }

    const results = [];
    for (const f of expanded) {
      if (!isMachO(f.bytes)) continue;
      const version = versions.get(bundleRoot(f.name)) || {};
      const binaryName = binaryNameFromPath(f.name, f.name);
      for (const slice of machOSlices(f.bytes)) {
        try {
          onProgress && onProgress(`Indexing ${binaryName} (${slice.arch})…`);
          await new Promise(r => setTimeout(r, 0)); // let the progress text paint
          const index = buildIndex(slice, binaryName);
          index.fileName = f.source;
          index.appVersion = version.appVersion || null;
          index.buildVersion = version.buildVersion || null;
          save(index);
          results.push({ ok: true, uuid: index.uuid, name: binaryName, arch: slice.arch, hasDwarf: index.hasDwarf,
            appVersion: index.appVersion, buildVersion: index.buildVersion });
        } catch (e) {
          results.push({ ok: false, uuid: slice.uuid, name: binaryName, arch: slice.arch, error: e.message });
        }
      }
    }
    return results;
  }

  return { ingest, loadAll, list, remove, has, symbolicate, normalizeUUID,
    // exposed for tests
    _internal: { machOSlices, buildIndex, lookup, unzip } };
})();

if (typeof module !== 'undefined') module.exports = DSYM;
