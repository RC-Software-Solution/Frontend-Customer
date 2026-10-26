# Performance baseline — 2026-10-26

Device: SM-A057F (Android 15), Expo Go, dev server (`__DEV__` on). **Relative comparison only:** dev mode
is slower than a release build, so compare like with like.

| Metric | Baseline | Budget / target |
|---|---|---|
| Referenced raster assets | 5614 KB | ≤ 1500 KB |
| Janky frames (median of 3 runs) | 2.38 % | no worse than baseline |
| 90th / 95th / 99th percentile frame time | 23 / 24 / 28 ms | no worse than baseline |

Re-measure at the Phase-3 gate and in Task 25.

## Final (Task 25, 2026-10-26)

| Metric | Baseline | Final |
|---|---|---|
| Referenced raster assets | 5614 KB | 1000 KB |
| Janky frames, 3 runs | 2.38 % (median) | 1.33 / 1.64 / 1.53 %, median 1.53 % |
| 90th / 95th / 99th percentile frame time | 23 / 24 / 28 ms | 21 / 21 / 22 ms |

Same device and method as the baseline (dev server, `scripts/perf-frames.sh`).
