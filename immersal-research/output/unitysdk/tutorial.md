# Getting started tutorial

Zrodlo: https://developers.immersal.com/docs/unitysdk/tutorial/

---

# Getting started tutorial

### Prerequisites

*   A succesfully mapped space and map id.
*   Unity version 2022.3 LTS.
*   Tools for building for iOS or Android.

This tutorial assumes prior experience with building mobile applications with Unity.

## Unity

### New project

Create a new Unity project using the default 3D project template.

### Installation

1.  Open up the Package Manager from **Window > Package Manager**
2.  Click the **+** button and select _"Add package from Git URL"_
3.  Copy & paste the package URL below and click **Add**

Package URL: `https://github.com/immersal/imdk-unity.git`

If you see a Unity pop-up about _"This project is using the new input system package but the native platform backends for the new input system are not enabled in the player settings."_, please select **Yes** and let Unity restart before continuing.

### Configure your Unity project

If adding the package was successful, you should automatically see a "Immersal Project Validation" pop-up window appear. This window displays Immersal specific project settings that need to be validated to ensure the SDK works as expected.

**Project configurations are platform-specific**, so let's switch to whatever platform we want to use first:

1.  Open up **File > Build Settings**
2.  Select Android or iOS as the Platform and click **Switch Platform**

After switching platforms, we can go back to the Project Validation window to fix possible issues:

1.  Focus the Project Validation window or open it again from **Immersal SDK > Project Validation**
2.  Click **Fix all**.

Enabling of XR Plugin Providers must be done manually as Unity does not allow configuring these automatically. Click the **Fix** button to open up the relevant Project Settings view and enable the checkbox next to the relevant XR Plugin Provider.

If there are any issues remaining or you want to know more, please refer to the [Project Configuration page](../projectconfiguration/).

### Simple sample

We provide a few samples that work well as a starting point for projects.

1.  Open up the Package Manager from **Window > Package Manager**
2.  Find the **Immersal Core** package
3.  Switch to the **Samples** tab
4.  Click Import next to the **Core Samples** option
5.  Open **"SimpleSample"** in Assets/Samples/Immersal SDK Core/2.x.x/Core Samples/Scenes/

If you see a TMP Importer pop-up, please click the **"Import TMP Essentials"** button before continuing.

### Login with Immersal

For the next steps, we'll need to configure our developer token.

1.  Open up **Immersal SDK Settings** from the **Immersal SDK** toolbar menu.
2.  Log in with your credentials.
3.  Ensure your developer token was added to the **Immersal SDK object** in the scene.

### Set up your map

Next we're going to configure the Immersal XR Map object to point to the map you've created earlier.

1.  Find the **XR Space** object in the Hierarchy
2.  Under it should be an **XR Map** object
3.  In the Inspector, look for the **"Download from cloud"** section
4.  Add your map id to the field
5.  Select both **Mapfile** and **Visualization** as download options
6.  Click the **Download** button
7.  After the download completes, you should see new configuration options for the XR Map.
8.  Click on the **Select visualization** button to select the point cloud visualization object.
9.  Set **Render Mode** to **"Editor And Runtime"**.

### Adding content

Time to add some content to your augmented space!

1.  Under the **XR Space** object, create a new empty object and call it _"Content"_
2.  Under the new Content object, add any 3d assets or other content
3.  **Make sure none of your content is set to "Static" in the Inspector**
4.  Save your scene

### Try it out

Only thing left is to build the project and try it out.

1.  Open up **File > Build Settings**
2.  Add your scene to the _"Scenes In Build"_ list if it's not there already
3.  Select Android or iOS as the Platform and click **Switch Platform** (if needed)
4.  Click **Build**

#### Android

Install the built apk like any other Unity Android project:

```none
adb install YourTutorialResult.apk
```

#### iOS

Open up the built _Unity-iPhone.xcodeproj_ in XCode, configure any signing options if necessary, choose target device and click **Run**.

### Workflow Tutorial

Complete tutorial for SDK2.0 workflow
