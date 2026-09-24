# Content Placement Sample

Zrodlo: https://developers.immersal.com/docs/unitysdk/samplescenes/content-placement-sample/

---

# Content Placement Sample

This simple scene shows how to store AR objects on the device locally for persistent AR experiences.

This sample requires you to first map a location with the ​[Mapper App](https://apps.apple.com/app/immersal-mapper/id1466607906)

Open the ContentPlacementSample scene found in the **"Assets/Samples/Immersal SDK Core/2.x.x/Core Samples/Scenes/"** folder.

## Downloading Your Map

Log in to the Developer Portal and download your map file of a pre-mapped location.

## Overview of the scene

The scene is similar to the Mapping App but has a few more game objects.

![](https://developers.immersal.com/docs/static/unity/samplescenes/contentplacementsample.png)

## ContentPlacementUI

A self-contained prefab that handles placing and storing AR objects in the scene.  
It is a simple implementation supporting copies of just one object to be instanced to the scene.  
The prefab consists of the ContentStorageManager Game Object and buttons to add and delete the AR objects.

![](https://developers.immersal.com/docs/static/unity/samplescenes/1content-placement-ui-hierarchy.png)

![](https://developers.immersal.com/docs/static/unity/samplescenes/2contentplacementscript.png)

ContentStorageManager.cs requires a reference to the XR Space game object under which the objects are instanced. You can also specify the name for the .json file that is stored on the device. The ContentStorageManager.cs writes the prefab locations to the specified .json file

## Using the Sample

1.  Place your downloaded map file into the XR Map game object's map file slot in the inspector.
2.  Open Build Settings (Ctrl + Shift + B) and make sure only the ContentPlacementSample is included in the Scenes in Build.
3.  Change your Player Settings if necessary. It's a good idea to change the Product Name and Package Name so the app will not overwrite a previously installed app on your device.
4.  Build the app and install it to your device.

When you start the app and look around at the location you mapped, the device should localize and find its pose in just seconds.

You can now add AR Diamond objects by clicking the Add Object button. You can delete all the objects by tapping on the Remove Objects button.

You can also move the AR Diamonds by dragging them on the screen. They have aMovableContent.cs script for the additional functionality.

If you restart the app, any placed diamonds will remain in place and persist between app sessions.

![](https://developers.immersal.com/docs/static/Unity/contentplacementui.jpg)
