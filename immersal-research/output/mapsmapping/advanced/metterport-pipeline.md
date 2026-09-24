# Matterport Pipeline

Zrodlo: https://developers.immersal.com/docs/mapsmapping/advanced/metterport-pipeline/

---

# Matterport Pipeline

## Workflow overview

Here are some illustrations to showcase how you would need to take

*   Scans for regular geometry surveying job
*   VPS scanning job with a Matterport
*   BLK2GO

![Comparison](../../../static/tutorials/mapping/matterport/3combined.png)

Comparison

## Before mapping

### How stationary scanners work

*   Matterport and other stationary scanners have been developed for a very different use case. The primary use case for these devices is to provide a high-resolution, colored point cloud of a target location. You take as few scans from the location as possible to make sure all details are captured and then process the scans in some software.
*   You take scans so every part of the location is only seen once with minor overlap between different scans.
*   With our Cloud Service, you need to see the same visual features from different viewpoints. You need to have a lot of overlap between images.

![Ensuring enough overlapping](../../../static/tutorials/mapping/matterport/360vps.png)

Ensuring enough overlapping

## Mapping Process for stationary camera

*   Set up the device on a tripod and take a scan. Move to another location and repeat.
*   Use a software to "register" (align) the scans. The scanners often don't have a tracking solution, so the individual scans have no idea where they were taken in relation to one another. You need to align all the scans and this is why you need some overlap between the different scans.
*   Once the scans are aligned, you have both the 360 images and camera poses that you can use for our Cloud Service

## Steps

1.  Purchase the e57 file of the space from the Matterport web portal.
2.  Use the `unpack_matterport_e57.py` script to extract the image and pose data from the file. Instructions inside the script:

    ```none
    # 1. Install all dependencies mentioned at the top of the file with pip
    # 2. Acquire an e57 file of the desired Matterport scan
    # 3. Set input_path to point to the e57 file
    # 4. Run the script
    # 5. Check the "out" directory generated in the same directory as the e57
```

3.  Use the submit\_matterport.py script to create and submit a map from the extracted data. Instruction inside the script:

    ```none
    # 1. Install all dependencies mentioned at the top of the file with pip
    # 2. Acquire an e57 file of the desired Matterport scan
    # 3. Use the unpack_matterport_e57.py script to unpack the data
    # 4. Set input_directory to point to the directory where the data was unpacked
    # 5. Give a name for your map in map_name and input your Immersal Developer Token in token
    # 6. Run the script and go check Immersal Develop Portal if no errors were presented
```

unpack dependencies:

```none
import numpy as np              # pip install numpy
import pye57                    # pip install pye57

# note: pye57 requires manual wheel compilation and installation on macos
# see e.g. https://jakubuhlik.com/docs/pcv/docs.html#libraries-building
```

submit dependencies:

```none
from natsort import natsorted   # pip install natsort
import numpy as np              # pip install numpy
import open3d as o3d            # pip install open3d
import requests                 # pip install requests
import cv2                      # pip install opencv-python
```

These are Pro features please contact support to get these scripts.
