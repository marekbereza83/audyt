# LocalizationMethod

Zrodlo: https://developers.immersal.com/docs/unitysdk/immersalcomponents/localizationmethod/

---

# LocalizationMethod

LocalizationMethods define how localization happens. The component takes in data from a ILocalizer and produces a pose describing the alignment of spatial maps.

ILocalizationMethods can expose XRMap specific configurations in the form of IMapOptions.

## Interface

```csharp
public interface ILocalizationMethod
{
    ConfigurationMode ConfigurationMode { get; }
    IMapOption MapOptions { get; }
    Task<bool> Configure(XRMap[] maps);
    Task<ILocalizationResult> Localize(ICameraData cameraData, CancellationToken cancellationToken);
    Task StopAndCleanUp();
    Task OnMapRegistered(XRMap map);
}
```

### ConfigurationMode

A simple property that describes how/when a Localizer should configure this implementation. Current options and their effect with the default Localizer:

*   `Always` always configure
*   `WhenNecessary` only configure if there are maps using this ILocalizationMethod implementation.

### MapOptions

Implementations of this method are expected to return an array of [IMapOption](../mapoption/). The MapManager will access this when queried by XRMaps.

### Configure

With this method the implementation is provided with an array of XRMaps that have been configured to use this implementation. The method should return a bool defining if configuration was succesful and the implementation is ready to be used.

The expectation is that this method will be called by the Localizer as part of it's own configuration process. With the default ILocalizer implementation, this happens after all maps are registered and loaded.

### Localize

Implementations of the Localize method take in ICameraData and return ILocalizationResult.

```csharp
public interface ILocalizationResult
{
    bool Success { get; }
    int MapId { get; }
    LocalizeInfo LocalizeInfo { get; }
}
```

LocalizeInfo is a core struct containing localization result data from the Immersal cloud service or plugin. This can be produced using the core LocalizeImage methods or the REST API jobs.

### StopAndCleanUp

Similar to the ILocalizer StopAndCleanUp, implementations of this method are expected to gracefully stop any running processes and clean up any resources connected to the implemented ILocalizationMethod.

### OnMapRegistered

This is a convenience method that gets called by the MapManager after a map has been registered. The call happens after registration and before loading into the plugin (if so configured).
