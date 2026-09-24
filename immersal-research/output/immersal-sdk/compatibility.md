# Compatibility

Zrodlo: https://developers.immersal.com/docs/immersal-sdk/compatibility/

---

# Compatibility

Immersal SDK powered applications can run on mobile phones, headsets and browsers. Development can be done using our dedicated SDKs or by utilizing the REST API.

## SDKs

### Unity SDK:

*   All ARKit and ARCore compatible devices through Unity's AR Foundation framework.
*   Huawei's AR Engine compatible devices (Android or Harmony OS) using the Huawei AR Engine SDK for Unity.
*   Magic Leap 2 headset using the Magic Leap XR Plugin and Unity Package.
*   XREAL Light headset using XREAL's SDK for Unity.
*   Rokid Max Pro headset using Rokid SDK for Unity,
*   PICO 4 Enterprise and 4 Ultra Enterprise usign PICO SDK for Unity.

### Web SDK:

*   [Immersal VPS for Web](https://github.com/immersal/vps-for-web) (Immersal VPS with simulated SLAM tracking, without WebSLAM)
*   [Immersal x Zappar Mattercraft template](https://www.youtube.com/watch?v=M73TdlHgs7k) (VPS from Immersal x SLAM tracking from Zappar)
*   [Immersal x 8th Wall sample](https://github.com/immersal/immersal-8thwall) (VPS from Immersal x SLAM tracking from 8th Wall _DEPRECATED_)

### REST API

*   Spatial mapping by submitting images to our Cloud Service
*   On-server Visual Positioning
    *   (see [https://github.com/HoloLabInc/HoloLab.Immersal](https://github.com/HoloLabInc/HoloLab.Immersal) for an example)

## Hardware

![Compatible mapping and localization methods](../../static/2025-03-27-22-51-55.png)

Compatible mapping and localization methods

### Spatial Mapping

*   [ARKit-capable iOS device](https://developer.apple.com/library/archive/documentation/DeviceInformation/Reference/iOSDeviceCompatibility/DeviceCompatibilityMatrix/DeviceCompatibilityMatrix.html)
*   [ARCore-capable Android device](https://developers.google.com/ar/devices)
*   Huawei AR Engine-capable devices
*   360 cameras.
*   3rd-party 3D reconstruction apps, e.g. Polycam, 3D scanner app.
*   Matterport Pro2/3
*   [Leica BLK2GO](https://shop.leica-geosystems.com/leica-blk/blk2go/overview)
*   NavVis scanner
*   Hexagon RealSLAM 10/20 scanner
*   XGRID K1, L2 scanner

### Visual Positioning (Localization)

*   [ARKit-capable iOS device](https://developer.apple.com/library/archive/documentation/DeviceInformation/Reference/iOSDeviceCompatibility/DeviceCompatibilityMatrix/DeviceCompatibilityMatrix.html)
*   [ARCore-capable Android device](https://developers.google.com/ar/devices)
*   Huawei AR Engine-capable device
*   HoloLens 2
*   Magic Leap 2
*   XREAL Light
*   Rokid Max Pro
*   PICO 4 Enterprise
*   PICO 4 Ultra Enterprise
*   Apple Vision Pro (coming soon)
*   Meta Quest (coming soon)

Most Android devices are locked to rendering 30 frames per second in AR applications. iOS devices allow for 60 fps apps for a snappier and more responsive feel.
