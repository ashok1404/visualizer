// ── Theme (light by default, toggle persists via localStorage) ─────────────────
function initTheme() {
  let stored = null;
  try { stored = localStorage.getItem('theme'); } catch (e) { /* storage unavailable */ }
  applyTheme(stored === 'dark' ? 'dark' : 'light');
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('themeIcon').textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable */ }
}

initTheme();

// ── Type Configuration ───────────────────────────────────────────────────────
const ICON_UI_LIFECYCLE = `<svg class="chip-icon" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.8"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.8"/></svg>`;
const ICON_NETWORK_STATE = `<svg class="chip-icon" viewBox="0 0 24 24" fill="none"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const TYPE_CONFIG = {
  'ui.lifecycle':   { label: 'UI Lifecycle',  icon: ICON_UI_LIFECYCLE, chipClass: 'chip-lifecycle', dot: '#8b5cf6', badge: '#8b5cf620', badgeBorder: '#8b5cf640' },
  'network.request':{ label: 'Network',       icon: '🌐', chipClass: 'chip-network',   dot: '#10b981', badge: '#10b98120', badgeBorder: '#10b98140' },
  'user.event':     { label: 'User Event',    icon: '👆', chipClass: 'chip-user',      dot: '#f59e0b', badge: '#f59e0b20', badgeBorder: '#f59e0b40' },
  'app.lifecycle':  { label: 'App Lifecycle', icon: '🚀', chipClass: 'chip-app',       dot: '#06b6d4', badge: '#06b6d420', badgeBorder: '#06b6d440' },
  'app.launch':     { label: 'App Launch',    icon: '🚀', chipClass: 'chip-app',       dot: '#06b6d4', badge: '#06b6d420', badgeBorder: '#06b6d440' },
  'app.install':    { label: 'App Install',   icon: '📥', chipClass: 'chip-app',       dot: '#06b6d4', badge: '#06b6d420', badgeBorder: '#06b6d440' },
  'network.state':  { label: 'Network State', icon: ICON_NETWORK_STATE, chipClass: 'chip-state',     dot: '#ec4899', badge: '#ec489920', badgeBorder: '#ec489940' },
  'system.event':  { label: 'System Event', icon: '⚙️', chipClass: 'chip-state',     dot: '#9f48ec', badge: '#9f48ec20', badgeBorder: '#9f48ec40' },
};

function getConfig(type) {
  return TYPE_CONFIG[type] || {
    label: type,
    icon: '🔹',
    chipClass: 'chip-nav',
    dot: '#4f8ef7',
    badge: '#4f8ef720',
    badgeBorder: '#4f8ef740',
  };
}

// ── App State ────────────────────────────────────────────────────────────────
// ── Example Payload (shown on first load, and via "Load Example") ───────────
const DEFAULT_PAYLOAD = [{"col":1,"time":1789130160000,"eCnt":1,"eTp":"NativeAppCrash","NATIVEAPP":{"eIdentifier":"Example-UIKit                  0x0000000100e75aa0 Example-UIKit + 55968","appVersion":"1.1","breadcrumbs":"[{\"type\":\"ui.lifecycle\",\"timestamp\":1789041719936,\"className\":\"SlideViewController\",\"event\":\"viewDidDisappear\"},{\"timestamp\":1789041719937,\"className\":\"SlideViewController\",\"type\":\"ui.lifecycle\",\"event\":\"viewDidDisappear\"},{\"event\":\"viewDidDisappear\",\"timestamp\":1789041719937,\"type\":\"ui.lifecycle\",\"className\":\"SlideViewController\"},{\"x\":\"74.0\",\"action\":\"tap\",\"type\":\"user.event\",\"timestamp\":1789041733494,\"y\":\"506.0\",\"targetId\":\"tap:Sub View\",\"targetClass\":\"UITableViewCell\"},{\"type\":\"ui.lifecycle\",\"event\":\"viewDidLoad\",\"timestamp\":1789041733659,\"className\":\"TestSubviewViewController\"},{\"timestamp\":1789041733662,\"className\":\"Subview1ViewController\",\"type\":\"ui.lifecycle\",\"event\":\"viewDidLoad\"},{\"timestamp\":1789041733663,\"type\":\"ui.lifecycle\",\"event\":\"viewWillAppear\",\"className\":\"TestSubviewViewController\"},{\"type\":\"ui.lifecycle\",\"className\":\"Subview1ViewController\",\"timestamp\":1789041733663,\"event\":\"viewWillAppear\"},{\"className\":\"HomeViewController\",\"timestamp\":1789041734177,\"event\":\"viewDidDisappear\",\"type\":\"ui.lifecycle\"},{\"timestamp\":1789041734177,\"event\":\"viewDidAppear\",\"type\":\"ui.lifecycle\",\"className\":\"TestSubviewViewController\"},{\"event\":\"viewDidAppear\",\"className\":\"Subview1ViewController\",\"timestamp\":1789041734178,\"type\":\"ui.lifecycle\"},{\"timestamp\":1789041737622,\"type\":\"ui.lifecycle\",\"className\":\"HomeViewController\",\"event\":\"viewWillAppear\"},{\"timestamp\":1789041738140,\"event\":\"viewDidDisappear\",\"className\":\"TestSubviewViewController\",\"type\":\"ui.lifecycle\"},{\"type\":\"ui.lifecycle\",\"timestamp\":1789041738141,\"className\":\"Subview1ViewController\",\"event\":\"viewDidDisappear\"},{\"type\":\"ui.lifecycle\",\"timestamp\":1789041738141,\"event\":\"viewDidAppear\",\"className\":\"HomeViewController\"},{\"targetId\":\"tap:Sub View\",\"type\":\"user.event\",\"action\":\"tap\",\"timestamp\":1789041762425,\"x\":\"3.0\",\"y\":\"544.0\",\"targetClass\":\"UITableViewCell\"},{\"className\":\"TestSubviewViewController\",\"type\":\"ui.lifecycle\",\"timestamp\":1789041762580,\"event\":\"viewDidLoad\"},{\"event\":\"viewDidLoad\",\"type\":\"ui.lifecycle\",\"timestamp\":1789041762582,\"className\":\"Subview1ViewController\"},{\"event\":\"viewWillAppear\",\"type\":\"ui.lifecycle\",\"timestamp\":1789041762583,\"className\":\"TestSubviewViewController\"},{\"type\":\"ui.lifecycle\",\"timestamp\":1789041762583,\"event\":\"viewWillAppear\",\"className\":\"Subview1ViewController\"},{\"event\":\"viewDidDisappear\",\"type\":\"ui.lifecycle\",\"timestamp\":1789041763086,\"className\":\"HomeViewController\"},{\"type\":\"ui.lifecycle\",\"event\":\"viewDidAppear\",\"timestamp\":1789041763086,\"className\":\"TestSubviewViewController\"},{\"event\":\"viewDidAppear\",\"timestamp\":1789041763086,\"className\":\"Subview1ViewController\",\"type\":\"ui.lifecycle\"},{\"className\":\"HomeViewController\",\"event\":\"viewWillAppear\",\"type\":\"ui.lifecycle\",\"timestamp\":1789041764213},{\"event\":\"viewDidDisappear\",\"timestamp\":1789041764733,\"type\":\"ui.lifecycle\",\"className\":\"TestSubviewViewController\"},{\"event\":\"viewDidDisappear\",\"timestamp\":1789041764733,\"type\":\"ui.lifecycle\",\"className\":\"Subview1ViewController\"},{\"event\":\"viewDidAppear\",\"type\":\"ui.lifecycle\",\"timestamp\":1789041764733,\"className\":\"HomeViewController\"},{\"targetClass\":\"UITableViewCell\",\"timestamp\":1789041765585,\"targetId\":\"tap:Hitch\",\"x\":\"108.333336\",\"type\":\"user.event\",\"y\":\"592.6667\",\"action\":\"tap\"},{\"event\":\"viewDidLoad\",\"type\":\"ui.lifecycle\",\"timestamp\":1789041765654,\"className\":\"HitchViewController\"},{\"timestamp\":1789041765655,\"event\":\"viewWillAppear\",\"type\":\"ui.lifecycle\",\"className\":\"HitchViewController\"},{\"timestamp\":1789041767287,\"event\":\"viewDidDisappear\",\"className\":\"HomeViewController\",\"type\":\"ui.lifecycle\"},{\"type\":\"ui.lifecycle\",\"event\":\"viewDidAppear\",\"className\":\"HitchViewController\",\"timestamp\":1789041767287},{\"timestamp\":1789041781064,\"className\":\"HomeViewController\",\"type\":\"ui.lifecycle\",\"event\":\"viewWillAppear\"},{\"type\":\"ui.lifecycle\",\"timestamp\":1789041781565,\"event\":\"viewDidDisappear\",\"className\":\"HitchViewController\"},{\"event\":\"viewDidAppear\",\"className\":\"HomeViewController\",\"timestamp\":1789041781566,\"type\":\"ui.lifecycle\"},{\"timestamp\":1789042169865,\"state\":\"cellular 4g\",\"type\":\"network.state\"},{\"state\":\"cellular 5g\",\"type\":\"network.state\",\"timestamp\":1789042229783},{\"event\":\"didEnterBackground\",\"type\":\"app.lifecycle\",\"timestamp\":1789042303809},{\"event\":\"didFinishLaunch\",\"timestamp\":1789048594561,\"type\":\"app.lifecycle\"},{\"event\":\"unknown\",\"eventType\":\"orientation\",\"timestamp\":1789048594562,\"type\":\"system.event\"},{\"eventType\":\"orientation\",\"type\":\"system.event\",\"event\":\"unknown\",\"timestamp\":1789048594642},{\"event\":\"willEnterForeground\",\"timestamp\":1789048594642,\"type\":\"app.lifecycle\"},{\"event\":\"viewDidLoad\",\"className\":\"RootViewController\",\"type\":\"ui.lifecycle\",\"timestamp\":1789048594646},{\"timestamp\":1789048594652,\"className\":\"RootViewController\",\"event\":\"viewWillAppear\",\"type\":\"ui.lifecycle\"},{\"type\":\"app.lifecycle\",\"timestamp\":1789048594690,\"event\":\"didBecomeActive\"},{\"event\":\"viewDidAppear\",\"type\":\"ui.lifecycle\",\"className\":\"RootViewController\",\"timestamp\":1789048594694},{\"action\":\"tap\",\"y\":\"275.33334\",\"timestamp\":1789048599790,\"type\":\"user.event\",\"targetClass\":\"UIButton\",\"x\":\"219.0\",\"targetId\":\"tap:Error\"},{\"type\":\"user.event\",\"timestamp\":1789048606023,\"x\":\"252.33333\",\"targetId\":\"tap:Auto Screen Tracking   ->\",\"targetClass\":\"UIButton\",\"action\":\"tap\",\"y\":\"609.0\"},{\"type\":\"ui.lifecycle\",\"event\":\"viewDidLoad\",\"className\":\"HomeViewController\",\"timestamp\":1789048606211},{\"timestamp\":1789048606211,\"className\":\"HomeViewController\",\"type\":\"ui.lifecycle\",\"event\":\"viewWillAppear\"},{\"type\":\"ui.lifecycle\",\"timestamp\":1789048606757,\"className\":\"RootViewController\",\"event\":\"viewDidDisappear\"},{\"event\":\"viewDidAppear\",\"timestamp\":1789048606757,\"type\":\"ui.lifecycle\",\"className\":\"HomeViewController\"},{\"type\":\"network.state\",\"timestamp\":1789048617352,\"state\":\"cellular 4g\"},{\"type\":\"ui.lifecycle\",\"timestamp\":1789048900488,\"event\":\"viewWillAppear\",\"className\":\"RootViewController\"},{\"type\":\"ui.lifecycle\",\"event\":\"viewDidDisappear\",\"className\":\"HomeViewController\",\"timestamp\":1789048900998},{\"type\":\"ui.lifecycle\",\"timestamp\":1789048900998,\"event\":\"viewDidAppear\",\"className\":\"RootViewController\"},{\"type\":\"app.lifecycle\",\"event\":\"didEnterBackground\",\"timestamp\":1789048902144},{\"timestamp\":1789049482362,\"type\":\"app.lifecycle\",\"event\":\"didFinishLaunch\"},{\"eventType\":\"orientation\",\"type\":\"system.event\",\"event\":\"unknown\",\"timestamp\":1789049482362},{\"eventType\":\"orientation\",\"event\":\"unknown\",\"timestamp\":1789049482383,\"type\":\"system.event\"},{\"timestamp\":1789049482383,\"type\":\"app.lifecycle\",\"event\":\"willEnterForeground\"},{\"timestamp\":1789049482385,\"type\":\"ui.lifecycle\",\"event\":\"viewDidLoad\",\"className\":\"RootViewController\"},{\"type\":\"ui.lifecycle\",\"className\":\"RootViewController\",\"timestamp\":1789049482389,\"event\":\"viewWillAppear\"},{\"event\":\"viewDidAppear\",\"type\":\"ui.lifecycle\",\"timestamp\":1789049482398,\"className\":\"RootViewController\"},{\"type\":\"app.lifecycle\",\"event\":\"didBecomeActive\",\"timestamp\":1789049482693},{\"event\":\"didEnterBackground\",\"type\":\"app.lifecycle\",\"timestamp\":1789049597023},{\"timestamp\":1789112385148,\"type\":\"app.lifecycle\",\"event\":\"didFinishLaunch\"},{\"eventType\":\"orientation\",\"event\":\"unknown\",\"timestamp\":1789112385148,\"type\":\"system.event\"},{\"type\":\"system.event\",\"eventType\":\"orientation\",\"event\":\"unknown\",\"timestamp\":1789112385170},{\"timestamp\":1789112385170,\"type\":\"app.lifecycle\",\"event\":\"willEnterForeground\"},{\"event\":\"viewDidLoad\",\"type\":\"ui.lifecycle\",\"timestamp\":1789112385173,\"className\":\"RootViewController\"},{\"event\":\"viewWillAppear\",\"type\":\"ui.lifecycle\",\"timestamp\":1789112385177,\"className\":\"RootViewController\"},{\"timestamp\":1789112385188,\"event\":\"didBecomeActive\",\"type\":\"app.lifecycle\"},{\"className\":\"RootViewController\",\"timestamp\":1789112385190,\"type\":\"ui.lifecycle\",\"event\":\"viewDidAppear\"},{\"type\":\"app.lifecycle\",\"event\":\"didEnterBackground\",\"timestamp\":1789113346190},{\"timestamp\":1789116004121,\"event\":\"didFinishLaunch\",\"type\":\"app.lifecycle\"},{\"eventType\":\"orientation\",\"timestamp\":1789116004121,\"event\":\"unknown\",\"type\":\"system.event\"},{\"eventType\":\"orientation\",\"event\":\"unknown\",\"type\":\"system.event\",\"timestamp\":1789116004143},{\"timestamp\":1789116004143,\"type\":\"app.lifecycle\",\"event\":\"willEnterForeground\"},{\"event\":\"viewDidLoad\",\"type\":\"ui.lifecycle\",\"className\":\"RootViewController\",\"timestamp\":1789116004147},{\"timestamp\":1789116004151,\"type\":\"ui.lifecycle\",\"className\":\"RootViewController\",\"event\":\"viewWillAppear\"},{\"timestamp\":1789116004165,\"event\":\"viewDidAppear\",\"type\":\"ui.lifecycle\",\"className\":\"RootViewController\"},{\"event\":\"didBecomeActive\",\"type\":\"app.lifecycle\",\"timestamp\":1789116004376},{\"eventType\":\"orientation\",\"event\":\"portrait\",\"type\":\"system.event\",\"timestamp\":1789116030359},{\"eventType\":\"orientation\",\"event\":\"unknown\",\"type\":\"system.event\",\"timestamp\":1789116033456},{\"timestamp\":1789116034369,\"type\":\"system.event\",\"eventType\":\"orientation\",\"event\":\"landscape\"},{\"eventType\":\"orientation\",\"timestamp\":1789116036438,\"event\":\"unknown\",\"type\":\"system.event\"},{\"eventType\":\"orientation\",\"timestamp\":1789116037283,\"type\":\"system.event\",\"event\":\"landscape\"},{\"event\":\"portrait\",\"eventType\":\"orientation\",\"type\":\"system.event\",\"timestamp\":1789116038209},{\"timestamp\":1789116066449,\"type\":\"network.state\",\"state\":\"cellular 4g\"},{\"state\":\"cellular 5g\",\"type\":\"network.state\",\"timestamp\":1789116221888},{\"type\":\"network.state\",\"timestamp\":1789116406638,\"state\":\"cellular 4g\"},{\"event\":\"unknown\",\"timestamp\":1789116727695,\"eventType\":\"orientation\",\"type\":\"system.event\"},{\"type\":\"app.lifecycle\",\"event\":\"didEnterBackground\",\"timestamp\":1789116893287},{\"type\":\"system.event\",\"eventType\":\"orientation\",\"event\":\"unknown\",\"timestamp\":1789117063714},{\"timestamp\":1789117065750,\"type\":\"app.lifecycle\",\"event\":\"willEnterForeground\"},{\"type\":\"app.lifecycle\",\"event\":\"didBecomeActive\",\"timestamp\":1789117066528},{\"type\":\"app.lifecycle\",\"timestamp\":1789117070351,\"event\":\"didEnterBackground\"},{\"timestamp\":1789117238155,\"type\":\"app.lifecycle\",\"event\":\"didFinishLaunch\"},{\"type\":\"system.event\",\"timestamp\":1789117238155,\"eventType\":\"orientation\",\"event\":\"unknown\"},{\"event\":\"unknown\",\"timestamp\":1789117238178,\"type\":\"system.event\",\"eventType\":\"orientation\"},{\"event\":\"willEnterForeground\",\"type\":\"app.lifecycle\",\"timestamp\":1789117238178},{\"event\":\"viewDidLoad\",\"timestamp\":1789117238181,\"type\":\"ui.lifecycle\",\"className\":\"RootViewController\"},{\"event\":\"viewWillAppear\",\"type\":\"ui.lifecycle\",\"className\":\"RootViewController\",\"timestamp\":1789117238187},{\"className\":\"RootViewController\",\"timestamp\":1789117238198,\"type\":\"ui.lifecycle\",\"event\":\"viewDidAppear\"},{\"timestamp\":1789117238419,\"event\":\"didBecomeActive\",\"type\":\"app.lifecycle\"},{\"state\":\"cellular 5g\",\"timestamp\":1789117271240,\"type\":\"network.state\"},{\"event\":\"didEnterBackground\",\"type\":\"app.lifecycle\",\"timestamp\":1789117503182},{\"type\":\"app.lifecycle\",\"timestamp\":1789117805872,\"event\":\"willEnterForeground\"},{\"event\":\"didBecomeActive\",\"type\":\"app.lifecycle\",\"timestamp\":1789117806171},{\"timestamp\":1789117813839,\"type\":\"app.lifecycle\",\"event\":\"didEnterBackground\"},{\"timestamp\":1789117837487,\"type\":\"network.state\",\"state\":\"cellular 4g\"},{\"type\":\"ui.lifecycle\",\"event\":\"viewDidDisappear\",\"timestamp\":1789117844943,\"className\":\"RootViewController\"},{\"event\":\"willTerminate\",\"type\":\"app.lifecycle\",\"timestamp\":1789117844949},{\"event\":\"didFinishLaunch\",\"timestamp\":1789128960032,\"type\":\"app.lifecycle\"},{\"type\":\"system.event\",\"timestamp\":1789128960032,\"event\":\"unknown\",\"eventType\":\"orientation\"},{\"type\":\"system.event\",\"eventType\":\"orientation\",\"event\":\"unknown\",\"timestamp\":1789128960072},{\"event\":\"willEnterForeground\",\"type\":\"app.lifecycle\",\"timestamp\":1789128960072},{\"className\":\"RootViewController\",\"type\":\"ui.lifecycle\",\"event\":\"viewDidLoad\",\"timestamp\":1789128960075},{\"event\":\"viewWillAppear\",\"type\":\"ui.lifecycle\",\"timestamp\":1789128960079,\"className\":\"RootViewController\"},{\"type\":\"app.lifecycle\",\"event\":\"didBecomeActive\",\"timestamp\":1789128960091},{\"type\":\"ui.lifecycle\",\"className\":\"RootViewController\",\"event\":\"viewDidAppear\",\"timestamp\":1789128960094},{\"type\":\"user.event\",\"x\":\"181.66667\",\"targetClass\":\"UIButton\",\"targetId\":\"tap:Auto Screen Tracking   ->\",\"action\":\"tap\",\"y\":\"633.3333\",\"timestamp\":1789128972212},{\"className\":\"HomeViewController\",\"type\":\"ui.lifecycle\",\"timestamp\":1789128972384,\"event\":\"viewDidLoad\"},{\"timestamp\":1789128972385,\"className\":\"HomeViewController\",\"type\":\"ui.lifecycle\",\"event\":\"viewWillAppear\"},{\"className\":\"RootViewController\",\"timestamp\":1789128973029,\"event\":\"viewDidDisappear\",\"type\":\"ui.lifecycle\"},{\"event\":\"viewDidAppear\",\"timestamp\":1789128973029,\"className\":\"HomeViewController\",\"type\":\"ui.lifecycle\"},{\"type\":\"ui.lifecycle\",\"event\":\"viewWillAppear\",\"timestamp\":1789128986544,\"className\":\"RootViewController\"},{\"type\":\"ui.lifecycle\",\"className\":\"HomeViewController\",\"timestamp\":1789128987043,\"event\":\"viewDidDisappear\"},{\"event\":\"viewDidAppear\",\"timestamp\":1789128987043,\"className\":\"RootViewController\",\"type\":\"ui.lifecycle\"},{\"type\":\"system.event\",\"event\":\"portrait\",\"timestamp\":1789129456313,\"eventType\":\"orientation\"},{\"type\":\"system.event\",\"eventType\":\"orientation\",\"timestamp\":1789129456603,\"event\":\"unknown\"},{\"timestamp\":1789129964848,\"type\":\"system.event\",\"event\":\"portrait\",\"eventType\":\"orientation\"},{\"timestamp\":1789129967759,\"eventType\":\"orientation\",\"type\":\"system.event\",\"event\":\"landscape\"},{\"type\":\"system.event\",\"eventType\":\"orientation\",\"event\":\"unknown\",\"timestamp\":1789129989983},{\"type\":\"app.lifecycle\",\"event\":\"didEnterBackground\",\"timestamp\":1789130071752},{\"timestamp\":1789130152805,\"type\":\"app.lifecycle\",\"event\":\"didFinishLaunch\"},{\"timestamp\":1789130152805,\"type\":\"system.event\",\"event\":\"unknown\",\"eventType\":\"orientation\"},{\"type\":\"system.event\",\"timestamp\":1789130152840,\"event\":\"unknown\",\"eventType\":\"orientation\"},{\"type\":\"app.lifecycle\",\"timestamp\":1789130152841,\"event\":\"willEnterForeground\"},{\"className\":\"RootViewController\",\"timestamp\":1789130152845,\"type\":\"ui.lifecycle\",\"event\":\"viewDidLoad\"},{\"className\":\"RootViewController\",\"event\":\"viewWillAppear\",\"type\":\"ui.lifecycle\",\"timestamp\":1789130152850},{\"event\":\"viewDidAppear\",\"type\":\"ui.lifecycle\",\"timestamp\":1789130152869,\"className\":\"RootViewController\"},{\"type\":\"app.lifecycle\",\"event\":\"didBecomeActive\",\"timestamp\":1789130153060},{\"timestamp\":1789130153069,\"state\":\"cellular 4g\",\"type\":\"network.state\"},{\"timestamp\":1789130156723,\"y\":\"272.0\",\"action\":\"tap\",\"targetId\":\"tap:Error\",\"type\":\"user.event\",\"x\":\"125.0\",\"targetClass\":\"UIButton\"}]","sdkVersion":"3.15.14","eMeta":"[source: \"MetricKit\", platform: \"iOS\", build: \"1\", arch: \"arm64e\", signal: 11, exceptionCode: 1, exceptionType: 1, regionFormat: \"IN\", isTestFlightApp: false, lowPowerModeEnabled: false]","stackTrace":"{\"threads\":[{\"crashed\":true,\"stack\":[{\"i\":0,\"bId\":\"0BA28CE2-8718-3CB3-BEF4-6DD44464EBE2\",\"fLine\":\"dyld                           0x00000001852d9c1c dyld + 19484\"},{\"i\":1,\"bId\":\"F94883C5-00B4-3753-B249-3B02DC969A79\",\"fLine\":\"Example-UIKit                  0x0000000100e75aa0 Example-UIKit + 55968\"},{\"i\":2,\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"fLine\":\"UIKitCore                      0x000000018e578aa4 UIKitCore + 2722468\"},{\"i\":3,\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"fLine\":\"UIKitCore                      0x000000018e36c158 UIKitCore + 573784\"},{\"i\":4,\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"fLine\":\"UIKitCore                      0x000000018e401670 UIKitCore + 1185392\"},{\"i\":5,\"bId\":\"7915658C-7728-3149-A524-2164C163F3D2\",\"fLine\":\"GraphicsServices               0x000000022e699498 GraphicsServices + 5272\"},{\"i\":6,\"bId\":\"5565CAD9-4941-32AC-8B10-7D3233C74151\",\"fLine\":\"CoreFoundation                 0x00000001886cd54c CoreFoundation + 189772\"},{\"i\":7,\"bId\":\"5565CAD9-4941-32AC-8B10-7D3233C74151\",\"fLine\":\"CoreFoundation                 0x00000001886ce1a0 CoreFoundation + 192928\"},{\"i\":8,\"bId\":\"5565CAD9-4941-32AC-8B10-7D3233C74151\",\"fLine\":\"CoreFoundation                 0x00000001887045a8 CoreFoundation + 415144\"},{\"i\":9,\"bId\":\"5565CAD9-4941-32AC-8B10-7D3233C74151\",\"fLine\":\"CoreFoundation                 0x000000018873f2d4 CoreFoundation + 656084\"},{\"i\":10,\"bId\":\"5565CAD9-4941-32AC-8B10-7D3233C74151\",\"fLine\":\"CoreFoundation                 0x000000018873f360 CoreFoundation + 656224\"},{\"i\":11,\"bId\":\"A4C6D2FF-F6E8-3B4E-94A0-DA3F7350BC4A\",\"fLine\":\"UpdateCycle                    0x000000029e3ca56c UpdateCycle + 5484\"},{\"i\":12,\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"fLine\":\"UIKitCore                      0x000000018e3d8c60 UIKitCore + 1018976\"},{\"i\":13,\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"fLine\":\"UIKitCore                      0x000000018e3db6d4 UIKitCore + 1029844\"},{\"i\":14,\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"fLine\":\"UIKitCore                      0x000000018e3c2188 UIKitCore + 926088\"},{\"i\":15,\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"fLine\":\"UIKitCore                      0x000000018e3d85b8 UIKitCore + 1017272\"},{\"i\":16,\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"fLine\":\"UIKitCore                      0x000000018e3bf480 UIKitCore + 914560\"},{\"i\":17,\"bId\":\"F94883C5-00B4-3753-B249-3B02DC969A79\",\"fLine\":\"Example-UIKit                  0x0000000100ed3788 Example-UIKit + 440200\"},{\"i\":18,\"bId\":\"F94883C5-00B4-3753-B249-3B02DC969A79\",\"fLine\":\"Example-UIKit                  0x0000000100ed338c Example-UIKit + 439180\"},{\"i\":19,\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"fLine\":\"UIKitCore                      0x000000018e3d2a68 UIKitCore + 993896\"},{\"i\":20,\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"fLine\":\"UIKitCore                      0x000000018e3be9a0 UIKitCore + 911776\"},{\"i\":21,\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"fLine\":\"UIKitCore                      0x000000018e3d9a64 UIKitCore + 1022564\"},{\"i\":22,\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"fLine\":\"UIKitCore                      0x000000018e9f6838 UIKitCore + 7432248\"},{\"i\":23,\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"fLine\":\"UIKitCore                      0x000000018e9f6358 UIKitCore + 7431000\"},{\"i\":24,\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"fLine\":\"UIKitCore                      0x000000018e901818 UIKitCore + 6428696\"},{\"i\":25,\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"fLine\":\"UIKitCore                      0x000000018e9f6358 UIKitCore + 7431000\"},{\"i\":26,\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"fLine\":\"UIKitCore                      0x000000018e901784 UIKitCore + 6428548\"},{\"i\":27,\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"fLine\":\"UIKitCore                      0x000000018f8354f8 UIKitCore + 22369528\"},{\"i\":28,\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"fLine\":\"UIKitCore                      0x000000018e63ad30 UIKitCore + 3517744\"},{\"i\":29,\"bId\":\"F94883C5-00B4-3753-B249-3B02DC969A79\",\"fLine\":\"Example-UIKit                  0x0000000100e6cde8 Example-UIKit + 19944\"},{\"i\":30,\"bId\":\"D6EE5F00-12F2-3DA4-B35D-E50AD18BD17F\",\"fLine\":\"libswiftCore.dylib             0x000000018539e5ac libswiftCore.dylib + 34220\"},{\"i\":31,\"bId\":\"D6EE5F00-12F2-3DA4-B35D-E50AD18BD17F\",\"fLine\":\"libswiftCore.dylib             0x000000018539d250 libswiftCore.dylib + 29264\"},{\"i\":32,\"bId\":\"D6EE5F00-12F2-3DA4-B35D-E50AD18BD17F\",\"fLine\":\"libswiftCore.dylib             0x000000018539ea94 libswiftCore.dylib + 35476\"},{\"i\":33,\"bId\":\"D6EE5F00-12F2-3DA4-B35D-E50AD18BD17F\",\"fLine\":\"libswiftCore.dylib             0x000000018539e038 libswiftCore.dylib + 32824\"},{\"i\":34,\"bId\":\"D6EE5F00-12F2-3DA4-B35D-E50AD18BD17F\",\"fLine\":\"libswiftCore.dylib             0x00000001853a28fc libswiftCore.dylib + 51452\"}],\"name\":\"Main Thread\",\"id\":\"0\"},{\"crashed\":false,\"stack\":[],\"name\":\"Thread 1\",\"id\":\"1\"},{\"crashed\":false,\"stack\":[],\"name\":\"Thread 2\",\"id\":\"2\"},{\"crashed\":false,\"stack\":[],\"name\":\"Thread 3\",\"id\":\"3\"},{\"crashed\":false,\"stack\":[],\"name\":\"Thread 4\",\"id\":\"4\"},{\"crashed\":false,\"stack\":[],\"name\":\"Thread 5\",\"id\":\"5\"},{\"crashed\":false,\"stack\":[],\"name\":\"Thread 6\",\"id\":\"6\"},{\"crashed\":false,\"stack\":[{\"i\":0,\"bId\":\"46B95807-F752-3DC2-A1BA-6290E8D7FE38\",\"fLine\":\"libsystem_pthread.dylib        0x00000001e805e8cc libsystem_pthread.dylib + 2252\"},{\"i\":1,\"bId\":\"46B95807-F752-3DC2-A1BA-6290E8D7FE38\",\"fLine\":\"libsystem_pthread.dylib        0x00000001e8062438 libsystem_pthread.dylib + 17464\"},{\"i\":2,\"bId\":\"1689FEA5-1780-3EFE-8F31-933D4DB24EC4\",\"fLine\":\"Foundation                     0x00000001859be904 Foundation + 583940\"},{\"i\":3,\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"fLine\":\"UIKitCore                      0x000000018e3c6eac UIKitCore + 945836\"},{\"i\":4,\"bId\":\"1689FEA5-1780-3EFE-8F31-933D4DB24EC4\",\"fLine\":\"Foundation                     0x000000018593abd8 Foundation + 43992\"},{\"i\":5,\"bId\":\"1689FEA5-1780-3EFE-8F31-933D4DB24EC4\",\"fLine\":\"Foundation                     0x000000018593acf0 Foundation + 44272\"},{\"i\":6,\"bId\":\"5565CAD9-4941-32AC-8B10-7D3233C74151\",\"fLine\":\"CoreFoundation                 0x00000001886cd54c CoreFoundation + 189772\"},{\"i\":7,\"bId\":\"5565CAD9-4941-32AC-8B10-7D3233C74151\",\"fLine\":\"CoreFoundation                 0x00000001886ce310 CoreFoundation + 193296\"},{\"i\":8,\"bId\":\"5565CAD9-4941-32AC-8B10-7D3233C74151\",\"fLine\":\"CoreFoundation                 0x0000000188704344 CoreFoundation + 414532\"},{\"i\":9,\"bId\":\"A11BF433-17AB-3F01-88BC-54C467CE6287\",\"fLine\":\"libsystem_kernel.dylib         0x0000000237d0c078 libsystem_kernel.dylib + 16504\"},{\"i\":10,\"bId\":\"A11BF433-17AB-3F01-88BC-54C467CE6287\",\"fLine\":\"libsystem_kernel.dylib         0x0000000237d0c22c libsystem_kernel.dylib + 16940\"},{\"i\":11,\"bId\":\"A11BF433-17AB-3F01-88BC-54C467CE6287\",\"fLine\":\"libsystem_kernel.dylib         0x0000000237d0c30c libsystem_kernel.dylib + 17164\"},{\"i\":12,\"bId\":\"A11BF433-17AB-3F01-88BC-54C467CE6287\",\"fLine\":\"libsystem_kernel.dylib         0x0000000237d08cd4 libsystem_kernel.dylib + 3284\"}],\"name\":\"Thread 7\",\"id\":\"7\"},{\"crashed\":false,\"stack\":[],\"name\":\"Thread 8\",\"id\":\"8\"},{\"crashed\":false,\"stack\":[],\"name\":\"Thread 9\",\"id\":\"9\"},{\"crashed\":false,\"stack\":[{\"i\":0,\"bId\":\"46B95807-F752-3DC2-A1BA-6290E8D7FE38\",\"fLine\":\"libsystem_pthread.dylib        0x00000001e805e8cc libsystem_pthread.dylib + 2252\"},{\"i\":1,\"bId\":\"46B95807-F752-3DC2-A1BA-6290E8D7FE38\",\"fLine\":\"libsystem_pthread.dylib        0x00000001e8062438 libsystem_pthread.dylib + 17464\"},{\"i\":2,\"bId\":\"1689FEA5-1780-3EFE-8F31-933D4DB24EC4\",\"fLine\":\"Foundation                     0x00000001859be904 Foundation + 583940\"},{\"i\":3,\"bId\":\"207A7ECF-FBF3-3EF5-A9AA-86CC52845F97\",\"fLine\":\"CFNetwork                      0x000000019dbddb54 CFNetwork + 596820\"},{\"i\":4,\"bId\":\"5565CAD9-4941-32AC-8B10-7D3233C74151\",\"fLine\":\"CoreFoundation                 0x00000001886cd54c CoreFoundation + 189772\"},{\"i\":5,\"bId\":\"5565CAD9-4941-32AC-8B10-7D3233C74151\",\"fLine\":\"CoreFoundation                 0x00000001886ce310 CoreFoundation + 193296\"},{\"i\":6,\"bId\":\"5565CAD9-4941-32AC-8B10-7D3233C74151\",\"fLine\":\"CoreFoundation                 0x0000000188704344 CoreFoundation + 414532\"},{\"i\":7,\"bId\":\"A11BF433-17AB-3F01-88BC-54C467CE6287\",\"fLine\":\"libsystem_kernel.dylib         0x0000000237d0c078 libsystem_kernel.dylib + 16504\"},{\"i\":8,\"bId\":\"A11BF433-17AB-3F01-88BC-54C467CE6287\",\"fLine\":\"libsystem_kernel.dylib         0x0000000237d0c22c libsystem_kernel.dylib + 16940\"},{\"i\":9,\"bId\":\"A11BF433-17AB-3F01-88BC-54C467CE6287\",\"fLine\":\"libsystem_kernel.dylib         0x0000000237d0c30c libsystem_kernel.dylib + 17164\"},{\"i\":10,\"bId\":\"A11BF433-17AB-3F01-88BC-54C467CE6287\",\"fLine\":\"libsystem_kernel.dylib         0x0000000237d08cd4 libsystem_kernel.dylib + 3284\"}],\"name\":\"Thread 10\",\"id\":\"10\"}],\"meta\":{\"fVersion\":\"1.0.0\"}}","netStateSource":"CTRadioAccessTechnologyLTE","netState":"cellular 4g","sdkId":"btt-swift-sdk","deviceModel":"iPhone13,2"},"VER":"3.15.14","msg":"The app crashed with EXC_BAD_ACCESS (SIGSEGV).~~Example-UIKit                  0x0000000100e75aa0 Example-UIKit + 55968","line":1,"url":"Example-UIKit"}];

let allBreadcrumbs = [];

let activeFilters  = new Set();
let sortOrder      = 'desc';
let crashEvent     = null;
let stackTraceData = null;
let crashMetadata  = null;
let currentView    = 'stacktrace';
let currentSdkId   = null;
let nativeAppInfo  = null; // appVersion/sdkVersion/deviceModel — straight from NATIVEAPP, not eMeta
let threadViewMode = 'text'; // 'cell' (thread cards) or 'text' (raw stack trace preview, default)

const SIGNAL_NAMES = {
  1: 'SIGHUP', 2: 'SIGINT', 3: 'SIGQUIT', 4: 'SIGILL', 5: 'SIGTRAP',
  6: 'SIGABRT', 7: 'SIGEMT', 8: 'SIGFPE', 9: 'SIGKILL', 10: 'SIGBUS',
  11: 'SIGSEGV', 12: 'SIGSYS', 13: 'SIGPIPE', 14: 'SIGALRM', 15: 'SIGTERM',
};

const META_LABELS = {
  appVersion: 'App Version',
  appBuildVersion: 'Build',
  osVersion: 'OS Version',
  deviceType: 'Device',
  platformArchitecture: 'Architecture',
  platform: 'Platform',
  build: 'Build',
  arch: 'Architecture',
  regionFormat: 'Region',
  isTestFlightApp: 'TestFlight',
  lowPowerModeEnabled: 'Low Power Mode',
  totalCPUTime: 'Total CPU Time',
  totalSampledTime: 'Sampled Time',
  writesCaused: 'Disk Writes',
  hangDuration: 'Hang Duration',
  launchDuration: 'Launch Duration',
  exceptionCode: 'Exception Code',
  exceptionType: 'Exception Sub Type',
  source: 'Source',
};

// ── Diagnostic Type Mapping (MetricKit-style eTp) ────────────────────────────
// eTp isn't always a crash — MetricKit-style payloads can report hangs/ANRs,
// slow launches, excess CPU, heavy disk writes, or memory warnings, and several
// of those never carry a stack trace at all — only eMeta + msg.
const DIAGNOSTIC_TYPES = {
  crash:  { key: 'crash',  icon: '💥', label: 'Crash',            color: '#ef4444', fields: ['signal', 'exceptionType', 'exceptionCode'] },
  hang:   { key: 'hang',   icon: '⏱️', label: 'Hang / ANR',        color: '#f59e0b', fields: ['hangDuration'] },
  launch: { key: 'launch', icon: '🐢', label: 'Slow Launch',       color: '#f59e0b', fields: ['launchDuration'] },
  memory: { key: 'memory', icon: '🧠', label: 'Memory Warning',    color: '#8b5cf6', fields: [] },
  cpu:    { key: 'cpu',    icon: '🔥', label: 'Excess CPU Usage',  color: '#ec4899', fields: ['totalCPUTime', 'totalSampledTime'] },
  disk:   { key: 'disk',   icon: '💾', label: 'Heavy Disk Write',  color: '#06b6d4', fields: ['writesCaused'] },
};

function getDiagnosticType(etp) {
  const norm = String(etp || '').toLowerCase();
  if (norm.includes('crash'))                          return DIAGNOSTIC_TYPES.crash;
  if (norm.includes('hang') || norm.includes('anr'))    return DIAGNOSTIC_TYPES.hang;
  if (norm.includes('launch'))                          return DIAGNOSTIC_TYPES.launch;
  if (norm.includes('memory'))                          return DIAGNOSTIC_TYPES.memory;
  if (norm.includes('cpu'))                             return DIAGNOSTIC_TYPES.cpu;
  if (norm.includes('disk') || norm.includes('write'))  return DIAGNOSTIC_TYPES.disk;
  return { key: 'generic', icon: '⚠️', label: etp || 'Diagnostic Event', color: '#4f8ef7', fields: [] };
}

// ── Platform Detection (from NATIVEAPP.sdkId) ────────────────────────────────
const PLATFORM_CONFIG = {
  'btt-swift-sdk':        { label: 'iOS',         icon: '🍎' },
  'btt-android-sdk':      { label: 'Android',      icon: '🤖' },
  'react-native-btt-sdk': { label: 'React Native', icon: '⚛️' },
};

function getPlatform(sdkId) {
  if (!sdkId) return null;
  if (PLATFORM_CONFIG[sdkId]) return PLATFORM_CONFIG[sdkId];

  const norm = String(sdkId).toLowerCase();
  if (norm.includes('react-native') || norm.includes('react_native') || norm.includes('reactnative'))
    return { label: 'React Native', icon: '⚛️' };
  if (norm.includes('swift') || norm.includes('ios') || norm.includes('objc') || norm.includes('cocoa'))
    return { label: 'iOS', icon: '🍎' };
  if (norm.includes('android') || norm.includes('kotlin'))
    return { label: 'Android', icon: '🤖' };
  if (norm.includes('flutter'))
    return { label: 'Flutter', icon: '🐦' };

  return { label: sdkId, icon: '📦' };
}

// ── Formatting Helpers ───────────────────────────────────────────────────────
function formatTime(ts) {
  const d = new Date(ts);
  const hms = d.toLocaleTimeString('en-US', {
    hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  return hms + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

// "2026-09-08 18:51 IST (+5:30)" style — local date/time plus the browser's UTC offset
function formatFullDateTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  const pad = n => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const offMin = -d.getTimezoneOffset();
  const sign = offMin >= 0 ? '+' : '-';
  const offH = Math.floor(Math.abs(offMin) / 60);
  const offM = pad(Math.abs(offMin) % 60);
  return `${date} ${time} (${sign}${offH}:${offM})`;
}

function formatDelta(ms) {
  if (ms < 1000) return `+${ms}ms`;
  return `+${(ms / 1000).toFixed(1)}s`;
}

function getStatusClass(code) {
  if (!code) return '';
  const n = parseInt(code, 10);
  if (n >= 500) return 'status-err';
  if (n >= 400) return 'status-warn';
  return 'status-ok';
}

// ── Event Text Builders ──────────────────────────────────────────────────────
function buildMainText(bc) {
  switch (bc.type) {
    case 'ui.lifecycle':
      return `${bc.className} → ${bc.event}`;
    case 'network.request':
      return bc.url ? bc.url.replace(/^https?:\/\//, '') : 'Unknown URL';
    case 'user.event':
      return `${bc.action} on ${bc.targetClass || ''}${bc.targetId ? ' · ' + bc.targetId.split(':').pop() : ''}`;
    case 'app.lifecycle':
      return `App → ${bc.event}`;
    case 'app.launch':
      return `Launch · ${bc.launchType || ''}`;
    case 'app.install':
      return `Installed · v${bc.version || ''}`;
    case 'network.state':
      return `Network → ${bc.state}`;
    case 'system.event':
      return `${bc.eventType} → ${bc.event}`;
    default:
      return JSON.stringify(bc).slice(0, 80);
  }
}

function buildDetail(bc) {
  const parts = [];

  if (bc.type === 'network.request') {
    if (bc.statusCode) {
      const cls = getStatusClass(bc.statusCode);
      parts.push(`<span><strong>status</strong> <span class="${cls}">${bc.statusCode}</span></span>`);
    }
    if (bc.url) {
      parts.push(`<span><strong>url</strong> ${bc.url}</span>`);
    }
  }

  if (bc.type === 'user.event') {
    if (bc.targetId)    parts.push(`<span><strong>id</strong> ${bc.targetId}</span>`);
    if (bc.targetClass) parts.push(`<span><strong>class</strong> ${bc.targetClass}</span>`);
  }

  if (bc.type === 'ui.lifecycle') {
    parts.push(`<span><strong>class</strong> ${bc.className}</span>`);
    parts.push(`<span><strong>event</strong> ${bc.event}</span>`);
  }

  return parts.join('');
}

// ── JSON Parsing ─────────────────────────────────────────────────────────────
function splitTopLevel(str, delim) {
  const parts = [];
  let depth = 0, inQuotes = false, current = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '"' && str[i - 1] !== '\\') inQuotes = !inQuotes;
    if (!inQuotes) {
      if (ch === '[' || ch === '(' || ch === '{') depth++;
      if (ch === ']' || ch === ')' || ch === '}') depth--;
    }
    if (ch === delim && depth === 0 && !inQuotes) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current) parts.push(current);
  return parts;
}

// parses Swift-style dump strings, e.g. [title: "...", signal: 11, isTestFlightApp: false]
function parseEMetaString(raw) {
  if (!raw) return null;
  let s = raw.trim();
  if (s.startsWith('[') && s.endsWith(']')) s = s.slice(1, -1);

  const obj = {};
  splitTopLevel(s, ',').forEach(pair => {
    const idx = pair.indexOf(':');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    let val = pair.slice(idx + 1).trim();

    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    } else if (val === 'true') {
      val = true;
    } else if (val === 'false') {
      val = false;
    } else if (val !== '' && !isNaN(Number(val))) {
      val = Number(val);
    }
    obj[key] = val;
  });
  return obj;
}

// splits a symbolicated frame line into binary / address / symbol columns.
// native (iOS) frames look like "Binary  0xADDRESS  Symbol + offset"; Android/RN
// frames instead look like "at Class.method(File.kt:51)" — no binary/address at
// all, so leave binary/address blank and keep fLine exactly as given.
function parseFrameLine(fLine) {
  const raw = String(fLine || '');
  const m = raw.match(/^(\S+)\s+(0x[0-9a-fA-F]+)\s+(.+)$/);
  if (m) return { binary: m[1], address: m[2], symbol: m[3] };
  return { binary: '', address: '', symbol: raw };
}

function parsePayload(raw) {
  let parsed = JSON.parse(raw.trim());

  // unwrap outer array if needed
  if (Array.isArray(parsed)) parsed = parsed[0];

  let bcs         = [];
  let crash       = null;
  let stackTrace  = null;
  let metadata    = null;

  const nativeApp = parsed.NATIVEAPP || {};

  // format: full crash report with NATIVEAPP.breadcrumbs string
  if (nativeApp.breadcrumbs) {
    try { bcs = JSON.parse(nativeApp.breadcrumbs); } catch (e) { /* not present in this payload */ }
  } else if (Array.isArray(parsed)) {
    // format: raw breadcrumb array
    bcs = parsed;
  }

  if (nativeApp.stackTrace) {
    try { stackTrace = JSON.parse(nativeApp.stackTrace); } catch (e) { /* malformed stack trace */ }
  }

  // eMeta may arrive as a real object, a JSON string, or a Swift-style
  // bracket dump ("[title: \"...\", signal: 11, ...]") — accept all three.
  if (nativeApp.eMeta) {
    if (typeof nativeApp.eMeta === 'object') {
      metadata = nativeApp.eMeta;
    } else if (typeof nativeApp.eMeta === 'string') {
      try {
        metadata = JSON.parse(nativeApp.eMeta);
      } catch (e) {
        metadata = parseEMetaString(nativeApp.eMeta);
      }
    }
  }

  // sdkId identifies which platform SDK produced this payload
  // (btt-swift-sdk → iOS, btt-android-sdk → Android, react-native-btt-sdk → RN)
  const sdkId = nativeApp.sdkId || null;

  // straight from NATIVEAPP, not eMeta — eMeta can carry its own appVersion
  // (and no deviceModel/sdkVersion at all), so these are kept separate
  const nativeAppInfo = {
    appVersion:  nativeApp.appVersion  || null,
    sdkVersion:  nativeApp.sdkVersion  || null,
    deviceModel: nativeApp.deviceModel || null,
  };

  // session id shows up under a few different names depending on SDK/version —
  // try the real field first, fall back to "col" (the only other per-session
  // identifier a payload carries) rather than leaving it blank
  const sessionId = parsed.sessionId || parsed.sessionID || parsed.sid
    || nativeApp.sessionId || nativeApp.sessionID || nativeApp.sid
    || (parsed.col != null ? parsed.col : null);

  // extract diagnostic event info — eTp decides the kind (crash, hang, slow
  // launch, excess CPU, heavy disk write, memory warning, ...); msg may be absent
  if (parsed.msg || parsed.eTp) {
    crash = {
      message:    parsed.msg ? parsed.msg.replace(/~~/g, '\n') : null,
      type:       parsed.eTp || 'Diagnostic Event',
      time:       parseInt(parsed.time, 10) || null,
      session:    sessionId != null ? String(sessionId) : null,
      errorCount: parsed.eCnt != null ? parseInt(parsed.eCnt, 10) : null,
    };
  }

  return { breadcrumbs: bcs, crash, stackTrace, metadata, sdkId, nativeAppInfo };
}

// ── Error Display ─────────────────────────────────────────────────────────────
function showError(msg) {
  const el = document.getElementById('errorMsg');
  el.textContent = msg;
  el.classList.add('visible');
}

// ── Stats Rendering ───────────────────────────────────────────────────────────
// ── Filter Chip Rendering ─────────────────────────────────────────────────────
function renderFilterChips() {
  const counts = {};
  allBreadcrumbs.forEach(b => { counts[b.type] = (counts[b.type] || 0) + 1; });

  const container = document.getElementById('filterChips');
  container.innerHTML = '';

  // preserve first-seen order
  const types = [...new Set(allBreadcrumbs.map(b => b.type))];

  types.forEach(type => {
    const cfg  = getConfig(type);
    const chip = document.createElement('div');
    chip.className    = `filter-chip ${cfg.chipClass}`;
    chip.dataset.type = type;
    chip.innerHTML = `
      <span class="dot"></span>
      ${cfg.label}
      <span class="count">${counts[type]}</span>
    `;
    chip.addEventListener('click', () => toggleFilter(type, chip));
    container.appendChild(chip);
  });
}

function toggleFilter(type, chip) {
  if (activeFilters.has(type)) {
    activeFilters.delete(type);
    chip.classList.add('inactive');
  } else {
    activeFilters.add(type);
    chip.classList.remove('inactive');
  }
  applyFilters();
}

// ── Sort ──────────────────────────────────────────────────────────────────────
function setSort(order) {
  sortOrder = order;
  document.getElementById('sortAsc').classList.toggle('active',  order === 'asc');
  document.getElementById('sortDesc').classList.toggle('active', order === 'desc');
  renderTimeline();
}

// ── Timeline Rendering ────────────────────────────────────────────────────────
function renderTimeline() {
  const container = document.getElementById('timeline');
  container.innerHTML = '';

  const sorted = [...allBreadcrumbs].sort((a, b) =>
    sortOrder === 'asc' ? a.timestamp - b.timestamp : b.timestamp - a.timestamp
  );

  sorted.forEach((bc, idx) => {
    const cfg   = getConfig(bc.type);
    const delta = idx > 0 ? Math.abs(bc.timestamp - sorted[idx - 1].timestamp) : 0;
    const detail = buildDetail(bc);

    const item = document.createElement('div');
    item.className        = 'bc-item';
    item.dataset.type     = bc.type;
    item.style.animationDelay = `${Math.min(idx * 12, 300)}ms`;

    item.innerHTML = `
      <div class="bc-dot-wrap">
        <div class="bc-dot" style="background:${cfg.dot}"></div>
      </div>
      <div class="bc-content">
        <div class="bc-row">
          <span class="bc-badge"
            style="background:${cfg.badge};border:1px solid ${cfg.badgeBorder};color:${cfg.dot}">
            ${cfg.icon} ${cfg.label}
          </span>
          <span class="bc-main" title="${buildMainText(bc)}">${buildMainText(bc)}</span>
          <div class="bc-meta">
            ${delta > 0 ? `<span class="bc-delta">${formatDelta(delta)}</span>` : ''}
            <span class="bc-time">${formatTime(bc.timestamp)}</span>
          </div>
        </div>
        ${detail ? `<div class="bc-detail">${detail}</div>` : ''}
      </div>
    `;

    container.appendChild(item);
  });

  applyFilters();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

// ── Stack Trace Rendering (Crashlytics-style) ────────────────────────────────
function renderStackTrace() {
  renderCrashSummary();
  renderMetaGrid();
  renderCharts();
  renderCrashLog();
  renderThreads();
  document.getElementById('crashDrilldownGrid').style.display = (crashMetadata || crashEvent) ? '' : 'none';
  document.getElementById('crashLogWrap').style.display = crashEvent ? '' : 'none';
}

function getCrashSummaryData() {
  if (!crashMetadata && !crashEvent) return null;

  const dtype       = getDiagnosticType(crashEvent && crashEvent.type);
  const isCrash      = dtype.key === 'crash';
  const signal        = crashMetadata ? crashMetadata.signal : null;
  const signalName    = signal != null ? (SIGNAL_NAMES[signal] || `Signal ${signal}`) : null;
  const reason         = (crashEvent && crashEvent.message) || (crashMetadata && crashMetadata.title) || dtype.label;

  const heading = isCrash
    ? `Fatal Exception${signalName ? ': ' + signalName : ''}`
    : dtype.label;

  const tags = dtype.fields
    .filter(key => crashMetadata && crashMetadata[key] != null)
    .map(key => `<span class="tag">${escapeHtml(META_LABELS[key] || key)} <strong>${escapeHtml(crashMetadata[key])}</strong></span>`);

  const platform = getPlatform(currentSdkId);
  if (platform) {
    tags.unshift(`<span class="tag">${platform.icon} <strong>${escapeHtml(platform.label)}</strong></span>`);
  }

  // right after the platform tag, not at the end
  if (crashMetadata && crashMetadata.source != null) {
    tags.splice(platform ? 1 : 0, 0, `<span class="tag"><strong>${escapeHtml(crashMetadata.source)}</strong></span>`);
  }

  return { dtype, heading, reason, tags };
}

function crashSummaryInnerHTML({ dtype, heading, reason, tags }) {
  return `
    ${reason ? `<div class="crash-summary-reason">${escapeHtml(reason)}</div>` : ''}
    <div class="crash-summary-tags">${tags.join('')}</div>
  `;
}

// ── Crash Report Export ──────────────────────────────────────────────────────
// combines metadata + message + stack trace into one plain-text file, laid out
// like the platform's own native crash log — only fields that format actually
// carries and that this payload actually has, nothing invented, nothing extra.
function getReportFields() {
  const platform   = getPlatform(currentSdkId);
  const dtype      = getDiagnosticType(crashEvent && crashEvent.type);
  const signal     = crashMetadata ? crashMetadata.signal : null;
  const signalName = signal != null ? (SIGNAL_NAMES[signal] || `Signal ${signal}`) : null;
  const reason     = (crashEvent && crashEvent.message) || (crashMetadata && crashMetadata.title) || dtype.label;
  const version    = crashMetadata && crashMetadata.appVersion
    ? crashMetadata.appVersion + (crashMetadata.appBuildVersion ? ` (${crashMetadata.appBuildVersion})` : '')
    : null;
  const threads      = stackTraceData && stackTraceData.threads ? stackTraceData.threads : [];
  const crashedThread = threads.find(t => t.crashed) || null;

  return { platform, dtype, signal, signalName, reason, version, threads, crashedThread };
}

function formatFrames(frames) {
  if (!frames.length) return '(no frames)';
  return frames.map(frame => {
    const { binary, address, symbol } = parseFrameLine(frame.fLine);
    return `${String(frame.i).padStart(3)}  ${binary.padEnd(30)} ${address}  ${symbol}`;
  }).join('\n');
}

// thread.name is often just "Thread <id>" again — only worth printing when it adds information
function threadLabel(thread) {
  const fallback = `Thread ${thread.id}`;
  return thread.name && thread.name !== fallback ? `: ${thread.name}` : '';
}

// any eMeta field not already surfaced as one of the named header fields —
// real apps bundle this alongside the crash (region, low power mode, TestFlight, ...)
function extraMetadataLines(usedKeys) {
  if (!crashMetadata) return [];
  return Object.keys(crashMetadata)
    .filter(key => !usedKeys.has(key) && crashMetadata[key] != null)
    .map(key => {
      let value = crashMetadata[key];
      if (typeof value === 'boolean') value = value ? 'Yes' : 'No';
      return `${META_LABELS[key] || key}: ${value}`;
    });
}

// Apple crash-log style — https://developer.apple.com/documentation/xcode/analyzing-a-crash-report
function buildIOSCrashText(f) {
  const lines = [];
  if (crashMetadata && crashMetadata.deviceType)        lines.push(`Hardware Model:      ${crashMetadata.deviceType}`);
  if (f.version)                                        lines.push(`Version:             ${f.version}`);
  if (crashMetadata && crashMetadata.platformArchitecture) lines.push(`Code Type:           ${crashMetadata.platformArchitecture}`);
  if (crashMetadata && crashMetadata.osVersion)         lines.push(`OS Version:          ${crashMetadata.osVersion}`);
  lines.push(...extraMetadataLines(new Set(['title', 'appVersion', 'appBuildVersion', 'osVersion', 'deviceType', 'platformArchitecture', 'signal'])));
  lines.push('');
  lines.push(`Exception Type:  ${f.signalName || f.dtype.label}`);
  if (f.reason) lines.push(`Exception Note:  ${f.reason}`);
  if (f.crashedThread) lines.push(`Triggered by Thread:  ${f.crashedThread.id}`);
  lines.push('');

  f.threads.forEach(thread => {
    const label = threadLabel(thread);
    lines.push(thread.crashed ? `Thread ${thread.id} Crashed${label}` : `Thread ${thread.id}${label}`);
    lines.push(formatFrames(thread.stack || []));
    lines.push('');
  });

  return lines.join('\n').trim();
}

// Android FATAL EXCEPTION style — matches what logcat prints for an uncaught exception
function buildAndroidCrashText(f) {
  const lines = [];
  const mainName = f.crashedThread ? (f.crashedThread.name || `Thread ${f.crashedThread.id}`) : 'main';
  lines.push(`FATAL EXCEPTION: ${mainName}`);
  if (f.version)                                lines.push(`App Version: ${f.version}`);
  if (crashMetadata && crashMetadata.deviceType) lines.push(`Device: ${crashMetadata.deviceType}`);
  if (crashMetadata && crashMetadata.osVersion)  lines.push(`OS Version: ${crashMetadata.osVersion}`);
  lines.push(...extraMetadataLines(new Set(['title', 'appVersion', 'appBuildVersion', 'osVersion', 'deviceType', 'signal'])));
  lines.push('');
  lines.push(f.reason || f.dtype.label);
  if (f.crashedThread) {
    (f.crashedThread.stack || []).forEach(frame => {
      lines.push(`\t${parseFrameLine(frame.fLine).symbol}`);
    });
  }

  const others = f.threads.filter(t => t !== f.crashedThread);
  if (others.length) {
    lines.push('');
    lines.push('--- Other Threads ---');
    others.forEach(thread => {
      lines.push('');
      lines.push(`"${thread.name || 'Thread ' + thread.id}"`);
      (thread.stack || []).forEach(frame => {
        lines.push(`\t${parseFrameLine(frame.fLine).symbol}`);
      });
    });
  }

  return lines.join('\n').trim();
}

// React Native unhandled-JS-exception style (redbox stack format)
function buildReactNativeCrashText(f) {
  const lines = [];
  lines.push(`Error: ${f.reason || f.dtype.label}`);
  lines.push('');
  if (f.version)                                 lines.push(`App Version: ${f.version}`);
  if (crashMetadata && crashMetadata.deviceType) lines.push(`Device: ${crashMetadata.deviceType}`);
  if (crashMetadata && crashMetadata.osVersion)  lines.push(`OS Version: ${crashMetadata.osVersion}`);
  lines.push(...extraMetadataLines(new Set(['title', 'appVersion', 'appBuildVersion', 'osVersion', 'deviceType', 'signal'])));
  lines.push('');

  const jsThread = f.crashedThread || f.threads[0];
  if (jsThread) {
    (jsThread.stack || []).forEach(frame => {
      lines.push(`    ${parseFrameLine(frame.fLine).symbol}`);
    });
  }

  return lines.join('\n').trim();
}

function buildGenericCrashText(f) {
  const lines = [];
  lines.push(`Incident Type: ${f.signalName ? `Fatal Exception: ${f.signalName}` : f.dtype.label}`);
  if (f.version)                                 lines.push(`App Version: ${f.version}`);
  if (crashMetadata && crashMetadata.deviceType) lines.push(`Device: ${crashMetadata.deviceType}`);
  if (crashMetadata && crashMetadata.osVersion)  lines.push(`OS Version: ${crashMetadata.osVersion}`);
  lines.push(...extraMetadataLines(new Set(['title', 'appVersion', 'appBuildVersion', 'osVersion', 'deviceType', 'signal'])));
  lines.push('');
  lines.push(f.reason || '(no message)');
  lines.push('');

  f.threads.forEach(thread => {
    const label = threadLabel(thread);
    lines.push(thread.crashed ? `Thread ${thread.id} Crashed${label}` : `Thread ${thread.id}${label}`);
    lines.push(formatFrames(thread.stack || []));
    lines.push('');
  });

  return lines.join('\n').trim();
}

function buildCrashReportText() {
  const f = getReportFields();
  const platformLabel = f.platform ? f.platform.label : 'Unknown';

  let body;
  switch (platformLabel) {
    case 'iOS':           body = buildIOSCrashText(f); break;
    case 'Android':       body = buildAndroidCrashText(f); break;
    case 'React Native':  body = buildReactNativeCrashText(f); break;
    default:              body = buildGenericCrashText(f);
  }

  const header = [`Platform:      ${platformLabel}`];
  if (crashEvent && crashEvent.time) header.push(`Date/Time:     ${new Date(crashEvent.time).toISOString()}`);

  return header.join('\n') + '\n\n' + body + '\n';
}

function downloadTextFile(text, filename) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadCrashReport() {
  downloadTextFile(buildCrashReportText(), `crash-report-${Date.now()}.txt`);
}

// plain-text export of the event timeline — same ordering as the on-screen
// timeline (respects the current sort), one line per breadcrumb
function buildBreadcrumbReportText() {
  const platformLabel = (getPlatform(currentSdkId) || {}).label || 'Unknown';
  const header = [`Platform:      ${platformLabel}`];
  if (crashEvent && crashEvent.time) header.push(`Date/Time:     ${new Date(crashEvent.time).toISOString()}`);
  header.push(`Total Events:  ${allBreadcrumbs.length}`);

  const sorted = [...allBreadcrumbs].sort((a, b) =>
    sortOrder === 'asc' ? a.timestamp - b.timestamp : b.timestamp - a.timestamp
  );

  const lines = sorted.map(bc => {
    const label = getConfig(bc.type).label;
    return `${new Date(bc.timestamp).toISOString()}  [${label}]  ${buildMainText(bc)}`;
  });

  return header.join('\n') + '\n\n' + (lines.join('\n') || '(no events)') + '\n';
}

function downloadBreadcrumbReport() {
  downloadTextFile(buildBreadcrumbReportText(), `breadcrumb-report-${Date.now()}.txt`);
}

// modal's single Download Report button — sends whichever report matches
// the segment currently open (Diagnostic → crash report, Breadcrumbs → timeline)
function downloadModalReport() {
  if (currentView === 'breadcrumb') downloadBreadcrumbReport();
  else downloadCrashReport();
}

function renderCrashSummary() {
  const el = document.getElementById('crashSummary');
  const data = getCrashSummaryData();
  if (!data) { el.innerHTML = ''; el.removeAttribute('style'); el.style.display = 'none'; return; }

  el.style.display     = '';
  el.style.background  = `${data.dtype.color}14`;
  el.style.borderColor = `${data.dtype.color}4d`;
  el.innerHTML = crashSummaryInnerHTML(data);
}

function renderPlatformBadge() {
  const el = document.getElementById('platformBadge');
  const platform = getPlatform(currentSdkId);

  if (!platform) {
    el.classList.remove('visible');
    el.innerHTML = '';
    return;
  }

  el.innerHTML = `
    <span class="platform-badge-icon">${platform.icon}</span>
    <span>${escapeHtml(platform.label)}</span>
    <span class="platform-badge-sdk">${escapeHtml(currentSdkId)}</span>
  `;
  el.classList.add('visible');
}

// title/signal/exceptionCode/exceptionType get special treatment elsewhere
// (message fallback, or the crash heading/tags) — everything else, including
// performance fields like hangDuration/launchDuration/totalCPUTime/
// writesCaused, shows here whenever it's present, regardless of the current
// diagnostic type
// appVersion/appBuildVersion are shown explicitly up top (App Version from
// NATIVEAPP, Build Version right after it) — skip them here so they don't
// also print a second time from the generic eMeta loop
const META_GRID_SKIP = new Set(['title', 'signal', 'exceptionCode', 'exceptionType', 'source', 'appVersion', 'appBuildVersion']);

function renderMetaGrid() {
  const container = document.getElementById('metaGrid');
  container.innerHTML = '';

  const addCard = (label, value) => {
    const card = document.createElement('div');
    card.className = 'meta-card';
    card.innerHTML = `
      <div class="meta-label">${escapeHtml(label)}</div>
      <div class="meta-value">${escapeHtml(value)}</div>
    `;
    container.appendChild(card);
  };

  // App Version from NATIVEAPP directly, not eMeta (eMeta may carry its own,
  // different appVersion, or none of these fields at all) — Build Version
  // right after it, then the rest of the NATIVEAPP-level fields
  if (nativeAppInfo && nativeAppInfo.appVersion) addCard('App Version', nativeAppInfo.appVersion);
  if (crashMetadata && crashMetadata.appBuildVersion != null) addCard('Build Version', crashMetadata.appBuildVersion);
  if (nativeAppInfo) {
    if (nativeAppInfo.sdkVersion)  addCard('SDK Version', nativeAppInfo.sdkVersion);
    if (nativeAppInfo.deviceModel) addCard('Model', nativeAppInfo.deviceModel);
  }

  if (!crashMetadata) return;

  Object.keys(crashMetadata).forEach(key => {
    if (META_GRID_SKIP.has(key)) return;
    let value = crashMetadata[key];
    if (typeof value === 'boolean') value = value ? 'Yes' : 'No';
    addCard(META_LABELS[key] || key, value);
  });
}

// ── Crash Charts (2x2 donut grid, mirrors the Error Drilldown layout) ───────
const CHART_COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#1d4ed8'];

function countsToSegments(counts) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count, pct: total ? (count / total * 100) : 0 }));
}

function singleValueSegment(value) {
  const label = (value != null && value !== '') ? String(value) : 'Unknown';
  return [{ label, count: 1, pct: 100 }];
}

// how many times each screen (ui.lifecycle className) was visited in the
// session's breadcrumb trail — closest thing to "Top Pages" a crash payload has
function computePageBreakdown() {
  const counts = {};
  allBreadcrumbs.forEach(bc => {
    if (bc.type === 'ui.lifecycle' && bc.className) {
      counts[bc.className] = (counts[bc.className] || 0) + 1;
    }
  });
  return countsToSegments(counts);
}

function renderDonut(segments) {
  if (!segments.length) return `<div class="chart-donut chart-donut-empty"></div>`;
  let acc = 0;
  const stops = segments.map((s, i) => {
    const start = acc;
    acc += s.pct;
    return `${CHART_COLORS[i % CHART_COLORS.length]} ${start}% ${acc}%`;
  }).join(', ');
  return `<div class="chart-donut" style="background: conic-gradient(${stops})"></div>`;
}

function renderChartCard(title, segments) {
  const top = segments.slice(0, 4);
  const rows = top.map((s, i) => `
    <div class="chart-legend-row">
      <span class="chart-legend-dot" style="background:${CHART_COLORS[i % CHART_COLORS.length]}"></span>
      <span class="chart-legend-label">${escapeHtml(s.label)}</span>
      <span class="chart-legend-count">${s.count}</span>
      <span class="chart-legend-pct">${s.pct.toFixed(2)}%</span>
    </div>
  `).join('');

  return `
    <div class="chart-card">
      <div class="chart-card-title">${escapeHtml(title)}</div>
      ${renderDonut(segments)}
      <div class="chart-legend">${rows || '<div class="chart-legend-empty">No data</div>'}</div>
    </div>
  `;
}

function renderCharts() {
  const container = document.getElementById('crashCharts');
  if (!crashMetadata && !stackTraceData) { container.innerHTML = ''; return; }

  const appVersionSeg = singleValueSegment(nativeAppInfo && nativeAppInfo.appVersion);
  const osSeg     = singleValueSegment((crashMetadata && crashMetadata.osVersion) || (crashMetadata && crashMetadata.platform));
  const deviceSeg = singleValueSegment((crashMetadata && crashMetadata.deviceType) || (nativeAppInfo && nativeAppInfo.deviceModel));
  const pageSeg   = computePageBreakdown();

  container.innerHTML = [
    renderChartCard('App Version', appVersionSeg),
    renderChartCard('OS Version', osSeg),
    renderChartCard('Device Type', deviceSeg),
    renderChartCard('Top Pages', pageSeg),
  ].join('');
}

// most recently visited screen (ui.lifecycle className) — used as "Page Name"
// in the crash log row, same source as the Top Pages chart
function getLastPageName() {
  const pages = allBreadcrumbs.filter(bc => bc.type === 'ui.lifecycle' && bc.className);
  if (!pages.length) return '—';
  return pages.reduce((a, b) => (b.timestamp > a.timestamp ? b : a)).className;
}

// ── Crash Log Table (mirrors the portal's crash session grid) ──────────────
// one row per parsed payload — every column comes straight from the payload,
// nothing invented (Traffic Segment / Content Groups / Onload aren't in a
// single crash JSON, so they're left out rather than faked)
// "Report" opens a focused modal with just the Event Timeline (Breadcrumbs
// side) or just the Threads list (Diagnostic side) — reparents the real,
// live elements in/out rather than duplicating them, so it's always in sync
// with whatever's currently rendered, no separate render path to maintain.
function openReportModal() {
  document.getElementById('modalTimelineSlot').appendChild(document.getElementById('breadcrumbGroup'));
  document.getElementById('modalThreadsSlot').appendChild(document.getElementById('threadsWrap'));
  setModalView(currentView === 'stacktrace' ? 'stacktrace' : 'breadcrumb');
  document.getElementById('reportModal').style.display = 'flex';
}

function closeReportModal() {
  const home = document.getElementById('modalContentHome');
  home.appendChild(document.getElementById('breadcrumbGroup'));
  home.appendChild(document.getElementById('threadsWrap'));
  document.getElementById('reportModal').style.display = 'none';
}

function setModalView(view) {
  currentView = view; // remembered so reopening the modal lands on the last tab used
  document.querySelectorAll('#modalViewSwitch .view-tab').forEach(t =>
    t.classList.toggle('active', t.id === (view === 'breadcrumb' ? 'modalTabBreadcrumb' : 'modalTabStacktrace'))
  );
  document.getElementById('modalTimelineSlot').style.display = view === 'breadcrumb' ? '' : 'none';
  document.getElementById('modalThreadsSlot').style.display  = view === 'stacktrace' ? '' : 'none';
  document.getElementById('modalDownloadBtn').textContent =
    view === 'breadcrumb' ? '⬇ Download Breadcrumb Report' : '⬇ Download Diagnostic Report';
}

function renderCrashLog() {
  const body = document.getElementById('crashLogBody');
  const pagerInfo = document.getElementById('crashLogPagerInfo');

  if (!crashEvent) {
    body.innerHTML = `<tr><td class="crash-log-empty" colspan="6">No crash data</td></tr>`;
    if (pagerInfo) pagerInfo.textContent = '0 to 0 (0)';
    return;
  }

  const errorTime  = formatFullDateTime(crashEvent.time);
  const session    = crashEvent.session != null ? escapeHtml(crashEvent.session) : '—';
  const pageName   = escapeHtml(getLastPageName());
  const trafficSegment = 'ScreenTracker';
  const errorCount = crashEvent.errorCount != null ? crashEvent.errorCount : 1;

  body.innerHTML = `
    <tr>
      <td>${escapeHtml(errorTime)}</td>
      <td>${session}</td>
      <td><button class="crash-log-view-link" onclick="openReportModal()">Report</button></td>
      <td>${pageName}</td>
      <td>${trafficSegment}</td>
      <td>${errorCount}</td>
    </tr>
  `;

  if (pagerInfo) pagerInfo.textContent = '1 to 1 (1)';
}

function renderFrameRow(frame) {
  const { binary, address, symbol } = parseFrameLine(frame.fLine);

  // no binary/address to show (Android/RN-style frames) — skip those columns
  // instead of leaving them empty, which would leave a big gap before the symbol
  if (!binary && !address) {
    return `
      <div class="frame-row frame-row-compact">
        <span class="frame-index">${frame.i}</span>
        <span class="frame-symbol">${escapeHtml(symbol)}</span>
      </div>
    `;
  }

  return `
    <div class="frame-row">
      <span class="frame-index">${frame.i}</span>
      <span class="frame-binary">${escapeHtml(binary)}</span>
      <span class="frame-address">${escapeHtml(address)}</span>
      <span class="frame-symbol">${escapeHtml(symbol)}</span>
    </div>
  `;
}

// same thread/frame data as the "Cell View" cards below, laid out as plain text
function buildThreadsText() {
  const threads = stackTraceData && stackTraceData.threads ? stackTraceData.threads : [];
  return threads.map(thread => {
    const label  = threadLabel(thread);
    const header = thread.crashed ? `Thread ${thread.id} Crashed${label}` : `Thread ${thread.id}${label}`;
    return `${header}\n${formatFrames(thread.stack || [])}`;
  }).join('\n\n');
}

function setThreadViewMode(mode) {
  threadViewMode = mode;
  applyThreadViewMode();
}

function applyThreadViewMode() {
  const isCell = threadViewMode === 'cell';
  document.getElementById('threadsList').style.display     = isCell ? '' : 'none';
  document.getElementById('threadsTextView').style.display = isCell ? 'none' : '';
  document.getElementById('threadViewBtnCell').classList.toggle('active', isCell);
  document.getElementById('threadViewBtnText').classList.toggle('active', !isCell);
}

function renderThreads() {
  const container = document.getElementById('threadsList');
  const wrap      = document.getElementById('threadsWrap');
  container.innerHTML = '';

  const threads = stackTraceData && stackTraceData.threads ? stackTraceData.threads : [];
  wrap.style.display = threads.length ? '' : 'none';
  document.getElementById('stackViewToggle').style.display = threads.length ? '' : 'none';
  document.getElementById('threadsTextView').textContent   = buildThreadsText();
  document.getElementById('threadCount').textContent = threads.length ? `${threads.length} threads` : '';

  threads.forEach(thread => {
    const isCrashed  = !!thread.crashed;
    const frames     = thread.stack || [];
    const threadName = thread.name || `Thread ${thread.id}`;

    const card = document.createElement('div');
    card.className = `thread-card ${isCrashed ? 'is-crashed' : ''}`;

    const header = document.createElement('div');
    header.className = 'thread-header';
    header.innerHTML = `
      <span class="thread-toggle">${isCrashed ? '▾' : '▸'}</span>
      <span class="thread-name">${isCrashed ? 'Crashed: ' : ''}${escapeHtml(threadName)}</span>
      <span class="thread-frame-count">${frames.length} frame${frames.length === 1 ? '' : 's'}</span>
    `;

    const framesEl = document.createElement('div');
    framesEl.className = 'thread-frames';
    if (!isCrashed) framesEl.classList.add('collapsed');

    framesEl.innerHTML = frames.length
      ? frames.map(renderFrameRow).join('')
      : `<div class="frame-empty">No captured frames</div>`;

    header.addEventListener('click', () => {
      framesEl.classList.toggle('collapsed');
      header.querySelector('.thread-toggle').textContent =
        framesEl.classList.contains('collapsed') ? '▸' : '▾';
    });

    card.appendChild(header);
    card.appendChild(framesEl);
    container.appendChild(card);
  });

  applyThreadViewMode();
}

// ── Filter Application ────────────────────────────────────────────────────────
function applyFilters() {
  const items = document.querySelectorAll('.bc-item');
  let visible = 0;

  items.forEach(item => {
    const type = item.dataset.type;
    // crash card has no type — always visible
    if (!type || activeFilters.has(type)) {
      item.classList.remove('filtered-out');
      visible++;
    } else {
      item.classList.add('filtered-out');
    }
  });

  const total = allBreadcrumbs.length;
  document.getElementById('resultCount').textContent = `${visible} / ${total} events`;

  document.getElementById('emptyState').classList.toggle('visible', visible === 0);
}

// ── Main Entry ────────────────────────────────────────────────────────────────
function parseAndRender() {
  const raw   = document.getElementById('jsonInput').value.trim();
  const errEl = document.getElementById('errorMsg');

  if (!raw) { showError('Please paste a JSON payload first.'); return; }

  try {
    const { breadcrumbs, crash, stackTrace, metadata, sdkId, nativeAppInfo: nativeInfo } = parsePayload(raw);
    errEl.classList.remove('visible');

    const hasBreadcrumbs = breadcrumbs && breadcrumbs.length > 0;
    const hasStackTrace  = !!(stackTrace && stackTrace.threads && stackTrace.threads.length);
    const hasMetadata    = !!metadata;

    if (!hasBreadcrumbs && !hasStackTrace && !hasMetadata) {
      showError('No breadcrumbs or stack trace found in payload.');
      return;
    }

    allBreadcrumbs = breadcrumbs;
    crashEvent     = crash;
    stackTraceData = stackTrace;
    crashMetadata  = metadata;
    currentSdkId   = sdkId;
    nativeAppInfo  = nativeInfo;
    renderPlatformBadge();

    document.getElementById('filterToolbar').classList.add('visible');

    // crash summary / info panel / charts / crash log — one unified view,
    // shown whenever there's a crash event or metadata, independent of
    // whether breadcrumbs or a full stack trace are also present
    renderStackTrace();

    if (hasBreadcrumbs) {
      activeFilters = new Set(breadcrumbs.map(b => b.type));
      renderFilterChips();
      renderTimeline();

      document.getElementById('controls').classList.add('visible');
      document.getElementById('timelineWrap').classList.add('visible');
    } else {
      document.getElementById('controls').classList.remove('visible');
      document.getElementById('timelineWrap').classList.remove('visible');
    }

  } catch (e) {
    showError('Invalid JSON: ' + e.message);
  }
}

function clearAll() {
  document.getElementById('jsonInput').value = '';
  document.getElementById('errorMsg').classList.remove('visible');
  document.getElementById('controls').classList.remove('visible');
  document.getElementById('timelineWrap').classList.remove('visible');
  document.getElementById('timeline').innerHTML = '';
  document.getElementById('filterToolbar').classList.remove('visible');
  document.getElementById('crashSummary').innerHTML = '';
  document.getElementById('metaGrid').innerHTML = '';
  document.getElementById('crashCharts').innerHTML = '';
  document.getElementById('crashDrilldownGrid').style.display = 'none';
  document.getElementById('crashLogBody').innerHTML = '';
  document.getElementById('crashLogWrap').style.display = 'none';
  document.getElementById('threadsList').innerHTML = '';
  document.getElementById('threadCount').textContent = '';
  allBreadcrumbs = [];
  crashEvent     = null;
  stackTraceData = null;
  crashMetadata  = null;
  currentSdkId   = null;
  nativeAppInfo  = null;
  renderPlatformBadge();
}

// ── Keyboard Shortcut: Cmd/Ctrl + Enter ──────────────────────────────────────
document.getElementById('jsonInput').addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) parseAndRender();
});

// ── Example Payload Loader ───────────────────────────────────────────────────
function loadExample() {
  document.getElementById('jsonInput').value = JSON.stringify(DEFAULT_PAYLOAD, null, 2);
  parseAndRender();
}

// show the example on first load so the format is visible with no payload of your own
loadExample();

// filter toolbar defaults — today's date instead of a blank picker
document.getElementById('filterDate').valueAsDate = new Date();
