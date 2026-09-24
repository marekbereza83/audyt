# MapOption

Zrodlo: https://developers.immersal.com/docs/unitysdk/immersalcomponents/mapoption/

---

# MapOption

```csharp
public interface IMapOption
{
    string Name { get; }
    void DrawEditorGUI(XRMap map);
}
```

This interface provides the possibility to create custom settings that are unique for each XRMap.

In the editor, XRMaps automatically query the MapManager for any available IMapOptions related to the currently selected ILocalizationMethod. The XRMap manages the IMapOption instances as well as their serialization.

The implementation should ensure the necessary data is marked for serialization and that editor code is contained within compile-guards.

### Name

The Name property can be used to differentiate between various IMapOption implementations.

### DrawEditorGUI

Implementations of this method should render the necessary inspector elements for configuring the option. XRMapEditor will call this when the associated ILocalizationMethod is active.

### Implementations

Currently the only built in IMapOption implementation is the MapLoadingOption that is utilized by the DeviceLocalization method and the MapManager to configure map loading behaviour at runtime.

### Example implementation

```csharp
[Serializable]
public class IntOption : IMapOption
{
    public string Name { get; private set; }

    [SerializeField]
    public int Value;

    public IntOption(string name, int initialValue)
    {
        Name = name;
        Value = initialValue;
    }

    public void DrawEditorGUI(XRMap map)
    {
#if UNITY_EDITOR
        Value = EditorGUILayout.IntField(Name, Value);
#endif
    }
}
```
