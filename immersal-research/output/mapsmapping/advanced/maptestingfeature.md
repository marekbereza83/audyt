# Map Testing

Zrodlo: https://developers.immersal.com/docs/mapsmapping/advanced/maptestingfeature/

---

# Map Testing

You have already built a map and now want to test its quality to check if it is good enough to use in your project. There are two ways to do that.

1.  Mapper App
2.  Python Script (Test images)

## Mapper App

In the mapper app, you can download the map you just created and try to localize in the same environment. On the top right, it will show the total number of localization attempts and successful localizations.

## Python Script

To test the map with the Python script, you need test images of the location. You can use Immersal Mapper to take test images in the space, imagining where end users might stand and how their devices (e.g., smartphones) might be oriented during the AR experience. Try to cover all possibilities, such as varying lighting conditions, and take as many images as possible. You can capture images with manual mode when you have captured the desired dataset for that location, press the share button in the top right button and export the data to your laptop/computer

![Share images](../../../static/tutorials/maptesting/shareimages.png)

Share images

![Export to](../../../static/tutorials/maptesting/exportimages.png)

Export to

This process will export a zip file. After extracting it, you'll find ".png" and ".json" files.

![Extract Zip file](../../../static/tutorials/maptesting/extractimages.png)

Extract Zip file

![Extracted data](../../../static/tutorials/maptesting/extractedimages.png)

Extracted data

These images will serve as our test dataset for remote localization tests. The results will show the positioning success rate and identify which specific images failed to localize correctly. Every time we optimize or customize the map, we need to use the same dataset for localization tests to observe whether the success rate increases or decreases.

For example, after trying to rebuild the map with different parameters, you need to perform localization tests to understand if the success rate has increased. Similarly, if we reduce the map size by some means, testing is necessary to see if and how the localization success rate is affected and whether the impact is acceptable.

Then you would get a set of images and JSON files. Now you need to run script [‘encode\_images\_and\_json.py’](https://github.com/immersal/immersal-python-tools-for-customer/blob/main/utils/encode_images_and_json.py) to convert the exported data to be able to run the localization test. After that, the image files will be renamed.

![Before and after encoding images](../../../static/tutorials/maptesting/beforeandafterencoding.png)

Before and after encoding images

Copy the link to your image folder and pase it into

```none
Path of your images
e.g. inputDirectory = r'/Users/Name/workspaces/TestMap/img'
inputDirectory = "path_of_frames"
```

copy the token from your developer portal and paste it in the script

```none
token = "your_token from Dev portal"
mapId = 123
```

Add your map id of the map that you want to test

And run the script then you will see the script iterating all images and perform localization again the given map, in the end you get the localization success rate. (e.g. 65.22% in the example below). In addition, for all the images that can get localized, you see a visualization and how feature points are matched to the space

![Successful localizations](../../../static/tutorials/maptesting/successfullocalizations.png)

Successful localizations

Here you can get the [script to run localization tests](https://github.com/immersal/immersal-python-tools-for-customer/blob/main/localization-test/localize_mapper_images_with_visualization.py)
