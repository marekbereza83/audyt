# Map Download Sample

Zrodlo: https://developers.immersal.com/docs/unitysdk/samplescenes/map-download-sample/

---

# Map Download Sample

This sample shows how to download, switch and use the constructed map at runtime.

This sample requires a valid Developer Token from our [Developer Portal](https://developers.immersal.com/)

Open the **MapDownloadSample** scene found in the **"Assets/Samples/Immersal SDK Core/2.x.x/Core Samples/Scenes/"** folder.

## Using Your Maps

You can log in to the Developer Portal and download a map file if you wish to also embed a map into the sample.  
But in this sample all your constructed maps are available in the app itself.

## Overview of the scene

The scene is very similar to the Multimap sample.

![](https://developers.immersal.com/docs/static/unity/samplescenes/mapdownloadsample.png)

## Using the sample

1.  Place your downloaded map file into the XR Map game object's map file slots in the inspector or leave it empty.
2.  Open Build Settings (Ctrl + Shift + B) and make sure only the MapDownloadSample is included in the Scenes in Build.
3.  Change your Player Settings if necessary. It's a good idea to change the Product Name and Package Name so the app will not overwrite a previously installed app on your device.
4.  Build the app and install it to your devices.

When you start the app and look around at a location you have mapped, the device should localize and find a pose in just seconds.  
If you click the dropdown menu, you can download and switch to other maps.
