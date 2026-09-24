# TrackingAnalyzer

Zrodlo: https://developers.immersal.com/docs/unitysdk/immersalcomponents/trackinganalyzer/

---

# TrackingAnalyzer

The TrackingAnalyzer component is responsible for interpreting incoming platform status and localization results and constructing a tracking status to describe the current quality of positioning.

## Interface

```csharp
public interface ITrackingAnalyzer
{
    public ITrackingStatus TrackingStatus { get; }
    public void Analyze(IPlatformStatus platformStatus, ILocalizationResults localizationResults);
}
```

### TrackingStatus

This field accessor simply returns the current ITrackingStatus that the TrackingAnalyzer is managing:

```csharp
public interface ITrackingStatus
{
    int LocalizationAttemptCount { get; }
    int LocalizationSuccessCount { get; }
    int TrackingQuality { get; }
}
```

### Analyze

Implementations get new data from this method.

ImmersalSession calls this at the very end of it's pipeline update cycle.

## Implementation

The SDK comes with a ready to use implementation of a TrackingAnalyzer with the following features:

*   A tracking quality update loop with configurable pose decay
*   Convenient events invoked on tracking quality state changes
