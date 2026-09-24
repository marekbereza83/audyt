# CameraData

Zrodlo: https://developers.immersal.com/docs/unitysdk/immersalcomponents/cameradata/

---

# CameraData

The CameraData class is responsible for containing all necessary data produced by the IPlatformSupport. In addition, it manages the life cycle of the contained data as well as access to it.

We do not expect our SDK users to create custom implementations of the ICameraData interface.

## ImageData

To support different platform implementations and custom data logic, we provide the IImageData interface and ImageData abstract class. These work together with the CameraData class to provide semi-automatic native/managed data management while still maintaining a flexible support for customization.

The SDK comes with a SimpleImageData class that can be used for constructing or manipulating CameraData when the data source is in byte\[\] form. This class serves as a good example of how the interface can be used or as a starting point for further customization:

```csharp
public sealed class SimpleImageData : ImageData
{
    public override IntPtr UnmanagedDataPointer => m_UnmanagedDataPointer;
    public override byte[] ManagedBytes { get; }

    private IntPtr m_UnmanagedDataPointer;
    private GCHandle m_managedDataHandle;

    public SimpleImageData(byte[] bytes)
    {
        ManagedBytes = bytes;
        m_managedDataHandle = GCHandle.Alloc(ManagedBytes, GCHandleType.Pinned);
        m_UnmanagedDataPointer = m_managedDataHandle.AddrOfPinnedObject();
    }

    public override void DisposeData()
    {
        m_managedDataHandle.Free();
        m_UnmanagedDataPointer = IntPtr.Zero;
    }
}
```

To learn more about using CameraData and ImageData, please have a look at the CustomLocalizationSample included in the SDK package samples.
