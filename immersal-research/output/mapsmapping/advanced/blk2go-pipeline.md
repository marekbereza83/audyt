# BLK2GO Pipeline

Zrodlo: https://developers.immersal.com/docs/mapsmapping/advanced/blk2go-pipeline/

---

# BLK2GO Pipeline

Pro or Enterprise license is required to use this feature.

## Device overview

![Leica BLK2GO](../../../static/tutorials/mapping/blk2go/leica_blk2go.png)

Leica BLK2GO

#### The [Leica BLK2GO](https://shop.leica-geosystems.com/leica-blk/blk2go/overview) features:

*   LiDAR range Min. 0.5 m - up to 25 m
*   Three cameras,vertical FOV 270°
*   One high resolution front camera
*   IMU
*   GrandSLAM
*   Allows mapping medium and large areas comfortably
*   10x faster mapping time on site
*   Captures a lot of images using the three cameras simultaneously
*   Tracks the camera poses in realtime

Immersal uses the images and poses from the three cameras on the device.

## Workflow overview

![Leica BLK2GO Mapping workflow](../../../static/tutorials/mapping/blk2go/blk2go.png)

Leica BLK2GO Mapping workflow

## Settings

It is important to check that the settings are set correctly before starting mapping.

##### warning

"Store Images" MUST be enabled, otherwise the scan can not be constructed into a map

*   "Image format" should be set to "Uncompressed images"
*   "Point cloud density" should be set to "Full density". This helps with the SLAM
*   "Press and Go" is optional. It allows you to start mapping without placing the device down on the stand
*   "Show trajectory" is optional, but recommended as it is helpful especially when mapping larger locations

![Leica BLK2GO Recommended settings](../../../static/tutorials/mapping/blk2go/blk2go_settings.png)

Leica BLK2GO Recommended settings

![Example shows if "Store Images" is not enabled, map construction will fail](../../../static/tutorials/mapping/blk2go/blk2go_store_images.png)

Example shows if "Store Images" is not enabled, map construction will fail

## Mapping workflow

### Before Mapping

Before mapping with the BLK2GO, it is a good idea to plan your route first. This is helpful to make sure the whole space is mapped correctly.

*   Start from open space
    *   Corners or near wall is not optimal
*   In difficult environments stop for a few seconds once in a while
*   When transitioning to a different environment (new room, different lighting) stop and show both environments for a few seconds
*   Close the loop. It is better if starting and end point is same place, or even with some extra overlap

### During Mapping

Once you have your route planned, you are ready to start mapping

*   Capture viewpoints your end user will be seeing. Your map will work in roughly the areas where you walked
*   Keep slowish pace, like walking with a full cup of water.
*   You should avoid straight camera lines. Walk in a snakelike zigzag pattern, to create more parallax
*   To scan efficiently try to capture all directions in one go.
*   Move the BLK2GO in an arc motion in front of you. Turn from the hips and not your shoulder
*   Capture images forwards and backwards

![Scanning in an arc motion](../../../static/tutorials/mapping/blk2go/blk2go_arc.png)

Scanning in an arc motion

### After Mapping

#### Downloading Scans

After mapping, you can access the scans on the device either through a connected cable, or with Wi-Fi.  
The BLK2GO is a router that you can connect to using Wi-Fi. You can find the password under the battery slot on the device.

Browse to address 10.1.1.1 for the portal, where you can download your scans as .b2g files. The password is the same as Wi-Fi

![Accessing the scans on the BLK2GO](../../../static/tutorials/mapping/blk2go/blk2go_scans.png)

Accessing the scans on the BLK2GO

#### Uploading scans

You can upload your scan .b2g file in the [Immersal Developer Portal](https://developers.immersal.com/) This feature requires you to have a Pro or Enterprise license.

![Uploading the scans in the Developer Portal](../../../static/tutorials/mapping/blk2go/blk2go_portal.png)

Uploading the scans in the Developer Portal

![Uploading the b2g files](../../../static/tutorials/mapping/blk2go/blk2go_upload.png)

Uploading the b2g files

## Mapping example

Mapping with the Leica BLK2GO
