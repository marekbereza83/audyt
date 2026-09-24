# REST API

Zrodlo: https://developers.immersal.com/docs/rest-api/

---

# REST API

The REST API is used to interact with the Immersal Cloud Service.  
You can use it to submit images for Spatial Map construction, modify and load Maps, and even use the on-server Visual Positioning.

*   Most REST API requests take JSON as input and also return the result as JSON
*   Most requests need a valid developer token for authentication. You can get it by logging in to the Developer Portal

We provide a sample implementation for Unity in C#, see the `REST.cs` and `RESTJobsAsync.cs classes` in the Immersal SDK Core `.unitypackage`  
We also provide basic Python examples in this documentation.  
It should also be quite straightforward to make the API calls in JSON from e.g. JavaScript & WebXR applications, and on other platforms.

Immersal Cloud Service REST API requires a developer token for authentication. You can get it from the [Developer Portal](https://developers.immersal.com/)

## API Methods

### Aligns maps

```none
https://api.immersal.com/align 
``` 

Aligns maps into the same coordinate space. First map in mapIds array is used as the origin for the other maps. Only private maps can be aligned. Only maps with status "done" can be aligned.

#### Parameters

Body

 

 

token\*

string

A valid developer token

name\*

string

Name for the alignment job.

mapIds\*

array

An array of {"id":int} objects (MAXCOUNT = 32)

#### Responses

```none
{
    "error": "none",
    "id" : 67123, //alignment job id
    "size" : 3 //how many maps was used
}

























```

```none
{
    "error": "auth" //invalid developer token
}

{
    "error": "query" //error connecting to database or no results
}

{
    "error": "map count" //map array was empty or has some invalid maps or more than max amount (32) maps 
}

{
    "error": "name" // invalid map name
}

{
    "error": "could not create user dir" //error creating a directory for user
}

{
    "error": "could not create dir" //error creating a directory for the constrction job
}

{
    "error": "could not open desc file" //could not open a file describing the job parameters
}

{
    "error": "could not open file" //error opening the file to write the align results
}
```

* * *

### B2G Upload (base64)

```none
https://api.immersal.com/b2gb64
```

Submit a .b2g file in b64 encoded format from a Leica BLK2GO device and metadata to the user's workspace.  
Pro or Enterprise license is required to use this feature. Note that this end point only uploads the b2g file. One should call /construct endpoint after uploading. Also preservePose=true parameter should be used in the /construct call to leverage BLK2GO pose data.

To match BLK2GO coordinate system with Immersal coordinates the rotation matrix should be set as follows:

![](https://developers.immersal.com/docs/static/apidocumentation/b2guploadbase64.png)

#### Parameters

Body

 

 

token\*

string

A valid developer token

b64\*

string

Base64-encoded b2g file

px\*

number

Camera x position

py\*

number

Camera y position

pz\*

number

Camera z position

r00\*

number

Rotation matrix row 0,col 0

r01\*

number

Rotation matrix row 0,col 1

r02\*

number

Rotation matrix row 0,col 2

r10\*

number

Rotation matrix row 1,col 0

r11\*

number

Rotation matrix row 1,col 1

r12\*

number

Rotation matrix row 1,col 2

r20\*

number

Rotation matrix row 2,col 0

r21\*

number

Rotation matrix row 2,col 1

r22\*

number

Rotation matrix row 2,col 2

#### Responses

```none
{
    "error": "none",
    "path": "path_on_the_server"
}

























```

```none
{
    "error": "auth" //invalid developer token
}

{
    "error": "query" //error connecting to database or no results
}

{
    "error": "image limit" //user image limit per map exceeded
}

{
    "error": "image format" //error parsing image format
}

{
    "error": "level" //user has not been authorized for enterprice license
}

{
    "error": "hash" //uploaded file may be corrupted
}

{
    "error": "rename" //renaming path filename failed
}
```

* * *

### B2G Upload (binary)

```none
https://api.immersal.com/b2g
```

Similar to /b2gb64 but faster. The b2g data is not b64-encoded but the payload is binary: json bytes + NUL terminator byte + b2g bytes.  
Supports robust chunked uploads via /upload endpoint.  
Pro or Enterprise license is required to use this feature. Note that this end point only uploads the b2g file. One should call /construct endpoint after uploading. Also preservePose=true parameter should be used in the /construct call to leverage BLK2GO pose data.

To match BLK2GO coordinate system with Immersal coordinates the rotation matrix should be set as follows:

![](https://developers.immersal.com/docs/static/apidocumentation/b2guploadbinary.png)

#### Parameters

Body

 

 

token\*

string

A valid developer token

hash\*

string

A hash code used to identify the file on server. Six character alpha numeric code. See /upload endpoint.

px\*

number

Camera x position

py\*

number

Camera y position

pz\*

number

Camera z position

r00\*

number

Rotation matrix row 0,col 0

r01\*

number

Rotation matrix row 0,col 1

r02\*

number

Rotation matrix row 0,col 2

r10\*

number

Rotation matrix row 1,col 0

r11\*

number

Rotation matrix row 1,col 1

r12\*

number

Rotation matrix row 1,col 2

r20\*

number

Rotation matrix row 2,col 0

r21\*

number

Rotation matrix row 2,col 1

r22\*

number

Rotation matrix row 2,col 2

#### Responses

```none
{
    "error": "none",
    "path": "path_on_the_server"
}

























```

```none
{
    "error": "blob" //invalid binary payload
}

{
    "error": "auth" //invalid developer token
}

{
    "error": "query" //error connecting to database or no results
}

{
    "error": "image limit" //user image limit per map exceeded
}

{
    "error": "image format" //error parsing image format
}

{
    "error": "level" //user has not been authorized for enterprice license
}

{
    "error": "hash" //uploaded file may be corrupted
}

{
    "error": "rename" //renaming path filename failed
}
```

* * *

### Capture Image

```none
https://api.immersal.com/captureb64
```

Submit the image and metadata to the user's workspace. The camera pose should be submitted in a right-handed coordinate system and the rotation is submitted as a row matrix.

[https://developer.apple.com/documentation/arkit/arconfiguration/worldalignment/gravity](https://developer.apple.com/documentation/arkit/arconfiguration/worldalignment/gravity)

[https://developer.apple.com/documentation/arkit/arcamera/2875730-intrinsics](https://developer.apple.com/documentation/arkit/arcamera/2875730-intrinsics)

If fx,fy,ox and oy parameters are omitted, the image assumed to be a 360 equirectangular image.

#### Parameters

Body

 

 

token\*

string

A valid developer token

run\*

integer

Index for the active mapping session. Should be updated if the SLAM tracking is lost (session and local coordinates are reset)

index

integer

Order index for the image

anchor

boolean

Submit image as the new anchor image (only one can exist in the workspace)

b64\*

string

Base64-encoded PNG image, 8-bit grayscale or 24-bit RGB

fx\*

number

Camera intrinsics pixel focal length x

fy\*

number

Camera intrinsics pixel focal length y

ox\*

number

Camera intrinsics principal point offset x, should be close to image\_resolution\_x / 2.0

oy\*

number

Camera intrinsics principal point offset y, should be close to image\_resolution\_y / 2.0

px\*

number

Camera x position

py\*

number

Camera y position

pz\*

number

Camera z position

r00\*

number

Rotation matrix row 0,col 0

r01\*

number

Rotation matrix row 0,col 1

r02\*

number

Rotation matrix row 0,col 2

r10\*

number

Rotation matrix row 1,col 0

r11\*

number

Rotation matrix row 1,col 1

r12\*

number

Rotation matrix row 1,col 2

r20\*

number

Rotation matrix row 2,col 0

r21\*

number

Rotation matrix row 2,col 1

r22\*

number

Rotation matrix row 2,col 2

longitude\*

number

WGS84 longitude

latitude\*

number

WGS84 latitude

altitude\*

number

GPS elevation

#### Responses

```none
{
    "error": "none",
    "path": "path_on_the_server"
}










```

```none
{
    "error": "auth" //invalid developer token
}

{
    "error": "query" //error connecting to database or no results
}

{
    "error": "image limit" //user image limit per map exceeded
}

{
    "error": "image format" //error parsing image format
}
```

* * *

### Capture Image (Binary)

```none
https://api.immersal.com/capture
```

Submit the image and metadata to the user's workspace.

Similar to /captureb64 but faster. The image data is not b64-encoded but the payload is binary: json bytes + NUL terminator byte + image bytes.

Supports robust chunked uploads via `/upload` endpoint.

The camera pose should be submitted in a right-handed coordinate system and the rotation is submitted as a row matrix.

[https://developer.apple.com/documentation/arkit/arconfiguration/worldalignment/gravity](https://developer.apple.com/documentation/arkit/arconfiguration/worldalignment/gravity)

[https://developer.apple.com/documentation/arkit/arcamera/2875730-intrinsics](https://developer.apple.com/documentation/arkit/arcamera/2875730-intrinsics)

If fx,fy,ox and oy parameters are omitted, the image assumed to be a 360 equirectangular image. Python example:

`body = json_bytes + b"\0" + img_bytes`  
`r = requests.post(complete_url, data=body)`

#### Parameters

Body

 

 

token\*

string

A valid developer token

run\*

integer

Index for the active mapping session. Should be updated if the SLAM tracking is lost (session and local coordinates are reset)

index

integer

Order index for the image

anchor

boolean

Submit image as the new anchor image (only one can exist in the workspace)

hash

string

A hash code used to identify the file on server. Six character alpha numeric code. See /upload endpoint.

fx\*

number

Camera intrinsics pixel focal length x

fy\*

number

Camera intrinsics pixel focal length y

ox\*

number

Camera intrinsics principal point offset x, should be close to image\_resolution\_x / 2.0

oy\*

number

Camera intrinsics principal point offset y, should be close to image\_resolution\_y / 2.0

px\*

number

Camera x position

py\*

number

Camera y position

pz\*

number

Camera z position

r00\*

number

Rotation matrix row 0,col 0

r01\*

number

Rotation matrix row 0,col 1

r02\*

number

Rotation matrix row 0,col 2

r10\*

number

Rotation matrix row 1,col 0

r11\*

number

Rotation matrix row 1,col 1

r12\*

number

Rotation matrix row 1,col 2

r20\*

number

Rotation matrix row 2,col 0

r21\*

number

Rotation matrix row 2,col 1

r22\*

number

Rotation matrix row 2,col 2

longitude\*

number

WGS84 longitude

latitude\*

number

WGS84 latitude

altitude\*

number

GPS elevation

#### Responses

```none
{
    "error": "none",
    "path": "path_on_the_server"
}
















```

```none
{
    "error": "blob" //invalid binary payload
}

{
    "error": "auth" //invalid developer token
}

{
    "error": "query" //error connecting to database or no results
}

{
    "error": "image limit" //user image limit per map exceeded
}

{
    "error": "image format" //error parsing image format
}
```

* * *

### Clear Workspace

```none
https://api.immersal.com/clear
```

Deletes all the images from the workspace. Setting the `anchor` parameter to `false` will retain the anchor image.

#### Parameters

Body

 

 

anchor\*

boolean

Delete anchor image

token\*

string

A valid developer token

#### Responses

```none
{
    "error": "none"
}



```

```none
{
    "error": "auth" //invalid developer token
}

{
    "error": "query" //error connecting to database
}
```

* * *

### Clear Map Access Token

```none
https://api.immersal.com/clearmaptoken
```

Clears a map access token. Map access token is a way to allow sharing of a private map. Only owner of a map can clear map access token.  
Map access token holder can access for example map metadata, download poses and download the map. This is a good way to build an app and share your maps to a smaller group without making it public for everyone.  
Map access token can be set, renewed or cleared. By default, a map does not have an access token. A new access token is unique and previous access tokens cannot be retrieved.

Endpoints that support map access token are:

*   /dense
*   /geopose
*   /getposes
*   /loadmap (may be deprecated)
*   /localizeb64
*   /localize
*   /map (NOTE /mapb64 is not supported!)
*   /metadataget
*   /sparse
*   /tex

#### Parameters

Body

 

 

id\*

integer

Map id

token\*

string

A valid developer token

#### Responses

```none
{
    "error": "none",
    "mapId": 12345, //id of the map affected
    "accessToken": "cleared"
}


```

```none
{
    "error": "auth" //invalid developer token
}

{
    "error": "query" //error connecting to database
}
```

* * *

### Map Construct

```none
https://api.immersal.com/construct
```

Starts a new map construction job.

#### Parameters

Body

 

 

preservePoses\*

bool

Uses submitted pose data to optimize map construction. Requires good quality pose data (Default: False)

token\*

string

A valid developer token

name\*

string

Map name

#### Responses

Returns the ID of the constructed map and number of images in it

```none
{
    "error": "none",
    "id": 7065,
    "size: 300
}



































```

```none
{
    "error": "auth" //invalid developer token
}

{
    "error": "name" //illegal characters in map name. Only alphanumerical allowed
}

{
    "error": "query" //error connecting to database or no results
}

{
    "error": "could not create user dir" //error creating a directory for user
}

{
    "error": "could not create job dir" //error creating a directory for the constrction job
}

{
    "error": "could not open file" //error opening construction job images
}

{
    "error": "invalid filename" //error opening an image
}

{
    "error": "capture count" //no images found or couldn't open any
}

{
    "error": "could not open desc file" //could not open a file describing the job parameters
}

{
    "error": "could not write lla" //could not write longitude, latitude and altitude values
}

{
    "error": "limit" // could not write construction job to database
}
```

* * *

### Copy Map

```none
https://api.immersal.com/copy
```

Copy map to another user. Public maps can be copied by leaving the `token` parameter empty. Map access tokens are not supported.

#### Parameters

Body

 

 

token\*

string

From user. A valid developer token

login\*

string

To user. A valid developer token

id\*

int

Map id

#### Responses

Returns userId and token

```none
{
    "error": "none"
}












```

```none
{
    "error": "auth 1"    // (from user) token parameter was an invalid developer token
}

{
    "error": "auth 2"    // (to user) login parameter was an invalid developer token
}

{
    "error": "query"    // database query failed OR no map was copied. Possibly due to no map found.
}

{
    "error": "map"    // no map was copied. Possible due to map not found.
}
```

* * *

### Check coverage

```none
https://api.immersal.com/coverage
```

Check coverage for a stitch or alignment job. Returns any errors or map id and component info for stitch and align jobs as a JSON formatted string.  
`connected` map ids for the components that could be stitched or aligned.  
`disconnected` map ids for the components that could not be stitched or aligned. Likely due to not enough overlap.

Syntax:  
[https://api.immersal.com/coverage?token=MYTOKENHERE&id=MAPID](https://api.immersal.com/coverage?token=MYTOKENHERE&id=MAPID)

#### Parameters

Body

 

 

id\*

integer

Map id

token\*

string

A valid developer token

#### Responses

```none
{
	"id":	123456,
	"connected":	[12, 34],
	"disconnected":	[56]
}


















```

```none
{
    "error": "query string len" // query string was over 1024 characters
}

{
    "error": "query string format" // invalid query string format
}

{
    "error": "auth" //invalid developer token
}

{
    "error": "query" //error connecting to database
}

{
    "error": "not found" //no results found
}

{
    "error": "file not found" //no coverage file found
}
```

* * *

### Delete Map

```none
https://api.immersal.com/delete
```

Delete's the user's map from the cloud service.

#### Parameters

Body

 

 

id\*

integer

Map id

token\*

string

A valid developer token

#### Responses

```none
{
    "error": "none"
}



```

```none
{
    "error": "auth" //invalid developer token
}

{
    "error": "query" //error connecting to database or no results
}
```

* * *

### Download Dense Point Cloud

```none
https://api.immersal.com/dense
```

Downloads the dense point cloud. Public dense point clouds can be downloaded without a developer token. Supports a map access token.

Syntax:  
[https://api.immersal.com/dense?token=MYTOKENHERE&id=MAPID](https://api.immersal.com/dense?token=MYTOKENHERE&id=MAPID)  
[https://api.immersal.com/dense?id=MAPID](https://api.immersal.com/dense?id=MAPID)

#### Parameters

Body

 

 

id\*

integer

Map id

token\*

string

A valid developer token OR a map access token

#### Responses

```none
Payload: mapId-mapName-dense.ply



















```

```none
{
    "error": "query string len" // query string was over 1024 characters
}

{
    "error": "query string format" // invalid query string format
}

{
    "error": "auth" //invalid developer token
}

{
    "error": "query" //error connecting to database
}

{
    "error": "not found" //no results found
}

{
    "error": "file not found" //no dense found
}
```

* * *

### Download Immersal Unity SDK

```none
https://api.immersal.com/download
```

Downloads the Immersal Unity SDK. Naming convention: `ImmersalSDKv1_17_0.unitypackage` `ImmersalSDKv1_16_1.unitypackage`

Syntax:  
[https://api.immersal.com/download?token=MYTOKENHERE&name=SDK\_VERSION\_NAME](https://api.immersal.com/download?token=MYTOKENHERE&name=SDK_VERSION_NAME)

#### Parameters

Body

 

 

token\*

string

A valid developer token

name\*

string

SDK version name like `ImmersalSDKv1_17_0.unitypackage`

#### Responses

```none
Payload: ImmersalSDKv1_17_0.unitypackage // The specified SDK version

























```

```none
{
    "error": "query string len" // query string was over 1024 characters
}

{
    "error": "query string format" // invalid query string format
}

{
    "error": "auth" //invalid developer token
}

{
    "error": "eula" //this user has not accepted eula
}

{
    "error": "invalid filename" //invalid requested sdk file name
}

{
    "error": "file not found" //SDK with given name was not found
}
```

* * *

### Map ECEF (GPS)

```none
https://api.immersal.com/ecef
```

Fetches the transform matrix from local map coordinates to global ECEF coordinates.

#### Parameters

Body

 

 

id\*

integer

Map id

token\*

string

A valid developer token

#### Responses

```none
{
	"error":	"none",
	"ecef":
		[
					2884704.4529634975,    //px
					1341415.1204073559,    //py
					5509576.2819128353,    //pz
					0.48534169793128967,   //r00 //rotation matrix elements
					0.87242347002029419,   //r01
					0.05762564018368721,   //r02
					0.23218682408332825,   //r10
					-0.19214998185634613,  //r11
					0.9535028338432312,    //r12
					0.84293103218078613,   //r20
					-0.44939476251602173,  //r21
					-0.29582363367080688,  //r22
					9.4544391632080078     //scale
		]
}
```

```none
{
    "error": "auth" //invalid developer token
}

{
    "error": "query" //error connecting to database
}

{
    "error": "not found" //no results found
}
```

* * *

### Stitch Maps

```none
https://api.immersal.com/fuse
```

Stitch a list of maps together. Construct a new map as a result.

#### Parameters

Body

 

 

token\*

string

A valid developer token

name\*

 

New map name

mapIds\*

int\[\]

Integer array of map ids (MAX COUNT 32)

#### Responses

```none
{
    "error": "none",
    "id": 1234, // new map id
    "size": 22 // number of valid maps used in stitching
}



































```

```none
{
    "error": "auth" //invalid developer token
}

{
    "error": "query" //error connecting to database or no results
}

{
    "error": "map count" //map array was empty or has some invalid maps or more than max amount (32) maps 
}

{
    "error": "name" // invalid map name
}

{
    "error": "could not create user dir" //error creating a directory for user
}

{
    "error": "could not create job dir" //error creating a directory for the constrction job
}

{
    "error": "could not open desc file" //could not open a file describing the job parameters
}

{
    "error": "could not open file" //error opening the file to write the stitch results
}

{
    "error": "could not copy ecef file" //error copying coordinate (ecef) files
}

{
    "error": "could not write lla" //error writing longitude, latitude and altitude values
}
```

* * *

### List Jobs

```none
https://api.immersal.com/list
```

Gets a list of jobs (i.e., maps that are either ready or in different phases of construction).

#### Parameters

Body

 

 

token\*

string

A valid developer token

#### Responses

Returns the job count and a list of all jobs

```none
{
	"error":	"none",
	"count":	2,
	"jobs":	[{
			"id":	38002,
			"type":	0,
			"version":	"1.15.0",
			"creator":	34,
			"size":	31,
			"status":	"done",
			"errno":	0,
			"privacy":	0,
			"name":	"Map",
			"latitude":	60.21714952870969,
			"longitude":	24.869899032903231,
			"altitude":	33.21094783659904,
			"created":	"2021-12-02 07:06:50",
			"modified":	"2021-12-02 07:08:26",
			"sha256_al":	"92b642ec89c5bab5f6e02889d394037366c87ac1f5b782d93c916520d7fde817",
			"sha256_sparse":	"d00bc3a8df8bf94e5ec901517a300cb792b16e97fba2d729a15cea07a988de7a",
			"sha256_dense":	"fa5c0a76ce34a0f55eb36caf54d579c7c38f707639abeafdbbd01c4a54e207fd",
			"sha256_tex":	"75a7da8ebaacdc0f9c7620c77686992af1138b9df079e1818f78c773b8ce7f2d"
		}, {
			"id":	38001,
			"type":	0,
			"version":	"1.15.0",
			"creator":	34,
			"size":	32,
			"status":	"failed",
			"errno":	17,
			"privacy":	0,
			"name":	"Map",
			"latitude":	60.217130975312493,
			"longitude":	24.8698941478125,
			"altitude":	29.127938747406006,
			"created":	"2021-12-02 07:05:26",
			"modified":	"2021-12-02 07:05:38",
			"sha256_al":	"",
			"sha256_sparse":	"",
			"sha256_dense":	"",
			"sha256_tex":	""
		}]
}
```

Invalid token

```none
{
	"error": "auth" // invalid token
}

{
	"error": "query" // error connecting to database
}
```

* * *

### List Jobs (GPS)

```none
https://api.immersal.com/geolist
```

Returns a list of jobs (i.e., maps that are either ready or in different phases of construction). The map list is filtered by the given GPS coordinates and range (in metres).  
The `token` can be left as an empty string to return a list of public maps.

#### Parameters

Body

 

 

token\*

string

A valid developer token, or empty

latitude\*

number

WGS84 latitude

longitude\*

number

WGS84 longitude

radius\*

number

search radius in meters (Max value 200)

#### Responses

Returns the job count and a list of all jobs

```none
{
	"error":	"none",
	"count":	2,
	"jobs":	[{
			"id":	38002,
			"type":	0,
			"version":	"1.15.0",
			"creator":	34,
			"size":	31,
			"status":	"done",
			"errno":	0,
			"privacy":	0,
			"name":	"Map",
			"latitude":	60.21714952870969,
			"longitude":	24.869899032903231,
			"altitude":	33.21094783659904,
			"created":	"2021-12-02 07:06:50",
			"modified":	"2021-12-02 07:08:26",
			"sha256_al":	"92b642ec89c5bab5f6e02889d394037366c87ac1f5b782d93c916520d7fde817",
			"sha256_sparse":	"d00bc3a8df8bf94e5ec901517a300cb792b16e97fba2d729a15cea07a988de7a",
			"sha256_dense":	"fa5c0a76ce34a0f55eb36caf54d579c7c38f707639abeafdbbd01c4a54e207fd",
			"sha256_tex":	"75a7da8ebaacdc0f9c7620c77686992af1138b9df079e1818f78c773b8ce7f2d"
		}, {
			"id":	38001,
			"type":	0,
			"version":	"1.15.0",
			"creator":	34,
			"size":	32,
			"status":	"failed",
			"errno":	17,
			"privacy":	0,
			"name":	"Map",
			"latitude":	60.217130975312493,
			"longitude":	24.8698941478125,
			"altitude":	29.127938747406006,
			"created":	"2021-12-02 07:05:26",
			"modified":	"2021-12-02 07:05:38",
			"sha256_al":	"",
			"sha256_sparse":	"",
			"sha256_dense":	"",
			"sha256_tex":	""
		}]
}
```

```none
{
	"error": "auth" // invalid token
}

{
	"error": "query" // error connecting to database
}
```

* * *

### Localize Image

```none
https://api.immersal.com/localizeb64
```

Uses the on-server localizer to localize a camera image against a list of maps. Supports a map access token.

#### Parameters

Body

 

 

mapIds\*

array

An array of {"id": int} objects (MAX COUNT: 8)

token\*

string

A valid developer token OR a map access token

b64\*

string

Base64-encoded PNG image, 8-bit grayscale or 24-bit RGB

oy\*

number

Camera intrinsics principal point y

ox\*

number

Camera intrinsics principal point x

fy\*

number

Camera intrinsics focal length y

fx\*

number

Camera intrinsics focal length x

#### Responses

The response (when localization has been successful) is a projection matrix in the AR Cloud space. It can be used to extract the position and orientation of the device, which then again can be combined with the device's local SLAM tracking.

```none
{
	"error":	"none",
	"success":	true,
	"map":	7587,
	"px":	-0.5459369421005249,
	"py":	0.0632220059633255,
	"pz":	0.36885133385658264,
	"r00":	0.68967300653457642,
	"r01":	0.14381979405879974,
	"r02":	-0.709695041179657,
	"r10":	0.0070222793146967888,
	"r11":	0.97870355844497681,
	"r12":	0.20515856146812439,
	"r20":	0.7240869402885437,
	"r21":	-0.14647600054740906,
	"r22":	0.67397546768188477
}




```

```none
{
    "error": "auth" //invalid developer token
}

{
    "error": "query" //error connecting to database
}

{
    "error": "map count" //map array was empty or has zero valid maps or more than max amount (8) maps 
}

{
    "error": "image" // image file was empty or could not be decoded
}
```

* * *

### Localize Image (Binary)

```none
https://api.immersal.com/localize
```

Uses the on-server localizer to localize a camera image against a list of maps. Supports a map access token.  
Similar to /localizeb64 but faster. The payload is binary format: json bytes + NUL terminator byte + image bytes.  
Python example:

body = json\_bytes + b"\\0" + img\_bytes  
r = requests.post(complete\_url, data=body)

#### Parameters

Body

 

 

mapIds\*

array

An array of {"id": int} objects (MAX COUNT: 8)

token\*

string

A valid developer token OR a map access token

oy\*

number

Camera intrinsics principal point y

ox\*

number

Camera intrinsics principal point x

fy\*

number

Camera intrinsics focal length y

fx\*

number

Camera intrinsics focal length x

#### Responses

The response (when localization has been successful) is a projection matrix in the AR Cloud space. It can be used to extract the position and orientation of the device, which then again can be combined with the device's local SLAM tracking.

```none
{
	"error":	"none",
	"success":	true,
	"map":	7587,
	"px":	-0.5459369421005249,
	"py":	0.0632220059633255,
	"pz":	0.36885133385658264,
	"r00":	0.68967300653457642,
	"r01":	0.14381979405879974,
	"r02":	-0.709695041179657,
	"r10":	0.0070222793146967888,
	"r11":	0.97870355844497681,
	"r12":	0.20515856146812439,
	"r20":	0.7240869402885437,
	"r21":	-0.14647600054740906,
	"r22":	0.67397546768188477
}




```

```none
{
    "error": "blob" //invalid binary payload
}

{
    "error": "auth" //invalid developer token
}

{
    "error": "query" //error connecting to database
}

{
    "error": "map count" //map array was empty or has zero valid maps or more than max amount (8) maps 
}

{
    "error": "image" // image file was empty or could not be decoded
}
```

* * *

### Localize Image (GPS): Receive Longitude, Latitude, Altitude

```none
https://api.immersal.com/geopose
```

Similar to _/localize_ endpoint but returns lon, lat, alt. The payload data is binary: json bytes + NUL terminator byte + image bytes. Supports a map access token.

Uses the on-server localizer to localize a camera image against a list of maps. On successful localization returns longitude, latitude and altitude values.

Python example:  
`body = json_bytes + b"\0" + img_bytes`  
`r = requests.post(complete_url, data=body)`

#### Parameters

Body

 

 

token\*

string

A valid developer token OR a map access token

mapIds\*

array

An array of {"id": int} objects (MAX COUNT: 8)

ox\*

number

Camera intrinsics principal point x

oy\*

number

Camera intrinsics principal point y

fy\*

number

Camera intrinsics focal length y

fx\*

number

Camera intrinsics focal length x

#### Responses

The response (when localization has been successful) is a projection matrix in the AR Cloud space. It can be used to extract the position and orientation of the device, which then again can be combined with the device's local SLAM tracking.

```none
{
	"error":	"none",
	"success":	true,
	"map":	67587,
	"longitude":	       	24.945831,
	"latitude":	        60.192059,
	"ellipsoidHeight":	30.465,
	"quaternion": 
	[
		0.68967300653457642, //w
		0.1438197940587997,  //x
		0.1438197940587997,  //y
		-0.709695041179657   //z
	]	
}







```

```none
{
    "error": "blob" //invalid binary payload
}

{
    "error": "auth" //invalid developer token
}

{
    "error": "query" //error connecting to database
}

{
    "error": "map count" //map array was empty or has zero valid maps or more than max amount (8) maps 
}

{
    "error": "image" // image file was empty or could not be decoded
}
```

* * *

### Localize Image (GeoPose): Receive Longitude, Latitude, Altitude

```none
https://api.immersal.com/geoposeoscp
```

Implementation of the [OSCP GeoPose Protocol v2](https://github.com/OpenArCloud/oscp-geopose-protocol). Localizes an image against a public map, near the device's geolocation. On successful localization returns a GeoPose with latitude, longitude, and h (ellipsoidal height). The payload data is JSON: sensor readings and Base64-encoded image bytes (JPEG, PNG etc. supported).

#### Parameters

TBD, see [OSCP GeoPose Protocol v2](https://github.com/OpenArCloud/oscp-geopose-protocol)

#### Responses

TBD, see [OSCP GeoPose Protocol v2](https://github.com/OpenArCloud/oscp-geopose-protocol)

```none
{
    "error": "json" //invalid JSON payload
}

{
    "error": "image" // image file was empty or could not be decoded
}
```

* * *

### Get Poses

```none
https://api.immersal.com/getposes
```

Gets the poses recorded with each image Immersal was able to connect to the map. Not all images necessarily connect.

Can for example be used for debugging and visualizing well connected areas, mapping path, camera direction etc.

You can query poses from a private map, map you have a valid map access token for and public maps.

#### Parameters

Body

 

 

token\*

string

A valid developer token OR a map access token

id\*

int

Map id

#### Responses

```none
{
   "count":   23,
   "poses":   [{
	         "px":	0,
	         "py":	0,
	         "pz":	0,
	         "r00":	0.026798615232110023,
		 "r01":	0.99964088201522827,
		 "r02":	-1.33211895541561e-17,
		 "r10":	-0.99425530433654785,
		 "r11":	0.026654237881302834,
		 "r12":	-0.10366258770227432,
		 "r20":	-0.10362535715103149,
		 "r21":	0.0027780139353126287,
		 "r22":	0.99461251497268677
	     }, {
		 "px":	6.3549356460571289,
		 "py":	-0.056963842362165451,
		 "pz":	5.7433390617370605,
		 ...
	      }]
}
```

```none
{
    "error": "auth" //invalid developer token
}

{
    "error": "query" //error connecting to database
}

{
    "error": "not found" //map or poses not found. 1.16 maps might not have poses recorded
}
```

* * *

### Login

```none
https://api.immersal.com/login
```

Gets the developer token required for the rest of the API requests.

#### Parameters

Body

 

 

id\*

integer

Map id

login\*

string

Username (email address)

password\*

string

Password

#### Responses

Returns the userId and token

```none
{
    "error": "none",
    "userId": 123,
    "token": "abc123",
}










```

```none
{
    "error": "auth"    // invalid credentials
}

{
    "error": "login"    // invalid username
}

{
    "error": "password"    // invalid password
}

{
    "error": "db query"    //error connecting to database
}
```

* * *

### Load Map (Binary)

```none
https://api.immersal.com/map
```

Load a previously constructed map binary from the cloud service.  
Downloadable maps:

*   User's own private/public
*   Other users' public maps
*   Other users' private maps with map access token

Syntax:  
[https://api.immersal.com/sparse?token=MYDEVTOKEN\_OR\_MAPACCESSTOKEN&id=MAPID](https://api.immersal.com/sparse?token=MYDEVTOKEN_OR_MAPACCESSTOKEN&id=MAPID)  
[https://api.immersal.com/sparse?id=MAPID](https://api.immersal.com/sparse?id=MAPID)

#### Parameters

Body

 

 

id\*

integer

Map id

token\*

string

A valid developer token OR a map access token

#### Responses

The response is the binary map file

```none
Payload: mapId-mapName.bytes //binary map file




















```

```none
{
    "error": "query string len" // query string was over 1024 characters
}

{
    "error": "query string format" // invalid query string format
}

{
    "error": "auth" //invalid developer token
}

{
    "error": "query" //error connecting to database
}

{
    "error": "not found" //no results found
}

{
    "error": "file not found" //no map found
}
```

* * *

### Load Map

```none
https://api.immersal.com/mapb64
```

Load a previously constructed map in b64 encoded format from the cloud service. Downloadable maps:

*   User's own private/public
*   Other users' public maps

#### Parameters

Body

 

 

id\*

integer

Map id

token\*

string

A valid developer token

#### Responses

The response is the binary map file (.byte in the Developer Portal) Base64-encoded, and the file's SHA256 hash.

```none
{
	"error":	"none",
	"b64":		"azdfazdf",
	"sha256_al":    "hash"
}









```

```none
{
    "error": "auth" //invalid developer token
}

{
    "error": "query" //error connecting to database
}

{
    "error": "not found" //no results found
}

{
    "error": "file not found" //no map found
}
```

* * *

### Load Map (May be deprecated)

```none
https://api.immersal.com/loadmap
```

Load a previously constructed map binary from the cloud service. May be deprecated. Please use /map endpoint instead.  
Downloadable maps:

*   User's own private/public
*   Other users' public maps
*   Other users' private maps with map access token

#### Parameters

Body

 

 

id\*

integer

Map id

token\*

string

A valid developer token OR a map access token

#### Responses

The response is the binary map file (.bytes in the Developer Portal) Base64-encoded, and the file's SHA256 Hash

```none
//the response is a binary map file











```

```none
{
    "error": "auth" //invalid developer token
}

{
    "error": "query" //error connecting to database
}

{
    "error": "not found" //no results found
}

{
    "error": "file not found" //no map found
}
```

* * *

### Reset Map Coordinates

```none
https://api.immersal.com/reset
```

Reset map ECEF coordinates (position, rotation and scale), latitude and longitude values to its original. Only user's private maps can be reset. This can be useful if map has been aligned with another or user has manually changed the coordinates.

#### Parameters

Body

 

 

id\*

integer

Map id

token\*

string

A valid developer token

#### Responses

```none
{
	"error":	"none"
}



















```

```none
{
    "error": "auth" //invalid developer token
}

{
    "error": "query" //error connecting to database or unsuccesful update
}

{
    "error": "not found" //no results found
}

{
    "error": "could not read ecef file" //no ecef file found
}

{
    "error": "could not read lla file" //no latitude, longitude, altitude file found
}
```

* * *

### Get Map Metadata

```none
https://api.immersal.com/metadataget
```

Loads the metadata of a map.  
Metadata is available from:

*   User's own private/public
*   Other users' public maps
*   Maps accessed with `map access token`

#### Parameters

Body

 

 

id\*

integer

Map id

token\*

string

A valid developer token OR a map access token

#### Responses

```none
{
	"error":	"none",
	"id": 		65123,
	"type": 	0, // 0=map construction, 1=stitching, 2=alignment
	"created": 	2022-10-24 14:43:17,
	"version":	1.17.0, //sdk version used
	"user": 	1234, //user of the map
	"creator": 	1235, //original creator of the map
	"name":		"MyMap", //name of the map
	"size":		34, //image count used for the map
	"status":	"done", //processing status "pending", "processing", "sparse", "failed", "done"
	"errno":	0,
	"privacy":	0, //public or private map? private (default) = 0, public = 1
	"latitude":	60.123, //latitude
	"longitude":	23.123 //longitude
	"altitude":	34.123 //altitude
	"tx":		0, //ecef X in meters
	"ty":		6378100.0,  //ecef Y in meters
	"tz":		0,  //ecef Z in meters
	"qw":		0.1,
	"qx":		0.1234,
	"qy":		0.1234,
	"qz":		0.1234,
	"scale":	1, //scale of the map
	"sha256_al": 	"hash",
	"sha256_sparse": "hash",
	"sha256_dense":	"hash",
	"sha256_tex":	"hash"
}
```

```none
{
    "error": "auth" //invalid developer token
}

{
    "error": "query" //error connecting to database
}

{
    "error": "not found" //no results found
}
```

* * *

### Set Map Metadata

```none
https://api.immersal.com/metadataset
```

Overwrites the metadata of a map. You can only overwrite your own private maps.

#### Parameters

Body

 

 

id\*

integer

Map id

token\*

string

A valid developer token

name\*

 

Name of the map

privacy

int

Privacy value. 0 = private, 1 = public

latitude

double

Latitude value

longitude

double

Longitude value

altitude

double

Altitude value

tx

double

X value of the origin.

ty

double

Y value of the origin.

tz

double

Z value of the origin.

qw

double

W component of the rotation quaternion.

qx

double

X component of the rotation quaternion.

qy

double

Y component of the rotation quaternion.

qz

double

Z component of the rotation quaternion.

scale

double

Scale of the map. 1 is normal.

#### Responses

```none
{
	"error":	"none"
}




















```

```none
{
    "error": "auth" //invalid developer token
}

{
    "error": "query" //error connecting to database
}

{
    "error": "not found" //no results found
}

{
    "error": "name" //name is not alphanumeric or contains spaces
}

{
    "error": "privacy" //privacy value was something else than 0 or 1
}

{
    "error": "no inputs" // no values found in the payload 
}
```

* * *

### Set Map Privacy

```none
https://api.immersal.com/privacy
```

Change privacy status of a map. Private maps are in owner control only. Public maps can be for example listed, copied, downloaded by everyone. Possible privacy values are integers: `0 = private` and `1 = public`.

#### Parameters

Body

 

 

token\*

string

A valid developer token

id\*

int

Map id

name\*

int

Map privacy value. 0 = private, 1 = public.

#### Responses

```none
{
    "error": "none"
}











```

```none
{
    "error": "auth"    // invalid token
}

{
    "error": "privacy"    // invalid privacy value
}

{
    "error": "query"    // database query failed or map was not found
}
```

* * *

### Register New User

```none
https://api.immersal.com/register
```

Registers a new user. Login, password and name must be at least four characters long and less than 255 characters long.

#### Parameters

Body

 

 

login\*

string

Username (email address)

name\*

string

Name of the user

password\*

 

Password

#### Responses

```none
{
    "error": "none",
    "userId": 123,
    "token": "abc123",
}










```

```none
{
    "error": "name"    // invalid name
}

{
    "error": "login"    // invalid username
}

{
    "error": "password"    // invalid password
}

{
    "error": "query"    //error connecting to database
}

{
    "error": "duplicate"    //duplicate entry found
}
```

* * *

### Restore Images

```none
https://api.immersal.com/restore
```

Restores the images from a previously constructed map into the user's workspace, e.g., for adding additional images.

TIP: Restore multiple map's images without clearing workspace. This is useful for capturing multiple lighting conditions as separate maps and later combine them to a "super map".

#### Parameters

Body

 

 

id\*

integer

Map id

token\*

string

A valid developer token

clear\*

bool

clear workspace before restoring. Default `True`

#### Responses

```none
{
    "error": "none"
}






















```

```none
{
    "error": "auth" //invalid developer token
}

{
    "error": "work" //error retrieving map from database
}

{
    "error": "job" //no maps found
}

{
    "error": "image delete" //error connecting to database and clearing workspace
}

{
    "error": "query" //error retrieving images from map
}

{
    "error": "image count" //error inserting images to workspace
}

{
    "error": "job type" //map id is not a valid map. Alignment jobs or stitched maps cannot be restored.
}
```

* * *

### Set Map Access Token

```none
https://api.immersal.com/setmaptoken
```

Map access token is a way to allow sharing of a private map. Only owner of a map can set map access token. Map access token holder can for example access map metadata, download poses and download the map. This is a good way to build an app and share your maps to a smaller group without making it public for everyone.  
Map access token can be set, renewed or cleared. By default, a map does not have an access token. A new access token is unique and previous access tokens cannot be retrieved.

Endpoints that support map access token are:  
/dense  
/geopose  
/getposes  
/loadmap (may be deprecated)  
/localizeb64  
/localize  
/map (NOTE /mapb64 is not supported!)  
/metadataget  
/sparse  
/tex

#### Parameters

Body

 

 

id\*

array

Mad Id

token\*

string

A valid developer token

#### Responses

```none
{
    "error": "none",
    "mapId": 12345, //id of the map affected
    "accessToken": "mynewmapaccesstoken12345" //new map access token. string variable
}







```

```none
{
    "error": "auth" //invalid developer token
}

{
    "error": "query" //error connecting to database
}

{
    "error": "No map found." //could not find a map with mapId parameter
}
```

* * *

### Download Sparse Point Cloud

```none
https://api.immersal.com/sparse
```

Downloads the sparse point cloud. Public sparse point clouds can be downloaded without a developer token. Supports a map access token.  
Syntax:

[https://api.immersal.com/sparse?token=MYTOKENHERE&id=MAPID](https://api.immersal.com/sparse?token=MYTOKENHERE&id=MAPID)  
[https://api.immersal.com/sparse?id=MAPID](https://api.immersal.com/sparse?id=MAPID)

#### Parameters

Body

 

 

id\*

integer

Map Id

token\*

string

A valid developer token OR a map access token

#### Responses

```none
Payload: mapId-mapName-sparse.ply





















```

```none
{
    "error": "query string len" // query string was over 1024 characters
}

{
    "error": "query string format" // invalid query string format
}

{
    "error": "auth" //invalid developer token
}

{
    "error": "query" //error connecting to database
}

{
    "error": "not found" //no results found
}

{
    "error": "file not found" //no sparse found
}
```

* * *

### Account Status

```none
https://api.immersal.com/status
```

Gets the account's status.

#### Parameters

Body

 

 

token\*

string

A valid developer token

#### Responses

Returns userId, imageCount, imageMax, eulaAccepted

```none
{
	"error": "none",
	"userId": 123,
	"imageCount": 15,	// images currently in the user's workspace
	"imageMax": 300,	// workpace image capacity (images per map limit)
	"eulaAccepted": true	// EULA acceptance required to download Immersal SDK Core
}


```

```none
{
	"error": "auth" //invalid developer token
}

{
	"error": "query" // error connecting to database
}
```

* * *

### Download Textured Mesh

```none
https://api.immersal.com/tex
```

Downloads the textured mesh of the map. Public textured meshes can be downloaded without a developer token. Supports a map access token.  
Syntax:

[https://api.immersal.com/tex?token=MYTOKENHERE&id=MAPID](https://api.immersal.com/tex?token=MYTOKENHERE&id=MAPID)  
[https://api.immersal.com/tex?id=MAPID](https://api.immersal.com/tex?id=MAPID)

#### Parameters

Body

 

 

id\*

integer

Map id

token\*

string

A valid developer token OR a map access token

#### Responses

```csharp
Payload: mapId-mapName-tex.ply




















```

```csharp
{
    "error": "query string len" // query string was over 1024 characters
}

{
    "error": "query string format" // invalid query string format
}

{
    "error": "auth" //invalid developer token
}

{
    "error": "query" //error connecting to database
}

{
    "error": "not found" //no results found
}

{
    "error": "file not found" //no sparse found
}
```

* * *

### Change Developer Token

```none
https://api.immersal.com/token
```

Generates and sets a new developer token. This could be useful if your developer token has been accidentally exposed.  
The new token is returned in the response if operation was successful. Current developer token can always be found the Immersal developer portal. For the changes to take effect it might require a login logout.

#### Parameters

Body

 

 

token\*

string

A valid developer token.

#### Responses

Returns userId, imageCount, imageMax, eulaAccepted

```csharp
{
	"error": "none",
	"token": 1234_MY_NEW_DEV_TOKEN //new developer token for the account
}











```

```csharp
{
	"error": "token" //invalid current developer token
}

{
	"error": "auth" // no users found with current developer token
}

{
	"error": "token gen" // error generating new token
}

{
	"error": "query" // error connecting to database
}
```

* * *

### Uploads Chunked Files

```none
https://api.immersal.com/upload
```

Allows uploading chunked files. Can handle network breaks during upload. Can be used with `capture` and `b2g` endpoints.  
The first chunk upload returns a json with a hash code that should be used on subsequent chunks to identify the file on server. This same hash can be used with for example `b2g` endpoint to identify the uploaded file after the upload is complete.  
The offset parameter should be left empty or zero on first chunk. The client is responsible for sending the offset amount on subsequent chunks. This can be done with `chunkId*chunkSize = offset` where first chunk id is zero.

#### Parameters

Body

 

 

token\*

string

A valid developer token.

hash\*

string

A hash code used to identify the file on server. First chunk is left empty and server responds with the correct hash to be used on following chunks.

offset\*

double

Offset in number of bytes from the start of the file for the current chunk. Client is responsible for keeping track of offset. First chunk should be left empty or zero.

#### Responses

```csharp
{
	"error": "none",
	"hash": XYZ123 //six character alpha numeric hash code
}



















```

```csharp
{
	"error": "token" //invalid developer token
}

{
	"error": "auth" // no users found with developer token
}

{
	"error": "blob" // invalid binary payload
}

{
	"error": "hash" // invalid hash code
}

{
	"error": "file" // could not open or find file
}

{
	"error": "db conn" // error connecting to database
}
```

* * *

### Get Version

```none
https://api.immersal.com/version
```

Returns the version of Immersal Cloud Service running on the server.

#### Parameters

No Parameters

```csharp
{
	"error": "none",
	"version": "1.18.0" //current version of Immersal Cloud Service running on the server
}
``` 

* * * 

## C# Sample Code

The code below is an example of using the REST API to log in a user and retrieving their token. Except for the `SDKLoginRequest` class, all other `Request` classes inherit the requisite token from `SDKRequestBase`. See the `Immersal.Samples.Mapping.MapperJobs` and `Immersal.Samples.Mapping.Mapper` classes and `Samples/Scenes/MappingApp` for more examples.

```csharp
SDKLoginRequest loginRequest = new SDKLoginRequest();
loginRequest.login = "your@email.address";
loginRequest.password = "password";

string jsonString = JsonUtility.ToJson(loginRequest);
using (UnityWebRequest request = UnityWebRequest.Put(string.Format(Endpoint.URL_FORMAT, m_Sdk.localizationServer, Endpoint.LOGIN), jsonString))
{
  request.method = UnityWebRequest.kHttpVerbPOST;
  request.useHttpContinue = false;
  request.SetRequestHeader("Content-Type", "application/json");
  request.SetRequestHeader("Accept", "application/json");
  yield return request.SendWebRequest();

  SDKLoginResult loginResult = JsonUtility.FromJson<SDKLoginResult>(request.downloadHandler.text);
  if (loginResult.error == "none")
  {
    Debug.Log(loginResult.token);
  }
}
```

## Entities

### Construct Job

Represents a server job that is calculating the map

```csharp
[Serializable]
public class SDKJob
{
    public int id;
    public int size;
    public int bank;
    public string work;
    public string status;   // "done" | "sparse" | "processing" | "failed" | "pending"
    public string server;
    public string name;
    public double latitude;
    public double longitude;
    public double altitude;
    public string created;
    public string modified;
}
```

### Map Id

Encapsulates a `map's ID`, might be extended in the future. Currently only used in SDKLocalizeRequest. In JavaScript and other platforms, this could be represented as a typical JSON object, e.g. `{"id": 6779}`.

```csharp
[Serializable]
public class SDKMapId
{
    public int id;
}
```

## Requests and Responses

### Login

> Log in request / response

```csharp
[Serializable]
public class SDKLoginRequest
{
    public string login;
    public string password;
}

[Serializable]
public class SDKLoginResult
{
    public string error;  // "none" | "auth"
    public string token;  // developer token
    public int banks;     // number of image banks, limited to 1 currently
}
```

### Clear the Image Bank

> Clear request / response

```none
[Serializable]
public class SDKClearRequest : SDKRequestBase
{
    public int bank;        // id of image bank to clear
    public bool anchor;     // if true, clears also anchor points (i.e. empty cloud)
}

[Serializable]
public class SDKClearResult
{
    public string error;
}
```

### Construct a Map

> Construct request / response

```csharp
[Serializable]
public class SDKConstructRequest : SDKRequestBase
{
    public int bank;        // id of image bank
    public string name;     // name for the map
}

[Serializable]
public class SDKConstructResult
{
    public int id;          // id of the construction job / map
    public int size;        // number of images used to create the map
    public string error;
}
```

### Status

> Status request / response

```csharp
[Serializable]
public class SDKStatusRequest : SDKRequestBase
{
    public int bank;
}

[Serializable]
public class SDKStatusResult
{
    public int imageCount;
    public int bankMax;
    public int imageMax;
    public bool eulaAccepted;
    public string error;
}
```

### List of All Jobs

> Jobs request / response

```csharp
[Serializable]
public class SDKJobsRequest : SDKRequestBase
{
    public int bank;
}

[Serializable]
public class SDKJobsResult
{
    public int count;
    public SDKJob[] jobs;
    public string error;
}
```

### List of All Jobs (GPS)

The same as `SDKJobsRequest`, but only fetches the maps within the user's GPS location and range. If `token` is not given, all public maps will be fetched.

```none
public class SDKGeoJobsRequest : SDKJobsRequest
{
    public double latitude;
    public double longitude;
    public double radius;
}
```

### Save Captured Image to the Map

> Image request / response

```csharp
[Serializable]
public class SDKImageRequest : SDKRequestBase
{
    public int bank;
    public int run;
    public int index;
    public bool anchor;
    public double px;    // camera x position
    public double py;    // camera y position
    public double pz;    // camera z position
    public double r00;   // rotation matrix row 0, col 0
    public double r01;   // rotation matrix row 0, col 1
    public double r02;   // rotation matrix row 0, col 2
    public double r10;   // rotation matrix row 1, col 0
    public double r11;   // rotation matrix row 1, col 1
    public double r12;   // rotation matrix row 1, col 2
    public double r20;   // rotation matrix row 2, col 0
    public double r21;   // rotation matrix row 2, col 1
    public double r22;   // rotation matrix row 2, col 2
    public double fx;    // camera intrinsics focal length x
    public double fy;    // camera intrinsics focal length y
    public double ox;    // camera intrinsics principal point x
    public double oy;    // camera intrinsics principal point y
    public double latitude;  // WGS84 latitude
    public double longitude; // WGS84 longitude
    public double altitude;  // GPS elevation
    public string b64;   // Base64-encoded PNG image, 8-bit grayscale or 24-bit RGB
}

[Serializable]
public class SDKImageResult
{
    public string path;
}
```

### Localize Image

> Localize request / response

The result (when localization has been successful) is a projection matrix in the AR Cloud space. It can be used to extract the position and rotation of the AR device, which then again can be combined with the device's local SLAM tracking.

```csharp
[Serializable]
public class SDKLocalizeRequest : SDKRequestBase
{
    public double fx;    // camera intrinsics focal length x
    public double fy;    // camera intrinsics focal length y
    public double ox;    // camera intrinsics principal point x
    public double oy;    // camera intrinsics principal point y
    public string b64;   // Base64-encoded PNG image, 8-bit grayscale or 24-bit RGB
    public SDKMapId[] mapIds;  // list of maps to localize against
}

[Serializable]
public class SDKLocalizeResult : SDKResultBase
{
    public bool success;
    public int map;     // ID of the map if localization was successful
    public float px;    // x position within the map
    public float py;    // y position within the map
    public float pz;    // z position within the map
    public float r00;   // rotation matrix row 0, col 0
    public float r01;   // rotation matrix row 0, col 1
    public float r02;   // rotation matrix row 0, col 2
    public float r10;   // rotation matrix row 1, col 0
    public float r11;   // rotation matrix row 1, col 1
    public float r12;   // rotation matrix row 1, col 2
    public float r20;   // rotation matrix row 2, col 0
    public float r21;   // rotation matrix row 2, col 1
    public float r22;   // rotation matrix row 2, col 2
}
```

### Map coordinates in ECEF system (GPS)

> ECEF request / response

```csharp
[Serializable]
public class SDKEcefRequest : SDKRequestBase
{
    public int id;    // map ID
}

[Serializable]
public class SDKEcefResult : SDKResultBase
{
    public double[] ecef;    // ECEF coordinates
}
```

### Delete Map

> Delete map request / response

```csharp
[Serializable]
public class SDKDeleteMapRequest : SDKRequestBase
{
    public int id;    // map ID
}

[Serializable]
public class SDKDeleteMapResult : SDKResultBase
{

}
```

### Restore Images

> Restore map images request / response After restoring the map's images, it is possible to add more images to the map and recalculate it.

    ```csharp
    [Serializable]
    public class SDKRestoreMapImagesRequest : SDKRequestBase
    {
        public int id;    // map ID
    }

    [Serializable]
    public class SDKRestoreMapImagesResult : SDKResultBase
    {

    }
```

### Load Constructed Map

> Map request / response

```csharp
[Serializable]
public class SDKMapRequest : SDKRequestBase
{
    public int id;    // map ID
}

[Serializable]
public class SDKMapResult
{
    public string md5_al;    // MD5 hash for the loaded map
    public string b64;    // Base64 encoded .bytes map file
}
```

### Errors

The REST API uses the following error codes (TBD):

Error Code

Meaning

400

Bad Request -- Your request is invalid.

 

double
