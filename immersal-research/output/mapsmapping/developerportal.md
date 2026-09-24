# Developer Portal

Zrodlo: https://developers.immersal.com/docs/mapsmapping/developerportal/

---

# Developer Portal

Overview of our Developer Portal

### New Accounts and logging in

You can create an account by registering at our [Developer Portal](https://developers.immersal.com/). The account is free for non-commercial and evaluation use.

After registering, you can log in to the portal.

![Developer Portal landing page.](https://developers.immersal.com/docs/static/tutorials/devportal/1login.png)

Developer Portal landing page.

## Portal Features

The main use for the Developer Portal is to download and manage your maps constructed using the [Must Add Immersal Mapper mapping app](https://developers.immersal.com/).

You can also find links to the latest SDK core package and Unity sample projects in the portal.

### Overview

![Default view of the portal](https://developers.immersal.com/docs/static/tutorials/devportal/2devportal.png)

Default view of the portal

After logging in, you should see something similar to the above screenshot.

By default, you will see a list of your own maps.

The portal has:

*   Options to reset your account password or private developer token.
*   Links to SDK core .unitypackage and the sample project for Unity.
*   Links to this documentation and our Discord support channel.
*   Button to copy your private developer token that's needed for some of the REST API calls.
*   A Jobs list that shows either all your maps or public maps.

### The Jobs list

This is the map list. You can further filter the list by using the search box. The list can also be sorted by the different columns.

Each map in the list has several properties:

*   Map id. This does not change and you can use it throughout the SDK to refer to a specific map.
*   Map name. Specified when starting a new map construction and might change later.
*   Status. A map can be pending, processing, partially processed (sparse), failed or done.
*   Images. Amount of images used in map construction.
*   Sharing. A map can be either private and accessed with your token only, or public for anyone to download.
*   Latitude and Longitude. If GPS data was recorder during the mapping process, the resulting map is geotagged.
*   SDK. Version of our SDK used to construct the map.
*   Creator. Account name for the original creator. Useful when sharing maps.
*   Created. Date and time of map creation.
*   Downloadable files. Output files from map construction.

## Downloadable files

We provide four outputs for each map construction.  
By hovering over the filenames, you can see the SHA256 hash of the map. You can also get this via our REST API and verify runtime map downloads.

*   The map file with .bytes extension. This is the actual map file used by our SDK for localization.
*   A sparse point cloud representation of the map as a .ply file.
*   A dense triangle mesh representation of the map as a .ply file.
*   A textured triangle mesh representation of the map as a .glb file.

![Sparse point cloud representation of the map data](https://developers.immersal.com/docs/static/tutorials/devportal/3_sparse.png)

Sparse point cloud representation of the map data

![Dense triangle mesh representation with vertex colors](https://developers.immersal.com/docs/static/tutorials/devportal/4_dense.png)

Dense triangle mesh representation with vertex colors

### Map Preview

There's an eye icon next to the point cloud and mesh downloads. Clicking the icon opens a 3D model viewer to a new tab. You can easily review maps this way.

![](https://developers.immersal.com/docs/static/tutorials/devportal/5_point-cloud.gif)

![](https://developers.immersal.com/docs/static/tutorials/devportal/6_mesh.gif)

If the map is public, you can even share the viewer link.  
[https://immersal.com/developers/view.html?1&5555&0](https://immersal.com/developers/view.html?1&5555&0)

### Viewing public maps

In addition to viewing and managing your own maps, you can also view all public maps. There are two different modes

![](https://developers.immersal.com/docs/static/tutorials/devportal/7dev_portal_modes.jpeg)

### Filter by GPS coordinates

[](https://developers.immersal.com/docs/static/tutorials/devportal/7mapediting.jpeg)You can search for maps near a location by specifying latitude and longitude coordinates and a radius in meters.  
By leaving the fields empty (showing just placeholder values) you can view all public maps.

![](https://developers.immersal.com/docs/static/tutorials/devportal/8dev_portal_public_maps_near_location.jpeg)

### Filter by creator

![](https://developers.immersal.com/docs/static/tutorials/devportal/9dev_portal_public_maps_from_user.jpeg)

You can also search for any user's public maps with the third mode. Just input a user account name to search.

## Managing maps

### Deleting maps

You can select maps and delete them. Any public maps may have been downloaded previously by other users and they can still retain a copy of the map.

### Stitching maps

You can select two or more maps for stitching. This operation creates a new map that is the combination of the input maps.  
For stitching to work, the input maps need to have visual overlap in their coverage. They need have parts of the same location in them.

In the below sample, notice the overlapping area in both maps in the far side of the room.

![](https://developers.immersal.com/docs/static/tutorials/devportal/10_map1.png)

![](https://developers.immersal.com/docs/static/tutorials/devportal/11map2.png)

![](https://developers.immersal.com/docs/static/tutorials/devportal/12maps_stitched.png)

### Sharing mode / Map privacy

You can select one or more maps and set them to either private or public.  
Private maps can be downloaded only by you with your private developer token. Public maps are downloadable by anyone.

### Sending maps to another accounts

You can select one or more maps and send a copy of them to another user. This is an easy way to quickly share maps between accounts when you don't want to make them public.

Remember that you can not delete the other users copy of the map.
