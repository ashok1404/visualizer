# Error/Crash JSON Fields

## Shape (reference)

Here is an example `error.rcb` payload:

```json
{
  "msg": "App crashed with SIGSEGV, signo: 11, errno: 1, signal code: 1, identified through Matric Kit~~Example-UIKit  0x0000000104d09aa0 Example-UIKit + 55968",
  "eTp": "NativeAppCrash",
  "time": 1788952320000,
  "NATIVEAPP": {
    "sdkId": "btt-swift-sdk",
    "eMeta": "[title: \"Example-UIKit  0x0000000104d09aa0 Example-UIKit + 55968\", signal: 11, exceptionCode: 1, exceptionType: 1, appVersion: \"1.1\", appBuildVersion: \"1\", osVersion: \"iPhone OS 26.6 (23G71)\", deviceType: \"iPhone13,2\", platformArchitecture: \"arm64e\", regionFormat: \"IN\", isTestFlightApp: false, lowPowerModeEnabled: false]",
    "stackTrace": "{\"meta\":{\"fVersion\":\"1.0.0\"},\"threads\":[{\"id\":\"0\",\"crashed\":true,\"name\":\"Main Thread\",\"stack\":[{\"i\":0,\"fLine\":\"dyld  0x00000001852d9c1c dyld + 19484\"},{\"i\":1,\"fLine\":\"Example-UIKit  0x0000000104d09aa0 Example-UIKit + 55968\"}]}]}"
  }
}
```

`eMeta` and `stackTrace` arrive as **strings**, not nested objects — decode
each separately (see below).

---

## 1. `msg`

Used as the title shown in the **Error Explorer's Top Errors** table, in the
**Error Message** column. Keep the full message as-is.

---

## 2. `eTp`

Used in the **Error Explorer's Top Errors** table, in the **Error Type**
column.

| Value | Meaning |
|---|---|
| `NativeAppCrash` | Crash |
| `ANRWarning` | ANR warning |
| `FatalANR` | ANR, fatal |
| `MemoryWarning` | Memory warning |
| `ForceRestart` | Force restart |
| `ExcessCPUUsage` | Excess CPU usage |
| `HeavyDiskWrite` | Heavy disk write |
| `SlowLaunch` | Slow launch |

---

## 3. `eMeta`

Shown on the **Error Detail (Error Drilldown)** screen in Error Explorer —
which type of error, and which environment (app version, OS, device, etc).

Decode it (JSON string, or a Swift bracket-dump like `[title: "...", signal:
11, ...]`) to get:

```json
{
  "title": "SIGSEGV in Example-App + 0x18568",
  "signal": 11,
  "exceptionCode": 0,
  "exceptionType": 1,
  "totalCPUTime": "45 seconds",
  "totalSampledTime": "60 seconds",
  "writesCaused": "1,024 MB",
  "hangDuration": "1.2 seconds",
  "launchDuration": "3.5 seconds",
  "appVersion": "1.7.0",
  "appBuildVersion": "42",
  "osVersion": "iPhone OS 26.0.1 (23A355)",
  "deviceType": "iPhone14,5",
  "platformArchitecture": "arm64e",
  "regionFormat": "US",
  "isTestFlightApp": false,
  "lowPowerModeEnabled": false
}
```

| Field | When it appears |
|---|---|
| `title`, `signal`, `exceptionCode`, `exceptionType` | Crash |
| `hangDuration` | ANR |
| `launchDuration` | Slow launch |
| `totalCPUTime`, `totalSampledTime` | Excess CPU |
| `writesCaused` | Heavy disk write |
| everything else (`appVersion`, `appBuildVersion`, `osVersion`, `deviceType`, `platformArchitecture`, `regionFormat`, `isTestFlightApp`, `lowPowerModeEnabled`) | Environment info — always present |

---

## 4. `stackTrace`

Also shown on the **Error Detail (Error Drilldown)** screen — decode the
string (`JSON.parse`), then combine data thread-wise using `index + fLine`:

```json
{
  "meta": {
    "fVersion": "1.0.0"
  },
  "threads": [
    {
      "id": "1",
      "name": "Main Thread",
      "crashed": true,
      "stack": [
        {
          "i": 0,
          "bId": "A1B2C3D4-E5F6-4A3B-9C8D-1E2F3A4B5C6D",
          "fLine": "libsystem_pthread.dylib        0x00000001e805e8cc libsystem_pthread.dylib + 2252"
        }
      ]
    }
  ]
}
```

Pattern — one thread block per entry in `threads[]`, one line per frame:

```
Thread[] crashed = true → Crashed
  Thread[].stack[0].i   Thread[].stack[0].fLine
  Thread[].stack[1].i   Thread[].stack[1].fLine
  Thread[].stack[2].i   Thread[].stack[2].fLine

Thread[] (not crashed)
  Thread[].stack[0].i   Thread[].stack[0].fLine
  Thread[].stack[1].i   Thread[].stack[1].fLine
```

Filled in with real data:

```
Thread 0 Crashed: Main Thread
  0  dyld                           0x00000001852d9c1c  dyld + 19484
  1  Example-UIKit                  0x0000000104d09aa0  Example-UIKit + 55968
  2  UIKitCore                      0x000000018e578aa4  UIKitCore + 2722468
  3  UIKitCore                      0x000000018e36c158  UIKitCore + 573784
  4  UIKitCore                      0x000000018e401670  UIKitCore + 1185392
  5  GraphicsServices               0x000000022e699498  GraphicsServices + 5272
  6  CoreFoundation                 0x00000001886cd54c  CoreFoundation + 189772
  7  CoreFoundation                 0x00000001886ce6e4  CoreFoundation + 194276
  8  CoreFoundation                 0x000000018870374c  CoreFoundation + 411468
  9  CoreFoundation                 0x0000000188703824  CoreFoundation + 411684

Thread 1
(no frames)

Thread 2
  0  libsystem_pthread.dylib        0x00000001e805e8cc  libsystem_pthread.dylib + 2252
  1  libsystem_pthread.dylib        0x00000001e8062438  libsystem_pthread.dylib + 17464
```

---

## 5. Full example — everything combined

All three (`msg`, `eTp`+`eMeta`, `stackTrace`) put together, the way the
**Error Detail (Error Drilldown)** screen shows a complete crash.

Pattern — which data comes from where:

```
Platform:      NATIVEAPP.sdkId
Date/Time:     time

Hardware Model:      NATIVEAPP.eMeta.deviceType
Version:             NATIVEAPP.eMeta.appVersion (NATIVEAPP.eMeta.appBuildVersion)
Code Type:           NATIVEAPP.eMeta.platformArchitecture
OS Version:          NATIVEAPP.eMeta.osVersion
Exception Code: NATIVEAPP.eMeta.exceptionCode
Exception Sub Type: NATIVEAPP.eMeta.exceptionType
Region: NATIVEAPP.eMeta.regionFormat
TestFlight: NATIVEAPP.eMeta.isTestFlightApp
Low Power Mode: NATIVEAPP.eMeta.lowPowerModeEnabled

Exception Type:  NATIVEAPP.eMeta.signal (mapped to signal name)
Exception Note:  msg
Triggered by Thread:  id of the thread where crashed = true

Thread[] crashed = true → Crashed
  Thread[].stack[0].i   Thread[].stack[0].fLine
  Thread[].stack[1].i   Thread[].stack[1].fLine
  Thread[].stack[2].i   Thread[].stack[2].fLine

Thread[] (not crashed)
  Thread[].stack[0].i   Thread[].stack[0].fLine
  Thread[].stack[1].i   Thread[].stack[1].fLine
```

Filled in with real data:

<details>
<summary>Click to expand full crash example</summary>

```
Platform:      iOS
Date/Time:     2026-09-09T11:12:00.000Z

Hardware Model:      iPhone13,2
Version:             1.1 (1)
Code Type:           arm64e
OS Version:          iPhone OS 26.6 (23G71)
Exception Code: 1
Exception Sub Type: 1
Region: IN
TestFlight: No
Low Power Mode: No

Exception Type:  SIGSEGV
Exception Note:  App crashed with SIGSEGV, signo: 11, errno: 1, signal code: 1, identified through Matric Kit
Triggered by Thread:  0

Thread 0 Crashed: Main Thread
  0  dyld                           0x00000001852d9c1c  dyld + 19484
  1  Example-UIKit                  0x0000000104d09aa0  Example-UIKit + 55968
  2  UIKitCore                      0x000000018e578aa4  UIKitCore + 2722468
  3  UIKitCore                      0x000000018e36c158  UIKitCore + 573784
  4  UIKitCore                      0x000000018e401670  UIKitCore + 1185392
  5  GraphicsServices               0x000000022e699498  GraphicsServices + 5272
  6  CoreFoundation                 0x00000001886cd54c  CoreFoundation + 189772
  7  CoreFoundation                 0x00000001886ce6e4  CoreFoundation + 194276
  8  CoreFoundation                 0x000000018870374c  CoreFoundation + 411468
  9  CoreFoundation                 0x0000000188703824  CoreFoundation + 411684
 10  CoreFoundation                 0x00000001886c11d8  CoreFoundation + 139736
 11  UpdateCycle                    0x000000029e3ca56c  UpdateCycle + 5484
 12  UIKitCore                      0x000000018e3d8c60  UIKitCore + 1018976
 13  UIKitCore                      0x000000018e3db6d4  UIKitCore + 1029844
 14  UIKitCore                      0x000000018e3c2188  UIKitCore + 926088
 15  UIKitCore                      0x000000018e3d85b8  UIKitCore + 1017272
 16  UIKitCore                      0x000000018e3bf480  UIKitCore + 914560
 17  Example-UIKit                  0x0000000104d672f8  Example-UIKit + 439032
 18  Example-UIKit                  0x0000000104d66efc  Example-UIKit + 438012
 19  UIKitCore                      0x000000018e3d2a68  UIKitCore + 993896
 20  UIKitCore                      0x000000018e3be9a0  UIKitCore + 911776
 21  UIKitCore                      0x000000018e3d9a64  UIKitCore + 1022564
 22  UIKitCore                      0x000000018e9f6838  UIKitCore + 7432248
 23  UIKitCore                      0x000000018e9f6358  UIKitCore + 7431000
 24  UIKitCore                      0x000000018e901818  UIKitCore + 6428696
 25  UIKitCore                      0x000000018e9f6358  UIKitCore + 7431000
 26  UIKitCore                      0x000000018e901784  UIKitCore + 6428548
 27  UIKitCore                      0x000000018f8354f8  UIKitCore + 22369528
 28  UIKitCore                      0x000000018e63ad30  UIKitCore + 3517744
 29  Example-UIKit                  0x0000000104d00de8  Example-UIKit + 19944
 30  libswiftCore.dylib             0x000000018539e5ac  libswiftCore.dylib + 34220
 31  libswiftCore.dylib             0x000000018539d250  libswiftCore.dylib + 29264
 32  libswiftCore.dylib             0x000000018539ea94  libswiftCore.dylib + 35476
 33  libswiftCore.dylib             0x000000018539e038  libswiftCore.dylib + 32824
 34  libswiftCore.dylib             0x00000001853a28fc  libswiftCore.dylib + 51452

Thread 1
(no frames)

Thread 2
(no frames)

Thread 3
(no frames)

Thread 4
(no frames)

Thread 5
(no frames)

Thread 6
(no frames)

Thread 7
(no frames)

Thread 8
  0  libsystem_pthread.dylib        0x00000001e805e8cc  libsystem_pthread.dylib + 2252
  1  libsystem_pthread.dylib        0x00000001e8062438  libsystem_pthread.dylib + 17464
  2  Foundation                     0x00000001859be904  Foundation + 583940
  3  UIKitCore                      0x000000018e3c6eac  UIKitCore + 945836
  4  Foundation                     0x000000018593abd8  Foundation + 43992
  5  Foundation                     0x000000018593acf0  Foundation + 44272
  6  CoreFoundation                 0x00000001886cd54c  CoreFoundation + 189772
  7  CoreFoundation                 0x00000001886ce310  CoreFoundation + 193296
  8  CoreFoundation                 0x0000000188704344  CoreFoundation + 414532
  9  libsystem_kernel.dylib         0x0000000237d0c078  libsystem_kernel.dylib + 16504
 10  libsystem_kernel.dylib         0x0000000237d0c22c  libsystem_kernel.dylib + 16940
 11  libsystem_kernel.dylib         0x0000000237d0c30c  libsystem_kernel.dylib + 17164
 12  libsystem_kernel.dylib         0x0000000237d08cd4  libsystem_kernel.dylib + 3284

Thread 9
  0  libsystem_pthread.dylib        0x00000001e805e8cc  libsystem_pthread.dylib + 2252
  1  libsystem_pthread.dylib        0x00000001e8062438  libsystem_pthread.dylib + 17464
  2  Foundation                     0x00000001859be904  Foundation + 583940
  3  CFNetwork                      0x000000019dbddb54  CFNetwork + 596820
  4  CoreFoundation                 0x00000001886cd54c  CoreFoundation + 189772
  5  CoreFoundation                 0x00000001886ce310  CoreFoundation + 193296
  6  CoreFoundation                 0x0000000188704344  CoreFoundation + 414532
  7  libsystem_kernel.dylib         0x0000000237d0c078  libsystem_kernel.dylib + 16504
  8  libsystem_kernel.dylib         0x0000000237d0c22c  libsystem_kernel.dylib + 16940
  9  libsystem_kernel.dylib         0x0000000237d0c30c  libsystem_kernel.dylib + 17164
 10  libsystem_kernel.dylib         0x0000000237d08cd4  libsystem_kernel.dylib + 3284
```

</details>
