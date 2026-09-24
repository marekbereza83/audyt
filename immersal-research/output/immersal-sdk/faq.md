# FAQ

Zrodlo: https://developers.immersal.com/docs/immersal-sdk/faq/

---

# FAQ

### How large areas can be mapped?

Free commercial license users are limited to100 images per map. The area you can cover with 100 images heavily depends on the complexity of the physical location.

*   Open areas with few obstacles take fewer images to map
*   Narrow, confined spaces with many obstacles occluding visibility take more images to map

As a very rough estimate, 100 images is enough for up to 100-120m² indoor areas or even up to 200-500m² open outdoor areas. If you have larger areas, you can divide them into multiple separate maps with separate size limits. This allows you to cover very large areas in a modular fashion. It is possible to map even cities with this approach. We have demonstrated this by mapping a roughly 1,000,000m² area of Helsinki city center with 120+ separate maps which were then aligned.

### Do both the iOS and the Android versions have the same features?

Yes

### Does localization work offline?

Yes. You can embed the maps into the application and use our SDK plugin for completely on-device localization (visual positioning)
