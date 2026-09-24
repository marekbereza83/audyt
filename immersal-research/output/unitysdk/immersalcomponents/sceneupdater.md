# SceneUpdater

Zrodlo: https://developers.immersal.com/docs/unitysdk/immersalcomponents/sceneupdater/

---

# SceneUpdater

The SceneUpdater component is responsible for taking in the pose data from Localizer, adjusting it if necessary, and updating the scene by passing it to the relevant ISpaceUpdateables.

## Interface

```csharp
public interface ISceneUpdater
{
    Task UpdateScene(MapEntry entry, ICameraData cameraData, ILocalizationResult localizationResult);
}
```

### UpdateScene

Implementations of this method take in data originating from Localizer, PlatformSupport and MapManager. It's expected that the ISceneUpdater implementation uses this data to align ISceneUpdateables with the device camera feed.

ImmersalSession calls this after getting successful localization results from Localizer. This is one of the last stops for the ImmersalSession data flow as ISceneUpdater implementations are not expected to return any results.

## Implementation

The SDK comes with a ready to use implementation of a SceneUpdater with the following features:

*   Transforming pose to camera space
*   Updating the relevant ISceneUpdateable with the adjusted pose (content moves, camera does not)
