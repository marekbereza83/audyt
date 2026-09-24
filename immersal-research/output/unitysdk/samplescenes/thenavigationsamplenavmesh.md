# The Navigation Sample (NavMesh)

Zrodlo: https://developers.immersal.com/docs/unitysdk/samplescenes/thenavigationsamplenavmesh/

---

# The Navigation Sample (NavMesh)

This scene features a basic navigation setup using Unity's NavMeshComponents System.

This sample requires you to first map a location with the ​[Mapper App](https://apps.apple.com/app/immersal-mapper/id1466607906)

Open the NavigationSampleNavMesh scene found in the **Assets/Samples/Immersal SDK Core/2.x.x/Core Samples/Scenes/** folder.

## Downloading Your Maps

Log in to the ​[developer portal](https://developers.immersal.com/) and download your map files of a pre-mapped location.

## Overview of the scene

Navigation Tutorial - Unity NavMesh

​[Sample Video with Blender](https://vimeo.com/showcase/6343595/video/363775920)

The scene is very similar to the Multimap sample. The difference is the added navigation features

![](../../../static/unity/samplescenes/navigationnavmesh/img0.png)

## AR Content and the NavMeshSurface

There are a couple of objects placed under the AR Space object.

The example\_mesh is geometry representation of the real-world locations floor area. This is used to create the NavMeshSurface used in path finding.

Then there are two Navigation Targets in the scene.

The `Generate NavMeshSurface here` object has a `NavMeshSurface.cs` script and we need to bake the NavMeshSurface data with the script before building the app.

## Using the sample

![](../../../static/unity/samplescenes/navigationnavmesh/gifnavmesh.gif)

You need to build your own mesh based on your map for this example.

## Building the geometry for path finding

Unity's NavMeshComponents uses 3d geometry to create a NavMesh for path finding.

You need to build the geometry in Unity Editor based on the point cloud preview using Unity's ProBuilder and ProGrids packages.

**OR**

You need to build the geometry in a 3rd party Content Creation Software such as [Blender](https://www.blender.org/) , [Maya](https://www.autodesk.eu/products/maya/overview?term=1-YEAR&tab=subscription) or [3ds Max](https://www.autodesk.eu/products/3ds-max/overview?term=1-YEAR&tab=subscription).

For this option you can download the sparse point could .ply file from the ​[Developer Portal](https://developers.immersal.com/). It is identical to the point cloud preview in Unity Editor.

This help page covers the workflow using [Blender](https://www.blender.org/).

## Building the floor geometry in Blender

Import the '.ply' file into Blender.

You'll notice that the point cloud is oriented sideways. This is because we generate the point cloud for a right-hand Y-up coordinate system and Blender uses a right-handed system with Z-up.

![](../../../static/unity/samplescenes/navigationnavmesh/img1.png)

In other software with matching coordinate systems, such as Maya, Houdini or Modo, the point cloud would be oriented correctly. But you may have to rotate the point cloud depending on your software of choice.

![Z-up coordinate system in Blender](../../../static/unity/samplescenes/navigationnavmesh/img2.png)

Z-up coordinate system in Blender

Rotate the point cloud 90 degrees on the X-axis to fix the point cloud orientation.

![The point cloud with its Y-axis now pointing up](../../../static/unity/samplescenes/navigationnavmesh/img3.png)

The point cloud with its Y-axis now pointing up

Now we can use the point cloud as a reference for building our scene. For navigation, we only need to create a mesh for areas where the user can move. In this case, the floor.

Use the basic modelling tools to build the geometry and align it to the point cloud. Make sure the floor level matches the floor level in the point cloud.

![Simple floor geometry](../../../static/unity/samplescenes/navigationnavmesh/img4.png)

Simple floor geometry

![Floor level matches the point cloud](../../../static/unity/samplescenes/navigationnavmesh/img5.png)

Floor level matches the point cloud

Export the geometry you created as a '.fbx' file. The Default settings work just fine, but be sure to check **"Selected Objects"** to only export the floor geometry.

![Export the floor geometry](../../../static/unity/samplescenes/navigationnavmesh/img6.png)

Export the floor geometry

![Export settings in Blender](../../../static/unity/samplescenes/navigationnavmesh/img7.png)

Export settings in Blender

It is good practice to clean the mesh before exporting.

Make sure that the object pivot is at scene origin so it matches the point cloud. Apply all rotations so the default orientation matches the point cloud. Make sure scale is applied. The object should have a scale of 1 in all axes.

## Setting up navigation in Unity

Import the floor geometry into Unity and place it into the scene under the AR Content game object.

The point cloud preview of your downloaded map and floor geometry should align.

![](../../../static/unity/samplescenes/navigationnavmesh/img8final.png)

Put the floor geometry into the Navigation layer in the inspector.

The Generate NavMeshSurface Here is set up to include all geometry in the Navigation layer for baking.

![](../../../static/unity/samplescenes/navigationnavmesh/img9.png)

Select the Generate Navigation Mesh Here Game Object and click **Bake** in the inspector.

You should now see the NavMeshSurface data overlaid on top of the floor with a blue color.

Navigation is all set up, now we only need Navigation Targets.

## Setting up Navigation Targets

A Navigation Target in this sample is simply a Game Object with a 'IsNavigationTarget.cs' script.

The script has options for setting up the targets Category, Name and Icon that will appear in the Target List Menu later.

Place the Navigation Targets on top of the NavMeshSurface.

The system will try to find targets that are reachable using the NavMeshSurface. Targets outside the area or too high to reach are not found.

The default height threshold is 2 meters.

This can be changed via **Window -> AI -> Navigation -> Agents**.

## Building and testing

1.  Place your downloaded map files into the AR Map game object's map file slots in the inspector and align the maps.
    
2.  Open Build Settings (Ctrl + Shift + B) and make sure only the NavigationSample is included in the Scenes in Build.
    
3.  Change your Player Settings if necessary. It's a good idea to change the Product Name and Package Name so the app will not overwrite a previously installed app on your device.
    
4.  Build the app and install it to your device.
    

When you start the app and look around at the location you mapped, the device should localize and find its pose in just seconds.

If you set the AR Map Render Mode options to **Editor and Runtime**, you should see the point cloud previews of the maps align to the real world as poses are found.

After successfully localizing, the floor geometry should align to the real world. Press **Show Navigation Targets** and pick a target to test the navigation.

![](../../../static/unity/samplescenes/navigationnavmesh/img10.png)

## Tips (Extra tutorials)

Here is a unity tutorial for creating basic NavMesh ( [https://youtu.be/CHV1ymlw-P8?si=HPwQgqsiSpQaETjh](https://youtu.be/CHV1ymlw-P8?si=HPwQgqsiSpQaETjh) )
