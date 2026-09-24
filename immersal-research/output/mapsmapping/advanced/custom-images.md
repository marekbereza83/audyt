# Custom Images

Zrodlo: https://developers.immersal.com/docs/mapsmapping/advanced/custom-images/

---

# Custom Images

How to submit images from custom sources via the REST API.

### Required Parameters

See the [Capture Image](http://localhost:5000/docs/rest-api/#capture-image-binary) REST API documentation. In addition to the actual image data, you need the following metadata.

*   `run` An integer for the current device tracking session. Images with the same parameter are in the same relative coordinate space and the camera pose for the images can be used to compute orientation and map scale.  
    This should be the same for all images within the same continuous coordinate space. With ARKit, this should be incremented whenever tracking is lost or when the images are from different mapping sessions.
    
*   `index` is a running integer counter for the images.
    
*   `anchor` is a boolean flag indicating the anchor image. There can only be one anchor image in the map. If multiple images with this parameter set True are submitted, the new ones always override the old one.
    
*   `px`, `py`, `pz` are the float values for the position for the camera pose.
    
*   `r00`, `r01`, `r02`, `r10`, `r11`, `r12`, `r20`, `r21`, `r22` are the float values for the matrix3x3 rotation matrix for the camera pose.
    
*   `fx`, `fy` are the float pixel focal length values for the image for both image axes. They should be the same.
    
*   `ox`, `oy`, are the float values for the principal point offset for both image axes. These values will be roughly `ox = image_width / 2, oy = image_height / 2` and some hardware-specific offset.
    

## Coordinate System

Immersal uses a right-hand coordinate system for map construction and visual positioning.

### Position

The input image position is expressed in a right-handed coordinate system where the forward direction is along the negative Z-axis.

Position

### Rotation

The rotation for the images is expressed as a 3x3 column-major rotation matrix in a right-handed coordinate system. The image coordinate system is similar to OpenCV where the image up direction is the negative Y axis and forward direction is the negative Z axis.

Rotation

### Using photogrammetry software as input

If you have existing photogrammetry models done in software such as Agisoft's Metashape, you can use the computed camera poses and the images as input to Immersal's Cloud Service.

Most software allows you to export the camera data required by Immersal.

You need to have the photogrammetry model in the correct metric scale, 1 unit = 1 meter. It's also good to have the model aligned so that the Y axis points up.

### Metashape

*   Construct a photogrammetry model in Metashape
*   Use the Metashape tools to set the correct scale and orientation to the model
*   Export the camera data as `.xml` File -> Export -> Export Cameras...
*   Parse the `px`, `py`, `pz`, `r00`...`r22`, `fx`, `fy`, `ox`, `oy` values from the `.xml` for each image and submit the image with the metadata to Immersal Cloud Service

![Sample input images extracted as frames from a video](https://developers.immersal.com/docs/static/tutorials/mapping/customimages/sample-input-images.png)

Sample input images extracted as frames from a video

![Setting the scale and orientation with manually placed Markers](https://developers.immersal.com/docs/static/tutorials/mapping/customimages/setting-scale-orientation-markers.png)

Setting the scale and orientation with manually placed Markers

![Photogrammetry model and camera poses in Metashape](https://developers.immersal.com/docs/static/tutorials/mapping/customimages/ph-model-cameraposes.png)

Photogrammetry model and camera poses in Metashape

**Sample script to parse the required metadata from the .xml file and save it as .json files next to the images**

```csharp
from bs4 import BeautifulSoup  # pip install bs4 lxml
import os
import numpy as np # pip install numpy
import json


def main(xmlFile, imagesDirectory):
    with open(xmlFile, "r") as handle:
        soup = BeautifulSoup(handle, "xml")

        # SENSORS
        sensorsList = []
        sensors = soup.find_all("sensor")
        for s in sensors:
            sensor_id = int(s.attrs.get("id"))
            calibration = s.find("calibration")
            resolution = calibration.find("resolution")
            width = int(resolution.attrs.get("width"))
            height = int(resolution.attrs.get("height"))
            f = float(calibration.find("f").contents[0])
            cx = float(calibration.find("cx").contents[0])
            cy = float(calibration.find("cy").contents[0])

            data = {
                "sensor_id": sensor_id,
                "width": width,
                "height": height,
                "f": f,
                "ox": width / 2 + cx,
                "oy": height / 2 + cy,
            }

            sensorsList.append(data)

        # COMPONENTS
        componentsList = []
        components = soup.find_all("component")
        for co in components:
            component_id = int(co.attrs.get("id"))
            transform = co.find("transform")
            r = transform.find("rotation").contents[0].split(" ")
            t = transform.find("translation").contents[0].split(" ")
            s = transform.find("scale").contents[0]

            m = np.empty((4, 4))
            m[0][0] = float(r[0])
            m[0][1] = float(r[1])
            m[0][2] = float(r[2])
            m[0][3] = float(t[0])
            m[1][0] = float(r[3])
            m[1][1] = float(r[4])
            m[1][2] = float(r[5])
            m[1][3] = float(t[1])
            m[2][0] = float(r[6])
            m[2][1] = float(r[7])
            m[2][2] = float(r[8])
            m[2][3] = float(t[2])
            m[3][0] = 0.0
            m[3][1] = 0.0
            m[3][2] = 0.0
            m[3][3] = 1.0 * float(s)

            data = {
                "component_id": component_id,
                "tx": float(t[0]),
                "ty": float(t[1]),
                "tz": float(t[2]),
                "r00": float(r[0]),
                "r01": float(r[1]),
                "r02": float(r[2]),
                "r10": float(r[3]),
                "r11": float(r[4]),
                "r12": float(r[5]),
                "r20": float(r[6]),
                "r21": float(r[7]),
                "r22": float(r[8]),
                "xf": m,
            }

            componentsList.append(data)

        # CAMERAS
        cameras = soup.find_all("camera")
        for c in cameras:
            sensor_id = c.attrs.get("sensor_id")
            component_id = c.attrs.get("component_id")

            if sensor_id is not None and component_id is not None:
                sensor = next(
                    (
                        item
                        for item in sensorsList
                        if item["sensor_id"] == int(sensor_id)
                    ),
                    None,
                )
                component = next(
                    (
                        item
                        for item in componentsList
                        if item["component_id"] == int(component_id)
                    ),
                    None,
                )

                if sensor is not None and component is not None:
                    f = sensor["f"]
                    ox = sensor["ox"]
                    oy = sensor["oy"]

                    filename = c.attrs.get("label")

                    camera_transform = c.find("transform").contents[0].split()
                    component_xf = component["xf"]

                    camera_xf = np.empty((4, 4))
                    camera_xf[0][0] = float(camera_transform[0])
                    camera_xf[0][1] = float(camera_transform[1])
                    camera_xf[0][2] = float(camera_transform[2])
                    camera_xf[0][3] = float(camera_transform[3]) * component_xf[3][3]
                    camera_xf[1][0] = float(camera_transform[4])
                    camera_xf[1][1] = float(camera_transform[5])
                    camera_xf[1][2] = float(camera_transform[6])
                    camera_xf[1][3] = float(camera_transform[7]) * component_xf[3][3]
                    camera_xf[2][0] = float(camera_transform[8])
                    camera_xf[2][1] = float(camera_transform[9])
                    camera_xf[2][2] = float(camera_transform[10])
                    camera_xf[2][3] = float(camera_transform[11]) * component_xf[3][3]
                    camera_xf[3][0] = float(camera_transform[12])
                    camera_xf[3][1] = float(camera_transform[13])
                    camera_xf[3][2] = float(camera_transform[14])
                    camera_xf[3][3] = float(camera_transform[15])

                    xf = np.matmul(component_xf, camera_xf)

                    r00 = xf[0][0]
                    r01 = xf[0][1]
                    r02 = xf[0][2]
                    r03 = xf[0][3]
                    r10 = xf[1][0]
                    r11 = xf[1][1]
                    r12 = xf[1][2]
                    r13 = xf[1][3]
                    r20 = xf[2][0]
                    r21 = xf[2][1]
                    r22 = xf[2][2]
                    r23 = xf[2][3]
                    r30 = xf[3][0]
                    r31 = xf[3][1]
                    r32 = xf[3][2]
                    r33 = xf[3][3]

                    data = {
                        "img": filename,
                        "px": r03,
                        "py": r13,
                        "pz": r23,
                        "r00": r00,
                        "r01": r01,
                        "r02": r02,
                        "r10": r10,
                        "r11": r11,
                        "r12": r12,
                        "r20": r20,
                        "r21": r21,
                        "r22": r22,
                        "fx": sensor["f"],
                        "fy": sensor["f"],
                        "ox": sensor["ox"],
                        "oy": sensor["oy"],
                    }

                    json_path = os.path.join(imagesDirectory, f"{filename}.json")

                    with open(json_path, "w") as outfile:
                        pretty_print = json.dumps(data, indent=4)
                        outfile.write(pretty_print)


if __name__ == "__main__":
    xmlFile = "path_to.xml"
    imagesDirectory = "images\\directory"
    main(xmlFile, imagesDirectory)
```

To create a new map from the data:

*   Clear the current workspace to start a new map
*   Submit the images
*   Start map construction

```csharp
import os
import cv2 # pip install opencv-python
import base64
import requests # pip install requests
import json
import math
import struct
import concurrent.futures
import numpy as np


def ClearWorkspace(url, token, deleteAnchor):
    complete_url = url + "/clear"

    data = {"token": token, "anchor": deleteAnchor}

    json_data = json.dumps(data)

    r = requests.post(complete_url, data=json_data)
    print(r.text)


def StartMapConstruction(url, token, preservePoses, mapName):
    complete_url = url + "/construct"

    data = {
        "token": token,
        "featureCount": 1024,
        "preservePoses": preservePoses,
        "name": mapName,
    }

    json_data = json.dumps(data)

    r = requests.post(complete_url, data=json_data)
    print(r.text)


def SubmitImage(imagesDirectory, jsonList, downsample, i, url, token):
    complete_url = url + "/captureb64"

    with open(os.path.join(imagesDirectory, jsonList[i]), "r") as f:
        json_data = json.load(f)

        fx = json_data["fx"]
        fy = json_data["fy"]
        ox = json_data["ox"]
        oy = json_data["oy"]

        filepath = os.path.join(imagesDirectory, json_data["img"])
        run = 13 # some integer for the current "tracking session"
        index = i

        img = cv2.imread(f"{filepath}.png", cv2.IMREAD_GRAYSCALE)
        height, width = img.shape

        mpix = height * width
        scaleFactor = math.sqrt(2000000 / mpix)
        if downsample and scaleFactor < 1.0:
            dim = (round(width * scaleFactor), round(height * scaleFactor))
            resized = cv2.resize(img, dim, interpolation=cv2.INTER_AREA)

            fx = fx * scaleFactor
            fy = fy * scaleFactor
            ox = ox * scaleFactor
            oy = oy * scaleFactor

            b64 = base64.b64encode(cv2.imencode(".png", resized)[1].tobytes())
        else:
            b64 = base64.b64encode(cv2.imencode(".png", img)[1].tobytes())

        px = json_data["px"]
        py = json_data["py"]
        pz = json_data["pz"]
        r00 = json_data["r00"]
        r01 = json_data["r01"]
        r02 = json_data["r02"]
        r10 = json_data["r10"]
        r11 = json_data["r11"]
        r12 = json_data["r12"]
        r20 = json_data["r20"]
        r21 = json_data["r21"]
        r22 = json_data["r22"]

        pos = [px, py, pz]
        rot = [r00, r01, r02, r10, r11, r12, r20, r21, r22]

        data = {
            "token": token,
            "run": run,
            "index": index,
            "anchor": False,
            "px": pos[0],
            "py": pos[1],
            "pz": pos[2],
            "r00": rot[0],
            "r01": rot[1],
            "r02": rot[2],
            "r10": rot[3],
            "r11": rot[4],
            "r12": rot[5],
            "r20": rot[6],
            "r21": rot[7],
            "r22": rot[8],
            "fx": fx,
            "fy": fy,
            "ox": ox,
            "oy": oy,
            "latitude": 0.0, # no GPS coordinates specified
            "longitude": 0.0,
            "altitude": 0.0,
            "b64": str(b64, "utf-8"),
        }

        json_data = json.dumps(data)

        r = requests.post(complete_url, data=json_data)
        return r.text


def SubmitImageSet(imagesDirectory, url, token, downsample):
    jsonList = [file for file in os.listdir(imagesDirectory) if file.endswith(".json")]

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        results = [
            executor.submit(
                SubmitImage,
                imagesDirectory,
                jsonList,
                downsample,
                i,
                url,
                token,
            )
            for i in range(0, len(jsonList))
        ]

        for f in concurrent.futures.as_completed(results):
            print(f.result())


def main():
    url = 'https://api.immersal.com'
    token = "your-token-here"
    imagesDirectory = "path\\to\\images"
    mapName = "mapName"
    downsample = True # Downsamples the input images to 2 mpix
    preservePoses = True # Map will match the photogrammetry software coordinates

    ClearWorkspace(url, token, True)
    SubmitImageSet(imagesDirectory, url, token, downsample)
    StartMapConstruction(url, token, preservePoses, mapName)


if __name__ == "__main__":
    main()
```
