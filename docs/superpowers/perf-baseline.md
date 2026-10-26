# Performance baseline — 2026-10-26

Device: SM-A057F (Android 15), Expo Go, dev server (`__DEV__` on). **Relative comparison only:** dev mode
is slower than a release build, so compare like with like.

| Metric | Baseline | Budget / target |
|---|---|---|
| Referenced raster assets | 5614 KB | ≤ 1500 KB |
| Janky frames (median of 3 runs) | 2.38 % | no worse than baseline |
| 90th / 95th / 99th percentile frame time | 23 / 24 / 28 ms | no worse than baseline |

Re-measure at the Phase-3 gate and in Task 25.
