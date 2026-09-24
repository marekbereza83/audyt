# Python Examples

Zrodlo: https://developers.immersal.com/docs/rest-api/python-example/

---

# Python Examples

Using the REST API with Python 3.8

Here you can find some Python sample scripts that document how to use the REST API.  
Substitute the Developer Token with your own token which you can find from the [Developer Portal](https://developers.immersal.com/)

You can also find more Python sample scripts from the repository [Immersal Python Tools for Customers](https://github.com/immersal/immersal-python-tools-for-customer)

### Login

```python
import requests
import json

def Login(url, username, password):
    complete_url = url + '/login'

    data = {
        "login": username,
        "password": password
    }

    json_data = json.dumps(data)

    r = requests.post(complete_url, data=json_data)
    print(r.text)

Login('https://api.immersal.com', 'john.doe@immersal.com', 'mypassword')
```

```python
# Successful login returns the user ID, developer token and the user level
{
	"error":	"none",
    "userId":	0000,
	"token":	"081df5eeacde56ce0958660bdbbfa4a61e23ffb0790ae41943d64f95c1a60de2",
    "level":	0
}

# Token authentication error
{
	"error":	"auth"
}
```

### Account status

Get basic information about the account, e.g. map size limits.

```python
import requests
import json

def AccountStatus(url, token):
    complete_url = url + '/status'

    data = {
        "token": token,
    }

    json_data = json.dumps(data)

    r = requests.post(complete_url, data=json_data)
    print(r.text)

AccountStatus('https://api.immersal.com', '081df5eeacde56ce0958660bdbbfa4a61e23ffb0790ae41943d64f95c1a60de2')
```

```python
# Success
{
	"error":	"none",
    "userId":	0000,
	"imageCount":	8, # number of images in the workspace
	"imageMax":	100,
	"eulaAccepted":	true,
    "level":	0

}

# Token authentication error
{
	"error":	"auth"
}
```

### Clear the workspace

The Immersal Mapper app uses a workspace to store the data before you submit it for construction.  
You can exit the app and continue adding images to the workspace later. When you're done with mapping, there's a function to clear the workspace before starting a new mapping session.

```python
import requests
import json

def ClearWorkspace(url, token, deleteAnchorImage):
    complete_url = url + '/clear'

    data = {
        "token" : token,
        "anchor" : deleteAnchorImage
    }

    json_data = json.dumps(data)

    r = requests.post(complete_url, data=json_data)
    print(r.text)
    
ClearWorkspace('https://api.immersal.com', '081df5eeacde56ce0958660bdbbfa4a61e23ffb0790ae41943d64f95c1a60de2', True)
```

### Restore map to workspace

You can also restore all images from previous maps to the workspace. This allows you to extend or update mapped locations.

```python
import requests
import json

def RestoreMap(url, token, mapId):
    complete_url = url + '/restore'

    data = {
        "token" : token,
        "id" : mapId
    }

    json_data = json.dumps(data)

    r = requests.post(complete_url, data=json_data)
    print(r.text)

RestoreMap('https://api.immersal.com', '081df5eeacde56ce0958660bdbbfa4a61e23ffb0790ae41943d64f95c1a60de2', 1234)
```

```none
# Success
{
	"error":	"none"
}

# Token authentication error
{
	"error":	"auth"
}

# Incorrect map id error
{
	"error":	"job"
}
```

### List account maps/jobs

Two variants. One for listing all user's maps and one for searching nearby maps.

You can leave the token string empty to search for public maps

```python
import requests
import json

def ListJobs(url, token):
    complete_url = url + '/list'

    data = {
        "token": token,
    }

    json_data = json.dumps(data)

    r = requests.post(complete_url, data=json_data)
    print(r.text)

ListJobs('https://api.immersal.com', '081df5eeacde56ce0958660bdbbfa4a61e23ffb0790ae41943d64f95c1a60de2')
```

```python
import requests
import json

def ListJobsGPS(url, token, latitude, longitude, radius):
    complete_url = url + '/geolist'

    data = {
        "token": token,
        "latitude": latitude,
        "longitude": longitude,
        "radius": radius
    }

    json_data = json.dumps(data)

    r = requests.post(complete_url, data=json_data)
    print(r.text)

ListJobsGPS('https://api.immersal.com', '081df5eeacde56ce0958660bdbbfa4a61e23ffb0790ae41943d64f95c1a60de2', 60.8978, 26.9193, 200.0)
```

```python
# Success
{
	"error":	"none",
	"count":	75,
	"jobs":	[{
			"id":	9386,
            "type": 0,
			"version":	"1.8.0",
			"creator":	"0000",
			"size":	5,
			"status":	"done",
			"errno":	"0",
			"privacy":	"0",
			"name":	"5img",
			"latitude":	60.897810474,
			"longitude":	26.919315117999997,
			"altitude":	122.15941162109375,
			"created":	"2020-09-11 14:42:56",
			"modified":	"2020-09-11 14:43:05",
			"sha256_al":	"e7c12d8a23a21702e129ec05af1423c37f708975cc82c9e05b90111ddcd19d22",
			"sha256_sparse":	"fb988633c42610bb34f403a816a2602047ddffa461072b2af9721d6fab708ecc",
			"sha256_dense":	"0efd9b336af155126afe544b52ea6095abce65517a01aeceba9b4add427365fe",
			"sha256_tex":	"d86c09d4ba792a2df7367368cb94e1b51ced08c63d2761dcf74ed260c51667fd"
		}, {
			"id":	9384,
            "type": 0,
			"version":	"1.8.0",
			"creator":	"0000",
			"size":	9,
			"status":	"done",
			"errno":	"0",
			"privacy":	"0",
			"name":	"18test",
			"latitude":	60.897835266666661,
			"longitude":	26.91930419111111,
			"altitude":	119.58823649088542,
			"created":	"2020-09-11 14:06:02",
			"modified":	"2020-09-11 14:06:21",
			"sha256_al":	"11d7ed2099c9b454d2c733261abd7642fdb7462259cf016e175b115bbbbf0aa6",
			"sha256_sparse":	"b53125dfa9449ed27bb8931b7defab6d725369249a7bf0752641522271d4249c",
			"sha256_dense":	"d1b942aa1fce7b7db641c9e4a151fe82832195f7a92f8e858510569cbf411c03",
			"sha256_tex":	"7284d11838d37a0faeee204e71f8085a11cf453c59c41488526e2d2d15c03d41"
		}
		
		...
}

# Token authentication error
{
	"error":	"auth"
}
```

### Submit an image to workspace

To construct a map, you need to submit images from the location to the workspace. You need to know the camera intrinsics for map construction and also provide camera position for accurate metric scale and orientation for up-axis alignment.

```python
import requests
import json
import base64

def ConvertToBase64(src_filepath):
    with open(src_filepath, 'rb') as imageFileAsBinary:
        fileContent = imageFileAsBinary.read()
        b64_encoded_img = base64.b64encode(fileContent)

        return b64_encoded_img

def SubmitImage(url, token, imagePath):
    complete_url = url + '/captureb64'

    data = {
        "token": token,
        "run": 0, # a running integer for the tracker session. Increment if tracking is lost or image is from a different session
        "index": 0, # running index for images
        "anchor": False, # flag for the image used as an anchor/map origin
        "px": 0.0, # camera x position from the tracker
        "py": 0.0, # camera y position from the tracker
        "pz": 0.0, # camera z position from the tracker
        "r00": 1.0, # camera orientation as a 3x3 matrix
        "r01": 0.0,
        "r02": 0.0,
        "r10": 0.0,
        "r11": 1.0,
        "r12": 0.0,
        "r20": 0.0,
        "r21": 0.0,
        "r22": 1.0,
        "fx": 1455.0, # image focal length in pixels on x axis
        "fy": 1455.0, # image focal length in pixels on y axis
        "ox": 960.0, # image principal point on x axis
        "oy": 720.0, # image principal point on y axis
        "latitude" : 0.0,
        "longitude" : 0.0,
        "altitude" : 0.0,
        "b64": str(ConvertToBase64(imagePath), 'utf-8') # base64 encoded .png image
    }

    json_data = json.dumps(data)
    # print(json_data)

    r = requests.post(complete_url, data=json_data)
    print(r.text)

SubmitImage('https://api.immersal.com', '081df5eeacde56ce0958660bdbbfa4a61e23ffb0790ae41943d64f95c1a60de2', 'test.png')
```

```python
# Success
{
	"error":	"none",
}

# Token authentication error
{
	"error":	"auth"
}
```

### Start map construction

Submits data from the workspace and starts the map construction process.

```python
def StartMapConstruction(url, token, mapName):
    complete_url = url + '/construct'

    data = {
        "token": token,
        "name": mapName,
    }

    json_data = json.dumps(data)

    r = requests.post(complete_url, data=json_data)
    print(r.text)

StartMapConstruction('https://api.immersal.com', '081df5eeacde56ce0958660bdbbfa4a61e23ffb0790ae41943d64f95c1a60de2', 'myFirstMap')
```

```python
# Success
{
	"error":	"none",
	"id":	1234,
	"size":	8 # number of images in the map
}

# Token authentication error
{
	"error":	"auth"
}
```

### Stitch maps together

```python
def StitchMaps(url, token, mapName, mapIds):
    complete_url = url + '/fuse'

    data = {
        "token" : token,
        "name" : mapName,
        "mapIds": mapIds
    }

    json_data = json.dumps(data)

    r = requests.post(complete_url, data=json_data)
    print(r.text)

StitchMaps('https://api.immersal.com', '081df5eeacde56ce0958660bdbbfa4a61e23ffb0790ae41943d64f95c1a60de2', 'stitchedMap', [1234, 5678])
```

```python
# Success
{
	"error":	"none",
	"id":	91011,
	"size":	2
}
```

### Download a map

You can leave the token string empty to download a public map

```python
import requests
import json
import base64

def DownloadMap(url, token, mapId):
    complete_url = url + '/mapb64'

    data = {
        "token": token,
        "id": mapId
    }

    json_data = json.dumps(data)

    r = requests.post(complete_url, data=json_data)
    # print(r.text)
    mapFile = base64.b64decode(json.loads(r.text)['b64'])
    open(str(mapId) + '.bytes', 'wb').write(mapFile)

DownloadMap('https://api.immersal.com', '', 125156)
```

```python
# Success
{
	"error":	"none",
	"sha256_al":	"d829ebc9138bb4cb68fe5009b39bf8639998684947052248cfeb10a6fc75ce6b",
	"b64":	"XQAAAAGSnQEAKUg ... +eFcJ1//88dco"
}

# incorrect map id or invalid token
{
	"error":	"not found"
}
```

### Server localization

In addition to localizing on the device, you can use on-server localization. You can localize to multiple maps at once.

test.png

test-img-for-map-id-4054.png

[](https://developers.immersal.com/docs/static/apidocumentation/test-img-for-map-id-4054.png)

You can leave the token string empty to localize against public maps

```python
import requests
import json

def ServerLocalize(url, token, imagePath):
    complete_url = url + '/localize'

    with open(imagePath, 'rb') as f:
        img_bytes = f.read()

        data = {
            "token": token,
            "fx": 1455.738159, # image focal length in pixels on x axis
            "fy": 1455.738159, # image focal length in pixels on y axis
            "ox": 962.615967, # image principal point on x axis
            "oy": 694.292175, # image principal point on y axis
            "mapIds": [{"id": 125156}] # a list of map ids to localize against
        }

        json_data = json.dumps(data)
        json_bytes = json_data.encode()

        body = json_bytes + b"\0" + img_bytes

        r = requests.post(complete_url, data=body)
        print(r.text)

ServerLocalize('https://api.immersal.com', '', 'test.png')
```

```python
# Successful localization
{
	"error":	"none",
	"success":	true,
	"map":	125156,
	"px":	-2.7424788475036621,
	"py":	25.899345397949219,
	"pz":	-8.0469636917114258,
	"r00":	-0.11626922339200974,
	"r01":	-0.98492711782455444,
	"r02":	-0.12806272506713867,
	"r10":	0.99144113063812256,
	"r11":	-0.1228010430932045,
	"r12":	0.04432196170091629,
	"r20":	-0.059380136430263519,
	"r21":	-0.12181337177753448,
    "r22":	0.99077522754669189,
    "confidence":	37,
	"time":	0.538425577
}

# Failed localization
{
	"error":	"none",
	"success":	false,
	"map":	-1,
	"px":	0,
	"py":	0,
	"pz":	0,
	"r00":	0,
	"r01":	0,
	"r02":	0,
	"r10":	0,
	"r11":	0,
	"r12":	0,
	"r20":	0,
	"r21":	0,
	"r22":	0,
	"confidence":	0,
	"time":	0.258835888
}

# Token authentication error
{
	"error":	"auth"
}

# Incorrect map id error, no valid maps to localize against
{
	"error":	"map count"
}
```

### Get map local to global ECEF conversion matrix

To convert the found pose from local map coordinates to global coordinates, you can get the conversion matrix from the server. The map needs to have GPS coordinates to have the conversion matrix.

You can leave the token string empty to get ECEF for a public map

```python
import requests
import json

def ServerECEF(url, token, mapId):
    complete_url = url + '/ecef'

    data = {
        "token": token,
        "id": mapId
    }

    json_data = json.dumps(data)

    r = requests.post(complete_url, data=json_data)
    print(r.text)

ServerECEF('https://api.immersal.com', '', 125156)
```

```python
# Success
{
	"error":	"none",
	"ecef":	[2884373.6879106648, 1340999.0750837622, 5509844.3036541771, -0.45108634233474731, -0.786507248878479, 0.42181453108787537, -0.20971845090389252, 0.55280953645706177, 0.80648607015609741, -0.86749023199081421, 0.27533257007598877, -0.41430991888046265, 1]
}

# incorrect map id, invalid token or conversion matrix unavailable
{
	"error":	"not found"
}
```

### On-server localization and Visual GPS example

test.png

test-img-for-map-id-4054.png

[](https://developers.immersal.com/docs/static/apidocumentation/test-img-for-map-id-4054.png)

This example code shows how to combine on-server localization and ECEF conversion matrix for a complete Visual GPS pipeline It localizes the test.png test image against a map (125156) from Helsinki streets, converts the local map position to ECEF and WGS84 and then displays the result on Google Maps.

```python
import requests
import json
import base64
import numpy as np
import webbrowser

def ConvertToBase64(src_filepath):
    with open(src_filepath, 'rb') as imageFileAsBinary:
        fileContent = imageFileAsBinary.read()
        b64_encoded_img = base64.b64encode(fileContent)

        return b64_encoded_img

def ServerLocalize(url, token, mapId, imagePath):
    complete_url = url + '/localizeb64'

    data = {
        "token": token,
        "fx": 727.87, # hard-coded camera intrinsics for the test image
        "fy": 727.87,
        "ox": 481.44,
        "oy": 347.15,
        "b64": str(ConvertToBase64(imagePath), 'utf-8'),
        "mapIds": [{"id": mapId}]
    }

    json_data = json.dumps(data)

    r = requests.post(complete_url, data=json_data)
    print(r.text)

    return r.text

def ServerECEF(url, token, mapId):
    complete_url = url + '/ecef'

    data = {
        "token": token,
        "id": mapId
    }

    json_data = json.dumps(data)

    r = requests.post(complete_url, data=json_data)
    print(r.text)

    return r.text

def EcefToWGS84(ecefPos):
    a = np.double(6378137.0)
    e = np.double(8.1819190842622e-2)

    asq = np.power(a, 2)
    esq = np.power(e, 2)

    x = np.double(ecefPos[0])
    y = np.double(ecefPos[1])
    z = np.double(ecefPos[2])

    b = np.sqrt(asq * (1.0 - esq))
    bsq = np.power(b, 2)
    ep = np.sqrt((asq - bsq) / bsq)
    p = np.sqrt(np.power(x, 2) + np.power(y, 2))
    th = np.arctan2(a * z, b * p)

    lon = np.arctan2(y, x)
    lat = np.arctan2((z + np.power(ep, 2) * b * np.power(np.sin(th), 3)), (p - esq * a * np.power(np.cos(th), 3)))
    n = a / (np.sqrt(1.0 - esq * np.power(np.sin(lat), 2)))
    alt = p / np.cos(lat) - n

    lon = lon % (2 * np.pi)

    lat = np.rad2deg(lat)
    lon = np.rad2deg(lon)
    
    if(lon > 180.0):
        lon = lon - 360.0

    return np.array([lat, lon, alt])

def MapPosToEcef(mapPos, m2e):
        mp = np.array([ -mapPos[1], -mapPos[0], mapPos[2], 1.0 ])
        S = m2e[12]
        m = np.array([ [S*m2e[3], S*m2e[6],  S*m2e[9], 0.0],
                       [S*m2e[4], S*m2e[7], S*m2e[10], 0.0],
                       [S*m2e[5], S*m2e[8], S*m2e[11], 0.0],
                       [  m2e[0],   m2e[1],    m2e[2], 1.0] ])
        q = mp.dot(m)
        return q

def Localize(url, token, mapId, imagePath):

    localizationResult = json.loads(ServerLocalize(url, token, mapId, imagePath))
    mapPos = np.array([localizationResult['px'], localizationResult['py'], localizationResult['pz'], 1.0])

    ecefResult = json.loads(ServerECEF(url, token, mapId))
    mapToEcef = np.array(ecefResult['ecef'])
    ecefPos = MapPosToEcef(mapPos, mapToEcef)
    wgs84 = EcefToWGS84(ecefPos)

    print('lat: ' + str(wgs84[0].astype(float)),
          'long: ' + str(wgs84[1].astype(float)),
          'alt: ' + str(wgs84[2].astype(float)))

    # Open location in Google Maps
    webbrowser.open_new_tab(f'https://www.google.com/maps/search/{str(wgs84[0])},{str(wgs84[1])}')

Localize('https://api.immersal.com', '', 125156, 'test.png')
```
