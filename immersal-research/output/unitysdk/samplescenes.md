# Sample Scenes

Zrodlo: https://developers.immersal.com/docs/unitysdk/samplescenes/

---

# Sample Scenes

Documentation for our official Unity sample scenes.

## Where to get them?

Our official sample projects can be downloaded from Package Manager.  
You can find all sample scenes under the **"Assets/Samples/Immersal SDK Core/2.x.x/Core Samples/Scenes/"** folder.

![](https://developers.immersal.com/docs/static/unity/scenelocation.png)

## Scene

There are few common things in all the scenes

## AR Session, AR Session Origin and AR Camera

Game objects provided by AR Foundation and you can find more about their functionalities from [Unity's documentation](https://docs.unity3d.com/Packages/com.unity.xr.arfoundation@3.0/manual/index.html).  
They provide the basic functionalities for the AR session.

## ImmersalSDK

Basic settings for our SDK

![](https://developers.immersal.com/docs/static/unity/samplescenes/hierarchyndinspector.png)

*   **Default Server** you can choose the server.
*   **Developer Token** is where you would insert your token found in our Developer Portal.
*   **Session** See ["Immersal Session"](https://developers.immersal.com/docs/unitysdk/immersalcomponents/immersalsession/)
*   **Platform** [Platform Support](https://developers.immersal.com/docs/unitysdk/immersalcomponents/platformsupport/) takes care of configuring a device as well as providing camera data from that device
*   **Localizer** [Localizer](https://developers.immersal.com/docs/unitysdk/immersalcomponents/localizer) takes in data from the platform and uses the core Immersal methods to produce a pose describing the alignment of spatial maps.
*   **Scene Updater** [Scene Updated](https://developers.immersal.com/docs/unitysdk/immersalcomponents/sceneupdater) responsible for taking in the pose data from Localizer, adjusting it if necessary, and updating the scene by passing it to the relevant ISpaceUpdateables.
*   **Tracking Analyzer** [Tracking Analyzer](https://developers.immersal.com/docs/unitysdk/immersalcomponents/trackinganalyzer) is responsible for interpreting incoming platform status and localization results and constructing a tracking status to describe the current quality of positioning.
*   **Target Frame Rate** for the app. iOS can manage 60fps, but most Android devices are locked to 30fps.
*   **Downsample** downsamples image to HD resolution.
*   **Download Directory** is the name of the folder where you want to download the maps

## XR Space and XR Maps

These game objects are used by our SDK to transform the AR content to match the real-world.  
When a pose is found, the XR Space is transformed in a way that the AR content visually matches the real-world. The AR Camera in the scene is not transformed, but the XR Space is brought to the camera.  
Map files in XR Maps are used to move the parent XR Space object. Every XR Map needs to have a parent XR Space object. If one does not exist, it will be created at runtime.

All AR content should be placed under the XR Space game object.

Technically the content can be placed under the XR Maps themselves if that makes organizing the scene easier.  
Map files in XR Maps are used to move the parent XR Space object. Every XR Map needs to have a parent XR Space object. If one does not exist, it will be created at runtime.

You should download map with the "XRMap" that is under the "XR Space"

*   Copy your map ID from [Dashboard](https://developers.immersal.com)
*   Paste it in the "Map id"
*   Select both **Mapfile** and **Visualization** as download options
*   Click "Download"

![](https://developers.immersal.com/docs/static/unity/samplescenes/downloadmap.png)

*   **Localization Method** you can choose from "Device" or "Server"
*   **On Device Behaviour** You can choose "Embed" or "Download"
*   **Map Metadata** the metadata tied to the specific map.  
    There are other option at the bottom to "Load" "Save" and "Reset" Alignment.

![](https://developers.immersal.com/docs/static/unity/samplescenes/armap.png)

When a map is downloaded you can see these setting on the pointcloud file

*   **Render Mode** sets the visibility of the preview point cloud. Set Render Mode to "Editor And Runtime".
*   **Point Color** changes the color of the preview point cloud.
*   **Point Siz**e let's you change the point cloud size in the scene.
*   **Render as 3D Points** renders points as 3D.
    
    ![](https://developers.immersal.com/docs/static/unity/samplescenes/armapvisual.png)
