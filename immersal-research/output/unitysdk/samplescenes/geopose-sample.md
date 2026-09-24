# GeoPose Sample

Zrodlo: https://developers.immersal.com/docs/unitysdk/samplescenes/geopose-sample/

---

# GeoPose Sample

This sample shows how to use the [OSCP GeoPose Protocol](https://github.com/OpenArCloud/oscp-geopose-protocol) compliant localization.

This sample only localizes against public maps, as no map IDs or user tokens are required nor accepted by the protocol. So, make sure to toggle the map privacy to 'public' on the [Developer Portal](https://developers.immersal.com/), under the 3 little dots next to the map name.

Open the **GeoPoseSample** scene found in the **"Assets/Samples/Immersal SDK Core/2.x.x/Core Samples/Scenes/"** folder.

## Using Your Maps

As GeoPose is map ID agnostic, visualizing or debugging your maps can be a little difficult. GeoPose tries to localize against all public maps within a search radius near your current GPS location (latitude and longitude). To make testing easier, make sure you have only 1 public map near your location, so you can be sure that any successful localization results are related to that map.

When creating a map, it's better to do it outdoors, as GPS doesn't work very well indoors. You need to have enough different GPS locations in your images while creating the map, so you should walk at least tens of meters while mapping. To make sure your map is suitable for geo localization, download the map's `metadata.json` file from the Developer Portal, and make sure the `tx, ty, tz` and `qw, qx, qy, qz` properties have meaningful values (other than 0).

To get correct results (especially rotation) from GeoPose localization, your map should be correctly GPS triangulated, see our [advanced documentation](http://developers.immersal.com/docs/mapsmapping//advanced/gps-triangulation/).

## Overview of the scene

The scene is very similar to the Simple sample, with the addition of `GPSLocationProvider` and the `GeoPoseLocalization` object under the `Localizer` GameObject.

![](https://developers.immersal.com/docs/static/unity/samplescenes/GeoPoseSample.png)

## Using the sample

1.  For previewing with the point cloud, add your map ID into your XR Map game object. If you have several XR Maps, note that the GeoPose localizer assumes the localization results are related to the first map in the list. In `XRMapVisualization`, turn on Editor and Runtime render mode.
2.  In your XR Map, make sure Localization method is set to GeoPoseLocalization.
3.  Open Build Settings (Ctrl + Shift + B) and make sure only the GeoPoseSample is included in the Scenes in Build.
4.  Change your Player Settings if necessary. It's a good idea to change the Product Name and Package Name so the app will not overwrite a previously installed app on your device.
5.  Build the app and install it to your devices.

When you start the app and look around at a location you have mapped, the device should localize and find a pose in just seconds.
