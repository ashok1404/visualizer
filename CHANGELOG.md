# Changelog

## 2026-09-10
- Added a Detailed/Plain Text toggle to the Threads section, letting you preview the stack trace as plain text without downloading.

## 2026-09-09
- Fixed Android/React Native stack frames showing a large gap after the frame index, and a duplicated "at at" in the downloaded report.
- Added a Download Report button that exports the crash as a .txt file formatted to match the detected platform's native crash log (iOS, Android, or React Native).
- Added icons to Event Timeline badges, using site-style SVG icons for UI Lifecycle and Network State.
- Matched the breadcrumb view's top section spacing to the Diagnostic tab's layout.
- Gave the Event Timeline uniform spacing to match the Threads list, and moved the crash card above the stats row to match the Diagnostic tab's layout.
- Folded release-note generation into `/release`, styled the breadcrumb crash card to match the Diagnostic tab, and defaulted breadcrumb sort to newest first.
