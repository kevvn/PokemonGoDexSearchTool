## 2024-05-24 - [Avoid Array Allocation in React Renders]
**Learning:** Using `.filter().length` inside React render cycles (like in `RegionSection`) creates unnecessary array allocations and subsequent garbage collection overhead, which can be expensive for frequently re-rendered components handling large datasets.
**Action:** Replace `.filter().length` with manual `for` loops to count items without creating intermediate array objects.
