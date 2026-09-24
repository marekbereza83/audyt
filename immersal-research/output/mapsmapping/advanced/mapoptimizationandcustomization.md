# Map Optimization

Zrodlo: https://developers.immersal.com/docs/mapsmapping/advanced/mapoptimizationandcustomization/

---

# Map Optimization

The mapping process in Immersal is highly flexible. On one hand, you can edit maps using the ['Map Editing'](https://developers.immersal.com/docs/mapsmapping/advanced/map-editing-feature/) feature; on the other hand, you can adjust various [map construction parameters](http://developers.immersal.com/docs/mapsmapping/advanced/mapoptimizationandcustomization/#map-construction-tweaking) based on the characteristics of the physical space to improve map quality.

The diagram below illustrates a complete workflow for map optimization. After optimizing a map, it is necessary to have a ['Map Testing'](https://developers.immersal.com/docs/mapsmapping/advanced/map-editing-feature/) method to validate the quality of the optimized map. First, you need to use the Immersal Mapper to collect a sufficient number of test images by taking photos. Then, use these test images for localization testing to determine the localization success rate of the map.

You can decide whether the latest map is optimal by considering both its localization success rate and size, based on your optimization goals. For example:

*   If you increase featureCount/featureCountMax, it may capture more features but will also result in a larger map size.
*   If you reduce trackerLengthMin, you can achieve a smaller map size, but it may significantly affect the localization success rate.

Therefore, you should evaluate the results according to your specific optimization goals to determine whether the current map is optimal.

![Map optimization workflow](../../../static/tutorials/mapoptimization.png)

Map optimization workflow

For map editing / cropping check the ["Map Editing Feature"](https://developers.immersal.com/docs/mapsmapping/advanced/map-editing-feature/)

## Map Construction Tweaking

You can tweak several parameters to ‘/construct’ endpoint of REST API for map customization and optimizations, as shown in the sample [script](https://github.com/immersal/immersal-python-tools-for-customer/blob/main/rest-api-samples/Immersal_REST_API_samples.py).

```none
def StartMapConstruction(url: str, token: str, mapName: str) -> str:
    complete_url = url + "/construct"

    data = {
        "token": token,
        "name": mapName,
        "preservePoses": False,
        # "featureCount": 1024, #default: 1024
        # "featureCountMax": 8192, #default: 8192,
        # "featureFilter": 0, # default: 0
        # "trackLengthMin": 2, #default: 2
        # "triangulationDistanceMax": 512, # default: 512
        # "dense": 1, # default: 1
    }
```

### FeatureCount

(default=1024): Maximum number of features/landmarks to keep per image after map construction.

### FeatureCountMax

(default=8192): Maximum number of features extracted from the image. By increasing these values, more features will be extracted, but it will also generate a bigger map.

### featureFilter

(default=0) Possible values are 0 or 1. In scenes where there are lots of unique details like grass, bushes, leaves, gravel, etc., we would pick a lot of noisy details (high frequency features) as our top picks. These features were very difficult to localize against. By using this parameter in map construction, it sorts the detected features based on size favoring large features (low frequency features). This seems to improve map construction and localization rate in high frequency environments.

### TrackerLengthMin

(default=2) This value represents the minimum number of images from which a feature point must originate to be kept in the final map. The larger the number, the higher the reliability required for feature points, resulting in fewer points being retained and a smaller map. We usually start with a default value of 2 and gradually increase it (typically between 2 and 5), observing the success rate of positioning until it noticeably drops.

### TriangulationDistanceMax (default=512)

This value represents the maximum distance to the target object for positioning, measured in meters. A value of 512 means that the system supports constructing a point cloud for an object up to 512 meters away. It's important to note that in triangulation, if your target object is far away, your baseline (the distance moved laterally) should be correspondingly increased, typically to 5%-10% of the distance. Otherwise, the point clouds for these distant objects will be unreliable. It is also important to note that sometimes constructing point clouds for distant objects is not a good idea because the accuracy of positioning decreases with distance. Therefore, you should adjust this parameter based on the actual scenario.

### dense (default=1)

This parameter determines whether the job will generate a dense map and a 3D model ('.glb' file). Typically, if your mapping data comes from the [Polycam pipeline](http://developers.immersal.com/docs/mapsmapping/advanced/polycam-pipeline/), [360 camera pipeline](http://developers.immersal.com/docs/mapsmapping/advanced/360-camera-pipeline/), or LiDAR(e.g. BLK2GO), you can disable this parameter. Doing so significantly speeds up the map generation process while allowing you to use the high-quality 3D models obtained from those sources.
