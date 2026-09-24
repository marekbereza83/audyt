# GPS Triangulation

Zrodlo: https://developers.immersal.com/docs/mapsmapping/advanced/gps-triangulation/

---

# GPS Triangulation

You have already built a map and want to triangulate it with Google Maps. You can now easily do so using this feature.

### Downloading Your Map

*   You can log in to the [Developer Portal](https://developers.immersal.com/) and download the Sparse.ply file from the map you want to triangulate.
    
*   Click on `map-name-sparse.ply` to download the map
    

### Triangulating

1.  Open Blender.
    
2.  Import the .ply point cloud file to Blender.
    
    ![import](../../../static/tutorials/gpstriangulation/blender_1.png)
    
    import
    
3.  Rotate it 90 degrees in the X-axis in Blender.
    
    ![initial look in blender](../../../static/tutorials/gpstriangulation/blender_2.png)
    
    initial look in blender
    
    ![Rotate 90 degrees](../../../static/tutorials/gpstriangulation/blender_3.png)
    
    Rotate 90 degrees
    
4.  Find at least 3 points that you can recognize from Google Maps.
    
    ![Add Points](../../../static/tutorials/gpstriangulation/blender_4.png)
    
    Add Points
    
5.  Add the points to [`map_ecef_from_3_wgs84_points.py`](https://github.com/immersal/immersal-python-tools-for-customer/blob/main/gps-triangulation-tool/map_ecef_from_3_wgs84_points.py). (Please see the /blender-googlemaps-example-images) to do the conversion correctly.
    

```none
def main() -> None:

    # 3 manually picked points in the map x, y, z
    map_position_a = np.array([0, 0, 0])
    map_position_b = np.array([0, 0, 0])
    map_position_c = np.array([0, 0, 0])
```

![Y-up Coordinates ](../../../static/tutorials/gpstriangulation/blender_5.png)

Y-up Coordinates

6.  Find the same points in google maps. Add them to the [`map_ecef_from_3_wgs84_points.py`](https://github.com/immersal/immersal-python-tools-for-customer/blob/main/gps-triangulation-tool/map_ecef_from_3_wgs84_points.py) script.

You can get a good altitude estimate for example in [Google Earth](https://earth.google.com/)

 ```none
 # latitude, longitude, and altitude values for the 3 points (From Google maps)
    wgs84_a = np.array([0.0, 0.0, 0.0])
    wgs84_b = np.array([0.0, 0.0, 0.0])
    wgs84_c = np.array([0.0, 0.0, 0.0])
```

![right click ](../../../static/tutorials/gpstriangulation/googlemaps_6.png)

right click

7.  Run the script. You need to add your token and mapid. It will also ask to pip install bunch of libraries. Install them.
    
8.  After the script runs successfully it will print out the result and update the map metadata in developer portal. To verify this. Check the metadata.json for the map from the portal.
    

### Testing the map

1.  Download test images that you know were captured within the same area. Use the support portal to download the job.
    
2.  Run [`localize-map-images_lat_lon.py`](https://github.com/immersal/immersal-python-tools-for-customer/blob/main/gps-triangulation-tool/localize-map-images_lat_lon.py). You need to add the folder containing the images, your token, and map ID. The script will create a `localization_results.json` and will write each loc there. You can also stop the script if you don't want to localize all images in the images folder.
    
3.  Run the [`show-locs-on-folium.py`](https://github.com/immersal/immersal-python-tools-for-customer/blob/main/gps-triangulation-tool/show-locs-on-folium.py). You need to also add to the script the `localization_results.json` path. The script will run and open up the browser it will also create a `localization_map.html` file. You will see a map with the successful localization results. If you click a point on the map it will open up showing the lat, lon and image path.
    
4.  Copy paste the image path open terminal and type $open and paste the image path. example: `$open /path/to/image`
    

That way you can check if the images match to the map.

### To Run

Create a virtual env. Type these commands to terminal.

```none
$ python -m venv env
```

```none
$ source env/bin/activate
```

if you don't have folium, install it with this command

```none
$ pip install folium   
```   

then you run the python script

To deactivate the virtual env use

```none
$ deactivate
```

### Video Tutorial

Here is the video tutorial for all the steps.

GPS-Triangulation
