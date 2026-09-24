# ImmersalSession

Zrodlo: https://developers.immersal.com/docs/unitysdk/immersalcomponents/immersalsession/

---

# ImmersalSession

The ImmersalSession forms a pipeline by connecting the different components together. It manages a continous loop that queries the relevant components for data and passes it onwards based on it's internal logic and configuration.

Basic description of the ImmersalSession loop:

1.  Update [IPlatformSupport](../platformsupport/) and receive results including camera data.
2.  Pass camera data to [ILocalizer](../localizer/) and receive localization results.
3.  Optionally process these results with a processing chain.
4.  Pass the results to [ISceneUpdater](../sceneupdater/).
5.  Also pass the results to [ITrackingAnalyzer](../trackinganalyzer/).
