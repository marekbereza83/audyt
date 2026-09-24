# PlatformSupport

Zrodlo: https://developers.immersal.com/docs/unitysdk/immersalcomponents/platformsupport/

---

# PlatformSupport

The PlatformSupport component takes care of configuring a device as well as providing camera data from that device.

## Interface

```csharp
public interface IPlatformSupport
{
    Task<IPlatformUpdateResult> UpdatePlatform();
    Task<IPlatformUpdateResult> UpdatePlatform(IPlatformConfiguration oneShotConfiguration);
    Task<IPlatformConfigureResult> ConfigurePlatform();
    Task<IPlatformConfigureResult> ConfigurePlatform(IPlatformConfiguration configuration);
    Task StopAndCleanUp();
}
```

### UpdatePlatform

Implementations of this method are expected to return IPlatformUpdateResult which contains information on the platform status as well as camera data from the device:

```csharp
public interface IPlatformUpdateResult
{
    bool Success { get; }
    IPlatformStatus Status { get; }
    ICameraData CameraData { get; }
}

public interface IPlatformStatus
{
    int TrackingQuality { get; }
}
```

ImmersalSession calls this method as first step of it's pipeline cycle.

### ConfigurePlatform

Implementations of this method are expected to configure the device and return a simple result:

```csharp
public interface IPlatformConfigureResult
{
    bool Success { get; }
}
```

This is called by the SDK automatically once at the start of the runtime or after resetting the SDK. It should ensure the platform is capable of providing expected data with the UpdatePlatform implementation.

### StopAndCleanUp

Implementations of this method are expected to stop any running processes tied to the platform in a graceful manner. The platform should take care of removing any event subscriptions and deal with other clean up tasks. The platform should be ready for a new call to ConfigurePlatform some time after this method has run.

This is called by the SDK when a full reset is requested.

## Implementations

The SDK comes with ready to use implementations of multiple platforms as well as the necessary data types for connecting to other components. Support for ARFoundation is part of the Core package. Other platforms are supported with their own dedicated packages.
