# Immersal Components

Zrodlo: https://developers.immersal.com/docs/unitysdk/immersalcomponents/

---

# Immersal Components

The Immersal Unity SDK has a modular component architecture that enables easy customization of various parts of the pipeline.

### Current components

*   PlatformSupport
*   Localizer
*   LocalizationMethod
*   MapOption
*   SceneUpdater
*   TrackingAnalyzer

The SDK comes with interfaces and implementations for all of these. The components are used together to form a pipeline that takes in data from a device camera and uses it to align the spatial maps. Developers are free to implement this pipeline in any way they wish.

## ImmersalSession

The SDK also comes with a sample implementation of this pipeline in the form of **ImmersalSession**. This implementation runs a continous update loop in which all the components are connected together. See more details on the ImmersalSession page.
