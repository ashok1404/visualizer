// ── Type Configuration ───────────────────────────────────────────────────────
const TYPE_CONFIG = {
  'ui.lifecycle':   { label: 'UI Lifecycle',  chipClass: 'chip-lifecycle', dot: '#8b5cf6', badge: '#8b5cf620', badgeBorder: '#8b5cf640' },
  'network.request':{ label: 'Network',       chipClass: 'chip-network',   dot: '#10b981', badge: '#10b98120', badgeBorder: '#10b98140' },
  'user.event':     { label: 'User Event',    chipClass: 'chip-user',      dot: '#f59e0b', badge: '#f59e0b20', badgeBorder: '#f59e0b40' },
  'app.lifecycle':  { label: 'App Lifecycle', chipClass: 'chip-app',       dot: '#06b6d4', badge: '#06b6d420', badgeBorder: '#06b6d440' },
  'app.launch':     { label: 'App Launch',    chipClass: 'chip-app',       dot: '#06b6d4', badge: '#06b6d420', badgeBorder: '#06b6d440' },
  'app.install':    { label: 'App Install',   chipClass: 'chip-app',       dot: '#06b6d4', badge: '#06b6d420', badgeBorder: '#06b6d440' },
  'network.state':  { label: 'Network State', chipClass: 'chip-state',     dot: '#ec4899', badge: '#ec489920', badgeBorder: '#ec489940' },
  'system.event':  { label: 'System Event', chipClass: 'chip-state',     dot: '#9f48ec', badge: '#9f48ec20', badgeBorder: '#9f48ec40' },
};

function getConfig(type) {
  return TYPE_CONFIG[type] || {
    label: type,
    chipClass: 'chip-nav',
    dot: '#4f8ef7',
    badge: '#4f8ef720',
    badgeBorder: '#4f8ef740',
  };
}

// ── App State ────────────────────────────────────────────────────────────────
// ── Example Payload (shown on first load, and via "Load Example") ───────────
const DEFAULT_PAYLOAD = [{"col":1,"time":1788952320000,"eCnt":1,"VER":"3.15.14","NATIVEAPP":{"eIdentifier":"Example-UIKit                  0x0000000104d09aa0 Example-UIKit + 55968","appVersion":"1.1","breadcrumbs":"[{\"timestamp\":1788870058442,\"type\":\"network.state\",\"state\":\"cellular 4g\"},{\"state\":\"cellular 5g\",\"type\":\"network.state\",\"timestamp\":1788870478646},{\"event\":\"unknown\",\"timestamp\":1788870680507,\"eventType\":\"orientation\",\"type\":\"system.event\"},{\"timestamp\":1788870681203,\"event\":\"portrait\",\"eventType\":\"orientation\",\"type\":\"system.event\"},{\"type\":\"app.lifecycle\",\"event\":\"didEnterBackground\",\"timestamp\":1788870682660},{\"type\":\"system.event\",\"eventType\":\"orientation\",\"event\":\"unknown\",\"timestamp\":1788871200253},{\"type\":\"app.lifecycle\",\"timestamp\":1788871200254,\"event\":\"willEnterForeground\"},{\"timestamp\":1788871200269,\"type\":\"network.state\",\"state\":\"cellular 4g\"},{\"event\":\"didBecomeActive\",\"type\":\"app.lifecycle\",\"timestamp\":1788871200540},{\"event\":\"didEnterBackground\",\"timestamp\":1788871206378,\"type\":\"app.lifecycle\"},{\"type\":\"ui.lifecycle\",\"event\":\"viewDidDisappear\",\"timestamp\":1788871206393,\"className\":\"RootViewController\"},{\"event\":\"willTerminate\",\"timestamp\":1788871206401,\"type\":\"app.lifecycle\"},{\"type\":\"app.lifecycle\",\"timestamp\":1788874305227,\"event\":\"didFinishLaunch\"},{\"type\":\"system.event\",\"timestamp\":1788874305228,\"eventType\":\"orientation\",\"event\":\"unknown\"},{\"event\":\"unknown\",\"timestamp\":1788874305248,\"eventType\":\"orientation\",\"type\":\"system.event\"},{\"type\":\"app.lifecycle\",\"timestamp\":1788874305248,\"event\":\"willEnterForeground\"},{\"event\":\"viewDidLoad\",\"timestamp\":1788874305250,\"className\":\"RootViewController\",\"type\":\"ui.lifecycle\"},{\"event\":\"viewWillAppear\",\"className\":\"RootViewController\",\"timestamp\":1788874305254,\"type\":\"ui.lifecycle\"},{\"timestamp\":1788874305264,\"event\":\"didBecomeActive\",\"type\":\"app.lifecycle\"},{\"className\":\"RootViewController\",\"event\":\"viewDidAppear\",\"type\":\"ui.lifecycle\",\"timestamp\":1788874305266},{\"type\":\"system.event\",\"eventType\":\"orientation\",\"event\":\"portrait\",\"timestamp\":1788874758178},{\"type\":\"system.event\",\"timestamp\":1788874759027,\"eventType\":\"orientation\",\"event\":\"unknown\"},{\"event\":\"portrait\",\"eventType\":\"orientation\",\"type\":\"system.event\",\"timestamp\":1788874759547},{\"eventType\":\"orientation\",\"event\":\"unknown\",\"timestamp\":1788874760958,\"type\":\"system.event\"},{\"timestamp\":1788874762406,\"event\":\"portrait\",\"eventType\":\"orientation\",\"type\":\"system.event\"},{\"eventType\":\"orientation\",\"timestamp\":1788874762891,\"type\":\"system.event\",\"event\":\"unknown\"},{\"event\":\"portrait\",\"eventType\":\"orientation\",\"timestamp\":1788874764179,\"type\":\"system.event\"},{\"type\":\"system.event\",\"eventType\":\"orientation\",\"timestamp\":1788874764422,\"event\":\"unknown\"},{\"eventType\":\"orientation\",\"type\":\"system.event\",\"event\":\"portrait\",\"timestamp\":1788874766194},{\"event\":\"unknown\",\"type\":\"system.event\",\"eventType\":\"orientation\",\"timestamp\":1788874766227},{\"type\":\"system.event\",\"timestamp\":1788874767900,\"event\":\"landscape\",\"eventType\":\"orientation\"},{\"eventType\":\"orientation\",\"timestamp\":1788874810392,\"event\":\"portrait\",\"type\":\"system.event\"},{\"type\":\"system.event\",\"timestamp\":1788874811098,\"eventType\":\"orientation\",\"event\":\"unknown\"},{\"event\":\"portrait\",\"timestamp\":1788874815085,\"type\":\"system.event\",\"eventType\":\"orientation\"},{\"type\":\"network.state\",\"state\":\"cellular 5g\",\"timestamp\":1788874827188},{\"timestamp\":1788874830244,\"type\":\"network.state\",\"state\":\"wifi\"},{\"type\":\"network.state\",\"state\":\"cellular 4g\",\"timestamp\":1788874831257},{\"eventType\":\"orientation\",\"type\":\"system.event\",\"timestamp\":1788875089635,\"event\":\"unknown\"},{\"timestamp\":1788875097844,\"type\":\"network.state\",\"state\":\"cellular 5g\"},{\"timestamp\":1788875098062,\"state\":\"wifi\",\"type\":\"network.state\"},{\"timestamp\":1788875658756,\"type\":\"network.state\",\"state\":\"cellular 5g\"},{\"type\":\"network.state\",\"timestamp\":1788875659521,\"state\":\"wifi\"},{\"type\":\"system.event\",\"timestamp\":1788875679442,\"event\":\"portrait\",\"eventType\":\"orientation\"},{\"eventType\":\"orientation\",\"event\":\"landscape\",\"type\":\"system.event\",\"timestamp\":1788875768505},{\"timestamp\":1788875772278,\"event\":\"unknown\",\"type\":\"system.event\",\"eventType\":\"orientation\"},{\"event\":\"portrait\",\"eventType\":\"orientation\",\"timestamp\":1788875778576,\"type\":\"system.event\"},{\"type\":\"system.event\",\"eventType\":\"orientation\",\"event\":\"unknown\",\"timestamp\":1788875779204},{\"event\":\"didEnterBackground\",\"type\":\"app.lifecycle\",\"timestamp\":1788875780312},{\"timestamp\":1788939239525,\"type\":\"app.lifecycle\",\"event\":\"didFinishLaunch\"},{\"timestamp\":1788939239525,\"type\":\"system.event\",\"event\":\"unknown\",\"eventType\":\"orientation\"},{\"eventType\":\"orientation\",\"event\":\"unknown\",\"timestamp\":1788939239590,\"type\":\"system.event\"},{\"timestamp\":1788939239590,\"event\":\"willEnterForeground\",\"type\":\"app.lifecycle\"},{\"event\":\"viewDidLoad\",\"className\":\"RootViewController\",\"timestamp\":1788939239593,\"type\":\"ui.lifecycle\"},{\"event\":\"viewWillAppear\",\"className\":\"RootViewController\",\"type\":\"ui.lifecycle\",\"timestamp\":1788939239602},{\"timestamp\":1788939239617,\"type\":\"app.lifecycle\",\"event\":\"didBecomeActive\"},{\"className\":\"RootViewController\",\"event\":\"viewDidAppear\",\"type\":\"ui.lifecycle\",\"timestamp\":1788939239621},{\"timestamp\":1788939257665,\"state\":\"cellular 5g\",\"type\":\"network.state\"},{\"type\":\"network.state\",\"timestamp\":1788939309500,\"state\":\"cellular 4g\"},{\"type\":\"app.lifecycle\",\"event\":\"didEnterBackground\",\"timestamp\":1788939473177},{\"timestamp\":1788940795933,\"type\":\"app.lifecycle\",\"event\":\"didFinishLaunch\"},{\"type\":\"system.event\",\"event\":\"unknown\",\"timestamp\":1788940795933,\"eventType\":\"orientation\"},{\"eventType\":\"orientation\",\"type\":\"system.event\",\"timestamp\":1788940795958,\"event\":\"unknown\"},{\"timestamp\":1788940795958,\"type\":\"app.lifecycle\",\"event\":\"willEnterForeground\"},{\"className\":\"RootViewController\",\"event\":\"viewDidLoad\",\"timestamp\":1788940795961,\"type\":\"ui.lifecycle\"},{\"className\":\"RootViewController\",\"event\":\"viewWillAppear\",\"timestamp\":1788940795966,\"type\":\"ui.lifecycle\"},{\"className\":\"RootViewController\",\"timestamp\":1788940795976,\"type\":\"ui.lifecycle\",\"event\":\"viewDidAppear\"},{\"timestamp\":1788940796213,\"type\":\"app.lifecycle\",\"event\":\"didBecomeActive\"},{\"type\":\"app.lifecycle\",\"event\":\"didEnterBackground\",\"timestamp\":1788940872993},{\"type\":\"app.lifecycle\",\"event\":\"didFinishLaunch\",\"timestamp\":1788942013683},{\"event\":\"unknown\",\"type\":\"system.event\",\"eventType\":\"orientation\",\"timestamp\":1788942013683},{\"event\":\"unknown\",\"eventType\":\"orientation\",\"timestamp\":1788942013753,\"type\":\"system.event\"},{\"type\":\"app.lifecycle\",\"timestamp\":1788942013753,\"event\":\"willEnterForeground\"},{\"type\":\"ui.lifecycle\",\"event\":\"viewDidLoad\",\"timestamp\":1788942013756,\"className\":\"RootViewController\"},{\"type\":\"ui.lifecycle\",\"event\":\"viewWillAppear\",\"timestamp\":1788942013763,\"className\":\"RootViewController\"},{\"type\":\"app.lifecycle\",\"event\":\"didBecomeActive\",\"timestamp\":1788942013814},{\"timestamp\":1788942013818,\"event\":\"viewDidAppear\",\"className\":\"RootViewController\",\"type\":\"ui.lifecycle\"},{\"type\":\"app.lifecycle\",\"event\":\"didEnterBackground\",\"timestamp\":1788942020185},{\"type\":\"app.lifecycle\",\"event\":\"didFinishLaunch\",\"timestamp\":1788942556785},{\"eventType\":\"orientation\",\"event\":\"unknown\",\"type\":\"system.event\",\"timestamp\":1788942556785},{\"timestamp\":1788942556806,\"event\":\"unknown\",\"eventType\":\"orientation\",\"type\":\"system.event\"},{\"event\":\"willEnterForeground\",\"type\":\"app.lifecycle\",\"timestamp\":1788942556806},{\"timestamp\":1788942556809,\"className\":\"RootViewController\",\"event\":\"viewDidLoad\",\"type\":\"ui.lifecycle\"},{\"timestamp\":1788942556812,\"type\":\"ui.lifecycle\",\"className\":\"RootViewController\",\"event\":\"viewWillAppear\"},{\"type\":\"ui.lifecycle\",\"event\":\"viewDidAppear\",\"timestamp\":1788942556821,\"className\":\"RootViewController\"},{\"timestamp\":1788942556907,\"type\":\"app.lifecycle\",\"event\":\"didBecomeActive\"},{\"type\":\"network.state\",\"state\":\"cellular 4g\",\"timestamp\":1788942712246},{\"state\":\"cellular 5g\",\"type\":\"network.state\",\"timestamp\":1788942936540},{\"type\":\"network.state\",\"timestamp\":1788942936640,\"state\":\"offline\"},{\"state\":\"cellular 5g\",\"timestamp\":1788942940984,\"type\":\"network.state\"},{\"timestamp\":1788943001623,\"type\":\"network.state\",\"state\":\"offline\"},{\"state\":\"cellular 5g\",\"timestamp\":1788943002684,\"type\":\"network.state\"},{\"event\":\"didEnterBackground\",\"type\":\"app.lifecycle\",\"timestamp\":1788943008061},{\"type\":\"network.state\",\"state\":\"cellular 4g\",\"timestamp\":1788943047947},{\"timestamp\":1788943059522,\"eventType\":\"orientation\",\"type\":\"system.event\",\"event\":\"landscape\"},{\"type\":\"app.lifecycle\",\"event\":\"willEnterForeground\",\"timestamp\":1788943059523},{\"event\":\"unknown\",\"eventType\":\"orientation\",\"type\":\"system.event\",\"timestamp\":1788943059830},{\"type\":\"app.lifecycle\",\"event\":\"didBecomeActive\",\"timestamp\":1788943060274},{\"type\":\"network.state\",\"timestamp\":1788943060643,\"state\":\"offline\"},{\"type\":\"network.state\",\"state\":\"cellular 5g\",\"timestamp\":1788943060861},{\"eventType\":\"orientation\",\"event\":\"portrait\",\"timestamp\":1788943061284,\"type\":\"system.event\"},{\"timestamp\":1788943062007,\"type\":\"system.event\",\"eventType\":\"orientation\",\"event\":\"unknown\"},{\"timestamp\":1788943069921,\"type\":\"app.lifecycle\",\"event\":\"didEnterBackground\"},{\"timestamp\":1788943423257,\"event\":\"didFinishLaunch\",\"type\":\"app.lifecycle\"},{\"event\":\"unknown\",\"timestamp\":1788943423257,\"eventType\":\"orientation\",\"type\":\"system.event\"},{\"event\":\"unknown\",\"type\":\"system.event\",\"timestamp\":1788943423314,\"eventType\":\"orientation\"},{\"timestamp\":1788943423314,\"event\":\"willEnterForeground\",\"type\":\"app.lifecycle\"},{\"event\":\"viewDidLoad\",\"timestamp\":1788943423317,\"className\":\"RootViewController\",\"type\":\"ui.lifecycle\"},{\"className\":\"RootViewController\",\"timestamp\":1788943423323,\"type\":\"ui.lifecycle\",\"event\":\"viewWillAppear\"},{\"className\":\"RootViewController\",\"timestamp\":1788943423354,\"type\":\"ui.lifecycle\",\"event\":\"viewDidAppear\"},{\"timestamp\":1788943423372,\"type\":\"app.lifecycle\",\"event\":\"didBecomeActive\"},{\"timestamp\":1788943441361,\"type\":\"network.state\",\"state\":\"cellular 5g\"},{\"timestamp\":1788943473525,\"type\":\"app.lifecycle\",\"event\":\"didEnterBackground\"},{\"type\":\"app.lifecycle\",\"event\":\"didFinishLaunch\",\"timestamp\":1788945242227},{\"event\":\"unknown\",\"eventType\":\"orientation\",\"timestamp\":1788945242227,\"type\":\"system.event\"},{\"eventType\":\"orientation\",\"type\":\"system.event\",\"timestamp\":1788945242267,\"event\":\"unknown\"},{\"timestamp\":1788945242267,\"type\":\"app.lifecycle\",\"event\":\"willEnterForeground\"},{\"className\":\"RootViewController\",\"type\":\"ui.lifecycle\",\"timestamp\":1788945242270,\"event\":\"viewDidLoad\"},{\"type\":\"ui.lifecycle\",\"timestamp\":1788945242275,\"event\":\"viewWillAppear\",\"className\":\"RootViewController\"},{\"type\":\"app.lifecycle\",\"event\":\"didBecomeActive\",\"timestamp\":1788945242293},{\"timestamp\":1788945242294,\"type\":\"ui.lifecycle\",\"className\":\"RootViewController\",\"event\":\"viewDidAppear\"},{\"action\":\"tap\",\"type\":\"user.event\",\"y\":\"216.33333\",\"timestamp\":1788945251229,\"x\":\"264.0\",\"targetId\":\"tap:Network  ->\",\"targetClass\":\"UIButton\"},{\"type\":\"ui.lifecycle\",\"event\":\"viewDidLoad\",\"className\":\"NetworkTrackingViewController\",\"timestamp\":1788945251315},{\"timestamp\":1788945251321,\"event\":\"viewWillAppear\",\"className\":\"NetworkTrackingViewController\",\"type\":\"ui.lifecycle\"},{\"timestamp\":1788945251890,\"event\":\"viewDidDisappear\",\"className\":\"RootViewController\",\"type\":\"ui.lifecycle\"},{\"className\":\"NetworkTrackingViewController\",\"timestamp\":1788945251890,\"type\":\"ui.lifecycle\",\"event\":\"viewDidAppear\"},{\"timestamp\":1788945252377,\"type\":\"ui.lifecycle\",\"event\":\"viewWillAppear\",\"className\":\"RootViewController\"},{\"timestamp\":1788945252874,\"type\":\"ui.lifecycle\",\"event\":\"viewDidDisappear\",\"className\":\"NetworkTrackingViewController\"},{\"event\":\"viewDidAppear\",\"type\":\"ui.lifecycle\",\"timestamp\":1788945252874,\"className\":\"RootViewController\"},{\"y\":\"609.0\",\"timestamp\":1788945258041,\"targetId\":\"tap:Auto Screen Tracking   ->\",\"targetClass\":\"UIButton\",\"action\":\"tap\",\"type\":\"user.event\",\"x\":\"290.66666\"},{\"event\":\"viewDidLoad\",\"timestamp\":1788945258254,\"type\":\"ui.lifecycle\",\"className\":\"HomeViewController\"},{\"timestamp\":1788945258254,\"type\":\"ui.lifecycle\",\"event\":\"viewWillAppear\",\"className\":\"HomeViewController\"},{\"timestamp\":1788945258791,\"type\":\"ui.lifecycle\",\"event\":\"viewDidDisappear\",\"className\":\"RootViewController\"},{\"type\":\"ui.lifecycle\",\"timestamp\":1788945258791,\"className\":\"HomeViewController\",\"event\":\"viewDidAppear\"},{\"timestamp\":1788945259402,\"event\":\"viewWillAppear\",\"className\":\"RootViewController\",\"type\":\"ui.lifecycle\"},{\"type\":\"ui.lifecycle\",\"className\":\"HomeViewController\",\"timestamp\":1788945259900,\"event\":\"viewDidDisappear\"},{\"className\":\"RootViewController\",\"event\":\"viewDidAppear\",\"timestamp\":1788945259900,\"type\":\"ui.lifecycle\"},{\"state\":\"cellular 5g\",\"timestamp\":1788945289992,\"type\":\"network.state\"},{\"event\":\"portrait\",\"eventType\":\"orientation\",\"timestamp\":1788945369672,\"type\":\"system.event\"},{\"eventType\":\"orientation\",\"timestamp\":1788945370596,\"type\":\"system.event\",\"event\":\"unknown\"},{\"event\":\"portrait\",\"type\":\"system.event\",\"eventType\":\"orientation\",\"timestamp\":1788945370836},{\"event\":\"didEnterBackground\",\"timestamp\":1788945372516,\"type\":\"app.lifecycle\"},{\"event\":\"didFinishLaunch\",\"timestamp\":1788952345248,\"type\":\"app.lifecycle\"},{\"eventType\":\"orientation\",\"type\":\"system.event\",\"timestamp\":1788952345248,\"event\":\"unknown\"},{\"timestamp\":1788952345329,\"event\":\"unknown\",\"type\":\"system.event\",\"eventType\":\"orientation\"},{\"timestamp\":1788952345329,\"type\":\"app.lifecycle\",\"event\":\"willEnterForeground\"},{\"type\":\"ui.lifecycle\",\"timestamp\":1788952345332,\"className\":\"RootViewController\",\"event\":\"viewDidLoad\"},{\"timestamp\":1788952345337,\"event\":\"viewWillAppear\",\"type\":\"ui.lifecycle\",\"className\":\"RootViewController\"},{\"event\":\"didBecomeActive\",\"timestamp\":1788952345372,\"type\":\"app.lifecycle\"},{\"timestamp\":1788952345375,\"event\":\"viewDidAppear\",\"className\":\"RootViewController\",\"type\":\"ui.lifecycle\"},{\"type\":\"user.event\",\"timestamp\":1788952347233,\"targetId\":\"tap:Error\",\"targetClass\":\"UIButton\",\"y\":\"268.66666\",\"action\":\"tap\",\"x\":\"231.33333\"}]","sdkVersion":"3.15.14","eMeta":"[title: \"Example-UIKit                  0x0000000104d09aa0 Example-UIKit + 55968\", signal: 11, exceptionCode: 1, exceptionType: 1, appVersion: \"1.1\", appBuildVersion: \"1\", osVersion: \"iPhone OS 26.6 (23G71)\", deviceType: \"iPhone13,2\", platformArchitecture: \"arm64e\", regionFormat: \"IN\", isTestFlightApp: false, lowPowerModeEnabled: false]","netStateSource":"CTRadioAccessTechnologyLTE","stackTrace":"{\"meta\":{\"fVersion\":\"1.0.0\"},\"threads\":[{\"id\":\"0\",\"crashed\":true,\"name\":\"Main Thread\",\"stack\":[{\"bId\":\"0BA28CE2-8718-3CB3-BEF4-6DD44464EBE2\",\"i\":0,\"fLine\":\"dyld                           0x00000001852d9c1c dyld + 19484\"},{\"bId\":\"EA45E776-FF58-35AC-BB12-03F41CD3A579\",\"i\":1,\"fLine\":\"Example-UIKit                  0x0000000104d09aa0 Example-UIKit + 55968\"},{\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"i\":2,\"fLine\":\"UIKitCore                      0x000000018e578aa4 UIKitCore + 2722468\"},{\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"i\":3,\"fLine\":\"UIKitCore                      0x000000018e36c158 UIKitCore + 573784\"},{\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"i\":4,\"fLine\":\"UIKitCore                      0x000000018e401670 UIKitCore + 1185392\"},{\"bId\":\"7915658C-7728-3149-A524-2164C163F3D2\",\"i\":5,\"fLine\":\"GraphicsServices               0x000000022e699498 GraphicsServices + 5272\"},{\"bId\":\"5565CAD9-4941-32AC-8B10-7D3233C74151\",\"i\":6,\"fLine\":\"CoreFoundation                 0x00000001886cd54c CoreFoundation + 189772\"},{\"bId\":\"5565CAD9-4941-32AC-8B10-7D3233C74151\",\"i\":7,\"fLine\":\"CoreFoundation                 0x00000001886ce6e4 CoreFoundation + 194276\"},{\"bId\":\"5565CAD9-4941-32AC-8B10-7D3233C74151\",\"i\":8,\"fLine\":\"CoreFoundation                 0x000000018870374c CoreFoundation + 411468\"},{\"bId\":\"5565CAD9-4941-32AC-8B10-7D3233C74151\",\"i\":9,\"fLine\":\"CoreFoundation                 0x0000000188703824 CoreFoundation + 411684\"},{\"bId\":\"5565CAD9-4941-32AC-8B10-7D3233C74151\",\"i\":10,\"fLine\":\"CoreFoundation                 0x00000001886c11d8 CoreFoundation + 139736\"},{\"bId\":\"A4C6D2FF-F6E8-3B4E-94A0-DA3F7350BC4A\",\"i\":11,\"fLine\":\"UpdateCycle                    0x000000029e3ca56c UpdateCycle + 5484\"},{\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"i\":12,\"fLine\":\"UIKitCore                      0x000000018e3d8c60 UIKitCore + 1018976\"},{\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"i\":13,\"fLine\":\"UIKitCore                      0x000000018e3db6d4 UIKitCore + 1029844\"},{\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"i\":14,\"fLine\":\"UIKitCore                      0x000000018e3c2188 UIKitCore + 926088\"},{\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"i\":15,\"fLine\":\"UIKitCore                      0x000000018e3d85b8 UIKitCore + 1017272\"},{\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"i\":16,\"fLine\":\"UIKitCore                      0x000000018e3bf480 UIKitCore + 914560\"},{\"bId\":\"EA45E776-FF58-35AC-BB12-03F41CD3A579\",\"i\":17,\"fLine\":\"Example-UIKit                  0x0000000104d672f8 Example-UIKit + 439032\"},{\"bId\":\"EA45E776-FF58-35AC-BB12-03F41CD3A579\",\"i\":18,\"fLine\":\"Example-UIKit                  0x0000000104d66efc Example-UIKit + 438012\"},{\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"i\":19,\"fLine\":\"UIKitCore                      0x000000018e3d2a68 UIKitCore + 993896\"},{\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"i\":20,\"fLine\":\"UIKitCore                      0x000000018e3be9a0 UIKitCore + 911776\"},{\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"i\":21,\"fLine\":\"UIKitCore                      0x000000018e3d9a64 UIKitCore + 1022564\"},{\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"i\":22,\"fLine\":\"UIKitCore                      0x000000018e9f6838 UIKitCore + 7432248\"},{\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"i\":23,\"fLine\":\"UIKitCore                      0x000000018e9f6358 UIKitCore + 7431000\"},{\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"i\":24,\"fLine\":\"UIKitCore                      0x000000018e901818 UIKitCore + 6428696\"},{\"fLine\":\"UIKitCore                      0x000000018e9f6358 UIKitCore + 7431000\",\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"i\":25},{\"fLine\":\"UIKitCore                      0x000000018e901784 UIKitCore + 6428548\",\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"i\":26},{\"fLine\":\"UIKitCore                      0x000000018f8354f8 UIKitCore + 22369528\",\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"i\":27},{\"fLine\":\"UIKitCore                      0x000000018e63ad30 UIKitCore + 3517744\",\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"i\":28},{\"fLine\":\"Example-UIKit                  0x0000000104d00de8 Example-UIKit + 19944\",\"bId\":\"EA45E776-FF58-35AC-BB12-03F41CD3A579\",\"i\":29},{\"fLine\":\"libswiftCore.dylib             0x000000018539e5ac libswiftCore.dylib + 34220\",\"bId\":\"D6EE5F00-12F2-3DA4-B35D-E50AD18BD17F\",\"i\":30},{\"fLine\":\"libswiftCore.dylib             0x000000018539d250 libswiftCore.dylib + 29264\",\"bId\":\"D6EE5F00-12F2-3DA4-B35D-E50AD18BD17F\",\"i\":31},{\"fLine\":\"libswiftCore.dylib             0x000000018539ea94 libswiftCore.dylib + 35476\",\"bId\":\"D6EE5F00-12F2-3DA4-B35D-E50AD18BD17F\",\"i\":32},{\"fLine\":\"libswiftCore.dylib             0x000000018539e038 libswiftCore.dylib + 32824\",\"bId\":\"D6EE5F00-12F2-3DA4-B35D-E50AD18BD17F\",\"i\":33},{\"fLine\":\"libswiftCore.dylib             0x00000001853a28fc libswiftCore.dylib + 51452\",\"bId\":\"D6EE5F00-12F2-3DA4-B35D-E50AD18BD17F\",\"i\":34}]},{\"crashed\":false,\"name\":\"Thread 1\",\"stack\":[],\"id\":\"1\"},{\"crashed\":false,\"name\":\"Thread 2\",\"stack\":[],\"id\":\"2\"},{\"crashed\":false,\"name\":\"Thread 3\",\"stack\":[],\"id\":\"3\"},{\"crashed\":false,\"name\":\"Thread 4\",\"stack\":[],\"id\":\"4\"},{\"crashed\":false,\"name\":\"Thread 5\",\"stack\":[],\"id\":\"5\"},{\"crashed\":false,\"name\":\"Thread 6\",\"stack\":[],\"id\":\"6\"},{\"crashed\":false,\"name\":\"Thread 7\",\"stack\":[],\"id\":\"7\"},{\"crashed\":false,\"name\":\"Thread 8\",\"stack\":[{\"bId\":\"46B95807-F752-3DC2-A1BA-6290E8D7FE38\",\"fLine\":\"libsystem_pthread.dylib        0x00000001e805e8cc libsystem_pthread.dylib + 2252\",\"i\":0},{\"bId\":\"46B95807-F752-3DC2-A1BA-6290E8D7FE38\",\"fLine\":\"libsystem_pthread.dylib        0x00000001e8062438 libsystem_pthread.dylib + 17464\",\"i\":1},{\"bId\":\"1689FEA5-1780-3EFE-8F31-933D4DB24EC4\",\"fLine\":\"Foundation                     0x00000001859be904 Foundation + 583940\",\"i\":2},{\"bId\":\"26334227-F558-3DA7-985D-326A0C894DD4\",\"fLine\":\"UIKitCore                      0x000000018e3c6eac UIKitCore + 945836\",\"i\":3},{\"bId\":\"1689FEA5-1780-3EFE-8F31-933D4DB24EC4\",\"fLine\":\"Foundation                     0x000000018593abd8 Foundation + 43992\",\"i\":4},{\"bId\":\"1689FEA5-1780-3EFE-8F31-933D4DB24EC4\",\"fLine\":\"Foundation                     0x000000018593acf0 Foundation + 44272\",\"i\":5},{\"bId\":\"5565CAD9-4941-32AC-8B10-7D3233C74151\",\"fLine\":\"CoreFoundation                 0x00000001886cd54c CoreFoundation + 189772\",\"i\":6},{\"bId\":\"5565CAD9-4941-32AC-8B10-7D3233C74151\",\"fLine\":\"CoreFoundation                 0x00000001886ce310 CoreFoundation + 193296\",\"i\":7},{\"bId\":\"5565CAD9-4941-32AC-8B10-7D3233C74151\",\"fLine\":\"CoreFoundation                 0x0000000188704344 CoreFoundation + 414532\",\"i\":8},{\"bId\":\"A11BF433-17AB-3F01-88BC-54C467CE6287\",\"fLine\":\"libsystem_kernel.dylib         0x0000000237d0c078 libsystem_kernel.dylib + 16504\",\"i\":9},{\"bId\":\"A11BF433-17AB-3F01-88BC-54C467CE6287\",\"fLine\":\"libsystem_kernel.dylib         0x0000000237d0c22c libsystem_kernel.dylib + 16940\",\"i\":10},{\"bId\":\"A11BF433-17AB-3F01-88BC-54C467CE6287\",\"fLine\":\"libsystem_kernel.dylib         0x0000000237d0c30c libsystem_kernel.dylib + 17164\",\"i\":11},{\"bId\":\"A11BF433-17AB-3F01-88BC-54C467CE6287\",\"fLine\":\"libsystem_kernel.dylib         0x0000000237d08cd4 libsystem_kernel.dylib + 3284\",\"i\":12}],\"id\":\"8\"},{\"crashed\":false,\"name\":\"Thread 9\",\"stack\":[{\"fLine\":\"libsystem_pthread.dylib        0x00000001e805e8cc libsystem_pthread.dylib + 2252\",\"i\":0,\"bId\":\"46B95807-F752-3DC2-A1BA-6290E8D7FE38\"},{\"fLine\":\"libsystem_pthread.dylib        0x00000001e8062438 libsystem_pthread.dylib + 17464\",\"i\":1,\"bId\":\"46B95807-F752-3DC2-A1BA-6290E8D7FE38\"},{\"fLine\":\"Foundation                     0x00000001859be904 Foundation + 583940\",\"i\":2,\"bId\":\"1689FEA5-1780-3EFE-8F31-933D4DB24EC4\"},{\"fLine\":\"CFNetwork                      0x000000019dbddb54 CFNetwork + 596820\",\"i\":3,\"bId\":\"207A7ECF-FBF3-3EF5-A9AA-86CC52845F97\"},{\"fLine\":\"CoreFoundation                 0x00000001886cd54c CoreFoundation + 189772\",\"i\":4,\"bId\":\"5565CAD9-4941-32AC-8B10-7D3233C74151\"},{\"fLine\":\"CoreFoundation                 0x00000001886ce310 CoreFoundation + 193296\",\"i\":5,\"bId\":\"5565CAD9-4941-32AC-8B10-7D3233C74151\"},{\"fLine\":\"CoreFoundation                 0x0000000188704344 CoreFoundation + 414532\",\"i\":6,\"bId\":\"5565CAD9-4941-32AC-8B10-7D3233C74151\"},{\"fLine\":\"libsystem_kernel.dylib         0x0000000237d0c078 libsystem_kernel.dylib + 16504\",\"i\":7,\"bId\":\"A11BF433-17AB-3F01-88BC-54C467CE6287\"},{\"fLine\":\"libsystem_kernel.dylib         0x0000000237d0c22c libsystem_kernel.dylib + 16940\",\"i\":8,\"bId\":\"A11BF433-17AB-3F01-88BC-54C467CE6287\"},{\"fLine\":\"libsystem_kernel.dylib         0x0000000237d0c30c libsystem_kernel.dylib + 17164\",\"i\":9,\"bId\":\"A11BF433-17AB-3F01-88BC-54C467CE6287\"},{\"fLine\":\"libsystem_kernel.dylib         0x0000000237d08cd4 libsystem_kernel.dylib + 3284\",\"i\":10,\"bId\":\"A11BF433-17AB-3F01-88BC-54C467CE6287\"}],\"id\":\"9\"}]}","netState":"cellular 5g","sdkId":"btt-swift-sdk","deviceModel":"iPhone13,2"},"eTp":"NativeAppCrash","msg":"App crashed with SIGSEGV, signo: 11, errno: 1, signal code: 1, identified through Matric Kit~~Example-UIKit                  0x0000000104d09aa0 Example-UIKit + 55968","line":1,"url":"Example-UIKit"}];

let allBreadcrumbs = [];

let activeFilters  = new Set();
let sortOrder      = 'asc';
let crashEvent     = null;
let stackTraceData = null;
let crashMetadata  = null;
let currentView    = 'breadcrumb';
let currentSdkId   = null;

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
  regionFormat: 'Region',
  isTestFlightApp: 'TestFlight',
  lowPowerModeEnabled: 'Low Power Mode',
  totalCPUTime: 'Total CPU Time',
  totalSampledTime: 'Sampled Time',
  writesCaused: 'Disk Writes',
  hangDuration: 'Hang Duration',
  launchDuration: 'Launch Duration',
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

function formatDelta(ms) {
  if (ms < 1000) return `+${ms}ms`;
  return `+${(ms / 1000).toFixed(1)}s`;
}

function formatDuration(ms) {
  if (ms < 1000) return ms + 'ms';
  if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
  const m = Math.floor(ms / 60000);
  const s = ((ms % 60000) / 1000).toFixed(0);
  return `${m}m ${s}s`;
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

// splits a symbolicated frame line into binary / address / symbol columns
function parseFrameLine(fLine) {
  const m = String(fLine || '').match(/^(\S+)\s+(0x[0-9a-fA-F]+)\s+(.+)$/);
  if (!m) return { binary: '', address: '', symbol: fLine || '' };
  return { binary: m[1], address: m[2], symbol: m[3] };
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

  // extract diagnostic event info — eTp decides the kind (crash, hang, slow
  // launch, excess CPU, heavy disk write, memory warning, ...); msg may be absent
  if (parsed.msg || parsed.eTp) {
    crash = {
      message: parsed.msg ? parsed.msg.split('~~')[0] : null,
      type:    parsed.eTp || 'Diagnostic Event',
      time:    parseInt(parsed.time, 10) || null,
    };
  }

  return { breadcrumbs: bcs, crash, stackTrace, metadata, sdkId };
}

// ── Error Display ─────────────────────────────────────────────────────────────
function showError(msg) {
  const el = document.getElementById('errorMsg');
  el.textContent = msg;
  el.classList.add('visible');
}

// ── Stats Rendering ───────────────────────────────────────────────────────────
function renderStats() {
  const bcs = allBreadcrumbs;

  document.getElementById('statTotal').textContent = bcs.length;

  const timestamps = bcs.map(b => b.timestamp).filter(Boolean);
  if (timestamps.length >= 2) {
    const dur = Math.max(...timestamps) - Math.min(...timestamps);
    document.getElementById('statDuration').textContent = formatDuration(dur);
  }

  const screens = new Set(
    bcs.filter(b => b.type === 'ui.lifecycle' && b.className).map(b => b.className)
  );
  document.getElementById('statScreens').textContent = screens.size;

  document.getElementById('statNetwork').textContent =
    bcs.filter(b => b.type === 'network.request').length;

  document.getElementById('statUser').textContent =
    bcs.filter(b => b.type === 'user.event').length;
}

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
            ${cfg.label}
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

  // append crash card as the final item
  if (crashEvent) {
    const crashEl = document.createElement('div');
    crashEl.className = 'bc-item is-crash';
    crashEl.style.animationDelay = `${Math.min(sorted.length * 12, 300)}ms`;
    crashEl.innerHTML = `
      <div class="bc-dot-wrap">
        <div class="bc-dot" style="background:#ef4444"></div>
      </div>
      <div class="bc-content"
        style="border-color:rgba(239,68,68,0.3);background:rgba(239,68,68,0.07)">
        <div class="bc-row">
          <span class="bc-badge"
            style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#ef4444">
            💥 CRASH
          </span>
          <span class="bc-main" style="color:#ef4444" title="${crashEvent.message}">
            ${crashEvent.message}
          </span>
          <div class="bc-meta">
            ${crashEvent.time
              ? `<span class="bc-time">${formatTime(crashEvent.time)}</span>`
              : ''}
          </div>
        </div>
        <div class="bc-detail" style="color:#ef4444aa">
          <span><strong style="color:#ef4444bb">type</strong> ${crashEvent.type}</span>
        </div>
      </div>
    `;
    container.appendChild(crashEl);
  }

  applyFilters();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

// ── View Switch ───────────────────────────────────────────────────────────────
function setView(view) {
  currentView = view;
  document.querySelectorAll('.view-tab').forEach(t => t.classList.toggle('active', t.dataset.view === view));
  document.getElementById('breadcrumbView').style.display = view === 'breadcrumb' ? '' : 'none';
  document.getElementById('stacktraceView').style.display = view === 'stacktrace' ? '' : 'none';
}

// ── Stack Trace Rendering (Crashlytics-style) ────────────────────────────────
function renderStackTrace() {
  renderCrashSummary();
  renderMetaGrid();
  renderThreads();
}

function renderCrashSummary() {
  const el = document.getElementById('crashSummary');
  if (!crashMetadata && !crashEvent) { el.innerHTML = ''; el.removeAttribute('style'); return; }

  const dtype       = getDiagnosticType(crashEvent && crashEvent.type);
  const isCrash      = dtype.key === 'crash';
  const signal        = crashMetadata ? crashMetadata.signal : null;
  const signalName    = signal != null ? (SIGNAL_NAMES[signal] || `Signal ${signal}`) : null;
  const reason         = (crashEvent && crashEvent.message) || (crashMetadata && crashMetadata.title) || dtype.label;
  const crashedThread  = stackTraceData && stackTraceData.threads
    ? stackTraceData.threads.find(t => t.crashed)
    : null;

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

  if (crashedThread) {
    tags.push(`<span class="tag">crashed on <strong>${escapeHtml(crashedThread.name || 'Thread ' + crashedThread.id)}</strong></span>`);
  }

  el.style.background  = `${dtype.color}14`;
  el.style.borderColor = `${dtype.color}4d`;

  el.innerHTML = `
    <div class="crash-summary-head">
      <span class="crash-summary-icon">${dtype.icon}</span>
      <span class="crash-summary-heading" style="color:${dtype.color}">${escapeHtml(heading)}</span>
    </div>
    ${reason ? `<div class="crash-summary-reason">${escapeHtml(reason)}</div>` : ''}
    <div class="crash-summary-tags">${tags.join('')}</div>
  `;
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

function renderMetaGrid() {
  const container = document.getElementById('metaGrid');
  container.innerHTML = '';
  if (!crashMetadata) return;

  const dtype = getDiagnosticType(crashEvent && crashEvent.type);
  const skip  = new Set(['title', ...dtype.fields]);

  Object.keys(crashMetadata).forEach(key => {
    if (skip.has(key)) return;
    let value = crashMetadata[key];
    if (typeof value === 'boolean') value = value ? 'Yes' : 'No';

    const card = document.createElement('div');
    card.className = 'meta-card';
    card.innerHTML = `
      <div class="meta-label">${escapeHtml(META_LABELS[key] || key)}</div>
      <div class="meta-value">${escapeHtml(value)}</div>
    `;
    container.appendChild(card);
  });
}

function renderFrameRow(frame) {
  const { binary, address, symbol } = parseFrameLine(frame.fLine);
  return `
    <div class="frame-row">
      <span class="frame-index">${frame.i}</span>
      <span class="frame-binary">${escapeHtml(binary)}</span>
      <span class="frame-address">${escapeHtml(address)}</span>
      <span class="frame-symbol">${escapeHtml(symbol)}</span>
    </div>
  `;
}

function renderThreads() {
  const container = document.getElementById('threadsList');
  const wrap      = document.getElementById('threadsWrap');
  container.innerHTML = '';

  const threads = stackTraceData && stackTraceData.threads ? stackTraceData.threads : [];
  wrap.style.display = threads.length ? '' : 'none';
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
    const { breadcrumbs, crash, stackTrace, metadata, sdkId } = parsePayload(raw);
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
    renderPlatformBadge();

    document.getElementById('tabBreadcrumb').style.display = hasBreadcrumbs ? '' : 'none';
    document.getElementById('tabStacktrace').style.display = (hasStackTrace || hasMetadata) ? '' : 'none';
    document.getElementById('viewSwitch').classList.add('visible');

    if (hasBreadcrumbs) {
      activeFilters = new Set(breadcrumbs.map(b => b.type));
      renderStats();
      renderFilterChips();
      renderTimeline();

      document.getElementById('controls').classList.add('visible');
      document.getElementById('statsRow').classList.add('visible');
      document.getElementById('timelineWrap').classList.add('visible');
    }

    if (hasStackTrace || hasMetadata) {
      renderStackTrace();
    }

    setView(hasBreadcrumbs ? 'breadcrumb' : 'stacktrace');

  } catch (e) {
    showError('Invalid JSON: ' + e.message);
  }
}

function clearAll() {
  document.getElementById('jsonInput').value = '';
  document.getElementById('errorMsg').classList.remove('visible');
  document.getElementById('controls').classList.remove('visible');
  document.getElementById('statsRow').classList.remove('visible');
  document.getElementById('timelineWrap').classList.remove('visible');
  document.getElementById('timeline').innerHTML = '';
  document.getElementById('viewSwitch').classList.remove('visible');
  document.getElementById('crashSummary').innerHTML = '';
  document.getElementById('metaGrid').innerHTML = '';
  document.getElementById('threadsList').innerHTML = '';
  document.getElementById('threadCount').textContent = '';
  allBreadcrumbs = [];
  crashEvent     = null;
  stackTraceData = null;
  crashMetadata  = null;
  currentSdkId   = null;
  renderPlatformBadge();
  setView('breadcrumb');
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
