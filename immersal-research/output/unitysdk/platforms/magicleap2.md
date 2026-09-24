# Magic Leap 2

Zrodlo: https://developers.immersal.com/docs/unitysdk/platforms/magicleap2/

---

# Magic Leap 2

We are working on updating Magic Leap support to newer versions.

### Prerequisites

*   [Magic Leap 2 tools](https://developer-docs.magicleap.cloud/docs/guides/unity/getting-started/install-the-tools/)
    *   ML C SDK 1.4.0
    *   **ML Unity package 1.7.0**
*   Unity 2022.3 LTS
*   Immersal Core 2.0

### Installation

Download and install the above mentioned versions of the Magic Leap C SDK and Unity package using the Magic Leap Hub package manager.

In the Unity Package Manager, install the Magic Leap package with the "Add package from tarball..." tool. Navigate to the location of the following folders and select the .tgz file within to add the package from com.magicleap.unitysdk.tgz (downloaded via ML Hub).

For example:

*   Mac : `$HOME/MagicLeap/tools/unity/<Version>/com.magicleap.unitysdk.tgz`
*   Windows : `%USERPROFILE%/MagicLeap/tools/unity/<Version>/com.magicleap.unitysdk.tgz`

After Magic Leap 2 Unity package has been installed, you can install the Immersal Magic Leap 2 support package:

1.  Open up the Package Manager from **Window > Package Manager**
2.  Click the **+** button and select _"Add package from Git URL"_
3.  Copy & paste the package URL below and click **Add**

Package URL: `https://github.com/immersal/imdk-ml2.git`

### Unity project configuration

Ensure Magic Leap XR Plug-In is enabled and configured:

1.  Switch the build platform to **Android**.
2.  Enable Magic Leap in **Project Settings > XR Plug-In Management**.
3.  Check and fix issues in **Project Settings > XR Plug-In Management > Project Validation**.

In addition, please ensure the following permissions have been enabled in the Magic Leap custom AndroidManifest:

*   android.permission.CAMERA
*   com.magicleap.permission.SPATIAL\_MAPPING
*   com.magicleap.permission.SPATIAL\_ANCHOR

You can find these permission in the **Edit > Project Settings > Magic Leap > Permissions** view.

Please refer to Magic Leap 2 documentation if you have issues in configuring your project.

### Simple sample

The Magic Leap 2 support package contains one sample scene showcasing the basic setup for using Immersal together with Magic Leap 2.

### Building and running

The application can be built the same way as any other Magic Leap 2 application. For more details, you can refer to the [Magic Leap 2 example documentation](https://developer-docs.magicleap.cloud/docs/guides/unity/getting-started/unity-building-simple-app/#building-to-device)

Note: there is a known issue when running the application for the first time that can cause localization to not work automatically. Currently you can simply restart the application to get around this. We are working on fixing this issue.
