# Known Issues

Zrodlo: https://developers.immersal.com/docs/unitysdk/knownissues/

---

# Known Issues

The current XRMapVisualiation implementation uses MeshTopology.Points for rendering but the Unity viewport rendering does not support this very well on all platforms. You might encounter the following warning:

```none
Drawing with MeshTopology.Points, yet the vertex program 'Hidden/SceneViewSelected' does not have PSIZE output.
```

This warning can be ignored. We are working on updating the visualization implementation.

We have had reports of the ImmersalSDK object failing to serialize the developer token in some instances. This is being investigated. If you run into this, please reach out to us.

Visual Scripting 1.9.0 (installed by default in Unity 2021.3.30f1 and 2022.3.10f1) can cause the following error in conjunction with AR Foundation 5.1.0:

```none
Library/PackageCache/com.unity.xr.arfoundation@5.1.0/Runtime/VisualScripting/Units/Events/EventUnits/SessionStateChangedEventUnit.cs(50,30):
error CS0506: 'SessionStateChangedEventUnit.StopListening(GraphStack)':
cannot override inherited member 'EventUnit<ARSessionState>.StopListening(GraphStack)' because it is not marked virtual, abstract, or override
```

#### Solution

If you do not need the Visual Scripting package, you can simply remove it from the Package Manager. Alternative options:

*   Update the Visual Scripting package to 1.9.1
*   Use Unity 2022.3.11f1 or newer which does not install Visual Scripting by default.

There is a minor bug in AR Foundation 5.0+ that can cause the following warning to appear:

```none
Saving has no effect. Your class 'UnityEditor.XR.Simulation.XREnvironmentViewManager' is missing the FilePathAttribute. Use this attribute to specify where to save your ScriptableSingleton. 
``` 

You can safely ignore the warning as it causes no issues. Unity has reported that a fix to this warning is coming out soon.

XRMaps manage and serialize their own reference to a ILocalizationMethod configured in the scene. This reference will break if moved to another scene.

Copying XRMapVisualization object can also result in duplicate references to the same internal Mesh, which can result in issues if the reference breaks.

#### Solution

For now it's best to not copy XRMap object to avoid issues with broken references. We are looking into creating a better solution for this.

It's possible that the SDK initializes faster than Unity rendering, which can lead to ARFPlatformSupport raising errors about not accessing camera image or intrinsics.

This is expected behaviour as the XRCameraSubsystem cannot provide the data before Unity renders the first frame.

#### Solution

Nothing needs to be done as the application will work normally once Unity rendering starts. We are looking into fixing the error messages in an upcoming patch release.
