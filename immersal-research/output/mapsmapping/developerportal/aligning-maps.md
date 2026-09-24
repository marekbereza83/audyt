# Aligning Maps

Zrodlo: https://developers.immersal.com/docs/mapsmapping/developerportal/aligning-maps/

---

# Aligning Maps

Enterprise license is required to use this feature.

How map alignment works.

When you click 'align map' in the developer portal, it will ask you to select the root map. The chosen root map will be used as the reference for setting the transforms of other maps in relation to it. The alignment process itself is automatic. You simply need to press the button and it will overwrite the transforms if possible, merging them seamlessly. The transform values are stored in the map's metadata. Once the map is loaded into Unity by checking the 'apply alignment' box, the map will be appropriately offset.

*   Make sure the maps have enough overlap to connect.
*   The algorithm will try to find matching feature pairs.

To initiate the Aligning process, follow these steps:

*   You can log in to the [Developer Portal](https://developers.immersal.com/).
*   In the Developer Portal, select two maps that have enough overlap.

![Selected maps](https://developers.immersal.com/docs/static/tutorials/aligning/1_select2map.png)

Selected maps

*   Click the button **Align maps**.

!["Align Maps" Button](https://developers.immersal.com/docs/static/tutorials/aligning/2_alignbutton.png)

"Align Maps" Button

*   Select root map to stitch other maps to.
*   Aligning root to origin will reset the root map's coordinate position and rotation to (0,0,0). This is good for Unity. You will lose the global real world coordinates.

![Select "Root Map" and "Name for Alignment"](https://developers.immersal.com/docs/static/tutorials/aligning/3_alignmentofmap.png)

Select "Root Map" and "Name for Alignment"

*   The alignment will be applied to selected maps metadata.
*   Output .json will describe if the process was successful.

![.json File](https://developers.immersal.com/docs/static/tutorials/aligning/4_jsonfilealignment.png)

.json File

*   The connected list shows which maps were successfully aligned, and the disconnected list is for the failed maps.
*   The transform values are stored in the map's metadata. Upon loading the map into Unity, by checking the 'apply alignment' box, the map will be appropriately offset.
