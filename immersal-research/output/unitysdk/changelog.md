# Changelog

Zrodlo: https://developers.immersal.com/docs/unitysdk/changelog/

---

# Changelog

## SDK v2.4.0 STABLE

Released: [2026-08-31](https://developers.immersal.com)

*   Support for Unity 6 (tested with 6.3 LTS)
*   Plugins: support for loading new map file format

*   Orientation changes in 2.3.0 caused some crashes that have been fixed
*   Improved `ARFoundationSupport.cs` robustness

`ICameraData.Orientation` renamed to `ScreenOrientation`

## SDK v2.3.0 STABLE

Released: [2026-02-12](https://developers.immersal.com)

*   `SolverType` enum now uses actual values instead of indices
*   Samples: `MapDownloadSample` "Use filtering" toggle
*   Plugin: some memory alignment bugs

*   `ICameraData.Orientation` has been replaced with `ImageOrientation`, which is based on Unity’s `DeviceOrientation` (note that this differs from `ScreenOrientation`). For example, when the build target uses Auto Rotation, `ScreenOrientation` changes as the device rotates. However, when the build target is locked (e.g., Portrait), `ScreenOrientation` remains fixed even as the device physically rotates. `DeviceOrientation`, on the other hand, always reflects the device’s physical orientation regardless of the chosen screen orientation. `ImageOrientation` represents how many degrees the raw camera image must be rotated (in Euler angles) to appear upright in portrait. For example: if an iPhone is physically held in portrait, ARKit provides the camera image rotated 90° CCW, so `ImageOrientation = 90` meaning "rotate the image 90° clockwise to make it upright".
*   In `ARFoundationSupport.cs`, `SetOrientationOverride()` has been replaced by a Quaternion extension method: `AdjustForScreenOrientation(ScreenOrientation? overrideOrientation = null)`. This change mainly affects very specific/advanced use cases.
*   Updated Unity packages

*   `DeviceLocalization.cs`: prior neighbour min/max/radius parameters to the Prior solver type to achieve feature parity with the on-server localizer
*   `filterRadius` parameter to localizers
*   Default parameters for the prior solver type (plugin currently crashes with '0' values)

* * *

## SDK v2.2.1 STABLE

Released: [2025-12-03](https://developers.immersal.com)

*   Core/plugins: Minor GeoPose fixes
*   Editor: Map alignment saving & loading
*   Samples: Prefab errors with missing script references
*   Compiler warnings

*   Updated all plugins to 2.2.1

* * *

## SDK v2.2.0 STABLE

Released: [2025-11-06](https://developers.immersal.com)

*   `GeoPoseLocalization.cs`: OSCP (Open Spatial Computing Platform) compliant GeoPose localizer. Uses the new `/geoposeoscp` [API endpoint](https://api.immersal.com/geoposeoscp). See: [Protocol specification](https://github.com/OpenArCloud/oscp-geopose-protocol) / [Read more](https://www.openarcloud.org/oscp)
*   `GPSLocationProvider.cs`: native (double-precision) GPS tracking
*   Core plugin: ENU->ECEF convertion functions
*   REST: Support for upload cancellation token in `RequestUpload`

*   RGB image memory issue
*   Wrong `solverType` when it's not 0 or prior
*   Android plugin: Support [16 KB page size requirement by Google](https://android-developers.googleblog.com/2025/05/prepare-play-apps-for-devices-with-16kb-page-size.html)
*   iOS: `NativeLocation.mm` plugin now returns `ellipsoidalAltitude` as GPS altitude instead of MSL (mean sea level). This matches the behaviour on Android devices and Immersal's geo-related APIs.
*   Minor bug fixes and SDK streamlining
*   Compiler warnings

*   Updated all plugins to 2.2.0
*   `Core.cs`: tidied up some function names and docs
*   Note: The old 'proprietary' Immersal GeoPose localizer `GeoLocalization.cs` uses the `/geopose` endpoint. This may change in the future...

*   The even older endpoint `/geolocalize` hasn't been updated in years and has been removed from `REST.cs` etc.

* * *

## SDK v2.1.1 STABLE

Released: [2025-03-06](https://developers.immersal.com)

*   MapManager.TryCreateMap can now apply map alignment at runtime
*   Server/GeoLocalization now exposes upload Progress via a public UnityEvent
*   ImmersalSDK now has a toggle for automatic initialization on Awake
*   ImmersalSession has additional toggle for restarting after reset
*   SceneDataProcessors can now be added/removed at runtime
*   Custom editor for PoseFilter
*   Custom editors for the provided localization method implementations
*   More public properties for ImmersalSession

*   PoseFilter bug causing unstable filtering
*   CameraData not disposed when unused by the Localizer
*   Prior localization using faulty poses
*   Prior localization missing REST parameters
*   TrackingAnalyzer tracking quality bug when dropping to 0
*   Some TrackingAnalyzer events not firing correctly

* * *

## SDK v2.1.0 STABLE

Released: [2025-01-09](https://developers.immersal.com)

Starting with this release, the 2.x.x SDK is no longer considered to be in a beta state.

 *    Localization with prior pose with the new SolverType and related options
*    Event and boolean for user validation completion at SDK initialization
*    IPlatformConfiguration for setting options (eg. image format) once or per update
*    Utility functions in ILocalizer to better support custom localization scripts
*    CustomLocalizationSample scene and script *    The 2.x.x SDK is no longer considered to be in a beta state
*    Updated all plugins to 2.1.0
*    The CameraData structure has been refactored into a new set of interfaces and classes
*    ARFoundationSupport updated to work with refactored CameraData system *    ImmersalSession starting localization too early when adding maps at runtime
*    MapManager removing embedded maps while localizing against them
*    Small RealtimeMapping sample bugs *    Old CameraData struct and related logic
*    Support for platforms using old CameraData (all platform packages older than 2.1.0)

* * *

## SDK v2.0.4 BETA

Released: [2024-11-20](https://developers.immersal.com)

 *    Screen orientation override methods in ARFoundationSupport
*    Mechanism to support project validation issues from external packages *    Default project issues now use the new issue provider mechanism *    Missing script references in a couple of prefabs *    Hardcoded Magic Leap specific project issue

* * *

## SDK v2.0.3 BETA

Released: [2024-09-11](https://developers.immersal.com)

 *    More options for PoseSmoother
*    Experimental options for PoseFilter
*    IDataProcessingChain interface *    Plugins updated to 2.0.3
*    Reduced map loading time and memory usage
*    Improved realtime mapping speed
*    DataProcessingChain type argument constrained to be a reference type
*    XRSpace now uses the new SceneUpdateData from SceneUpdater in processing *    PoseFilter issues with large maps / offsets
*    Custom server URL serialization bug
*    ImmersalSession LocalizeOnce() checks current task before awaiting it

* * *

## SDK v2.0.2 BETA

Released: [2024-04-26](https://developers.immersal.com)

 *    Custom server option in ImmersalSDK object
*    Dense as optional parameter in map construction REST API (defaults to true) *    Plugins updated to 2.0.2 *    Project validation not recognizing old format XR Plugin names
*    Server selection in ImmersalSDK object not working as expected
*    XRMaps not working when ISceneUpdateable is not a direct parent
*    Unity stuck on "domain reloading" on Windows due to plugin issues

* * *

## SDK v2.0.1 BETA

Released: [2024-03-20](https://developers.immersal.com)

 *    Real time mapping sample and related scripts
*    Confidence value in REST SDKLocalizeResult and ServerLocalization
*    New events in Localizer and MapManager
*    Localization method option in map download sample
*    ImmersalSession burst mode parameters *    Plugins updated to 2.0.1
*    Exposed more ARFoundationSupport methods as public
*    ARFoundationSupport initialization logic moved to ConfigurePlatform
*    ServerLocalization now always includes rotation in requests
*    IImmersalSession.StopSession() now has a parameter for cancelling the currently running task. *    Project validation bugs
*    Localizer & LocalizationMethod runtime configuration bugs
*    Missing mapId from ServerLocalization LocalizeInfo
*    XRMap Metadata parsing bug
*    RestartSdk bugs *    Legacy embedded map logic in map download sample

* * *

## SDK v2.0.0 BETA

Released: [2024-02-12](https://developers.immersal.com)

The SDK has been refactored in a major way. **There is no backwards compatibility with older SDK versions.**

 *    Interfaced component architecture
*    Asynchronous localization with multiple methods
*    Multiple XRSpace support
*    Customizable data processing chains
*    Map specific localization options
*    Streamlined map configuration
*    Improved events
*    Updated Editor scripts for better UX
*    Updated REST api framework
*    Automated project validation
*    MapManager for runtime map management
*    ImmersalLogger as a debugging utility
*    Unity package format *    Old inheritance based architecture
*    Map loading during edit mode
*    ARHelper and other deprecated classes

* * *

## SDK v1.20.1 STABLE

Released: [2025-11-19](https://developers.immersal.com)

*   Samples: Unity version to latest 2022.3.67f2 LTS
*   Updated Unity packages
*   Core: GeoPose ECEF/ENU handling
*   Plugins updated to 1.20.1

*   Samples: RealtimeMappingSample now adds GPS lat/lon to uploaded maps

*   Core: Android plugin; 16 KB page size fix

* * *

## SDK v1.20.0 STABLE

Released: [2023-11-30](https://developers.immersal.com)

 *    REST: Added map copy, align and stitch requests
*    REST: Added device model logging to improve future localization method development
*    Core: Added configurable `solverType` to enable localization method selection
*    Core: Added new map construction parameters:
    *   `locFilter`, disabled by default
    *   `featureFilter`, 0 by default
    *   `mapCompression`, 0 by default *    Core: Android plugin; user validation (for real-time mapping and other Enterprise features)

* * *

## SDK v1.19.2

Released: [2023-10-03](https://developers.immersal.com)

 *    Updated Unity version to 2022.3.10f1
*    Updated Unity packages
*    Core: Updated plugin interface for `LocalizeImage()`, now returns a struct with the pose data and confidence value
*    Samples: Changed to use the `newTrackedPoseDriver` component in Unity, instead of the deprecated `ARPoseDriver` component *    Core: Added native plugins for Magic Leap 2 and HoloLens 2
*    Developer Portal: Added the password reset functionality *    Core: On-server localization now works when the map construction has reached the `sparse` state

* * *

## SDK v1.19.1

Released: [2023-06-21](https://developers.immersal.com)

 *    Core: Fixed Map construction sometimes failing with a version 1.18.1 dataset.
*    Samples: Changed all sample scenes to use the deprecated `ARPoseDriver`, until Unity fixes the `TrackedPoseDriver` in AR Foundation
*    Samples: Sample scenes on Android sometimes start with a black screen, with errors in adb console: "Failed to begin a new frame, ProcessSkybox will not render the Skybox. Skipped rendering frame because GfxDevice is in invalid state (device lost)". Deleting the Library folder in the Unity project seems to fix this. This problem is related to Unity 2022 and AR Foundation.

* * *

## SDK v1.19

Released: [2023-06-07](https://developers.immersal.com)

 *    Core: Real-time on-device mapping (requires Enterprise license)
*    Core: Optimized memory usage and speed
*    Core: "Edit" map type for edited maps
*    Samples: Added [Magic Leap 2](https://github.com/immersal/immersal-sdk-magicleap2-samples) samples (on-device localization and real-time mapping require Enterprise license)
*    Samples: Added GeoPose localizer option to Mapper settings
*    Samples: Added a new sample scene "Realtime Mapping Sample"
*    Samples: Added a new sample scene "Move AR Camera instead of AR Space"
*    Added support for the Immersal China server *    Samples: Updated Unity version to 2022.3 LTS
*    Samples: Updated ARFoundation, ARKit and ARCore packages to 5.0.6
*    Samples: Updated all sample scenes to use the new input system and XRRig
*    Removed Lumin plugin and dropped support for Magic Leap 1
*    Removed old Unity NavMeshComponents and added new AI Navigation package
*    Removed unused parameters from the plugin interface *    Core: Handedness fix to GeoPose localizer
*    Core: Fixed minor memory leaks
*    Core: Fixed \[`ARMap::FreeMap()`\] bugs with map handles, should now behave correctly in multi-scene scenarios and in Unity Editor
*    Core: REST requests now return the correct amount of bytes
*    Samples: Fixed ContentPlacement sample crashing at startup when no content.json file was present
*    Samples: Removed Immersal logo from being a RaycastTarget
*    Samples: Fixed mapper not clearing loaded maps on logout

* * *

## SDK v1.18

Released: [2023-02-11](https://developers.immersal.com)

 *    Core/Cloud Service: Localization improvements, less false positives
*    Cloud Service: Improved memory usage with large maps
*    Core: Removed unnecessary TMPro reference from a script
*    Core: Fixed editor scripts not to be included in builds on Unity 2022 *    Core: Android x86\_64 plugin for Magic Leap 2 (FOR ENTERPRISE LICENSE ONLY, contact [sales@immersal.com](mailto:sales@immersal.com) for licensing requests)
*    Samples: iOS post process script to turn off bitcode *    Core: LoadMap() in ARMap now calls the plugin asynchronously to avoid UI freezes with large maps. The function doesn't return mapHandle anymore, but it's still available through ARMap.mapHandle.
*    Samples: Updated Unity version to 2021.3.16f1 and AR Foundation to 4.2.7
*    Samples: Cleaned up and updated some Unity packages *    Samples: ARMap errors in the Unity Editor, don't affect builds on device

* * *

## SDK v1.17

v1.16 and earlier maps can be used with v1.17 but new v1.17 maps can not be loaded with earlier versions by default

Released: [2022-11-02](https://developers.immersal.com)

 *    Core: Apple Silicon support in the macOS plugin
*    REST API: Added featureType parameter to map constuction construct endpoint. Value 0 creates maps in the old format which is compatible with v1.16 and the new default value of 2 creates maps in -  the new v1.17 format
*    REST API: Added a map access token with get/set endpoints
*    Developer Portal: Toggle to visualize input poses for new v1.17 maps *    Core: Improved tracking quality measurement
*    Core: Fixed OnPoseFound event not always firing
*    Developer Portal: Map origin in correct location in 3D Viewer
*    Other minor bug fixes *    Samples: Multiplayer sample removed because it was using the old UNet HLAPI not supported by Unity anymore *    Samples: Multiplayer sample removed because it was using the old UNet HLAPI not supported by Unity anymore

* * *

## SDK v1.16.1

Released: [2022-03-02](https://developers.immersal.com)

 *    Developer Portal: Support for uploading Leica BLK2GO .b2g files for map construction (FOR ENTERPRISE LICENSE ONLY, contact [sdk@immersal.com](mailto:sdk@immersal.com) for licensing requests)
*    Core & Samples: A native UWP ARM64 plugin for HoloLens 2 + HLLocalizer sample (FOR ENTERPRISE LICENSE ONLY, contact [sdk@immersal.com](mailto:sdk@immersal.com) for licensing requests)
*    Mapper: Added license text *    Several bug fixes *    Core: Refactored ImmersalSDK.cs to have RegisterLocalizer() and UnRegisterLocalizer() functions

* * *

## SDK v1.15.0

IMPORTANT Older maps will work with the new v1.15.0 release but new maps will not work with older releases!

We will support v1.14.1 until March 1st, 2022 v1.14.1 REST API can be accessed through [https://api.immersal.com](https://api.immersal.com) v1.15.0 REST API can be accessed through [https://api.immersal.com/1.15.0](https://api.immersal.com/1.15.0)

The Developer Portal will support both versions. The version can be changed through a dropdown menu at the top.

Released: [2021-12-02](https://developers.immersal.com)

 *    Cloud Service: Restoring map data to the workspace now supports additive restore keeping old data. This allows for easy combination of existing maps.
*    Samples: Added a Debug Console to the Mapper app.
*    Samples: Added a warning to the Mapper app login screen if the device has no network connection. *    Core: Fixed an issue with ARMap where maps were loaded twice.
*    Samples: Fixed a bug in the Mapper app when aligning maps without changing the root map. *    Cloud Service: Now uses a right-handed coordinate system
*    Core: Now uses a right-handed coordinate system
*    Core: Core scripts now convert from right-handed coordinate system to Unity's left-handed coordinate system
*    Samples: The Mapper app now only shows the 50 first maps in the Map Download List with an option to load more. *    v1.15.0 support for Nreal, HWAR, Magic Leap, and HoloLens will be updated shortly. These branches have not yet been updated at release.

* * *

## SDK v1.14.1

Released: [2021-09-29](https://developers.immersal.com)

 *    Graduated Magic Leap plugin in the core SDK
*    Developer Portal: WebXR viewing mode for Android Chrome (prerequisites: up-to-date Chrome, chrome://flags/#webxr-incubations 'Enabled')
*    Core: ARSpace; added OnDestroy() housekeeping *    Samples: Job / queue system in Mapper and some other samples was broken, fixed
*    Samples: Mapper; automatic capture experimental feature was on by default, fixed *    Cloud Service: Faster map construction
*    Core: Recompiled and minified plugins, re-added ARMv7 support for Android (useful for Mono builds) Samples: Updated to Unity 2020.3 LTS

* * *

## SDK v1.11.3

Released: [2021-01-20](https://developers.immersal.com)

 *    Core: Fixed a minor compatibility problem with the latest GitHub samples.

* * *

## SDK v1.11.2

Released: [2021-01-12](https://developers.immersal.com)

 *    Core: Updated all plugins
*    Core: Improvements to the on-server localizer in ARLocalizer and ARMap

* * *

## SDK v1.11.1

Released: [2021-01-11](https://developers.immersal.com)

 *    Core: Updated localizer with improved performance and speed
*    REST API: New functions using async/await instead of Unity coroutines
*    Switched to System.Net.HttpClient everywhere, because of random problems with UnityWebRequest on iOS
*    General bug fixes

* * *

## SDK v1.10

Released: [2020-11-11](https://developers.immersal.com)

 *    REST API: Proper URI identifiers
*    REST API: new endpoints for image capture and on-server localization, where the image payload can be sent as binary instead of a Base64-encoded string (smaller filesize -> faster uploads)
*    Immersal Mapper / REST API: Use tracker poses-feature for map construction (beta) *    Immersal Mapper: Smaller filesize in image uploads
*    Immersal Mapper: Localization and capturing is now faster especially on older devices, such as iPhone 7 and beyond
*    Updated developer pricing

* * *

## SDK v1.9

Released: [2020-10-23](https://developers.immersal.com)

 *    Samples: Magic Leap localization support and a reference Unity project, [MagicLeap](https://github.com/immersal/arcloud-sdk-samples/tree/magicleap)
*    Core: OnPoseFound and OnPoseLost events in ImmersalSDK.cs, OnFirstLocalization event in ARMap.cs
*    Core: ARLocalizer.cs now has start/stop/pause/resume methods *    Core: Localizer does not return the map id anymore. Instead, it returns a map handle like an earlier SDK version did.
*    Immersal Mapper: Updated UI
*    Samples: Restructured Unity core package and the Unity sample project. ARMap.cs, ARLocalizer.cs, and other essential scripts are now part of the core package. This should make future SDK updates to new versions easier.
*    Samples: Code cleanup
*    Samples: Reworked the pointcloud3d shader to support point size attribute on OpenGL, Vulkan, and Metal platforms.
*    Samples: Mapper app sample updated to the latest version.

* * *

## SDK v1.8

Released: [2020-09-11](https://developers.immersal.com)

 *    Samples: Nreal Light localization support, [https://github.com/immersal/arcloud-sdk-samples/tree/nreal](https://github.com/immersal/arcloud-sdk-samples/tree/nreal)
*    Samples & Immersal Mapper app: Progress bar for map loading.
*    Documentation: REST API Python sample scripts *    Samples: `NativeBindings` errors in Unity Editor. *    Huawei AR Engine support moved to its [https://github.com/immersal/arcloud-sdk-samples/tree/hwar](https://github.com/immersal/arcloud-sdk-samples/tree/hwar)
*    Samples: Api Compatibility Level was errorneously set to .NET 4.x, switched back to .NET Standard 2.0
*    Samples: Mapper now stores queued images into the persistent data directory to avoid out-of-memory crashes
*    Samples: Updated to Unity 2019.4.9f1 LTS and AR Foundation 4.0.8

* * *

## SDK v1.7

Released: [2020-07-06](https://developers.immersal.com)

 *    Core: Improved localization robustness.
*    Core: REST API clean-up; error, start, progress, and complete callbacks.
*    Core: REST API; Map construct detail level.
*    Samples: Native double-precision GPS coordinates for iOS and Android.
*    Samples: Image upload progress bar to Mapper UI.
*    Samples: Map construction detail level in Mapper.
*    Samples: Visual GPS compass bearing in Mapper. *    Samples: ARMap.cs crashing in Unity Editor when editing.
*    Samples: Bug fixes to Huawei AR sample scripts. *    Core: Smaller plug-in size.
*    Core: Changed map hashes from MD5 to SHA256.
*    Samples: Updated to Unity 2019.4 LTS and AR Foundation 4.

⚠️ Known Issue

*    Assets\\ImmersalSDK\\Core\\Plugins\\NativeBindings.cs(73,24): error CS0161: 'NativeBindings.GetLatitude()': not all code paths return a value

If Unity's platform is 'PC, Mac & Linux Standalone', there's a regression bug in the Core SDK. Switch platform to iOS or Android to resolve the issue.

* * *

## SDK v1.6

Released: [2020-06-05](https://developers.immersal.com)

 *    Server / Developer Portal: Support for textured meshes (both grayscale and RGB).
*    Samples: ARLocalizer.cs, ARSpace.cs & ARMap.cs: support for uniform scaling of maps.
*    Samples: ARLocalizer.cs now has MapChanged and PoseFound events. *    Plugin: image capturing is now a lot faster.

* * *

## SDK v1.5

⚠️ New v1.5 maps are not supported by older SDK versions.

SDK v1.4 was released to closed testing earlier. After a round of updates and new features, we decided to fast-track v1.5 out for public release.

Released: [2020-05-05](https://developers.immersal.com)

 *    Server/Developer Portal: Support for private and public maps.
*    Server/Developer Portal: Sending/copying maps between accounts.
*    Server/Developer Portal: Search for public maps and filter by GPS coordinates or user accounts.
*    Server/Developer Portal: SHA256 hashes for new maps.
*    Server/Developer Portal: Reset the private developer token.
*    Samples: \[Huawei AR Engine support\] ([https://developer.huawei.com/consumer](https://developer.huawei.com/consumer))
*    Samples: ARLocalizer.cs has a new toggle to reset filtering when the last localized map id changes.
*    Samples: Graph-based navigation sample. *    Immersal Mapper: Android now properly requests for location (GPS) permissions. *    Server/Plug-in: Generated maps are now up to 80% smaller.
*    Server/Plug-in: Map file format is not compatible with v1.3 anymore. v1.5.0 plugin can still load maps done with earlier SDK versions.
*    Server/Plug-in: Both the localization accuracy and speed have been improved.
*    Plug-in: The native plugins are now 75% smaller.
*    Developer Portal: Updated version of the [Developer Portal](https://developers.immersal.com) to support new features.
*    Samples: ARlocalizer.cs lastLocalizedMapId variable made public.

* * *

## SDK v1.3

New v1.3 maps are not supported by older SDK versions.

Released: [2020-02-07](https://developers.immersal.com)

*   Developer Portal: v1.3 breaks map file format forward compatibility. Old maps are stored in a separate legacy v1.2 Developer Portal. Maps are not carried over to the new version.
*    Developer Portal: A new sparse state in map construction. Maps are generated faster as you can now download the .bytes file and sparse .ply point cloud before the dense mesh is computed.
*    Server: On-server localizer now also accepts RGB24 .png images in addition to 8-bit grayscale ones for easier headset integration.
*    Plugin: Visual GPS support. If a map contains GPS data, the localizer will return WGS84 lat/long/alt coordinates with a successful localization.
*    Samples: Mapping App now has a GPS toggle. When on, captured images contain GPS coordinate data which is used in map construction. Also, maps in the map list are filtered with a 200-meter radius from the current location.

 *    ARLocalizer.cs Burst mode now runs when the app enters the foreground.
*    ARLocalizer.cs and ARHelper.cs Fixed rotation for different screen orientations so portrait/landscape/auto now work.
*    Plugin: Localizer now returns -1 mapID if no maps are loaded. *    Immersal AR Cloud SDK name to Immersal SDK everywhere.
*    Developer Portal: Dense meshes are now more detailed.
*    Plugin: Localizer now returns the actual mapID from the Developer Portal instead of a mapHandle unique to the session.
*    Plugin: Map file format changed. Old .bytes files continue to work in v1.3, but new maps will not work in older versions.
*    Samples: Updated project to Unity 2019.2.20f1.
*    Samples: Added dependancy to AR Foundation 3.1 preview, because some scenes have AR Occlusion Manager attached to the AR Camera. Older versions of AR Foundation continue to work.
*    Samples: Updated NavigationSample scripts.

* * *

## SDK v1.2

Released: [2019-10-16](https://developers.immersal.com)

 *    Developer Portal: Map stitching. You can select multiple maps and combine them into one new map (assuming the maps have overlapping features).
*    Samples: Mapping App can now restore any old map's source data to the workspace from the map list.
*    Samples: Mapping app can also delete maps from the map list directly.
*    SDK: Mapping performance improvements.
*    SDK: REST API updated. *    Samples: The "AR Cloud space" rotation and position can now be gotten from ARSpace.cs instead of ARLocalizer.cs, which was buggy anyway and returned only the first map's pose, thus giving incorrect results when using multimaps.
*    Samples: Navigation and multiplayer samples fixed to work with multimaps.
*    Samples: UI fixes all over. *    Samples: Updated project to `Unity 2019.2.8f1` and `AR Foundation 3.0.0 preview.3`, should continue to work just fine with older versions.
*    Developer Portal: Updated EULA.

* * *

## SDK v1.1

Released: [2019-09-12](https://developers.immersal.com)

 *    A simple `Multiplayer Sample` scene using Unity Networking (Note: You need to enable Multiplayer in Unity Services).
*    Variable lighting adaptation.
*    Android 64-bit support.
*    `Map Download Sample` (previously SampleScene) and MapListController.cs are back by popular demand.
*    On-server localization.
*    Gravity-based map alignment when constructing a new map. *    Mapping and localization now work on iPad Mini (probably fixes problems with various Android devices as well).
*    Point cloud renderer and runtime map loading fixes.
*    On-device localization was sometimes giving false results. *    Supported Unity version is now 2019.2.3f1+, should work on 2018.4 LTS still with correct AR Foundation packages.
*    Android plugin is now an `.aar` file with both 32-bit and 64-bit binaries.

* * *

## SDK v1.01

Released: [2019-06-24](https://developers.immersal.com)

 *    Samples: `Mapping App` now notifies the user if sequential captured images can be connected by their matching feature points *    Samples: C# API updated for AR Foundation 1.5 / 2.2. Samples: Point cloud preview bugs fixed. Samples: Now distributed in a separate [GitHub repository](https://github.com/immersal/immersal-sdk-samples). SDK: Requires Unity 2018.4 LTS. SDK: Now distributed as a .unitypackage (available at the [developer portal](https://developers.immersal.com)).

* * *

## SDK v0.19

Released: [2019-06-12](https://developers.immersal.com)

 *    SDK: Improved multimap support in Unity Editor.
*    SDK: ARLocalizer.cs finds the first pose much faster. *    Samples: Improved `MappingApp` with separate Workspace and Visualize modes.
*    Samples: Changes to sample scenes to support multimap feature.
*    SDK: ARSpace.cs functionality moved to ARMap.cs to clarify multimap workflow.

* * *

## SDK v0.18

Released: [2019-05-23](https://developers.immersal.com)

 *    Samples: Downsample option in ARLocalizer. Uses less memory and is faster.
*    Samples: Multimap loading support in `MappingApp`.
*    Samples: RGB Image Capture Toggle in `MappingApp`.
*    Developer Portal: Dense point cloud download.
*    Developer Portal: Delete map function.
*    SDK: Initial multimap support. *    DK: Fixed camera intrinsics calculation (fixes screen space Y offset bug on iOS devices).
*    SDK: ARCloud.cs script removed, ARSpace.cs has the same functionality. *    Samples: Removed the drop-down menu for dynamic map loading. It needs to be completely reworked to support multimaps.

* * *

## SDK v0.17

Released: [2019-04-08](https://developers.immersal.com)

 *    Samples: Persistent Content Placement Sample Scene.
*    Samples: Pose Filtering in SampleScene.
*    Developer Portal: Dense point cloud download.
*    SDK: RGB Camera Capture option. *    Samples: `MappingApp` UI and UX improvements.
*    SDK: Updated to OpenCV 4.
*    SDK: Improved network bandwidth usage during mapping.

* * *

## SDK v0.16

Released: [2019-03-07](https://developers.immersal.com)

 *    Samples: Indoor Navigation Sample Scene.
*    Samples: Tracking Quality Indicator PoseIndicator in SampleScene.
*    Developer Portal: Sparse point cloud download.
*    SDK: Feature Anchor sets map orientation. *    Samples: Option to switch between different maps in addition to the embedded one.
*    Samples: `MappingApp` UI and UX improvements.
*    Samples: `MappingApp` Capture Delay decreased from 0.5 seconds to 0.25 seconds.
*    Unity Package: Project cleanup. *    Samples: Fixed crash when no debug text was assigned to ARLocalizer.
*    SDK: Fixed a bug with setting the camera resolution. Now defaults to best possible.

* * *

## SDK v0.15

Released: [2019-02-17](https://developers.immersal.com)

 *    Initial release
