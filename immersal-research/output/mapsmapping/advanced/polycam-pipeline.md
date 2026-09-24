# Polycam Pipeline

Zrodlo: https://developers.immersal.com/docs/mapsmapping/advanced/polycam-pipeline/

---

# Polycam Pipeline

Pro or Enterprise license is required to use this feature.

## Workflow overview

![Polycam Pipeline](../../../static/tutorials/mapping/polycam/img1.png)

Polycam Pipeline

### Pros

*   Great UX on mapping
*   Optimized and reliable camera pose for map construction
*   High-quality mesh from Polycam for content development

### Cons

*   Each map should take no more than 1400 images

Demo Video

## Before mapping

### Route Planning

*   The most important basic principle during mapping is that our walking path needs to be consistent with the locations where we ultimately expect users to be able to perform localization. Therefore, we first need to consider the positions where we expect users to stand and the directions in which their camera should be oriented. The walking paths and camera orientations during mapping need to be as consistent with these expectations as possible.
    
*   For mapping a larger space, a good practice is not to scan everything in one go, but rather to divide the space into sections, scan one section first, and then expand based on it (refer to the 'Extending Space' section in the documentation).
    
*   For mapping a larger space, it's necessary to ensure a loop, meaning you need to start from the initial point, move slowly, and eventually return to the starting point, continuing to walk a certain distance further to ensure there is sufficient overlap.
    

![Ensuring enough overlapping](../../../static/tutorials/mapping/polycam/img2.png)

Ensuring enough overlapping

### Preparing Tools

*   Immersal developer account (Pro or Enterprise level)
*   Polycam app:
    *   Ensure that your 'Developer mode' is set to ‘on'.
    *   Conduct a mapping, try 'export', double check if you can export raw data including not only images but also poses.

![](../../../static/tutorials/mapping/polycam/img3.png)

## Mapping Steps

Open Polycam app, select the 'LiDAR' mode, we can use either video recording or photo-taking to map the space.

### Approach A : Video-recording approach

*   Under this approach, Polycam automatically captures a photo every 0.5 seconds. This frequency cannot be customized; it will automatically adjust based on the movement of the user and whether LiDAR can reach the surface. The number of photos taken is not shown on the UI.
    
*   Please be careful not to move too quickly. Pay attention to the prompts on the UI, if you move too fast, it will display a "slow down" text. Moving too quickly can cause the photos to be blurry, which affects the extraction of features
    
    ![The alert of 'moving too fast'](../../../static/tutorials/mapping/polycam/img4.png)
    
    The alert of 'moving too fast'
    
*   Under this approach, Polycam provides real-time visual feedback through the generated mesh of the environment. It's important to note that it may naturally lead users to point the camera towards the ground, walls, or ceiling to generate mesh. However, photos of surfaces with little features are ineffective for constructing spatial maps with Immersal (unless the surfaces have many features, such as text/patterns). Conversely, what is more effective for Immersal mapping is aiming the camera towards open areas inside a room to capture many objects within it. Moreover, always remember the basic principle of mapping, the camera pose during the mapping should be as consistent as possible with that during localization. Therefore, do not aim vertically at the ground, walls, or ceiling, unless users really need to get localized towards these surfaces.
    
*   It's particularly important to note that the LiDAR used by the iPhone/iPad for Polycam has a limited detection range (< 5m). For objects beyond this distance, Polycam cannot generate mesh, but Immersal can still use these images for map construction. Therefore, you can aim at slightly distant objects, allowing the automatic photo capture to catch them, even if you can't see PolyCam's visual feedback.
    
*   Please avoid facing blank walls, the ground, or reflective surfaces, such as glass or mirrors.
    

![LiDAR mode, video-shooting approach](../../../static/tutorials/mapping/polycam/img5.png)

LiDAR mode, video-shooting approach

### Approach B : Photo-taking approach

*   The photo capture mode is more flexible because the photographer can freely control the density of the photos taken and see the number of photos. However, you need to pay attention for the orientation of the camera to ensure there is sufficient overlap between every two photos; otherwise, it will affect the mapping process.
    
*   Take a photo every certain distance (e.g., every two meters), first capturing a surface within LiDAR range (within 5 meters). If the target is within 5 meters, photograph it directly; if beyond 5 meters, angle the camera downwards towards the ground. Then, rotate the camera to shoot in other directions (which can exceed 5 meters), paying special attention to ensure there is sufficient overlap between every two photos!
    
*   It's particularly important to note that the LiDAR of iPhone/iPad has a detection range of only ~5 meters. For objects beyond this distance, PolyCam cannot generate mesh. However, Immersal can still use these pictures for mapping. Therefore, you can aim at objects that are a bit farther away, but avoid continuously aiming at the sky. Ensure that as you move, the LiDAR can always touch a surface.
    
*   Pay attention to the photo count in the bottom right corner, not the progress bar in the bottom left.
    
*   If you're mapping a road, you should walk down it in one direction and then return in the opposite direction, covering it twice.
    
*   Please avoid facing blank walls, the ground, or reflective surfaces, such as glass or mirrors.
    

![LiDAR mode, photo-taking approach](../../../static/tutorials/mapping/polycam/img7.png)

LiDAR mode, photo-taking approach

![The number of photo taken](../../../static/tutorials/mapping/polycam/img6.png)

The number of photo taken

## Mapping Steps

! Note! (applicable to both video-shooting approach and photo-taking approach).

*   During the mapping, try to ensure that the LiDAR can reach a surface. Please avoid continuously pointing the camera towards the air. In such situations, since the LiDAR cannot reach a surface, it will affect the acquisition of a reliable camera position, thereby impacting the mapping results.
    
*   Avoid pointing the camera directly at the ground, walls, or ceiling. PolyCam's user interface interaction naturally leads users to aim the camera towards ground or ceiling, which is effective for generating mesh with PolyCam. However, this is not ideal for Immersal mapping because the shooting angle for Immersal mapping should be consistent with the posture commonly used by users during final positioning. Users generally do not aim towards the ground or ceiling for positioning (unless there are special markings on the ground, such as text, pictures, etc.). Please ensure the camera is aimed at objects around you, or diagonally downward (to allow LiDAR to reach the ground), or diagonally upward (if needing to cover the ceiling). In summary, try to mimic the posture users would likely use during final positioning.
    
*   When you need to cover tall objects like the exterior walls of buildings, start by capturing photos that include the ground. Then, gradually move upwards to cover the object in your shots, and afterward, slowly move back down to a position where the LiDAR can again reach the surface. This method ensures that you capture both the object of interest and maintain a reference to surfaces the LiDAR can detect, aiding in accurate mapping.
    
*   Avoid sudden acceleration and deceleration.
    
*   Do not suddenly rotate the camera.
    

![Avoid pointing camera directly to ground/ceiling](../../../static/tutorials/mapping/polycam/img8.png)

Avoid pointing camera directly to ground/ceiling

![Do not always aim the camera to the air](../../../static/tutorials/mapping/polycam/img9.png)

Do not always aim the camera to the air

### Submitting data in Polycam

*   After completing the video shooting or photography, select 'Custom', and check the 'Loop closure' option, which is for camera pose optimization. This option is automatically selected when the number of photos is less than 700. For more than 700 photos, it needs to be manually selected.

![enable 'loop closure'](../../../static/tutorials/mapping/polycam/img10.png)

enable 'loop closure'

![processing](../../../static/tutorials/mapping/polycam/img11.png)

processing

*   Please note that turning on 'Loop closure' is crucial. Through this, we can obtain more reliable camera pose data than the original one from ARKit, which aids in constructing an accurate spatial map. As demonstrated in the example of a ~60,000 square meter block, moving in such large spatial environments generates a significant amount of cumulative error. The original pose data from ARKit is no longer reliable, but after optimization, the errors can be corrected, allowing for the creation of precise spatial maps.

![Street block (~60,000 m2)](../../../static/tutorials/mapping/polycam/img12.png)

Street block (~60,000 m2)

![with 'loop closure'    Vs   without 'loop closure'](../../../static/tutorials/mapping/polycam/img13.png)

with 'loop closure' Vs without 'loop closure'

### Extending space

*   You can expand an existing space by selecting 'Extend'. Start by recognizing an area that has already been collected. After successful recognition, continue collecting data. Before proceeding, make sure to switch modes (record video or take photos).
    
*   Upon resubmission, the new processing round will include all the images from both the previous and the current sessions, resulting in a longer processing time.
    

![extend space](../../../static/tutorials/mapping/polycam/img14.png)

extend space

![Pay attention to the mode (video-shooting or photo0taking)](../../../static/tutorials/mapping/polycam/img15.png)

Pay attention to the mode (video-shooting or photo0taking)

## After mapping

### Exporting data from Polycam

*   Export the raw data from Polycam to your computer

### Uploading for Immersal map construction

*   Use script `submit_polycam_scan.py` from Immersal to convert and upload the exported Polycam raw data to the Immersal server. Specify Immersal server, your token, map name, and the directory path of the exported Polycam data within the script. Please note that the map name must consist of alphanumeric characters (A-Z/a-z/0-9) and should not contain spaces or special characters (e.g., -, \_, /).
    
*   Please pay special attention to using a wired network connection for uploading when you have a large number of images. This helps prevent interruptions during the upload process. When uploading, monitor the console output, and if the final output displays "error": "none", it signifies a successful upload. Otherwise, an error message will be printed indicating the issue.
    

![](../../../static/tutorials/mapping/polycam/img16.png)

### Testing localization with Immersal Mapper app

*   User may test localization on-site with Immersal Mapper app

### Exporting model from Polycam for adding AR content

*   We can export the high-quality models generated by Polycam for adding AR content. The exported models can be in OBJ format or any other Unity-compatible format. Simply place the exported models in the Assets directory of your Unity project. Based on these models, you can then add AR content. The exported models and the Immersal map(point cloud) should share the same coordinate system and should be aligned with each other.
