// ── Swift Demangler ──────────────────────────────────────────────────────────
// A dependency-free port of the Swift runtime's Demangler (lib/Demangling/
// Demangler.cpp) and NodePrinter, fixed to the "simplified" options that
// `xcrun swift-demangle --simplified` and `atos` use, so symbolicated frames
// read the way Xcode / Crashlytics show them, e.g.
//   $s15Example_SwiftUI12TriggersViewVwca → assignWithCopy for TriggersView
// The mangled name is parsed into a node tree with the same stack/substitution
// machine as the compiler's demangler, then printed. Anything unexpected makes
// swiftDemangle() return null rather than guess.
const SwiftDemangler = (() => {

  const MAX_STEPS = 200000;       // parse operations per symbol
  const MAX_OUTPUT = 65536;       // printed characters per symbol
  const PRINT_MAX_DEPTH = 768;    // NodePrinter::MaxDepth

  class Node {
    constructor(kind, text, index) {
      this.kind = kind;
      this.text = text;
      this.index = index;
      this.children = [];
    }
    add(child) { this.children.push(child); return this; }
    child(i) {
      const c = this.children[i];
      if (!c) throw new Error('missing child');
      return c;
    }
    get first() { return this.child(0); }
    get last() { return this.child(this.children.length - 1); }
    get count() { return this.children.length; }
  }

  // ── node kind classes ──────────────────────────────────────────────────────
  const kindSet = s => new Set(s.split(' '));

  const CONTEXT_KINDS = kindSet('Allocator AnonymousContext Class Constructor Deallocator ' +
    'DefaultArgumentInitializer Destructor DidSet Enum ExplicitClosure Extension Function Getter ' +
    'GlobalGetter IVarInitializer IVarDestroyer ImplicitClosure Initializer InitAccessor ' +
    'IsolatedDeallocator MaterializeForSet ModifyAccessor Modify2Accessor Module NativeOwningAddressor ' +
    'NativeOwningMutableAddressor NativePinningAddressor NativePinningMutableAddressor OtherNominalType ' +
    'OwningAddressor OwningMutableAddressor PropertyWrapperBackingInitializer ' +
    'PropertyWrapperInitFromProjectedValue Protocol ProtocolSymbolicReference ReadAccessor Read2Accessor ' +
    'Setter Static Structure Subscript TypeSymbolicReference TypeAlias UnsafeAddressor ' +
    'UnsafeMutableAddressor Variable WillSet OpaqueReturnTypeOf AutoDiffFunction BuiltinTupleType');
  const DECL_NAME_KINDS = kindSet('Identifier LocalDeclName PrivateDeclName RelatedEntityDeclName ' +
    'PrefixOperator PostfixOperator InfixOperator TypeSymbolicReference ProtocolSymbolicReference ' +
    'ObjectiveCProtocolSymbolicReference');
  const ANY_GENERIC_KINDS = kindSet('Structure Class Enum Protocol ProtocolSymbolicReference ' +
    'ObjectiveCProtocolSymbolicReference OtherNominalType TypeAlias TypeSymbolicReference BuiltinTupleType');
  const REQUIREMENT_KINDS = kindSet('DependentGenericParamPackMarker DependentGenericParamValueMarker ' +
    'DependentGenericSameTypeRequirement DependentGenericSameShapeRequirement ' +
    'DependentGenericLayoutRequirement DependentGenericConformanceRequirement ' +
    'DependentGenericInverseConformanceRequirement');
  const FUNCTION_ATTR_KINDS = kindSet('FunctionSignatureSpecialization GenericSpecialization ' +
    'GenericSpecializationPrespecialized InlinedGenericFunction GenericSpecializationNotReAbstracted ' +
    'GenericPartialSpecialization GenericPartialSpecializationNotReAbstracted ' +
    'GenericSpecializationInResilienceDomain ObjCAttribute NonObjCAttribute DynamicAttribute ' +
    'DirectMethodReferenceAttribute VTableAttribute PartialApplyForwarder PartialApplyObjCForwarder ' +
    'OutlinedVariable OutlinedReadOnlyObject OutlinedBridgedMethod MergedFunction DistributedThunk ' +
    'DistributedAccessor DynamicallyReplaceableFunctionImpl DynamicallyReplaceableFunctionKey ' +
    'DynamicallyReplaceableFunctionVar AsyncFunctionPointer AsyncAwaitResumePartialFunction ' +
    'AsyncSuspendResumePartialFunction AccessibleFunctionRecord BackDeploymentThunk ' +
    'BackDeploymentFallback HasSymbolQuery CoroFunctionPointer DefaultOverride');
  const ANY_CONFORMANCE_KINDS = kindSet('ConcreteProtocolConformance PackProtocolConformance ' +
    'DependentProtocolConformanceRoot DependentProtocolConformanceInherited ' +
    'DependentProtocolConformanceAssociated DependentProtocolConformanceOpaque');
  const DEP_CONFORMANCE_KINDS = kindSet('DependentProtocolConformanceRoot ' +
    'DependentProtocolConformanceInherited DependentProtocolConformanceAssociated');
  const MACRO_EXPANSION_KINDS = kindSet('AccessorAttachedMacroExpansion ' +
    'MemberAttributeAttachedMacroExpansion FreestandingMacroExpansion MemberAttachedMacroExpansion ' +
    'PeerAttachedMacroExpansion ConformanceAttachedMacroExpansion ExtensionAttachedMacroExpansion ' +
    'MacroExpansionLoc');
  const NO_GENERIC_ARGS_KINDS = kindSet('Variable Subscript ImplicitClosure ExplicitClosure ' +
    'DefaultArgumentInitializer Initializer PropertyWrapperBackingInitializer ' +
    'PropertyWrapperInitFromProjectedValue Static');

  const isContext = k => CONTEXT_KINDS.has(k);
  const isDeclName = k => DECL_NAME_KINDS.has(k);
  const isEntity = k => k === 'Type' || isContext(k);
  const isRequirement = k => REQUIREMENT_KINDS.has(k);
  const isFunctionAttr = k => FUNCTION_ATTR_KINDS.has(k);

  const isDigit = c => c >= '0' && c <= '9' && c.length === 1;
  const isLower = c => c >= 'a' && c <= 'z' && c.length === 1;
  const isUpper = c => c >= 'A' && c <= 'Z' && c.length === 1;
  const isLetter = c => isLower(c) || isUpper(c);
  const isWordStart = c => c !== '' && !isDigit(c) && c !== '_';
  const isWordEnd = (c, prev) => c === '' || c === '_' || (!isUpper(prev) && isUpper(c));

  const isProtocolNode = n => !!n && (n.kind === 'Type' ? isProtocolNode(n.children[0]) :
    n.kind === 'Protocol' || n.kind === 'ProtocolSymbolicReference' ||
    n.kind === 'ObjectiveCProtocolSymbolicReference');

  // STANDARD_TYPE table: S<c> → Swift.<name>; Sc<c> → concurrency types
  const STD_TYPES = {
    A: ['Structure', 'AutoreleasingUnsafeMutablePointer'], a: ['Structure', 'Array'],
    b: ['Structure', 'Bool'], D: ['Structure', 'Dictionary'], d: ['Structure', 'Double'],
    f: ['Structure', 'Float'], h: ['Structure', 'Set'], I: ['Structure', 'DefaultIndices'],
    i: ['Structure', 'Int'], J: ['Structure', 'Character'], N: ['Structure', 'ClosedRange'],
    n: ['Structure', 'Range'], O: ['Structure', 'ObjectIdentifier'], P: ['Structure', 'UnsafePointer'],
    p: ['Structure', 'UnsafeMutablePointer'], R: ['Structure', 'UnsafeBufferPointer'],
    r: ['Structure', 'UnsafeMutableBufferPointer'], S: ['Structure', 'String'],
    s: ['Structure', 'Substring'], u: ['Structure', 'UInt'], V: ['Structure', 'UnsafeRawPointer'],
    v: ['Structure', 'UnsafeMutableRawPointer'], W: ['Structure', 'UnsafeRawBufferPointer'],
    w: ['Structure', 'UnsafeMutableRawBufferPointer'], q: ['Enum', 'Optional'],
    B: ['Protocol', 'BinaryFloatingPoint'], E: ['Protocol', 'Encodable'], e: ['Protocol', 'Decodable'],
    F: ['Protocol', 'FloatingPoint'], G: ['Protocol', 'RandomNumberGenerator'],
    H: ['Protocol', 'Hashable'], j: ['Protocol', 'Numeric'], K: ['Protocol', 'BidirectionalCollection'],
    k: ['Protocol', 'RandomAccessCollection'], L: ['Protocol', 'Comparable'],
    l: ['Protocol', 'Collection'], M: ['Protocol', 'MutableCollection'],
    m: ['Protocol', 'RangeReplaceableCollection'], Q: ['Protocol', 'Equatable'],
    T: ['Protocol', 'Sequence'], t: ['Protocol', 'IteratorProtocol'], U: ['Protocol', 'UnsignedInteger'],
    X: ['Protocol', 'RangeExpression'], x: ['Protocol', 'Strideable'], Y: ['Protocol', 'RawRepresentable'],
    y: ['Protocol', 'StringProtocol'], Z: ['Protocol', 'SignedInteger'], z: ['Protocol', 'BinaryInteger'],
  };
  const STD_CONCURRENCY_TYPES = {
    A: ['Protocol', 'Actor'], C: ['Structure', 'CheckedContinuation'],
    c: ['Structure', 'UnsafeContinuation'], E: ['Structure', 'CancellationError'],
    e: ['Structure', 'UnownedSerialExecutor'], F: ['Protocol', 'Executor'],
    f: ['Protocol', 'SerialExecutor'], G: ['Structure', 'TaskGroup'],
    g: ['Structure', 'ThrowingTaskGroup'], h: ['Protocol', 'TaskExecutor'],
    I: ['Protocol', 'AsyncIteratorProtocol'], i: ['Protocol', 'AsyncSequence'],
    J: ['Structure', 'UnownedJob'], M: ['Class', 'MainActor'], P: ['Structure', 'TaskPriority'],
    S: ['Structure', 'AsyncStream'], s: ['Structure', 'AsyncThrowingStream'], T: ['Structure', 'Task'],
    t: ['Structure', 'UnsafeCurrentTask'],
  };

  const VALUE_WITNESSES = {
    al: 'allocateBuffer', ca: 'assignWithCopy', ta: 'assignWithTake', de: 'deallocateBuffer',
    xx: 'destroy', XX: 'destroyBuffer', Xx: 'destroyArray', CP: 'initializeBufferWithCopyOfBuffer',
    Cp: 'initializeBufferWithCopy', cp: 'initializeWithCopy', Tk: 'initializeBufferWithTake',
    tk: 'initializeWithTake', pr: 'projectBuffer', TK: 'initializeBufferWithTakeOfBuffer',
    Cc: 'initializeArrayWithCopy', Tt: 'initializeArrayWithTakeFrontToBack',
    tT: 'initializeArrayWithTakeBackToFront', xs: 'storeExtraInhabitant',
    xg: 'getExtraInhabitantIndex', ug: 'getEnumTag', up: 'destructiveProjectEnumData',
    ui: 'destructiveInjectEnumTag', et: 'getEnumTagSinglePayload', st: 'storeEnumTagSinglePayload',
  };

  // FunctionSigSpecializationParamKind
  const FSPK = {
    ConstantPropFunction: 0, ConstantPropGlobal: 1, ConstantPropInteger: 2, ConstantPropFloat: 3,
    ConstantPropString: 4, ClosureProp: 5, BoxToValue: 6, BoxToStack: 7, InOutToOut: 8,
    ConstantPropKeyPath: 9, ConstantPropStruct: 10, EscapingClosureProp: 11, ClosurePropPreviousArg: 12,
    Dead: 1 << 6, OwnedToGuaranteed: 1 << 7, SROA: 1 << 8, GuaranteedToOwned: 1 << 9,
    ExistentialToGeneric: 1 << 10,
  };

  const OP_CHARS = '& @/= >    <*!|+?%-~   ^ .';
  const MACRO_ROLES = { a: 'Accessor', r: 'MemberAttribute', m: 'Member', p: 'Peer',
    c: 'Conformance', e: 'Extension', q: 'Preamble', b: 'Body' };
  const MACRO_ROLE_DESC = { Accessor: 'accessor', MemberAttribute: 'memberAttribute',
    Member: 'member', Peer: 'peer', Conformance: 'conformance', Extension: 'extension',
    Preamble: 'preamble', Body: 'body' };

  // Swift's punycode variant (digits a-z, A-J; '_' delimiter)
  const decodePunycode = input => {
    const base = 36, tmin = 1, tmax = 26, skew = 38, damp = 700, INT_MAX = 2147483647;
    const out = [];
    let n = 128, i = 0, bias = 72;
    const digit = c => c >= 'a' && c <= 'z' ? c.charCodeAt(0) - 97 :
      c >= 'A' && c <= 'J' ? c.charCodeAt(0) - 65 + 26 : -1;
    const adapt = (delta, numPoints, first) => {
      delta = first ? Math.floor(delta / damp) : Math.floor(delta / 2);
      delta += Math.floor(delta / numPoints);
      let k = 0;
      while (delta > ((base - tmin) * tmax) >> 1) { delta = Math.floor(delta / (base - tmin)); k += base; }
      return k + Math.floor(((base - tmin + 1) * delta) / (delta + skew));
    };
    const last = input.lastIndexOf('_');
    if (last >= 0) {
      for (const c of input.slice(0, last)) {
        if (c.charCodeAt(0) > 0x7f) return null;
        out.push(c.charCodeAt(0));
      }
      input = input.slice(last + 1);
    }
    let p = 0;
    while (p < input.length) {
      const oldi = i;
      let w = 1;
      for (let k = base; ; k += base) {
        if (p >= input.length) return null;
        const d = digit(input[p++]);
        if (d < 0 || d > Math.floor((INT_MAX - i) / w)) return null;
        i += d * w;
        const t = k <= bias ? tmin : k >= bias + tmax ? tmax : k - bias;
        if (d < t) break;
        if (w > Math.floor(INT_MAX / (base - t))) return null;
        w *= base - t;
      }
      bias = adapt(i - oldi, out.length + 1, oldi === 0);
      n += Math.floor(i / (out.length + 1));
      i %= out.length + 1;
      if (n < 0x80) return null;
      out.splice(i, 0, n);
      i++;
    }
    let s = '';
    for (let cp of out) {
      if (cp >= 0xD800 && cp < 0xD880) cp -= 0xD800;   // escaped non-symbol ASCII
      else if (cp >= 0xD880 && cp < 0xE000 || cp > 0x10FFFF) return null;
      s += String.fromCodePoint(cp);
    }
    return s;
  };

  // ── Demangler ──────────────────────────────────────────────────────────────
  class Demangler {
    constructor(text) {
      this.text = text;
      this.pos = 0;
      this.stack = [];
      this.subs = [];
      this.words = [];
      this.oldFn = false;
      this.steps = 0;
    }

    peek() { return this.pos < this.text.length ? this.text[this.pos] : ''; }
    next() { return this.pos < this.text.length ? this.text[this.pos++] : ''; }
    nextIf(s) {
      if (!this.text.startsWith(s, this.pos)) return false;
      this.pos += s.length;
      return true;
    }
    pushBack() { if (this.pos > 0) this.pos--; }
    push(n) { this.stack.push(n); }
    pop(pred) {
      if (!this.stack.length) return null;
      if (pred === undefined) return this.stack.pop();
      const k = this.stack[this.stack.length - 1].kind;
      return (typeof pred === 'string' ? k === pred : pred(k)) ? this.stack.pop() : null;
    }
    addSubst(n) { if (n) this.subs.push(n); }

    node(kind, text, index) { return new Node(kind, text, index); }
    withChild(kind, child) { return child ? this.node(kind).add(child) : null; }
    withChildren(kind, ...children) {
      if (children.some(c => !c)) return null;
      const n = this.node(kind);
      children.forEach(c => n.add(c));
      return n;
    }
    type(child) { return this.withChild('Type', child); }
    addChild(parent, child) { return parent && child ? parent.add(child) : null; }
    changeKind(n, kind) {
      if (!n) return null;
      const r = this.node(kind, n.text, n.index);
      n.children.forEach(c => r.add(c));
      return r;
    }
    popWithType(kind) { return this.withChild(kind, this.pop('Type')); }

    demangleSymbol() {
      const t = this.text;
      const prefix = ['_T0', '$S', '_$S', '$s', '_$s', '$e', '_$e', '@__swiftmacro_'].find(p => t.startsWith(p));
      if (!prefix) return null;
      this.oldFn = t.startsWith('_T');
      this.pos = prefix.length;
      while (this.pos < t.length) {
        if (this.peek() === '\0') break;
        const n = this.operator();
        if (!n) return null;
        this.push(n);
      }
      const top = this.node('Global');
      const suffix = this.pop('Suffix');
      let parent = top;
      let attr;
      while ((attr = this.pop(isFunctionAttr))) {
        parent.add(attr);
        if (attr.kind === 'PartialApplyForwarder' || attr.kind === 'PartialApplyObjCForwarder') parent = attr;
      }
      for (const n of this.stack) parent.add(n.kind === 'Type' ? n.first : n);
      if (suffix) top.add(suffix);
      return top.count ? top : null;
    }

    operator() {
      if (++this.steps > MAX_STEPS) throw new Error('too complex');
      let c = this.next();
      while (c === '\xff') c = this.next();   // symbolic-reference alignment padding
      if (c !== '' && c.charCodeAt(0) >= 1 && c.charCodeAt(0) <= 0x17) return null;   // symbolic refs need a resolver
      switch (c) {
        case 'A': return this.multiSubstitutions();
        case 'B': return this.builtinType();
        case 'C': return this.anyGenericType('Class');
        case 'D': return this.typeMangling();
        case 'E': return this.extensionContext();
        case 'F': return this.plainFunction();
        case 'G': return this.boundGenericType();
        case 'H':
          switch (this.next()) {
            case 'A': return this.depConformanceAssociated();
            case 'C': return this.concreteConformance();
            case 'D': return this.depConformanceRoot();
            case 'I': return this.depConformanceInherited();
            case 'O': return this.depConformanceOpaque();
            case 'P': return this.withChild('ProtocolConformanceRefInTypeModule', this.popProtocol());
            case 'p': return this.withChild('ProtocolConformanceRefInProtocolModule', this.popProtocol());
            case 'X': return this.withChild('PackProtocolConformance', this.popAnyConformanceList());
            case 'c': return this.withChild('ProtocolConformanceDescriptorRecord', this.popProtocolConformance());
            case 'n': return this.popWithType('NominalTypeDescriptorRecord');
            case 'o': return this.withChild('OpaqueTypeDescriptorRecord', this.pop());
            case 'r': return this.withChild('ProtocolDescriptorRecord', this.popProtocol());
            case 'F': return this.node('AccessibleFunctionRecord');
            default: this.pushBack(); this.pushBack(); return this.identifier();
          }
        case 'I': return this.implFunctionType();
        case 'K': return this.node('ThrowsAnnotation');
        case 'L': return this.localIdentifier();
        case 'M': return this.metatype();
        case 'N': return this.withChild('TypeMetadata', this.pop('Type'));
        case 'O': return this.anyGenericType('Enum');
        case 'P': return this.anyGenericType('Protocol');
        case 'Q': return this.archetype();
        case 'R': return this.genericRequirement();
        case 'S': return this.standardSubstitution();
        case 'T': return this.thunkOrSpecialization();
        case 'V': return this.anyGenericType('Structure');
        case 'W': return this.witness();
        case 'X': return this.specialType();
        case 'Y': return this.typeAnnotation();
        case 'Z': return this.withChild('Static', this.pop(isEntity));
        case 'a': return this.anyGenericType('TypeAlias');
        case 'c': return this.popFunctionType('FunctionType');
        case 'd': return this.node('VariadicMarker');
        case 'f': return this.functionEntity();
        case 'g': return this.retroactiveConformance();
        case 'h': return this.type(this.withChild('Shared', this.popTypeAndGetChild()));
        case 'i': return this.subscript();
        case 'l': return this.genericSignature(false);
        case 'm': return this.type(this.withChild('Metatype', this.pop('Type')));
        case 'n': return this.type(this.withChild('Owned', this.popTypeAndGetChild()));
        case 'o': return this.operatorIdentifier();
        case 'p': return this.type(this.protocolList());
        case 'q': return this.type(this.genericParamIndex());
        case 'r': return this.genericSignature(true);
        case 's': return this.node('Module', 'Swift');
        case 't': return this.popTuple();
        case 'u': return this.genericType();
        case 'v': return this.accessor(this.entity('Variable'));
        case 'w': return this.valueWitness();
        case 'x': return this.type(this.genericParam(0, 0));
        case 'y': return this.node('EmptyList');
        case 'z': return this.type(this.withChild('InOut', this.popTypeAndGetChild()));
        case '_': return this.node('FirstElementMarker');
        case '.': {
          // IRGen's '.<n>' disambiguators and similar become an unmangled suffix
          this.pushBack();
          const s = this.text.slice(this.pos);
          this.pos = this.text.length;
          return this.node('Suffix', s);
        }
        case '$': return this.integerType();
        default: this.pushBack(); return this.identifier();
      }
    }

    natural() {
      if (!isDigit(this.peek())) return -1000;
      let num = 0;
      for (;;) {
        const c = this.peek();
        if (!isDigit(c)) return num;
        num = num * 10 + (c.charCodeAt(0) - 48);
        if (num > 2147483647) return -1000;
        this.next();
      }
    }
    index() {
      if (this.nextIf('_')) return 0;
      const n = this.natural();
      if (n >= 0 && n < 2147483647 && this.nextIf('_')) return n + 1;
      return -1000;
    }
    indexNode() {
      const i = this.index();
      return i >= 0 ? this.node('Number', undefined, i) : null;
    }

    multiSubstitutions() {
      let repeat = -1;
      for (;;) {
        const c = this.next();
        if (c === '') return null;
        if (isLower(c)) {
          const n = this.pushMultiSubstitutions(repeat, c.charCodeAt(0) - 97);
          if (!n) return null;
          this.push(n);
          repeat = -1;
          continue;
        }
        if (isUpper(c)) return this.pushMultiSubstitutions(repeat, c.charCodeAt(0) - 65);
        if (c === '_') {
          const idx = repeat + 27;
          return idx < this.subs.length ? this.subs[idx] : null;
        }
        this.pushBack();
        repeat = this.natural();
        if (repeat < 0) return null;
      }
    }
    pushMultiSubstitutions(repeat, idx) {
      if (idx >= this.subs.length || repeat > 2048) return null;
      const n = this.subs[idx];
      while (repeat-- > 1) this.push(n);
      return n;
    }

    swiftType(kind, name) {
      return this.type(this.withChildren(kind, this.node('Module', 'Swift'), this.node('Identifier', name)));
    }
    standardSubstitution() {
      switch (this.next()) {
        case 'o': return this.node('Module', '__C');
        case 'C': return this.node('Module', '__C_Synthesized');
        case 'g': {
          const opt = this.type(this.withChildren('BoundGenericEnum', this.swiftType('Enum', 'Optional'),
            this.withChild('TypeList', this.pop('Type'))));
          this.addSubst(opt);
          return opt;
        }
        default: {
          this.pushBack();
          let repeat = this.natural();
          if (repeat > 2048) return null;
          const second = this.nextIf('c');
          const entry = (second ? STD_CONCURRENCY_TYPES : STD_TYPES)[this.next()];
          if (!entry) return null;
          const n = this.swiftType(entry[0], entry[1]);
          while (repeat-- > 1) this.push(n);
          return n;
        }
      }
    }

    identifier() {
      let hasWordSubsts = false, punycoded = false;
      const c0 = this.peek();
      if (!isDigit(c0)) return null;
      if (c0 === '0') {
        this.next();
        if (this.peek() === '0') { this.next(); punycoded = true; } else hasWordSubsts = true;
      }
      let ident = '';
      do {
        while (hasWordSubsts && isLetter(this.peek())) {
          const c = this.next();
          let wi;
          if (isLower(c)) wi = c.charCodeAt(0) - 97;
          else { wi = c.charCodeAt(0) - 65; hasWordSubsts = false; }
          if (wi >= this.words.length) return null;
          ident += this.words[wi];
          if (ident.length > MAX_OUTPUT) return null;
        }
        if (this.nextIf('0')) break;
        const len = this.natural();
        if (len <= 0) return null;
        if (punycoded) this.nextIf('_');
        if (this.pos + len > this.text.length) return null;
        const slice = this.text.substr(this.pos, len);
        if (punycoded) {
          const decoded = decodePunycode(slice);
          if (decoded === null) return null;
          ident += decoded;
        } else {
          ident += slice;
          let start = -1;
          for (let i = 0; i <= slice.length; i++) {
            const c = i < slice.length ? slice[i] : '';
            if (start >= 0 && isWordEnd(c, slice[i - 1])) {
              if (i - start >= 2 && this.words.length < 26) this.words.push(slice.slice(start, i));
              start = -1;
            }
            if (start < 0 && isWordStart(c)) start = i;
          }
        }
        if (ident.length > MAX_OUTPUT) return null;
        this.pos += len;
      } while (hasWordSubsts);
      if (!ident) return null;
      const n = this.node('Identifier', ident);
      this.addSubst(n);
      return n;
    }

    operatorIdentifier() {
      const ident = this.pop('Identifier');
      if (!ident) return null;
      let op = '';
      for (const c of ident.text) {
        if (c.charCodeAt(0) >= 0x80) { op += c; continue; }
        if (!isLower(c)) return null;
        const o = OP_CHARS[c.charCodeAt(0) - 97];
        if (o === ' ') return null;
        op += o;
      }
      switch (this.next()) {
        case 'i': return this.node('InfixOperator', op);
        case 'p': return this.node('PrefixOperator', op);
        case 'P': return this.node('PostfixOperator', op);
        default: return null;
      }
    }

    localIdentifier() {
      if (this.nextIf('L')) {
        const discriminator = this.pop('Identifier');
        return this.withChildren('PrivateDeclName', discriminator, this.pop(isDeclName));
      }
      if (this.nextIf('l')) return this.withChild('PrivateDeclName', this.pop('Identifier'));
      const c = this.peek();
      if ((c >= 'a' && c <= 'j' || c >= 'A' && c <= 'J') && c.length === 1) {
        this.next();
        const r = this.node('RelatedEntityDeclName').add(this.node('Identifier', c));
        return this.addChild(r, this.pop());
      }
      const discriminator = this.indexNode();
      return this.withChildren('LocalDeclName', discriminator, this.pop(isDeclName));
    }

    popModule() {
      const ident = this.pop('Identifier');
      if (ident) return this.changeKind(ident, 'Module');
      return this.pop('Module');
    }
    popContext() {
      const mod = this.popModule();
      if (mod) return mod;
      const ty = this.pop('Type');
      if (ty) {
        if (ty.count !== 1 || !isContext(ty.first.kind)) return null;
        return ty.first;
      }
      return this.pop(isContext);
    }
    popTypeAndGetChild() {
      const ty = this.pop('Type');
      return ty && ty.count === 1 ? ty.first : null;
    }
    popTypeAndGetAnyGeneric() {
      const c = this.popTypeAndGetChild();
      return c && ANY_GENERIC_KINDS.has(c.kind) ? c : null;
    }

    builtinType() {
      let ty;
      const named = name => this.node('BuiltinTypeName', name);
      switch (this.next()) {
        case 'A': ty = named('Builtin.ImplicitActor'); break;
        case 'b': ty = named('Builtin.BridgeObject'); break;
        case 'B': ty = named('Builtin.UnsafeValueBuffer'); break;
        case 'e': ty = named('Builtin.Executor'); break;
        case 'f': case 'i': {
          const isFloat = this.text[this.pos - 1] === 'f';
          const size = this.index() - 1;
          if (size <= 0 || size > 4096) return null;
          ty = named((isFloat ? 'Builtin.FPIEEE' : 'Builtin.Int') + size);
          break;
        }
        case 'I': ty = named('Builtin.IntLiteral'); break;
        case 'v': {
          const elts = this.index() - 1;
          if (elts <= 0 || elts > 4096) return null;
          const elt = this.popTypeAndGetChild();
          if (!elt || elt.kind !== 'BuiltinTypeName' || !elt.text.startsWith('Builtin.')) return null;
          ty = named('Builtin.Vec' + elts + 'x' + elt.text.slice(8));
          break;
        }
        case 'V': {
          const element = this.pop('Type');
          if (!element) return null;
          const size = this.pop('Type');
          if (!size) return null;
          ty = this.node('BuiltinFixedArray').add(size).add(element);
          break;
        }
        case 'O': ty = named('Builtin.UnknownObject'); break;
        case 'o': ty = named('Builtin.NativeObject'); break;
        case 'p': ty = named('Builtin.RawPointer'); break;
        case 'j': ty = named('Builtin.Job'); break;
        case 'D': ty = named('Builtin.DefaultActorStorage'); break;
        case 'd': ty = named('Builtin.NonDefaultDistributedActorStorage'); break;
        case 'c': ty = named('Builtin.RawUnsafeContinuation'); break;
        case 't': ty = named('Builtin.SILToken'); break;
        case 'w': ty = named('Builtin.Word'); break;
        case 'P': ty = named('Builtin.PackIndex'); break;
        case 'T': ty = this.node('BuiltinTupleType'); break;
        default: return null;
      }
      return this.type(ty);
    }

    anyGenericType(kind) {
      const name = this.pop(isDeclName);
      const ctx = this.popContext();
      const ty = this.type(this.withChildren(kind, ctx, name));
      this.addSubst(ty);
      return ty;
    }

    extensionContext() {
      const sig = this.pop('DependentGenericSignature');
      const mod = this.popModule();
      const ty = this.popTypeAndGetAnyGeneric();
      let ext = this.withChildren('Extension', mod, ty);
      if (sig) ext = this.addChild(ext, sig);
      return ext;
    }

    plainFunction() {
      const sig = this.pop('DependentGenericSignature');
      let ty = this.popFunctionType('FunctionType');
      const labels = this.popFunctionParamLabels(ty);
      if (sig) ty = this.type(this.withChildren('DependentGenericType', sig, ty));
      const name = this.pop(isDeclName);
      const ctx = this.popContext();
      return labels ? this.withChildren('Function', ctx, name, labels, ty) :
        this.withChildren('Function', ctx, name, ty);
    }

    popFunctionType(kind, hasClangType) {
      let fn = this.node(kind);
      if (hasClangType) this.addChild(fn, this.clangType());
      // components are popped in the reverse of their mangling order
      this.addChild(fn, this.pop('SendingResultFunctionType'));
      this.addChild(fn, this.pop(k => k === 'GlobalActorFunctionType' || k === 'IsolatedAnyFunctionType' ||
        k === 'NonIsolatedCallerFunctionType'));
      this.addChild(fn, this.pop('DifferentiableFunctionType'));
      this.addChild(fn, this.pop(k => k === 'ThrowsAnnotation' || k === 'TypedThrowsAnnotation'));
      this.addChild(fn, this.pop('ConcurrentFunctionType'));
      this.addChild(fn, this.pop('AsyncAnnotation'));
      fn = this.addChild(fn, this.popFunctionParams('ArgumentTuple'));
      fn = this.addChild(fn, this.popFunctionParams('ReturnType'));
      return this.type(fn);
    }
    popFunctionParams(kind) {
      const params = this.pop('EmptyList') ? this.type(this.node('Tuple')) : this.pop('Type');
      return this.withChild(kind, params);
    }

    popFunctionParamLabels(ty) {
      if (!this.oldFn && this.pop('EmptyList')) return this.node('LabelList');
      if (!ty || ty.kind !== 'Type') return null;
      let fn = ty.first;
      if (fn.kind === 'DependentGenericType') fn = fn.child(1).first;
      if (fn.kind !== 'FunctionType' && fn.kind !== 'NoEscapeFunctionType') return null;
      let i = 0;
      for (const k of ['SendingResultFunctionType', 'GlobalActorFunctionType', 'IsolatedAnyFunctionType',
        'NonIsolatedCallerFunctionType', 'DifferentiableFunctionType']) {
        if (fn.child(i).kind === k) i++;
      }
      if (fn.child(i).kind === 'ThrowsAnnotation' || fn.child(i).kind === 'TypedThrowsAnnotation') i++;
      if (fn.child(i).kind === 'ConcurrentFunctionType') i++;
      if (fn.child(i).kind === 'AsyncAnnotation') i++;
      const paramType = fn.child(i);
      if (paramType.kind !== 'ArgumentTuple') return null;
      const params = paramType.first.first;
      const numParams = params.kind === 'Tuple' ? params.count : 1;
      if (numParams === 0) return null;
      const labels = this.node('LabelList');
      const tuple = params;
      if (this.oldFn && tuple.kind !== 'Tuple') return labels;
      let hasLabels = false;
      for (let p = 0; p < numParams; p++) {
        let label;
        if (this.oldFn) {
          const param = tuple.child(p);
          const li = param.children.findIndex(c => c.kind === 'TupleElementName');
          if (li >= 0) {
            label = this.node('Identifier', param.children[li].text);
            param.children.splice(li, 1);
          } else label = this.node('FirstElementMarker');
        } else label = this.pop();
        if (!label || (label.kind !== 'Identifier' && label.kind !== 'FirstElementMarker')) return null;
        labels.add(label);
        hasLabels = hasLabels || label.kind !== 'FirstElementMarker';
      }
      if (!hasLabels) return this.node('LabelList');
      if (!this.oldFn) labels.children.reverse();
      return labels;
    }

    // pops "_ ... y"-delimited lists of nodes, returning them in mangling order
    popList(rootKind, popElement) {
      const root = this.node(rootKind);
      if (!this.pop('EmptyList')) {
        let firstElem = false;
        do {
          firstElem = !!this.pop('FirstElementMarker');
          const el = popElement();
          if (!el) return null;
          root.add(el);
        } while (!firstElem);
        root.children.reverse();
      }
      return root;
    }
    popTuple() {
      return this.type(this.popList('Tuple', () => {
        const el = this.node('TupleElement');
        this.addChild(el, this.pop('VariadicMarker'));
        const ident = this.pop('Identifier');
        if (ident) el.add(this.node('TupleElementName', ident.text));
        const ty = this.pop('Type');
        return ty ? el.add(ty) : null;
      }));
    }
    popTypeList() { return this.popList('TypeList', () => this.pop('Type')); }
    popPack(kind) { return this.type(this.popList(kind, () => this.pop('Type'))); }

    popProtocol() {
      const ty = this.pop('Type');
      if (ty) return ty.count >= 1 && isProtocolNode(ty) ? ty : null;
      const sym = this.pop('ProtocolSymbolicReference') || this.pop('ObjectiveCProtocolSymbolicReference');
      if (sym) return sym;
      const name = this.pop(isDeclName);
      const ctx = this.popContext();
      return this.type(this.withChildren('Protocol', ctx, name));
    }

    popAnyConformanceList() {
      return this.popList('AnyProtocolConformanceList', () => this.pop(k => ANY_CONFORMANCE_KINDS.has(k)));
    }
    concreteConformance() {
      const conditional = this.popAnyConformanceList();
      let ref = this.pop('ProtocolConformanceRefInTypeModule') ||
        this.pop('ProtocolConformanceRefInProtocolModule');
      if (!ref) {
        const mod = this.popModule();
        ref = this.withChildren('ProtocolConformanceRefInOtherModule', this.popProtocol(), mod);
      }
      const ty = this.pop('Type');
      return this.withChildren('ConcreteProtocolConformance', ty, ref, conditional);
    }
    popDepConformance() { return this.pop(k => DEP_CONFORMANCE_KINDS.has(k)); }
    depConformanceIndex() {
      const i = this.index();
      if (i <= 0) return null;
      return i === 1 ? this.node('UnknownIndex') : this.node('Index', undefined, i - 2);
    }
    depConformanceRoot() {
      const index = this.depConformanceIndex();
      const proto = this.popProtocol();
      return this.withChildren('DependentProtocolConformanceRoot', this.pop('Type'), proto, index);
    }
    depConformanceInherited() {
      const index = this.depConformanceIndex();
      const proto = this.popProtocol();
      return this.withChildren('DependentProtocolConformanceInherited', this.popDepConformance(), proto, index);
    }
    depConformanceAssociated() {
      const index = this.depConformanceIndex();
      const proto = this.popProtocol();
      const assoc = this.withChildren('DependentAssociatedConformance', this.pop('Type'), proto);
      return this.withChildren('DependentProtocolConformanceAssociated', this.popDepConformance(), assoc, index);
    }
    depConformanceOpaque() {
      const ty = this.pop('Type');
      return this.withChildren('DependentProtocolConformanceOpaque', this.popDepConformance(), ty);
    }
    retroactiveConformance() {
      const index = this.indexNode();
      const conf = this.pop(k => ANY_CONFORMANCE_KINDS.has(k));
      return this.withChildren('RetroactiveConformance', index, conf);
    }
    popRetroactiveConformances() {
      let list = null, conf;
      while ((conf = this.pop('RetroactiveConformance'))) {
        if (!list) list = this.node('TypeList');
        list.add(conf);
      }
      if (list) list.children.reverse();
      return list;
    }

    // returns { lists, retro } or null
    boundGenerics() {
      const retro = this.popRetroactiveConformances();
      const lists = [];
      for (;;) {
        const list = this.node('TypeList');
        lists.push(list);
        let ty;
        while ((ty = this.pop('Type'))) list.add(ty);
        list.children.reverse();
        if (this.pop('EmptyList')) break;
        if (!this.pop('FirstElementMarker')) return null;
      }
      return { lists, retro };
    }
    boundGenericType() {
      const bg = this.boundGenerics();
      if (!bg) return null;
      const nominal = this.popTypeAndGetAnyGeneric();
      const bound = this.boundGenericArgs(nominal, bg.lists, 0, 0);
      if (!bound) return null;
      this.addChild(bound, bg.retro);
      const ty = this.type(bound);
      this.addSubst(ty);
      return ty;
    }
    boundGenericArgs(nominal, lists, idx, depth) {
      if (!nominal || idx >= lists.length || depth > 256) return null;
      if (nominal.kind === 'TypeSymbolicReference' || nominal.kind === 'ProtocolSymbolicReference') {
        const remaining = this.node('TypeList');
        for (let i = lists.length - 1; i >= idx; i--) lists[i].children.forEach(c => remaining.add(c));
        return this.withChildren('BoundGenericOtherNominalType', this.type(nominal), remaining);
      }
      if (!nominal.count) return null;
      const context = nominal.first;
      const consumes = !NO_GENERIC_ARGS_KINDS.has(nominal.kind);
      const args = lists[idx];
      if (consumes) idx++;
      if (idx < lists.length) {
        let parent;
        if (context.kind === 'Extension') {
          parent = this.withChildren('Extension', context.first,
            this.boundGenericArgs(context.child(1), lists, idx, depth + 1));
          if (context.count === 3) this.addChild(parent, context.child(2));
        } else {
          parent = this.boundGenericArgs(context, lists, idx, depth + 1);
        }
        const rebuilt = this.withChild(nominal.kind, parent);
        if (!rebuilt) return null;
        for (let i = 1; i < nominal.count; i++) rebuilt.add(nominal.children[i]);
        nominal = rebuilt;
      }
      if (!consumes || !args.count) return nominal;
      const boundKind = { Class: 'BoundGenericClass', Structure: 'BoundGenericStructure',
        Enum: 'BoundGenericEnum', Protocol: 'BoundGenericProtocol',
        OtherNominalType: 'BoundGenericOtherNominalType', TypeAlias: 'BoundGenericTypeAlias' }[nominal.kind];
      if (nominal.kind === 'Function' || nominal.kind === 'Constructor') {
        return this.withChildren('BoundGenericFunction', nominal, args);
      }
      return boundKind ? this.withChildren(boundKind, this.type(nominal), args) : null;
    }

    implParamConvention(kind) {
      const attr = { i: '@in', c: '@in_constant', l: '@inout', b: '@inout_aliasable',
        n: '@in_guaranteed', X: '@in_cxx', x: '@owned', g: '@guaranteed', e: '@deallocating',
        y: '@unowned', v: '@pack_owned', p: '@pack_guaranteed', m: '@pack_inout' }[this.next()];
      if (!attr) { this.pushBack(); return null; }
      return this.node(kind).add(this.node('ImplConvention', attr));
    }
    implResultConvention(kind) {
      const attr = { r: '@out', o: '@owned', d: '@unowned', u: '@unowned_inner_pointer',
        a: '@autoreleased', k: '@pack_out' }[this.next()];
      if (!attr) { this.pushBack(); return null; }
      return this.node(kind).add(this.node('ImplConvention', attr));
    }
    clangType() {
      const len = this.natural();
      if (len <= 0 || this.pos + len > this.text.length) return null;
      const s = this.text.substr(this.pos, len);
      this.pos += len;
      return this.node('ClangType', s);
    }

    implFunctionType() {
      let ty = this.node('ImplFunctionType');
      if (this.nextIf('s')) {
        const bg = this.boundGenerics();
        if (!bg) return null;
        const sig = this.pop('DependentGenericSignature');
        if (!sig || bg.lists.length !== 1) return null;
        const subs = this.node('ImplPatternSubstitutions').add(sig).add(bg.lists[0]);
        if (bg.retro) subs.add(bg.retro);
        ty.add(subs);
      }
      if (this.nextIf('I')) {
        const bg = this.boundGenerics();
        if (!bg || bg.lists.length !== 1) return null;
        const subs = this.node('ImplInvocationSubstitutions').add(bg.lists[0]);
        if (bg.retro) subs.add(bg.retro);
        ty.add(subs);
      }
      let sig = this.pop('DependentGenericSignature');
      if (sig && this.nextIf('P')) sig = this.changeKind(sig, 'DependentPseudogenericSignature');
      if (this.nextIf('e')) ty.add(this.node('ImplEscaping'));
      if (this.nextIf('A')) ty.add(this.node('ImplErasedIsolation'));
      const diff = this.peek();
      if ('dlfr'.includes(diff) && diff) { this.next(); ty.add(this.node('ImplDifferentiabilityKind', undefined, diff)); }
      const callee = { y: '@callee_unowned', g: '@callee_guaranteed', x: '@callee_owned',
        t: '@convention(thin)' }[this.next()];
      if (!callee) return null;
      ty.add(this.node('ImplConvention', callee));
      let conv = null, hasClangType = false;
      const c = this.next();
      switch (c) {
        case 'B': conv = 'block'; break;
        case 'C': conv = 'c'; break;
        case 'z': {
          const c2 = this.next();
          if (c2 === 'B' || c2 === 'C') { hasClangType = true; conv = c2 === 'B' ? 'block' : 'c'; } else { this.pushBack(); this.pushBack(); }
          break;
        }
        case 'M': conv = 'method'; break;
        case 'O': conv = 'objc_method'; break;
        case 'K': conv = 'closure'; break;
        case 'W': conv = 'witness_method'; break;
        default: this.pushBack();
      }
      if (conv) {
        const fc = this.node('ImplFunctionConvention').add(this.node('ImplFunctionConventionName', conv));
        if (hasClangType) this.addChild(fc, this.clangType());
        ty.add(fc);
      }
      const coro = this.nextIf('A') ? 'yield_once' : this.nextIf('I') ? 'yield_once_2' : this.nextIf('G') ? 'yield_many' : null;
      if (coro) ty.add(this.node('ImplCoroutineKind', coro));
      if (this.nextIf('h')) ty.add(this.node('ImplFunctionAttribute', '@Sendable'));
      if (this.nextIf('H')) ty.add(this.node('ImplFunctionAttribute', '@async'));
      if (this.nextIf('T')) ty.add(this.node('ImplSendingResult'));
      this.addChild(ty, sig);

      let numTypes = 0, param;
      while ((param = this.implParamConvention('ImplParameter'))) {
        ty = this.addChild(ty, param);
        param.add(this.node('ImplParameterResultDifferentiability', this.nextIf('w') ? '@noDerivative' : ''));
        if (this.nextIf('T')) param.add(this.node('ImplParameterSending', 'sending'));
        if (this.nextIf('I')) param.add(this.node('ImplParameterIsolated', 'isolated'));
        if (this.nextIf('L')) param.add(this.node('ImplParameterImplicitLeading', 'sil_implicit_leading_param'));
        numTypes++;
      }
      let result;
      while ((result = this.implResultConvention('ImplResult'))) {
        ty = this.addChild(ty, result);
        result.add(this.node('ImplParameterResultDifferentiability', this.nextIf('w') ? '@noDerivative' : ''));
        numTypes++;
      }
      while (this.nextIf('Y')) {
        const y = this.implParamConvention('ImplYield');
        if (!y) return null;
        ty = this.addChild(ty, y);
        numTypes++;
      }
      if (this.nextIf('z')) {
        const err = this.implResultConvention('ImplErrorResult');
        if (!err) return null;
        ty = this.addChild(ty, err);
        numTypes++;
      }
      if (!ty || !this.nextIf('_')) return null;
      for (let i = 0; i < numTypes; i++) {
        const t = this.pop('Type');
        if (!t) return null;
        ty.child(ty.count - i - 1).add(t);
      }
      return this.type(ty);
    }

    metatype() {
      const T = k => this.popWithType(k);
      switch (this.next()) {
        case 'a': return T('TypeMetadataAccessFunction');
        case 'A': return this.withChild('ReflectionMetadataAssocTypeDescriptor', this.popProtocolConformance());
        case 'b': return T('CanonicalSpecializedGenericTypeMetadataAccessFunction');
        case 'B': return this.withChild('ReflectionMetadataBuiltinDescriptor', this.pop('Type'));
        case 'c': return this.withChild('ProtocolConformanceDescriptor', this.popProtocolConformance());
        case 'C': {
          const ty = this.pop('Type');
          if (!ty || !ANY_GENERIC_KINDS.has(ty.first.kind)) return null;
          return this.withChild('ReflectionMetadataSuperclassDescriptor', ty.first);
        }
        case 'D': case 'd': return T('TypeMetadataDemanglingCache');   // Xcode's toolchain emits 'Md'
        case 'R': return T('TypeMetadataMangledNameRef');
        case 'f': return T('FullTypeMetadata');
        case 'F': return this.withChild('ReflectionMetadataFieldDescriptor', this.pop('Type'));
        case 'g': return this.withChild('OpaqueTypeDescriptorAccessor', this.pop());
        case 'h': return this.withChild('OpaqueTypeDescriptorAccessorImpl', this.pop());
        case 'i': return T('TypeMetadataInstantiationFunction');
        case 'I': return T('TypeMetadataInstantiationCache');
        case 'j': return this.withChild('OpaqueTypeDescriptorAccessorKey', this.pop());
        case 'J': return this.withChild('NoncanonicalSpecializedGenericTypeMetadataCache', this.pop());
        case 'k': return this.withChild('OpaqueTypeDescriptorAccessorVar', this.pop());
        case 'K': return this.withChild('MetadataInstantiationCache', this.pop());
        case 'l': return T('TypeMetadataSingletonInitializationCache');
        case 'L': return T('TypeMetadataLazyCache');
        case 'm': return T('Metaclass');
        case 'M': return T('CanonicalSpecializedGenericMetaclass');
        case 'n': return T('NominalTypeDescriptor');
        case 'N': return T('NoncanonicalSpecializedGenericTypeMetadata');
        case 'o': return T('ClassMetadataBaseOffset');
        case 'p': return this.withChild('ProtocolDescriptor', this.popProtocol());
        case 'P': return T('GenericTypeMetadataPattern');
        case 'q': return this.withChild('Uniquable', this.pop());
        case 'Q': return this.withChild('OpaqueTypeDescriptor', this.pop());
        case 'r': return T('TypeMetadataCompletionFunction');
        case 's': return T('ObjCResilientClassStub');
        case 'S': return this.withChild('ProtocolSelfConformanceDescriptor', this.popProtocol());
        case 't': return T('FullObjCResilientClassStub');
        case 'u': return T('MethodLookupFunction');
        case 'U': return T('ObjCMetadataUpdateFunction');
        case 'V': return this.withChild('PropertyDescriptor', this.pop(isEntity));
        case 'X': return this.privateContextDescriptor();
        case 'z': return T('CanonicalPrespecializedGenericTypeCachingOnceToken');
        default: return null;
      }
    }

    privateContextDescriptor() {
      switch (this.next()) {
        case 'E': return this.withChild('ExtensionDescriptor', this.popContext());
        case 'M': return this.withChild('ModuleDescriptor', this.popModule());
        case 'Y': {
          const discriminator = this.pop();
          if (!discriminator) return null;
          const ctx = this.popContext();
          return ctx ? this.node('AnonymousDescriptor').add(ctx).add(discriminator) : null;
        }
        case 'X': return this.withChild('AnonymousDescriptor', this.popContext());
        case 'A': {
          const path = this.popAssocTypePath();
          if (!path) return null;
          return this.withChildren('AssociatedTypeGenericParamRef', this.pop('Type'), path);
        }
        default: return null;
      }
    }

    archetype() {
      switch (this.next()) {
        case 'a': {
          const ident = this.pop('Identifier');
          const arche = this.popTypeAndGetChild();
          const assoc = this.type(this.withChildren('AssociatedTypeRef', arche, ident));
          this.addSubst(assoc);
          return assoc;
        }
        case 'O': return this.withChild('OpaqueReturnTypeOf', this.popContext());
        case 'o': {
          const index = this.index();
          const bg = this.boundGenerics();
          if (!bg) return null;
          const name = this.pop();
          if (!name) return null;
          const opaque = this.node('OpaqueType').add(name).add(this.node('Index', undefined, index));
          const bound = this.node('TypeList');
          for (let i = bg.lists.length - 1; i >= 0; i--) bound.add(bg.lists[i]);
          opaque.add(bound);
          if (bg.retro) opaque.add(bg.retro);
          const ty = this.type(opaque);
          this.addSubst(ty);
          return ty;
        }
        case 'r': return this.type(this.node('OpaqueReturnType'));
        case 'R': {
          const ordinal = this.index();
          if (ordinal < 0) return null;
          return this.type(this.node('OpaqueReturnType').add(this.node('OpaqueReturnTypeIndex', undefined, ordinal)));
        }
        case 'x': return this.substAssoc(this.assocTypeSimple(null));
        case 'X': return this.substAssoc(this.assocTypeCompound(null));
        case 'y': return this.substAssoc(this.assocTypeSimple(this.genericParamIndex()));
        case 'Y': return this.substAssoc(this.assocTypeCompound(this.genericParamIndex()));
        case 'z': return this.substAssoc(this.assocTypeSimple(this.genericParam(0, 0)));
        case 'Z': return this.substAssoc(this.assocTypeCompound(this.genericParam(0, 0)));
        case 'p': {
          const count = this.popTypeAndGetChild();
          const pattern = this.popTypeAndGetChild();
          return this.type(this.withChildren('PackExpansion', pattern, count));
        }
        case 'e': {
          const pack = this.popTypeAndGetChild();
          const level = this.index();
          if (level < 0) return null;
          return this.type(this.withChildren('PackElement', pack, this.node('PackElementLevel', undefined, level)));
        }
        case 'P': return this.popPack('Pack');
        case 'S': {
          const k = { d: 'SILPackDirect', i: 'SILPackIndirect' }[this.next()];
          return k ? this.popPack(k) : null;
        }
        default: return null;
      }
    }
    substAssoc(t) { this.addSubst(t); return t; }

    assocTypeSimple(base) {
      const name = this.popAssocTypeName();
      const baseTy = base ? this.type(base) : this.pop('Type');
      return this.type(this.withChildren('DependentMemberType', baseTy, name));
    }
    assocTypeCompound(base) {
      const names = [];
      let firstElem = false;
      do {
        firstElem = !!this.pop('FirstElementMarker');
        const name = this.popAssocTypeName();
        if (!name) return null;
        names.push(name);
      } while (!firstElem);
      let baseTy = base ? this.type(base) : this.pop('Type');
      while (names.length) {
        const dep = this.addChild(this.node('DependentMemberType'), baseTy);
        baseTy = this.type(this.addChild(dep, names.pop()));
      }
      return baseTy;
    }
    popAssocTypeName() {
      let proto = this.pop('Type');
      if (proto && !isProtocolNode(proto)) return null;
      if (!proto) proto = this.pop('ProtocolSymbolicReference') || this.pop('ObjectiveCProtocolSymbolicReference');
      const assoc = this.withChild('DependentAssociatedTypeRef', this.pop('Identifier'));
      this.addChild(assoc, proto);
      return assoc;
    }
    popAssocTypePath() {
      const path = this.node('AssocTypePath');
      let firstElem = false;
      do {
        firstElem = !!this.pop('FirstElementMarker');
        const name = this.popAssocTypeName();
        if (!name) return null;
        path.add(name);
      } while (!firstElem);
      path.children.reverse();
      return path;
    }

    genericParam(depth, index) {
      if (depth < 0 || index < 0) return null;
      return this.node('DependentGenericParamType')
        .add(this.node('Index', undefined, depth)).add(this.node('Index', undefined, index));
    }
    genericParamIndex() {
      if (this.nextIf('d')) {
        const depth = this.index() + 1;
        return this.genericParam(depth, this.index());
      }
      if (this.nextIf('z')) return this.genericParam(0, 0);
      if (this.nextIf('s')) return this.node('ConstrainedExistentialSelf');
      return this.genericParam(0, this.index() + 1);
    }

    popProtocolConformance() {
      const sig = this.pop('DependentGenericSignature');
      const mod = this.popModule();
      const proto = this.popProtocol();
      let ty = this.pop('Type');
      let ident = null;
      if (!ty) {
        ident = this.pop('Identifier');
        ty = this.pop('Type');
      }
      if (sig) ty = this.type(this.withChildren('DependentGenericType', sig, ty));
      const conf = this.withChildren('ProtocolConformance', ty, proto, mod);
      this.addChild(conf, ident);
      return conf;
    }

    thunkOrSpecialization() {
      const c = this.next();
      switch (c) {
        case 'T': return this.next() === 'I' ? this.withChild('SILThunkIdentity', this.pop(isEntity)) : null;
        case 'c': return this.withChild('CurryThunk', this.pop(isEntity));
        case 'j': return this.withChild('DispatchThunk', this.pop(isEntity));
        case 'q': return this.withChild('MethodDescriptor', this.pop(isEntity));
        case 'o': return this.node('ObjCAttribute');
        case 'O': return this.node('NonObjCAttribute');
        case 'D': return this.node('DynamicAttribute');
        case 'd': return this.node('DirectMethodReferenceAttribute');
        case 'E': return this.node('DistributedThunk');
        case 'F': return this.node('DistributedAccessor');
        case 'a': return this.node('PartialApplyObjCForwarder');
        case 'A': return this.node('PartialApplyForwarder');
        case 'm': return this.node('MergedFunction');
        case 'X': return this.node('DynamicallyReplaceableFunctionVar');
        case 'x': return this.node('DynamicallyReplaceableFunctionKey');
        case 'I': return this.node('DynamicallyReplaceableFunctionImpl');
        case 'Y': case 'Q':
          return this.withChild(c === 'Q' ? 'AsyncAwaitResumePartialFunction' : 'AsyncSuspendResumePartialFunction',
            this.indexNode());
        case 'C': return this.withChild('CoroutineContinuationPrototype', this.pop('Type'));
        case 'z': case 'Z': {
          const flag = this.indexNode();
          const sig = this.pop('DependentGenericSignature');
          const resultTy = this.pop('Type');
          const implTy = this.pop('Type');
          const n = this.withChildren(c === 'z' ? 'ObjCAsyncCompletionHandlerImpl' :
            'PredefinedObjCAsyncCompletionHandlerImpl', implTy, resultTy, flag);
          if (sig) this.addChild(n, sig);
          return n;
        }
        case 'V': {
          const base = this.pop(isEntity);
          return this.withChildren('VTableThunk', this.pop(isEntity), base);
        }
        case 'W': {
          const entity = this.pop(isEntity);
          return this.withChildren('ProtocolWitness', this.popProtocolConformance(), entity);
        }
        case 'S': return this.withChild('ProtocolSelfConformanceWitness', this.pop(isEntity));
        case 'R': case 'r': case 'y': {
          const kind = c === 'R' ? 'ReabstractionThunkHelper' : c === 'y' ? 'ReabstractionThunkHelperWithSelf' : 'ReabstractionThunk';
          const thunk = this.node(kind);
          const sig = this.pop('DependentGenericSignature');
          if (sig) thunk.add(sig);
          if (c === 'y') this.addChild(thunk, this.pop('Type'));
          this.addChild(thunk, this.pop('Type'));
          this.addChild(thunk, this.pop('Type'));
          return thunk;
        }
        case 'g': return this.genericSpecialization('GenericSpecialization', null);
        case 'G': return this.genericSpecialization('GenericSpecializationNotReAbstracted', null);
        case 'B': return this.genericSpecialization('GenericSpecializationInResilienceDomain', null);
        case 't': {
          this.pushBack();
          const dropped = this.node('GenericSpecialization');
          while (this.nextIf('t')) {
            const n = this.natural();
            dropped.add(this.node('DroppedArgument', undefined, n < 0 ? 0 : n + 1));
          }
          const k = { g: 'GenericSpecialization', G: 'GenericSpecializationNotReAbstracted',
            B: 'GenericSpecializationInResilienceDomain' }[this.next()];
          return k ? this.genericSpecialization(k, dropped) : null;
        }
        case 's': return this.genericSpecialization('GenericSpecializationPrespecialized', null);
        case 'i': return this.genericSpecialization('InlinedGenericFunction', null);
        case 'p': case 'P': {
          const spec = this.specAttributes(c === 'p' ? 'GenericPartialSpecialization' :
            'GenericPartialSpecializationNotReAbstracted');
          return this.addChild(spec, this.withChild('GenericSpecializationParam', this.pop('Type')));
        }
        case 'f': return this.functionSpecialization();
        case 'K': case 'k': {
          const kind = this.nextIf('mu') ? 'KeyPathUnappliedMethodThunkHelper' :
            this.nextIf('MA') ? 'KeyPathAppliedMethodThunkHelper' :
            c === 'K' ? 'KeyPathGetterThunkHelper' : 'KeyPathSetterThunkHelper';
          const serialized = this.nextIf('q');
          const types = [];
          let n = this.pop();
          if (!n || n.kind !== 'Type') return null;
          do { types.push(n); n = this.pop(); } while (n && n.kind === 'Type');
          if (!n) return null;
          let result;
          if (n.kind === 'DependentGenericSignature') {
            const decl = this.pop();
            if (!decl) return null;
            result = this.node(kind).add(decl).add(n);
          } else result = this.node(kind).add(n);
          for (let i = types.length - 1; i >= 0; i--) result.add(types[i]);
          if (serialized) result.add(this.node('IsSerialized'));
          return result;
        }
        case 'l': return this.withChild('AssociatedTypeDescriptor', this.popAssocTypeName());
        case 'L': return this.withChild('ProtocolRequirementsBaseDescriptor', this.popProtocol());
        case 'M': return this.withChild('DefaultAssociatedTypeMetadataAccessor', this.popAssocTypeName());
        case 'n': case 'N': {
          const req = this.popProtocol();
          const path = this.popAssocTypePath();
          const proto = this.pop('Type');
          return this.withChildren(c === 'n' ? 'AssociatedConformanceDescriptor' :
            'DefaultAssociatedConformanceAccessor', proto, path, req);
        }
        case 'b': {
          const req = this.popProtocol();
          return this.withChildren('BaseConformanceDescriptor', this.pop('Type'), req);
        }
        case 'H': case 'h': {
          const kind = c === 'H' ? 'KeyPathEqualsThunkHelper' : 'KeyPathHashThunkHelper';
          const serialized = this.nextIf('q');
          let sig = null;
          const types = [];
          let n = this.pop();
          if (!n) return null;
          if (n.kind === 'DependentGenericSignature') sig = n;
          else if (n.kind === 'Type') types.push(n);
          else return null;
          while ((n = this.pop())) {
            if (n.kind !== 'Type') return null;
            types.push(n);
          }
          const result = this.node(kind);
          for (let i = types.length - 1; i >= 0; i--) result.add(types[i]);
          if (sig) result.add(sig);
          if (serialized) result.add(this.node('IsSerialized'));
          return result;
        }
        case 'v': {
          const idx = this.index();
          if (idx < 0) return null;
          return this.node(this.next() === 'r' ? 'OutlinedReadOnlyObject' : 'OutlinedVariable', undefined, idx);
        }
        case 'e': {
          const params = this.bridgedMethodParams();
          return params ? this.node('OutlinedBridgedMethod', params) : null;
        }
        case 'u': return this.node('AsyncFunctionPointer');
        case 'U': {
          const actor = this.pop('Type');
          if (!actor) return null;
          const reabstraction = this.pop();
          if (!reabstraction) return null;
          return this.node('ReabstractionThunkHelperWithGlobalActor').add(reabstraction).add(actor);
        }
        case 'w': {
          const k = { b: 'BackDeploymentThunk', B: 'BackDeploymentFallback', S: 'HasSymbolQuery',
            c: 'CoroFunctionPointer', d: 'DefaultOverride' }[this.next()];
          return k ? this.node(k) : null;
        }
        default: return null;   // includes autodiff ('J'), not supported
      }
    }

    bridgedMethodParams() {
      if (this.nextIf('_')) return '';
      const kind = this.next();
      if (!'opam'.includes(kind) || !kind) return '';
      let s = kind;
      while (!this.nextIf('_')) {
        const c = this.next();
        if (c !== 'n' && c !== 'b' && c !== 'g') return '';
        s += c;
      }
      return s;
    }

    genericSpecialization(kind, dropped) {
      const spec = this.specAttributes(kind);
      if (!spec) return null;
      if (dropped) dropped.children.forEach(c => spec.add(c));
      const list = this.popTypeList();
      if (!list) return null;
      list.children.forEach(t => spec.add(this.node('GenericSpecializationParam').add(t)));
      return spec;
    }

    specAttributes(kind) {
      const serialized = this.nextIf('q');
      const asyncRemoved = this.nextIf('a');
      const passId = this.next().charCodeAt(0) - 48;
      if (!(passId >= 0 && passId < 10)) return null;
      const spec = this.node(kind);
      if (serialized) spec.add(this.node('IsSerialized'));
      if (asyncRemoved) spec.add(this.node('AsyncRemoved'));
      spec.add(this.node('SpecializationPassID', undefined, passId));
      return spec;
    }

    functionSpecialization() {
      let spec = this.specAttributes('FunctionSignatureSpecialization');
      while (spec && !this.nextIf('_')) spec = this.addChild(spec, this.funcSpecParam('FunctionSignatureSpecializationParam'));
      if (!this.nextIf('n')) spec = this.addChild(spec, this.funcSpecParam('FunctionSignatureSpecializationReturn'));
      if (!spec) return null;
      // attach the popped payloads, last parameter first
      for (let idx = spec.count - 1; idx >= 0; idx--) {
        const param = spec.children[idx];
        if (param.kind !== 'FunctionSignatureSpecializationParam' || !param.count) continue;
        const kind = param.first.index;
        if (kind !== FSPK.ConstantPropFunction && kind !== FSPK.ConstantPropGlobal &&
            kind !== FSPK.ConstantPropString && kind !== FSPK.ConstantPropKeyPath && kind !== FSPK.ClosureProp) continue;
        const fixed = param.count;
        let ty;
        while ((ty = this.pop('Type'))) {
          if (kind !== FSPK.ClosureProp && kind !== FSPK.ConstantPropKeyPath) return null;
          param.add(ty);
        }
        const name = this.pop('Identifier');
        if (!name) return null;
        let text = name.text;
        if (kind === FSPK.ConstantPropString && text.startsWith('_')) text = text.slice(1);
        param.add(this.node('FunctionSignatureSpecializationParamPayload', text));
        param.children = param.children.slice(0, fixed).concat(param.children.slice(fixed).reverse());
      }
      return spec;
    }

    funcSpecParam(kind) {
      const param = this.node(kind);
      const pk = v => param.add(this.node('FunctionSignatureSpecializationParamKind', undefined, v));
      const flags = (v, letters) => {
        const bits = { D: FSPK.Dead, G: FSPK.OwnedToGuaranteed, O: FSPK.GuaranteedToOwned, X: FSPK.SROA };
        for (const l of letters) if (this.nextIf(l)) v |= bits[l];
        return pk(v);
      };
      switch (this.next()) {
        case 'n': return param;
        case 'c': return pk(FSPK.ClosureProp);
        case 'p':
          switch (this.next()) {
            case 'f': return pk(FSPK.ConstantPropFunction);
            case 'g': return pk(FSPK.ConstantPropGlobal);
            case 'i': case 'd': {
              pk(this.text[this.pos - 1] === 'i' ? FSPK.ConstantPropInteger : FSPK.ConstantPropFloat);
              let s = '';
              while (isDigit(this.peek())) s += this.next();
              return s ? param.add(this.node('FunctionSignatureSpecializationParamPayload', s)) : null;
            }
            case 's': {
              const enc = { b: 'u8', w: 'u16', c: 'objc' }[this.next()];
              if (!enc) return null;
              pk(FSPK.ConstantPropString);
              return param.add(this.node('FunctionSignatureSpecializationParamPayload', enc));
            }
            case 'k': return pk(FSPK.ConstantPropKeyPath);
            default: return null;
          }
        case 'e': return flags(FSPK.ExistentialToGeneric, 'DGOX');
        case 'd': return flags(FSPK.Dead, 'GOX');
        case 'g': return flags(FSPK.OwnedToGuaranteed, 'X');
        case 'o': return flags(FSPK.GuaranteedToOwned, 'X');
        case 'x': return pk(FSPK.SROA);
        case 'i': return pk(FSPK.BoxToValue);
        case 's': return pk(FSPK.BoxToStack);
        case 'r': return pk(FSPK.InOutToOut);
        default: return null;
      }
    }

    witness() {
      const c = this.next();
      switch (c) {
        case 'C': return this.withChild('EnumCase', this.pop(isEntity));
        case 'V': return this.withChild('ValueWitnessTable', this.pop('Type'));
        case 'v': {
          const d = { d: 0, i: 1 }[this.next()];
          if (d === undefined) return null;
          return this.withChildren('FieldOffset', this.node('Directness', undefined, d), this.pop(isEntity));
        }
        case 'S': return this.withChild('ProtocolSelfConformanceWitnessTable', this.popProtocol());
        case 'P': return this.withChild('ProtocolWitnessTable', this.popProtocolConformance());
        case 'p': return this.withChild('ProtocolWitnessTablePattern', this.popProtocolConformance());
        case 'G': return this.withChild('GenericProtocolWitnessTable', this.popProtocolConformance());
        case 'I': return this.withChild('GenericProtocolWitnessTableInstantiationFunction', this.popProtocolConformance());
        case 'r': return this.withChild('ResilientProtocolWitnessTable', this.popProtocolConformance());
        case 'l': case 'L': {
          const conf = this.popProtocolConformance();
          return this.withChildren(c === 'l' ? 'LazyProtocolWitnessTableAccessor' :
            'LazyProtocolWitnessTableCacheVariable', this.pop('Type'), conf);
        }
        case 'a': return this.withChild('ProtocolWitnessTableAccessor', this.popProtocolConformance());
        case 't': {
          const name = this.pop(isDeclName);
          return this.withChildren('AssociatedTypeMetadataAccessor', this.popProtocolConformance(), name);
        }
        case 'T': {
          const proto = this.pop('Type');
          const path = this.popAssocTypePath();
          return this.withChildren('AssociatedTypeWitnessTableAccessor', this.popProtocolConformance(), path, proto);
        }
        case 'b': {
          const proto = this.pop('Type');
          return this.withChildren('BaseWitnessTableAccessor', this.popProtocolConformance(), proto);
        }
        case 'O': {
          const kind = { B: 'OutlinedInitializeWithTakeNoValueWitness', C: 'OutlinedInitializeWithCopyNoValueWitness',
            D: 'OutlinedAssignWithTakeNoValueWitness', F: 'OutlinedAssignWithCopyNoValueWitness',
            H: 'OutlinedDestroyNoValueWitness', y: 'OutlinedCopy', e: 'OutlinedConsume', r: 'OutlinedRetain',
            s: 'OutlinedRelease', b: 'OutlinedInitializeWithTake', c: 'OutlinedInitializeWithCopy',
            d: 'OutlinedAssignWithTake', f: 'OutlinedAssignWithCopy', h: 'OutlinedDestroy', g: 'OutlinedEnumGetTag',
            i: 'OutlinedEnumTagStore', j: 'OutlinedEnumProjectDataForLoad' }[this.next()];
          if (!kind) return null;
          const hasCase = kind === 'OutlinedEnumTagStore' || kind === 'OutlinedEnumProjectDataForLoad';
          const caseIdx = hasCase ? this.indexNode() : null;
          const sig = this.pop('DependentGenericSignature');
          const parts = [this.pop('Type')];
          if (sig) parts.push(sig);
          if (hasCase) parts.push(caseIdx);
          return this.withChildren(kind, ...parts);
        }
        case 'Z': case 'z': {
          const decls = this.node('GlobalVariableOnceDeclList');
          const vars = [];
          while (this.pop('FirstElementMarker')) {
            const ident = this.pop(isDeclName);
            if (!ident) return null;
            vars.push(ident);
          }
          for (let i = vars.length - 1; i >= 0; i--) decls.add(vars[i]);
          const ctx = this.popContext();
          if (!ctx) return null;
          return this.withChildren(c === 'Z' ? 'GlobalVariableOnceFunction' : 'GlobalVariableOnceToken', ctx, decls);
        }
        default: return null;   // includes differentiability witnesses ('J')
      }
    }

    specialType() {
      const c = this.next();
      const fnKinds = { E: 'NoEscapeFunctionType', A: 'EscapingAutoClosureType', f: 'ThinFunctionType',
        K: 'AutoClosureType', U: 'UncurriedFunctionType', L: 'EscapingObjCBlock', B: 'ObjCBlock',
        C: 'CFunctionPointer' };
      if (fnKinds[c]) return this.popFunctionType(fnKinds[c]);
      const wrap = k => this.type(this.withChild(k, this.pop('Type')));
      switch (c) {
        case 'g': case 'G': {
          const ty = this.pop('Type');
          const sig = c === 'G' ? this.pop('DependentGenericSignature') : null;
          return sig ? this.withChildren('ExtendedExistentialTypeShape', sig, ty) :
            this.withChild('ExtendedExistentialTypeShape', ty);
        }
        case 'z': {
          const k = { B: 'ObjCBlock', C: 'CFunctionPointer' }[this.next()];
          return k ? this.popFunctionType(k, true) : null;
        }
        case 'o': return wrap('Unowned');
        case 'u': return wrap('Unmanaged');
        case 'w': return wrap('Weak');
        case 'b': return wrap('SILBoxType');
        case 'D': return wrap('DynamicSelf');
        case 'M': case 'm': {
          const repr = this.metatypeRepresentation();
          const ty = this.pop('Type');
          return this.type(this.withChildren(c === 'M' ? 'Metatype' : 'ExistentialMetatype', repr, ty));
        }
        case 'P': {
          const reqs = this.node('ConstrainedExistentialRequirementList');
          let firstElem = false;
          do {
            firstElem = !!this.pop('FirstElementMarker');
            const req = this.pop(isRequirement);
            if (!req) return null;
            reqs.add(req);
          } while (!firstElem);
          reqs.children.reverse();
          return this.type(this.withChildren('ConstrainedExistential', this.pop('Type'), reqs));
        }
        case 'p': return wrap('ExistentialMetatype');
        case 'c': {
          const superclass = this.pop('Type');
          return this.type(this.withChildren('ProtocolListWithClass', this.protocolList(), superclass));
        }
        case 'l': return this.type(this.withChild('ProtocolListWithAnyObject', this.protocolList()));
        case 'X': case 'x': {
          let sig = null, args = null;
          if (c === 'X') {
            sig = this.pop('DependentGenericSignature');
            if (!sig) return null;
            args = this.popTypeList();
            if (!args) return null;
          }
          const fields = this.popTypeList();
          if (!fields) return null;
          const layout = this.node('SILBoxLayout');
          for (let fieldTy of fields.children) {
            let mutable = false;
            if (fieldTy.first.kind === 'InOut') { mutable = true; fieldTy = this.type(fieldTy.first.first); }
            layout.add(this.node(mutable ? 'SILBoxMutableField' : 'SILBoxImmutableField').add(fieldTy));
          }
          const box = this.node('SILBoxTypeWithLayout').add(layout);
          if (sig) box.add(sig).add(args);
          return this.type(box);
        }
        case 'Y': return this.anyGenericType('OtherNominalType');
        case 'Z': {
          const types = this.popTypeList();
          const name = this.pop('Identifier');
          const parent = this.popContext();
          let anon = this.addChild(this.node('AnonymousContext'), name);
          anon = this.addChild(anon, parent);
          return this.addChild(anon, types);
        }
        case 'e': return this.type(this.node('ErrorType'));
        case 'S':
          switch (this.next()) {
            case 'q': return wrap('SugaredOptional');
            case 'a': return wrap('SugaredArray');
            case 'A': {
              const element = this.pop('Type');
              return this.type(this.withChildren('SugaredInlineArray', this.pop('Type'), element));
            }
            case 'D': {
              const value = this.pop('Type');
              return this.type(this.withChildren('SugaredDictionary', this.pop('Type'), value));
            }
            case 'p': return wrap('SugaredParen');
            default: return null;
          }
        default: return null;
      }
    }

    metatypeRepresentation() {
      const r = { t: '@thin', T: '@thick', o: '@objc_metatype' }[this.next()];
      return r ? this.node('MetatypeRepresentation', r) : null;
    }

    accessor(child) {
      const kinds = { m: 'MaterializeForSet', s: 'Setter', g: 'Getter', G: 'GlobalGetter', w: 'WillSet',
        W: 'DidSet', r: 'ReadAccessor', y: 'Read2Accessor', M: 'ModifyAccessor', x: 'Modify2Accessor',
        i: 'InitAccessor' };
      const c = this.next();
      let kind = kinds[c];
      if (c === 'a') kind = { O: 'OwningMutableAddressor', o: 'NativeOwningMutableAddressor',
        P: 'NativePinningMutableAddressor', u: 'UnsafeMutableAddressor' }[this.next()];
      else if (c === 'l') kind = { O: 'OwningAddressor', o: 'NativeOwningAddressor',
        p: 'NativePinningAddressor', u: 'UnsafeAddressor' }[this.next()];
      else if (c === 'p') return child;   // pseudo-accessor: the storage itself
      return kind ? this.withChild(kind, child) : null;
    }

    functionEntity() {
      const simple = { D: 'Deallocator', d: 'Destructor', Z: 'IsolatedDeallocator', E: 'IVarDestroyer',
        e: 'IVarInitializer', i: 'Initializer', P: 'PropertyWrapperBackingInitializer',
        W: 'PropertyWrapperInitFromProjectedValue' };
      const c = this.next();
      if (c === 'm') return this.entity('Macro');
      if (c === 'M') return this.macroExpansion();
      if (c === 'p') return this.entity('GenericTypeParamDecl');
      if (simple[c]) return this.withChild(simple[c], this.popContext());
      if (c === 'C' || c === 'c') {
        const priv = this.pop('PrivateDeclName');
        const ty = this.pop('Type');
        const labels = this.popFunctionParamLabels(ty);
        let e = this.withChild(c === 'C' ? 'Allocator' : 'Constructor', this.popContext());
        this.addChild(e, labels);
        e = this.addChild(e, ty);
        this.addChild(e, priv);
        return e;
      }
      if (c === 'U' || c === 'u') {
        const idx = this.indexNode();
        const ty = this.pop('Type');
        let e = this.withChild(c === 'U' ? 'ExplicitClosure' : 'ImplicitClosure', this.popContext());
        e = this.addChild(e, idx);
        return this.addChild(e, ty);
      }
      if (c === 'A') {
        const idx = this.indexNode();
        return this.addChild(this.withChild('DefaultArgumentInitializer', this.popContext()), idx);
      }
      return null;
    }

    entity(kind) {
      const ty = this.pop('Type');
      const labels = this.popFunctionParamLabels(ty);
      const name = this.pop(isDeclName);
      const ctx = this.popContext();
      return labels ? this.withChildren(kind, ctx, name, labels, ty) : this.withChildren(kind, ctx, name, ty);
    }

    subscript() {
      const priv = this.pop('PrivateDeclName');
      const ty = this.pop('Type');
      const labels = this.popFunctionParamLabels(ty);
      const ctx = this.popContext();
      if (!ty) return null;
      let sub = this.addChild(this.node('Subscript'), ctx);
      this.addChild(sub, labels);
      sub = this.addChild(sub, ty);
      this.addChild(sub, priv);
      return this.accessor(sub);
    }

    protocolList() {
      const list = this.popList('TypeList', () => this.popProtocol());
      return list ? this.node('ProtocolList').add(list) : null;
    }

    genericSignature(hasParamCounts) {
      const sig = this.node('DependentGenericSignature');
      if (hasParamCounts) {
        while (!this.nextIf('l')) {
          if (this.pos >= this.text.length) return null;
          let count = 0;
          if (!this.nextIf('z')) count = this.index() + 1;
          if (count < 0) return null;
          sig.add(this.node('DependentGenericParamCount', undefined, count));
        }
      } else {
        sig.add(this.node('DependentGenericParamCount', undefined, 1));
      }
      let req;
      const reqs = [];
      while ((req = this.pop(isRequirement))) reqs.push(req);
      reqs.reverse().forEach(r => sig.add(r));
      return sig;
    }

    genericRequirement() {
      let constraint, typeKind, inverse = null;
      const c = this.next();
      const table = { V: ['Value', 'Generic'], v: ['Pack', 'Generic'], c: ['BaseClass', 'Assoc'],
        C: ['BaseClass', 'Compound'], b: ['BaseClass', 'Generic'], B: ['BaseClass', 'Subst'],
        t: ['SameType', 'Assoc'], T: ['SameType', 'Compound'], s: ['SameType', 'Generic'],
        S: ['SameType', 'Subst'], m: ['Layout', 'Assoc'], M: ['Layout', 'Compound'],
        l: ['Layout', 'Generic'], L: ['Layout', 'Subst'], p: ['Protocol', 'Assoc'],
        P: ['Protocol', 'Compound'], Q: ['Protocol', 'Subst'], h: ['SameShape', 'Generic'],
        i: ['Inverse', 'Generic'], I: ['Inverse', 'Subst'] };
      if (table[c]) {
        [constraint, typeKind] = table[c];
        if (constraint === 'Inverse') {
          inverse = this.indexNode();
          if (!inverse) return null;
        }
      } else {
        constraint = 'Protocol';
        typeKind = 'Generic';
        this.pushBack();
      }
      let ty;
      switch (typeKind) {
        case 'Generic': ty = this.type(this.genericParamIndex()); break;
        case 'Assoc': ty = this.assocTypeSimple(this.genericParamIndex()); this.addSubst(ty); break;
        case 'Compound': ty = this.assocTypeCompound(this.genericParamIndex()); this.addSubst(ty); break;
        default: ty = this.pop('Type');
      }
      switch (constraint) {
        case 'Value': return this.withChildren('DependentGenericParamValueMarker', ty, this.pop('Type'));
        case 'Pack': return this.withChild('DependentGenericParamPackMarker', ty);
        case 'Protocol': return this.withChildren('DependentGenericConformanceRequirement', ty, this.popProtocol());
        case 'Inverse': return this.withChildren('DependentGenericInverseConformanceRequirement', ty, inverse);
        case 'BaseClass': return this.withChildren('DependentGenericConformanceRequirement', ty, this.pop('Type'));
        case 'SameType': return this.withChildren('DependentGenericSameTypeRequirement', ty, this.pop('Type'));
        case 'SameShape': return this.withChildren('DependentGenericSameShapeRequirement', ty, this.pop('Type'));
      }
      // layout constraint
      const lc = this.next();
      let size = null, align = null;
      if (lc && 'EeMmS'.includes(lc)) {
        size = this.indexNode();
        if (!size) return null;
        if (lc === 'E' || lc === 'M') align = this.indexNode();
      } else if (!lc || !'URNCDTB'.includes(lc)) {
        return null;
      }
      const layout = this.withChildren('DependentGenericLayoutRequirement', ty, this.node('Identifier', lc));
      if (size) this.addChild(layout, size);
      if (align) this.addChild(layout, align);
      return layout;
    }

    genericType() {
      const sig = this.pop('DependentGenericSignature');
      const ty = this.pop('Type');
      return this.type(this.withChildren('DependentGenericType', sig, ty));
    }

    valueWitness() {
      const code = this.next() + this.next();
      const name = VALUE_WITNESSES[code];
      if (!name) return null;
      return this.addChild(this.node('ValueWitness').add(this.node('Index', name)), this.pop('Type'));
    }

    typeMangling() {
      const ty = this.pop('Type');
      const labels = this.popFunctionParamLabels(ty);
      const tm = this.node('TypeMangling');
      this.addChild(tm, labels);
      return this.addChild(tm, ty);
    }

    typeAnnotation() {
      const c = this.next();
      switch (c) {
        case 'a': return this.node('AsyncAnnotation');
        case 'A': return this.node('IsolatedAnyFunctionType');
        case 'b': return this.node('ConcurrentFunctionType');
        case 'c': return this.withChild('GlobalActorFunctionType', this.popTypeAndGetChild());
        case 'C': return this.node('NonIsolatedCallerFunctionType');
        case 'i': return this.type(this.withChild('Isolated', this.popTypeAndGetChild()));
        case 'j': {
          const k = this.next();
          return 'frdl'.includes(k) && k ? this.node('DifferentiableFunctionType', undefined, k) : null;
        }
        case 'k': return this.type(this.withChild('NoDerivative', this.popTypeAndGetChild()));
        case 'K': return this.withChild('TypedThrowsAnnotation', this.popTypeAndGetChild());
        case 't': return this.type(this.withChild('CompileTimeLiteral', this.popTypeAndGetChild()));
        case 'g': return this.type(this.withChild('ConstValue', this.popTypeAndGetChild()));
        case 'T': return this.node('SendingResultFunctionType');
        case 'u': return this.type(this.withChild('Sending', this.popTypeAndGetChild()));
        default: return null;
      }
    }

    macroExpansion() {
      const c = this.next();
      let kind, attached = false, freestanding = false;
      if (MACRO_ROLES[c]) { kind = MACRO_ROLES[c] + 'AttachedMacroExpansion'; attached = true; }
      else if (c === 'f') { kind = 'FreestandingMacroExpansion'; freestanding = true; }
      else if (c === 'u') kind = 'MacroExpansionUniqueName';
      else if (c === 'X') {
        const line = this.index(), col = this.index();
        const buffer = this.pop('Identifier');
        const mod = this.pop('Identifier');
        return this.withChildren('MacroExpansionLoc', mod, buffer,
          this.node('Index', undefined, line), this.node('Index', undefined, col));
      } else return null;
      const macroName = this.pop('Identifier');
      const priv = freestanding ? this.pop('PrivateDeclName') : null;
      const attachedName = attached ? this.pop(isDeclName) : null;
      const ctx = this.pop(k => MACRO_EXPANSION_KINDS.has(k)) || this.popContext();
      const discriminator = this.indexNode();
      const result = attached && attachedName ?
        this.withChildren(kind, ctx, attachedName, macroName, discriminator) :
        this.withChildren(kind, ctx, macroName, discriminator);
      if (result && priv) result.add(priv);
      return result;
    }

    integerType() {
      if (this.peek() === 'n') {
        this.next();
        return this.type(this.node('NegativeInteger', undefined, -this.index()));
      }
      return this.type(this.node('Integer', undefined, this.index()));
    }
  }

  // ── Printer (DemangleOptions::SimplifiedUIDemangleOptions) ─────────────────
  const genericParameterName = (depth, index) => {
    let name = '';
    do {
      name += String.fromCharCode(65 + (index % 26));
      index = Math.floor(index / 26);
    } while (index);
    return depth !== 0 ? name + depth : name;
  };

  const SIMPLE_TYPE_KINDS = kindSet('AssociatedType AssociatedTypeRef BoundGenericClass BoundGenericEnum ' +
    'BoundGenericStructure BoundGenericProtocol BoundGenericOtherNominalType BoundGenericTypeAlias ' +
    'BoundGenericFunction BuiltinTypeName BuiltinTupleType BuiltinFixedArray Class DependentGenericType ' +
    'DependentMemberType DependentGenericParamType DynamicSelf Enum ErrorType ExistentialMetatype ' +
    'Metatype MetatypeRepresentation Module Tuple Pack SILPackDirect SILPackIndirect ' +
    'ConstrainedExistentialRequirementList ConstrainedExistentialSelf Protocol ' +
    'ProtocolSymbolicReference ReturnType SILBoxType SILBoxTypeWithLayout Structure OtherNominalType ' +
    'TupleElementName TypeAlias TypeList LabelList TypeSymbolicReference SugaredOptional SugaredArray ' +
    'SugaredInlineArray SugaredDictionary SugaredParen Integer NegativeInteger');
  const FUNCTION_TYPE_KINDS = kindSet('FunctionType NoEscapeFunctionType UncurriedFunctionType ' +
    'CFunctionPointer ThinFunctionType');

  const isSimpleType = n => {
    if (n.kind === 'Type') return isSimpleType(n.first);
    if (n.kind === 'ProtocolList') return n.first.count <= 1;
    if (n.kind === 'ProtocolListWithAnyObject') return n.first.first.count === 0;
    return SIMPLE_TYPE_KINDS.has(n.kind);
  };
  const needSpaceBeforeType = n => n.kind === 'Type' ? needSpaceBeforeType(n.first) :
    !(n.kind === 'FunctionType' || n.kind === 'NoEscapeFunctionType' ||
      n.kind === 'UncurriedFunctionType' || n.kind === 'DependentGenericType');
  const isExistentialType = n => n.kind === 'ExistentialMetatype' || n.kind === 'ProtocolList' ||
    n.kind === 'ProtocolListWithClass' || n.kind === 'ProtocolListWithAnyObject';
  const childOf = (n, kind) => n.children.find(c => c.kind === kind) || null;

  // simple "<prefix><child 0>" nodes
  const PREFIXED = {
    CurryThunk: 'curry thunk of ', SILThunkIdentity: 'identity thunk of ',
    DispatchThunk: 'dispatch thunk of ', MethodDescriptor: 'method descriptor for ',
    MethodLookupFunction: 'method lookup function for ',
    ObjCMetadataUpdateFunction: 'ObjC metadata update function for ',
    ObjCResilientClassStub: 'ObjC resilient class stub for ',
    FullObjCResilientClassStub: 'full ObjC resilient class stub for ',
    OutlinedRetain: 'outlined retain of ', OutlinedRelease: 'outlined release of ',
    OutlinedInitializeWithTake: 'outlined init with take of ',
    OutlinedInitializeWithTakeNoValueWitness: 'outlined init with take of ',
    OutlinedInitializeWithCopy: 'outlined init with copy of ',
    OutlinedInitializeWithCopyNoValueWitness: 'outlined init with copy of ',
    OutlinedAssignWithTake: 'outlined assign with take of ',
    OutlinedAssignWithTakeNoValueWitness: 'outlined assign with take of ',
    OutlinedAssignWithCopy: 'outlined assign with copy of ',
    OutlinedAssignWithCopyNoValueWitness: 'outlined assign with copy of ',
    OutlinedDestroy: 'outlined destroy of ', OutlinedDestroyNoValueWitness: 'outlined destroy of ',
    OutlinedEnumProjectDataForLoad: 'outlined enum project data for load of ',
    OutlinedEnumTagStore: 'outlined enum tag store of ', OutlinedEnumGetTag: 'outlined enum get tag of ',
    Static: 'static ', InOut: 'inout ', Isolated: 'isolated ', Sending: 'sending ',
    CompileTimeLiteral: '_const ', ConstValue: '@const ', Shared: '__shared ', Owned: '__owned ',
    NoDerivative: '@noDerivative ', Weak: 'weak ', Unowned: 'unowned ', Unmanaged: 'unowned(unsafe) ',
    ProtocolSelfConformanceWitnessTable: 'protocol self-conformance witness table for ',
    ProtocolWitnessTableAccessor: 'protocol witness table accessor for ',
    ProtocolWitnessTable: 'protocol witness table for ',
    ProtocolWitnessTablePattern: 'protocol witness table pattern for ',
    GenericProtocolWitnessTable: 'generic protocol witness table for ',
    GenericProtocolWitnessTableInstantiationFunction: 'instantiation function for generic protocol witness table for ',
    ResilientProtocolWitnessTable: 'resilient protocol witness table for ',
    ProtocolSelfConformanceWitness: 'protocol self-conformance witness for ',
    EnumCase: 'enum case for ',
    GenericTypeMetadataPattern: 'generic type metadata pattern for ', Metaclass: 'metaclass for ',
    ProtocolSelfConformanceDescriptor: 'protocol self-conformance descriptor for ',
    ProtocolConformanceDescriptor: 'protocol conformance descriptor for ',
    ProtocolConformanceDescriptorRecord: 'protocol conformance descriptor runtime record for ',
    ProtocolDescriptor: 'protocol descriptor for ',
    ProtocolDescriptorRecord: 'protocol descriptor runtime record for ',
    ProtocolRequirementsBaseDescriptor: 'protocol requirements base descriptor for ',
    FullTypeMetadata: 'full type metadata for ', TypeMetadata: 'type metadata for ',
    TypeMetadataAccessFunction: 'type metadata accessor for ',
    TypeMetadataInstantiationCache: 'type metadata instantiation cache for ',
    TypeMetadataInstantiationFunction: 'type metadata instantiation function for ',
    TypeMetadataSingletonInitializationCache: 'type metadata singleton initialization cache for ',
    TypeMetadataCompletionFunction: 'type metadata completion function for ',
    TypeMetadataDemanglingCache: 'demangling cache variable for type metadata for ',
    TypeMetadataLazyCache: 'lazy cache variable for type metadata for ',
    TypeMetadataMangledNameRef: 'mangled name ref for type metadata for ',
    AssociatedTypeDescriptor: 'associated type descriptor for ',
    DefaultAssociatedTypeMetadataAccessor: 'default associated type metadata accessor for ',
    ClassMetadataBaseOffset: 'class metadata base offset for ',
    PropertyDescriptor: 'property descriptor for ', NominalTypeDescriptor: 'nominal type descriptor for ',
    NominalTypeDescriptorRecord: 'nominal type descriptor runtime record for ',
    OpaqueTypeDescriptor: 'opaque type descriptor for ',
    OpaqueTypeDescriptorRecord: 'opaque type descriptor runtime record for ',
    OpaqueTypeDescriptorAccessor: 'opaque type descriptor accessor for ',
    OpaqueTypeDescriptorAccessorImpl: 'opaque type descriptor accessor impl for ',
    OpaqueTypeDescriptorAccessorKey: 'opaque type descriptor accessor key for ',
    OpaqueTypeDescriptorAccessorVar: 'opaque type descriptor accessor var for ',
    CoroutineContinuationPrototype: 'coroutine continuation prototype for ',
    ValueWitnessTable: 'value witness table for ',
    ReflectionMetadataBuiltinDescriptor: 'reflection metadata builtin descriptor ',
    ReflectionMetadataFieldDescriptor: 'reflection metadata field descriptor ',
    ReflectionMetadataAssocTypeDescriptor: 'reflection metadata associated type descriptor ',
    ReflectionMetadataSuperclassDescriptor: 'reflection metadata superclass descriptor ',
    CanonicalSpecializedGenericMetaclass: 'specialized generic metaclass for ',
    CanonicalSpecializedGenericTypeMetadataAccessFunction: 'canonical specialized generic type metadata accessor for ',
    MetadataInstantiationCache: 'metadata instantiation cache for ',
    NoncanonicalSpecializedGenericTypeMetadata: 'noncanonical specialized generic type metadata for ',
    NoncanonicalSpecializedGenericTypeMetadataCache: 'cache variable for noncanonical specialized generic type metadata for ',
    CanonicalPrespecializedGenericTypeCachingOnceToken: 'flag for loading of canonical specialized generic type metadata for ',
    Uniquable: 'uniquable ', ModuleDescriptor: 'module descriptor ',
    AnonymousDescriptor: 'anonymous descriptor ', ExtensionDescriptor: 'extension descriptor ',
    SILBoxType: '@box ', PackExpansion: 'repeat ', DeclContext: '', Type: '',
  };
  // nodes that print fixed text and nothing else
  const FIXED = {
    OutlinedBridgedMethod: null, NonObjCAttribute: '@nonobjc ', ObjCAttribute: '@objc ',
    DirectMethodReferenceAttribute: 'super ', DynamicAttribute: 'dynamic ', VTableAttribute: 'override ',
    IsSerialized: 'serialized', BuiltinTupleType: 'Builtin.TheTupleType', UnknownIndex: 'unknown index',
    MergedFunction: '', DistributedThunk: '', DistributedAccessor: '', AccessibleFunctionRecord: '',
    DynamicallyReplaceableFunctionKey: '', DynamicallyReplaceableFunctionImpl: '',
    DynamicallyReplaceableFunctionVar: '', BackDeploymentThunk: '',
    BackDeploymentFallback: 'back deployment fallback for ', DynamicSelf: 'Self',
    ConstrainedExistentialSelf: 'Self', AssociatedType: '', LabelList: '',
    ImplEscaping: '@escaping', ImplErasedIsolation: '@isolated(any)', ImplSendingResult: 'sending',
    ErrorType: '<ERROR TYPE>', ConcurrentFunctionType: '@Sendable ',
    IsolatedAnyFunctionType: '@isolated(any) ', NonIsolatedCallerFunctionType: 'nonisolated(nonsending) ',
    SendingResultFunctionType: 'sending ', AsyncAnnotation: ' async', ThrowsAnnotation: ' throws',
    EmptyList: ' empty-list ', FirstElementMarker: ' first-element-marker ',
    VariadicMarker: ' variadic-marker ', AsyncFunctionPointer: 'async function pointer to ',
    AsyncAwaitResumePartialFunction: '', AsyncSuspendResumePartialFunction: '',
    HasSymbolQuery: '#_hasSymbol query for ', CoroFunctionPointer: 'coro function pointer to ',
    DefaultOverride: 'default override of ', OpaqueReturnTypeIndex: '', OpaqueReturnTypeParent: '',
    OpaqueReturnType: 'some', Suffix: '', Module: '',
  };
  // accessor node → suffix printed after the storage name
  const ACCESSORS = {
    OwningAddressor: 'owningAddressor', OwningMutableAddressor: 'owningMutableAddressor',
    NativeOwningAddressor: 'nativeOwningAddressor', NativeOwningMutableAddressor: 'nativeOwningMutableAddressor',
    NativePinningAddressor: 'nativePinningAddressor', NativePinningMutableAddressor: 'nativePinningMutableAddressor',
    UnsafeAddressor: 'unsafeAddressor', UnsafeMutableAddressor: 'unsafeMutableAddressor',
    GlobalGetter: 'getter', Getter: 'getter', Setter: 'setter', MaterializeForSet: 'materializeForSet',
    WillSet: 'willset', DidSet: 'didset', ReadAccessor: 'read', Read2Accessor: 'read2',
    ModifyAccessor: 'modify', Modify2Accessor: 'modify2', InitAccessor: 'init',
  };
  const SPECIALIZATIONS = kindSet('FunctionSignatureSpecialization GenericPartialSpecialization ' +
    'GenericPartialSpecializationNotReAbstracted GenericSpecialization ' +
    'GenericSpecializationInResilienceDomain GenericSpecializationPrespecialized ' +
    'GenericSpecializationNotReAbstracted InlinedGenericFunction');

  class Printer {
    constructor() {
      this.out = '';
      this.specialized = false;
    }
    w(s) {
      this.out += s;
      if (this.out.length > MAX_OUTPUT) throw new Error('too long');
    }
    children(n, depth, sep) {
      n.children.forEach((c, i) => {
        if (i && sep) this.w(sep);
        this.print(c, depth + 1);
      });
    }
    withParens(n, depth) {
      const parens = !isSimpleType(n);
      if (parens) this.w('(');
      this.print(n, depth + 1);
      if (parens) this.w(')');
    }

    boundGeneric(n, depth) {
      if (n.count < 2) return;
      const noSugar = () => {
        this.print(n.first, depth + 1);
        this.w('<');
        this.children(n.child(1), depth, ', ');
        this.w('>');
      };
      if (n.count !== 2 || n.kind === 'BoundGenericClass') return noSugar();
      if (n.kind === 'BoundGenericProtocol') {
        this.children(n.child(1), depth);
        this.w(' as ');
        this.print(n.first, depth + 1);
        return;
      }
      const sugar = this.findSugar(n);
      const args = n.child(1);
      if (sugar === 'Optional' || sugar === 'IUO') {
        this.withParens(args.first, depth);
        this.w(sugar === 'Optional' ? '?' : '!');
      } else if (sugar === 'Array') {
        this.w('[');
        this.print(args.first, depth + 1);
        this.w(']');
      } else if (sugar === 'Dictionary') {
        this.w('[');
        this.print(args.first, depth + 1);
        this.w(' : ');
        this.print(args.child(1), depth + 1);
        this.w(']');
      } else noSugar();
    }
    findSugar(n) {
      if (n.count === 1 && n.kind === 'Type') return this.findSugar(n.first);
      if (n.count !== 2 || (n.kind !== 'BoundGenericEnum' && n.kind !== 'BoundGenericStructure')) return null;
      const unbound = n.first.first;
      const nargs = n.child(1).count;
      const is = name => unbound.count > 1 && unbound.child(1).kind === 'Identifier' && unbound.child(1).text === name &&
        unbound.first.kind === 'Module' && unbound.first.text === 'Swift';
      if (n.kind === 'BoundGenericEnum') {
        if (is('Optional') && nargs === 1) return 'Optional';
        if (is('ImplicitlyUnwrappedOptional') && nargs === 1) return 'IUO';
        return null;
      }
      if (is('Array') && nargs === 1) return 'Array';
      if (is('Dictionary') && nargs === 2) return 'Dictionary';
      return null;
    }

    // function types print only their argument labels: "(_:file:)"
    functionParameters(labels, paramType) {
      if (paramType.kind !== 'ArgumentTuple') throw new Error('invalid');
      const params = paramType.first.first;
      if (params.kind !== 'Tuple') { this.w('(_:)'); return; }
      const hasLabels = labels && labels.count > 0;
      this.w('(');
      params.children.forEach((p, i) => {
        if (hasLabels) {
          const l = labels.child(i);
          this.w((l.kind === 'Identifier' ? l.text : '_') + ':');
        } else {
          const name = childOf(p, 'TupleElementName');
          this.w(name ? name.text + ':' : '_:');
        }
      });
      this.w(')');
    }
    functionType(labels, n, depth) {
      if (n.count < 2) throw new Error('invalid');
      switch (n.kind) {
        case 'AutoClosureType': case 'EscapingAutoClosureType': this.w('@autoclosure '); break;
        case 'ThinFunctionType': this.w('@convention(thin) '); break;
        case 'CFunctionPointer': case 'ObjCBlock': case 'EscapingObjCBlock':
          if (n.kind === 'EscapingObjCBlock') this.w('@escaping ');
          this.w('@convention(' + (n.kind === 'CFunctionPointer' ? 'c' : 'block'));
          if (n.first.kind === 'ClangType') this.w(', mangledCType: "' + n.first.text + '"');
          this.w(') ');
          break;
      }
      let i = 0;
      const at = k => n.child(i).kind === k;
      if (at('ClangType')) i++;
      if (at('SendingResultFunctionType')) i++;
      if (at('IsolatedAnyFunctionType')) this.print(n.child(i++), depth + 1);
      let nonIsolatedCaller = null;
      if (at('NonIsolatedCallerFunctionType')) nonIsolatedCaller = n.child(i++);
      if (at('GlobalActorFunctionType')) this.print(n.child(i++), depth + 1);
      let diff = null;
      if (at('DifferentiableFunctionType')) diff = n.child(i++).index;
      if (at('ThrowsAnnotation') || at('TypedThrowsAnnotation')) i++;
      let sendable = false;
      if (at('ConcurrentFunctionType')) { i++; sendable = true; }
      if (diff) this.w({ f: '@differentiable(_forward) ', r: '@differentiable(reverse) ',
        l: '@differentiable(_linear) ', d: '@differentiable ' }[diff] || '');
      if (nonIsolatedCaller) this.print(nonIsolatedCaller, depth + 1);
      if (sendable) this.w('@Sendable ');
      this.functionParameters(labels, n.child(n.count - 2));
    }

    implFunctionType(fn, depth) {
      let patternSubs = null, invocationSubs = null, sendingResult = null;
      let state = 0;   // 0 attrs, 1 inputs, 2 results
      const transition = to => {
        for (; state < to; state++) {
          if (state === 0) {
            if (patternSubs) {
              this.w('@substituted ');
              this.print(patternSubs.first, depth + 1);
              this.w(' ');
            }
            this.w('(');
          } else {
            this.w(') -> ');
            if (sendingResult) { this.print(sendingResult, depth + 1); this.w(' '); }
            this.w('(');
          }
        }
      };
      for (const c of fn.children) {
        if (c.kind === 'ImplParameter') {
          if (state === 1) this.w(', ');
          transition(1);
          this.print(c, depth + 1);
        } else if (c.kind === 'ImplResult' || c.kind === 'ImplYield' || c.kind === 'ImplErrorResult') {
          if (state === 2) this.w(', ');
          transition(2);
          this.print(c, depth + 1);
        } else if (c.kind === 'ImplPatternSubstitutions') patternSubs = c;
        else if (c.kind === 'ImplInvocationSubstitutions') invocationSubs = c;
        else if (c.kind === 'ImplSendingResult') sendingResult = c;
        else {
          if (state !== 0) throw new Error('invalid');
          this.print(c, depth + 1);
          this.w(' ');
        }
      }
      transition(2);
      this.w(')');
      if (patternSubs) { this.w(' for <'); this.children(patternSubs.child(1), depth); this.w('>'); }
      if (invocationSubs) { this.w(' for <'); this.children(invocationSubs.first, depth); this.w('>'); }
    }

    genericSignature(n, depth) {
      this.w('<');
      let numParams = 0;
      while (numParams < n.count && n.child(numParams).kind === 'DependentGenericParamCount') numParams++;
      let firstReq = numParams;
      while (firstReq < n.count) {
        let c = n.child(firstReq);
        if (c.kind === 'Type') c = c.first;
        if (c.kind !== 'DependentGenericParamPackMarker' && c.kind !== 'DependentGenericParamValueMarker') break;
        firstReq++;
      }
      const marker = (kind, d, idx) => {
        for (let i = numParams; i < firstReq; i++) {
          const m = n.child(i);
          if (m.kind !== kind) continue;
          const ty = m.first;
          if (ty.kind !== 'Type') continue;
          const param = ty.first;
          if (param.kind !== 'DependentGenericParamType') continue;
          if (idx === param.first.index && d === param.child(1).index) return kind === 'DependentGenericParamValueMarker' ? (ty.children[1] || true) : true;
        }
        return null;
      };
      for (let d = 0; d < numParams; d++) {
        if (d) this.w('><');
        const count = n.child(d).index;
        for (let idx = 0; idx < count; idx++) {
          if (idx) this.w(', ');
          if (idx >= 128) { this.w('...'); break; }
          if (marker('DependentGenericParamPackMarker', d, idx)) this.w('each ');
          const value = marker('DependentGenericParamValueMarker', d, idx);
          if (value) this.w('let ');
          this.w(genericParameterName(d, idx));
          if (value && value !== true) { this.w(': '); this.print(value, depth + 1); }
        }
      }
      this.w('>');
    }

    // Returns the context still to be printed in "... in <context>" form, if any.
    entity(e, depth, asPrefix, typePr, hasName, extraName = '', extraIndex = -1, overwriteName = '') {
      let genericArgs = null;
      if (e.kind === 'BoundGenericFunction') {
        genericArgs = e.child(1);
        e = e.first;
      }
      let multiWord = extraName.includes(' ');
      const localName = hasName && e.child(1).kind === 'LocalDeclName';
      if (localName) multiWord = true;
      if (asPrefix && (typePr !== 'none' || multiWord)) return e;

      let postfix = null;
      const context = e.first;
      if (multiWord) postfix = context;
      else {
        const pos = this.out.length;
        postfix = this.print(context, depth + 1, true);
        if (this.out.length !== pos) this.w('.');
      }

      if (hasName || overwriteName) {
        if (extraName && multiWord) {
          this.w(extraName);
          if (extraIndex >= 0) this.w(String(extraIndex));
          this.w(' of ');
          extraName = '';
          extraIndex = -1;
        }
        const pos = this.out.length;
        if (overwriteName) this.w(overwriteName);
        else {
          const name = e.child(1);
          if (name.kind !== 'PrivateDeclName') this.print(name, depth + 1);
          const priv = childOf(e, 'PrivateDeclName');
          if (priv) this.print(priv, depth + 1);
        }
        if (this.out.length !== pos && extraName) this.w('.');
      }
      if (extraName) {
        this.w(extraName);
        if (extraIndex >= 0) this.w(String(extraIndex));
      }

      if (typePr === 'function') {
        const tyNode = childOf(e, 'Type');
        if (!tyNode) throw new Error('invalid');
        let type = tyNode.first;
        let t = type;
        while (t.kind === 'DependentGenericType') t = t.child(1).first;
        if (FUNCTION_TYPE_KINDS.has(t.kind)) {
          if (multiWord || needSpaceBeforeType(type)) this.w(' ');
          const labels = childOf(e, 'LabelList');
          if (labels || genericArgs) {
            if (genericArgs) { this.w('<'); this.children(genericArgs, depth, ', '); this.w('>'); }
            if (type.kind === 'DependentGenericType') {
              if (!genericArgs) this.print(type.first, depth + 1);
              const dep = type.child(1);
              if (needSpaceBeforeType(dep)) this.w(' ');
              type = dep.first;
            }
            this.functionType(labels, type, depth);
          } else {
            this.print(type, depth + 1);
          }
        }
      }
      if (!asPrefix && postfix) {
        const of = ['DefaultArgumentInitializer', 'Initializer', 'PropertyWrapperBackingInitializer',
          'PropertyWrapperInitFromProjectedValue'].includes(e.kind);
        this.w(of ? ' of ' : ' in ');
        this.print(postfix, depth + 1);
        postfix = null;
      }
      return postfix;
    }

    print(n, depth, asPrefix = false) {
      if (depth > PRINT_MAX_DEPTH) { this.w('<<too complex>>'); return null; }
      const k = n.kind;
      const c0 = () => this.print(n.first, depth + 1);
      if (k in PREFIXED) { this.w(PREFIXED[k]); c0(); return null; }
      if (k in FIXED) {
        if (k === 'OutlinedBridgedMethod') this.w('outlined bridged method (' + n.text + ') of ');
        else this.w(FIXED[k]);
        return null;
      }
      if (k in ACCESSORS) {
        const storage = n.first;
        if (storage.kind === 'Variable') return this.entity(storage, depth, asPrefix, 'colon', true, ACCESSORS[k]);
        if (storage.kind === 'Subscript') return this.entity(storage, depth, asPrefix, 'colon', false, ACCESSORS[k], -1, 'subscript');
        throw new Error('invalid');
      }
      if (SPECIALIZATIONS.has(k)) {
        if (!this.specialized) { this.w('specialized '); this.specialized = true; }
        return null;
      }
      switch (k) {
        case 'Global': this.children(n, depth); return null;
        case 'AsyncRemoved': this.w('async demotion of '); c0(); return null;
        case 'OutlinedCopy': case 'OutlinedConsume':
          this.w(k === 'OutlinedCopy' ? 'outlined copy of ' : 'outlined consume of ');
          c0();
          if (n.count > 1) this.print(n.child(1), depth + 1);
          return null;
        case 'OutlinedVariable': this.w('outlined variable #' + n.index + ' of '); return null;
        case 'OutlinedReadOnlyObject': this.w('outlined read-only object #' + n.index + ' of '); return null;
        case 'Directness': this.w(n.index === 0 ? 'direct ' : 'indirect '); return null;
        case 'AnonymousContext': return null;
        case 'Extension':
          this.print(n.child(1), depth + 1);
          if (n.count === 3) this.print(n.child(2), depth + 1);
          return null;
        case 'Variable': return this.entity(n, depth, asPrefix, 'colon', true);
        case 'Function': case 'BoundGenericFunction': return this.entity(n, depth, asPrefix, 'function', true);
        case 'Subscript': return this.entity(n, depth, asPrefix, 'function', false, '', -1, 'subscript');
        case 'Macro': return this.entity(n, depth, asPrefix, n.count === 3 ? 'colon' : 'function', true);
        case 'AccessorAttachedMacroExpansion': case 'MemberAttributeAttachedMacroExpansion':
        case 'MemberAttachedMacroExpansion': case 'PeerAttachedMacroExpansion':
        case 'ConformanceAttachedMacroExpansion': case 'ExtensionAttachedMacroExpansion':
        case 'PreambleAttachedMacroExpansion': case 'BodyAttachedMacroExpansion': {
          const role = MACRO_ROLE_DESC[k.slice(0, -'AttachedMacroExpansion'.length)];
          const macro = new Printer();
          macro.print(n.child(2), 0);
          return this.entity(n, depth, asPrefix, 'none', true, role + ' macro @' + macro.out + ' expansion #',
            n.child(3).index + 1);
        }
        case 'FreestandingMacroExpansion':
          return this.entity(n, depth, asPrefix, 'none', true, 'freestanding macro expansion #', n.child(2).index + 1);
        case 'MacroExpansionUniqueName':
          return this.entity(n, depth, asPrefix, 'none', true, 'unique name #', n.child(2).index + 1);
        case 'MacroExpansionLoc':
          ['module ', ' file ', ' line ', ' column '].forEach((label, i) => {
            if (n.count > i) { this.w(label); this.print(n.child(i), depth + 1); }
          });
          return null;
        case 'GenericTypeParamDecl': return this.entity(n, depth, asPrefix, 'none', true);
        case 'ExplicitClosure':
          return this.entity(n, depth, asPrefix, 'none', false, 'closure #', n.child(1).index + 1);
        case 'ImplicitClosure':
          return this.entity(n, depth, asPrefix, 'none', false, 'implicit closure #', n.child(1).index + 1);
        case 'Initializer':
          return this.entity(n, depth, asPrefix, 'none', false, 'variable initialization expression');
        case 'PropertyWrapperBackingInitializer':
          return this.entity(n, depth, asPrefix, 'none', false, 'property wrapper backing initializer');
        case 'PropertyWrapperInitFromProjectedValue':
          return this.entity(n, depth, asPrefix, 'none', false, 'property wrapper init from projected value');
        case 'DefaultArgumentInitializer':
          return this.entity(n, depth, asPrefix, 'none', false, 'default argument ', n.child(1).index);
        case 'TypeMangling':
          if (n.first.kind === 'LabelList') this.functionType(n.first, n.child(1).first, depth);
          else c0();
          return null;
        case 'Class': case 'Structure': case 'Enum': case 'Protocol': case 'TypeAlias': case 'OtherNominalType':
          return this.entity(n, depth, asPrefix, 'none', true);
        case 'LocalDeclName':
          this.print(n.child(1), depth + 1);
          this.w(' #' + (n.first.index + 1));
          return null;
        case 'PrivateDeclName':
          if (n.count > 1) this.print(n.child(1), depth + 1);
          return null;
        case 'RelatedEntityDeclName':
          this.w("related decl '" + n.first.text + "' for ");
          this.print(n.child(1), depth + 1);
          return null;
        case 'Identifier': case 'ClangType': case 'BuiltinTypeName': case 'MetatypeRepresentation':
        case 'ImplConvention': case 'ImplFunctionAttribute':
          this.w(n.text);
          return null;
        case 'NegativeInteger': this.w(String(n.index)); return null;
        case 'Index': case 'Number': case 'SpecializationPassID': case 'Integer':
          // a uint64 in the runtime, so a failed (-1000) index wraps around
          this.w(n.index < 0 ? (BigInt(n.index) + (1n << 64n)).toString() : String(n.index));
          return null;
        case 'FunctionType': case 'UncurriedFunctionType': case 'NoEscapeFunctionType':
        case 'AutoClosureType': case 'EscapingAutoClosureType': case 'ThinFunctionType':
        case 'CFunctionPointer': case 'ObjCBlock': case 'EscapingObjCBlock':
          this.functionType(null, n, depth);
          return null;
        case 'ArgumentTuple': this.functionParameters(null, n); return null;
        case 'Tuple': this.w('('); this.children(n, depth, ', '); this.w(')'); return null;
        case 'TupleElement': {
          const label = childOf(n, 'TupleElementName');
          if (label) this.w(label.text + ': ');
          const ty = childOf(n, 'Type');
          if (!ty) throw new Error('invalid');
          this.print(ty, depth + 1);
          if (childOf(n, 'VariadicMarker')) this.w('...');
          return null;
        }
        case 'TupleElementName': this.w(n.text + ': '); return null;
        case 'Pack': case 'SILPackDirect': case 'SILPackIndirect':
          this.w(k === 'Pack' ? 'Pack{' : k === 'SILPackDirect' ? '@direct Pack{' : '@indirect Pack{');
          this.children(n, depth, ', ');
          this.w('}');
          return null;
        case 'PackElement':
          this.w('/* level: ' + n.child(1).index + ' */ each ');
          c0();
          return null;
        case 'ReturnType':
          if (!n.count) this.w(n.text || '');
          else this.children(n, depth);
          return null;
        case 'RetroactiveConformance':
          if (n.count !== 2) return null;
          this.w('retroactive @ ');
          c0();
          this.print(n.child(1), depth + 1);
          return null;
        case 'DroppedArgument': this.w('param' + n.index + '-removed'); return null;
        case 'GenericSpecializationParam':
          c0();
          for (let i = 1; i < n.count; i++) { this.w(i === 1 ? ' with ' : ' and '); this.print(n.child(i), depth + 1); }
          return null;
        case 'BuiltinFixedArray':
          this.w('Builtin.FixedArray<'); c0(); this.w(', '); this.print(n.child(1), depth + 1); this.w('>');
          return null;
        case 'InfixOperator': this.w(n.text + ' infix'); return null;
        case 'PrefixOperator': this.w(n.text + ' prefix'); return null;
        case 'PostfixOperator': this.w(n.text + ' postfix'); return null;
        case 'LazyProtocolWitnessTableAccessor': case 'LazyProtocolWitnessTableCacheVariable':
          this.w(k === 'LazyProtocolWitnessTableAccessor' ? 'lazy protocol witness table accessor for type ' :
            'lazy protocol witness table cache variable for type ');
          c0();
          this.w(' and conformance ');
          this.print(n.child(1), depth + 1);
          return null;
        case 'VTableThunk':
          this.w('vtable thunk for ');
          this.print(n.child(1), depth + 1);
          this.w(' dispatching to ');
          c0();
          return null;
        case 'ProtocolWitness':
          this.w('protocol witness for ');
          this.print(n.child(1), depth + 1);
          this.w(' in conformance ');
          c0();
          return null;
        case 'PartialApplyForwarder': case 'PartialApplyObjCForwarder':
          this.w('partial apply');
          if (n.count) { this.w(' for '); this.children(n, depth); }
          return null;
        case 'KeyPathGetterThunkHelper': case 'KeyPathSetterThunkHelper':
        case 'KeyPathUnappliedMethodThunkHelper': case 'KeyPathAppliedMethodThunkHelper':
          this.w({ KeyPathGetterThunkHelper: 'key path getter for ', KeyPathSetterThunkHelper: 'key path setter for ',
            KeyPathUnappliedMethodThunkHelper: 'key path unapplied method ',
            KeyPathAppliedMethodThunkHelper: 'key path applied method ' }[k]);
          c0();
          this.w(' : ');
          for (let i = 1; i < n.count; i++) {
            if (n.child(i).kind === 'IsSerialized') this.w(', ');
            this.print(n.child(i), depth + 1);
          }
          return null;
        case 'KeyPathEqualsThunkHelper': case 'KeyPathHashThunkHelper': {
          this.w('key path index ' + (k === 'KeyPathEqualsThunkHelper' ? 'equality' : 'hash') + ' operator for ');
          let last = n.count;
          let lastChild = n.child(last - 1);
          if (lastChild.kind === 'IsSerialized') lastChild = n.child(--last - 1);
          if (lastChild.kind === 'DependentGenericSignature') { this.print(lastChild, depth + 1); last--; }
          this.w('(');
          for (let i = 0; i < last; i++) { if (i) this.w(', '); this.print(n.child(i), depth + 1); }
          this.w(')');
          return null;
        }
        case 'FieldOffset':
          c0();
          this.w('field offset for ');
          this.print(n.child(1), depth + 1);
          return null;
        case 'ReabstractionThunk': case 'ReabstractionThunkHelper':
          this.w('thunk for ');
          this.print(n.last, depth + 1);
          return null;
        case 'ReabstractionThunkHelperWithGlobalActor':
          c0();
          this.w(' with global actor constraint ');
          this.print(n.child(1), depth + 1);
          return null;
        case 'ReabstractionThunkHelperWithSelf': {
          this.w('reabstraction thunk ');
          let i = 0;
          if (n.count === 4) { this.print(n.first, depth + 1); this.w(' '); i = 1; }
          this.w('from ');
          this.print(n.child(i + 2), depth + 1);
          this.w(' to ');
          this.print(n.child(i + 1), depth + 1);
          this.w(' self ');
          this.print(n.child(i), depth + 1);
          return null;
        }
        case 'AssociatedConformanceDescriptor': case 'DefaultAssociatedConformanceAccessor':
          this.w(k === 'AssociatedConformanceDescriptor' ? 'associated conformance descriptor for ' :
            'default associated conformance accessor for ');
          c0(); this.w('.'); this.print(n.child(1), depth + 1); this.w(': '); this.print(n.child(2), depth + 1);
          return null;
        case 'AssociatedTypeMetadataAccessor':
          this.w('associated type metadata accessor for ');
          this.print(n.child(1), depth + 1); this.w(' in '); c0();
          return null;
        case 'BaseConformanceDescriptor':
          this.w('base conformance descriptor for '); c0(); this.w(': '); this.print(n.child(1), depth + 1);
          return null;
        case 'AssociatedTypeWitnessTableAccessor':
          this.w('associated type witness table accessor for ');
          this.print(n.child(1), depth + 1); this.w(' : '); this.print(n.child(2), depth + 1); this.w(' in '); c0();
          return null;
        case 'BaseWitnessTableAccessor':
          this.w('base witness table accessor for '); this.print(n.child(1), depth + 1); this.w(' in '); c0();
          return null;
        case 'ValueWitness':
          this.w(n.first.text + ' for ');
          this.print(n.child(1), depth + 1);
          return null;
        case 'BoundGenericClass': case 'BoundGenericStructure': case 'BoundGenericEnum':
        case 'BoundGenericProtocol': case 'BoundGenericOtherNominalType': case 'BoundGenericTypeAlias':
          this.boundGeneric(n, depth);
          return null;
        case 'Metatype': {
          let i = 0;
          if (n.count === 2) { c0(); this.w(' '); i = 1; }
          const ty = n.child(i).first;
          this.withParens(ty, depth);
          this.w(isExistentialType(ty) ? '.Protocol' : '.Type');
          return null;
        }
        case 'ExistentialMetatype': {
          let i = 0;
          if (n.count === 2) { c0(); this.w(' '); i = 1; }
          this.print(n.child(i), depth + 1);
          this.w('.Type');
          return null;
        }
        case 'ConstrainedExistential':
          this.w('any '); c0(); this.w('<'); this.print(n.child(1), depth + 1); this.w('>');
          return null;
        case 'ConstrainedExistentialRequirementList': this.children(n, depth, ', '); return null;
        case 'AssociatedTypeRef': c0(); this.w('.' + n.child(1).text); return null;
        case 'ProtocolList':
          if (!n.first.count) this.w('Any');
          else this.children(n.first, depth, ' & ');
          return null;
        case 'ProtocolListWithClass':
          if (n.count < 2) return null;
          this.print(n.child(1), depth + 1);
          this.w(' & ');
          if (n.first.count < 1) return null;
          this.children(n.first.first, depth, ' & ');
          return null;
        case 'ProtocolListWithAnyObject': {
          if (n.count < 1 || n.first.count < 1) return null;
          const list = n.first.first;
          if (list.count) { this.children(list, depth, ' & '); this.w(' & '); }
          this.w('Swift.AnyObject');
          return null;
        }
        case 'Allocator':
          return this.entity(n, depth, asPrefix, 'function', false, n.first.kind === 'Class' ? '__allocating_init' : 'init');
        case 'Constructor': return this.entity(n, depth, asPrefix, 'function', n.count > 2, 'init');
        case 'Destructor': return this.entity(n, depth, asPrefix, 'none', false, 'deinit');
        case 'Deallocator':
          return this.entity(n, depth, asPrefix, 'none', false, n.first.kind === 'Class' ? '__deallocating_deinit' : 'deinit');
        case 'IsolatedDeallocator':
          return this.entity(n, depth, asPrefix, 'none', false, n.first.kind === 'Class' ? '__isolated_deallocating_deinit' : 'deinit');
        case 'IVarInitializer': return this.entity(n, depth, asPrefix, 'none', false, '__ivar_initializer');
        case 'IVarDestroyer': return this.entity(n, depth, asPrefix, 'none', false, '__ivar_destroyer');
        case 'ProtocolConformance':
          if (n.count === 4) {
            this.w('property behavior storage of '); this.print(n.child(2), depth + 1);
            this.w(' in '); c0(); this.w(' : '); this.print(n.child(1), depth + 1);
          } else c0();
          return null;
        case 'TypeList': this.children(n, depth); return null;
        case 'AnyProtocolConformanceList':
          if (n.count) { this.w('('); this.children(n, depth, ', '); this.w(')'); }
          return null;
        case 'ConcreteProtocolConformance':
          this.w('concrete protocol conformance ');
          c0();
          this.w(' to ');
          this.print(n.child(1), depth + 1);
          if (n.count > 2 && n.child(2).count) {
            this.w(' with conditional requirements: ');
            this.print(n.child(2), depth + 1);
          }
          return null;
        case 'PackProtocolConformance': this.w('pack protocol conformance '); this.children(n, depth); return null;
        case 'DependentAssociatedConformance':
          this.w('dependent associated conformance ');
          this.children(n, depth);
          return null;
        case 'DependentProtocolConformanceAssociated': case 'DependentProtocolConformanceInherited':
        case 'DependentProtocolConformanceRoot':
          this.w({ DependentProtocolConformanceAssociated: 'dependent associated protocol conformance ',
            DependentProtocolConformanceInherited: 'dependent inherited protocol conformance ',
            DependentProtocolConformanceRoot: 'dependent root protocol conformance ' }[k]);
          if (n.child(2).index !== undefined) this.w('#' + n.child(2).index + ' ');
          c0();
          this.w(' to ');
          this.print(n.child(1), depth + 1);
          return null;
        case 'DependentProtocolConformanceOpaque':
          this.w('opaque result conformance '); c0(); this.w(' of '); this.print(n.child(1), depth + 1);
          return null;
        case 'ProtocolConformanceRefInTypeModule': case 'ProtocolConformanceRefInProtocolModule':
        case 'ProtocolConformanceRefInOtherModule':
          this.w({ ProtocolConformanceRefInTypeModule: "protocol conformance ref (type's module) ",
            ProtocolConformanceRefInProtocolModule: "protocol conformance ref (protocol's module) ",
            ProtocolConformanceRefInOtherModule: 'protocol conformance ref (retroactive) ' }[k]);
          this.children(n, depth);
          return null;
        case 'ImplDifferentiabilityKind':
          this.w('@differentiable' + ({ l: '(_linear)', f: '(_forward)', r: '(reverse)' }[n.index] || ''));
          return null;
        case 'ImplCoroutineKind': if (n.text) this.w('@' + n.text); return null;
        case 'ImplParameterResultDifferentiability': case 'ImplParameterSending':
        case 'ImplParameterIsolated': case 'ImplParameterImplicitLeading':
          if (n.text) this.w(n.text + ' ');
          return null;
        case 'ImplFunctionConvention':
          this.w('@convention(' + n.first.text);
          if (n.count === 2) this.w(', mangledCType: "' + n.child(1).text + '"');
          this.w(')');
          return null;
        case 'ImplErrorResult': case 'ImplYield':
          this.w(k === 'ImplErrorResult' ? '@error ' : '@yields ');
          this.children(n, depth, ' ');
          return null;
        case 'ImplParameter': case 'ImplResult':
          c0();
          this.w(' ');
          if (n.count === 3) this.print(n.child(1), depth + 1);
          if (n.count === 4) { this.print(n.child(1), depth + 1); this.print(n.child(2), depth + 1); }
          this.print(n.last, depth + 1);
          return null;
        case 'ImplFunctionType': this.implFunctionType(n, depth); return null;
        case 'ImplInvocationSubstitutions':
          this.w('for <'); this.children(n.first, depth, ', '); this.w('>');
          return null;
        case 'ImplPatternSubstitutions':
          this.w('@substituted '); c0(); this.w(' for <'); this.children(n.child(1), depth, ', '); this.w('>');
          return null;
        case 'DependentPseudogenericSignature': case 'DependentGenericSignature':
          this.genericSignature(n, depth);
          return null;
        case 'DependentGenericConformanceRequirement':
          c0(); this.w(': '); this.print(n.child(1), depth + 1);
          return null;
        case 'DependentGenericSameTypeRequirement':
          c0(); this.w(' == '); this.print(n.child(1), depth + 1);
          return null;
        case 'DependentGenericSameShapeRequirement':
          c0(); this.w('.shape == '); this.print(n.child(1), depth + 1); this.w('.shape');
          return null;
        case 'DependentGenericInverseConformanceRequirement': {
          const bit = n.child(1).index;
          c0();
          this.w(': ~Swift.' + (['Copyable', 'Escapable'][bit] || '<bit ' + bit + '>'));
          return null;
        }
        case 'DependentGenericLayoutRequirement': {
          c0();
          const c = n.child(1).text;
          this.w(': ' + ({ U: '_UnknownLayout', R: '_RefCountedObject', N: '_NativeRefCountedObject',
            C: 'AnyObject', D: '_NativeClass', T: '_Trivial', E: '_Trivial', e: '_Trivial',
            M: '_TrivialAtMost', m: '_TrivialAtMost' }[c] || ''));
          if (n.count > 2) {
            this.w('(');
            this.print(n.child(2), depth + 1);
            if (n.count > 3) { this.w(', '); this.print(n.child(3), depth + 1); }
            this.w(')');
          }
          return null;
        }
        case 'DependentGenericParamType':
          this.w(genericParameterName(n.first.index, n.child(1).index));
          return null;
        case 'DependentGenericType': {
          c0();
          const dep = n.child(1);
          if (needSpaceBeforeType(dep)) this.w(' ');
          this.print(dep, depth + 1);
          return null;
        }
        case 'DependentMemberType': c0(); this.w('.'); this.print(n.child(1), depth + 1); return null;
        case 'DependentAssociatedTypeRef':
          if (n.count > 1) { this.print(n.child(1), depth + 1); this.w('.'); }
          c0();
          return null;
        case 'DifferentiableFunctionType':
          this.w('@differentiable' + ({ f: '(_forward)', r: '(reverse)', l: '(_linear)' }[n.index] || '') + ' ');
          return null;
        case 'GlobalActorFunctionType':
          if (n.count) { this.w('@'); c0(); this.w(' '); }
          return null;
        case 'TypedThrowsAnnotation':
          this.w(' throws(');
          if (n.count === 1) c0();
          this.w(')');
          return null;
        case 'SILBoxTypeWithLayout': {
          const layout = n.first;
          let args = null;
          if (n.count === 3) {
            this.print(n.child(1), depth + 1);
            this.w(' ');
            args = n.child(2);
          }
          this.print(layout, depth + 1);
          if (args) { this.w(' <'); this.children(args, depth, ', '); this.w('>'); }
          return null;
        }
        case 'SILBoxLayout':
          this.w('{');
          n.children.forEach((c, i) => { this.w(i ? ', ' : ' '); this.print(c, depth + 1); });
          this.w(' }');
          return null;
        case 'SILBoxImmutableField': case 'SILBoxMutableField':
          this.w(k === 'SILBoxImmutableField' ? 'let ' : 'var ');
          c0();
          return null;
        case 'AssocTypePath': this.children(n, depth, '.'); return null;
        case 'AssociatedTypeGenericParamRef':
          this.w('generic parameter reference for associated type ');
          this.children(n, depth);
          return null;
        case 'SugaredOptional': this.withParens(n.first, depth); this.w('?'); return null;
        case 'SugaredArray': this.w('['); c0(); this.w(']'); return null;
        case 'SugaredInlineArray': this.w('['); c0(); this.w(' of '); this.print(n.child(1), depth + 1); this.w(']'); return null;
        case 'SugaredDictionary': this.w('['); c0(); this.w(' : '); this.print(n.child(1), depth + 1); this.w(']'); return null;
        case 'SugaredParen': this.w('('); c0(); this.w(')'); return null;
        case 'OpaqueReturnTypeOf': this.w('<<opaque return type of '); this.children(n, depth); this.w('>>'); return null;
        case 'OpaqueType': c0(); this.w('.'); this.print(n.child(1), depth + 1); return null;
        case 'GlobalVariableOnceToken': case 'GlobalVariableOnceFunction':
          this.w(k === 'GlobalVariableOnceToken' ? 'one-time initialization token for ' :
            'one-time initialization function for ');
          this.print(n.child(1), depth + 1);
          return null;
        case 'GlobalVariableOnceDeclList':
          if (n.count === 1) c0();
          else { this.w('('); this.children(n, depth, ', '); this.w(')'); }
          return null;
        case 'ObjCAsyncCompletionHandlerImpl': case 'PredefinedObjCAsyncCompletionHandlerImpl':
          if (k === 'PredefinedObjCAsyncCompletionHandlerImpl') this.w('predefined ');
          this.w('@objc completion handler block implementation for ');
          if (n.count >= 4) this.print(n.child(3), depth + 1);
          c0();
          this.w(' with result type ');
          this.print(n.child(1), depth + 1);
          this.w(['', ' nonzero on error', ' zero on error'][n.child(2).index] ?? ' <invalid error flag>');
          return null;
        default:
          throw new Error('unsupported node ' + k);
      }
    }
  }

  const demangle = mangled => {
    const d = new Demangler(mangled);
    return d.demangleSymbol();
  };

  const print = root => {
    const p = new Printer();
    p.print(root, 0);
    return p.out;
  };

  return { demangle, print };
})();

// Returns the simplified demangled string (as `swift-demangle --simplified`
// prints it), or null if the input isn't a Swift symbol or can't be demangled.
function swiftDemangle(mangled) {
  try {
    if (typeof mangled !== 'string' || mangled.length > 16384) return null;
    const root = SwiftDemangler.demangle(mangled);
    if (!root) return null;
    const out = SwiftDemangler.print(root);
    return out ? out : null;
  } catch (e) {
    return null;
  }
}

if (typeof module !== 'undefined') module.exports = { swiftDemangle };
