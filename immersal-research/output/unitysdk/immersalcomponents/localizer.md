# Localizer

Zrodlo: https://developers.immersal.com/docs/unitysdk/immersalcomponents/localizer/

---

# Localizer

The Localizer component configures and manages LocalizationMethods.

## Interface

```csharp
public interface ILocalizer
{
    ILocalizationMethod[] AvailableLocalizationMethods { get;  }
    Task<ILocalizerConfigurationResult> ConfigureLocalizer(ILocalizerConfiguration configuration);
    Task<ILocalizationResults> Localize(ICameraData cameraData);
    Task<List<LocalizationTask>> CreateLocalizationTasks(ICameraData cameraData);
    Task<ILocalizationResults> LocalizeAllMethods(ICameraData cameraData);
    Task StopAndCleanUp();
    Task StopLocalizationForMethod(ILocalizationMethod localizationMethod);
    bool TryGetLocalizationTask(ILocalizationMethod localizationMethod, out LocalizationTask task);
}
```

### ConfigureLocalization

Implementations of this method are expected to set up the Localizer.

Implementations receive ILocalizationConfiguration which includes a Dictionary mapping XRMaps to their associated ILocalizationMethods.

The implementation should return a simple result describing success.

```csharp
public interface ILocalizationConfiguration
{
    Dictionary<ILocalizationMethod, XRMap[]> LocalizationMethodXRMapMapping { get; }
}

public interface ILocalizationConfigurationResult
{
    public bool Success { get; }
}
```

The SDK will call this in the beginning of runtime, after PlatformSupport has been configured.

### Localize

Implementations of this method return a collection of localization results:

```csharp
public interface ILocalizationResults
{
    ILocalizationResult[] results { get; }
}
```

ILocalizationResult is declared together with ILocalizationMethod.

ImmersalSession calls this after getting data from PlatformSupport update as part of it's pipeline cycle.

### StopAndCleanUp

Implementations of this method are expected to stop any running processes tied to the Localizer in a graceful manner. The Localizer should take care of removing any event subscriptions and cancel any asynchronous tasks etc. The Localizer should be ready for a new call to ConfigureLocalization some time after this method has run.

This is called by the SDK when a full reset is requested.

## Implementation

The SDK comes with a ready to use implementation of a Localizer with the following features:

*   Management and configuration of ILocalizationMethods
*   Parallel localization with each configured ILocalizationMethod.
*   Events based on localization results
