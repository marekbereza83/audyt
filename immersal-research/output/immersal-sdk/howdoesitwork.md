# How does it work?

Zrodlo: https://developers.immersal.com/docs/immersal-sdk/howdoesitwork/

---

# How does it work?

Immersal SDK enables persistent AR experiences in the physical world by providing two main functions:

*   Spatial mapping
*   Localization

### Spatial mapping

Spatial mapping is the act of capturing visual data from a physical space and processing it into a map for localization.

With Immersal, you can create maps with our dedicated apps, supported hardware scanners or the REST API.

### Localization

Localization is the process of finding the device position and orientation within the physical space.

Immersal provides localization to mapped spaces using one of our SDKs or our REST API.

# How to get started?

### Register

Register for a free account in the [Developer Portal](https://developers.immersal.com/) The free license has capacity limitations, but you can use it even for commercial projects and it suits many use cases.

The developer portal gives you access to your **developer token**, which is required for some functionality (REST API / Pro & Enterprise features).

Spatial Mapping can be done with Immersal Mapper App without a developer token, simply by logging in with your credentials.

In your apps, Visual Positioning (localization) can also be done without the Immersal Cloud Service and the required token. You can embed your Spatial Maps into your app and use on-device Visual Positioning completely offline.

### Map a space

The easiest way to start mapping is to download our Mapper app and following our [How To Map](../../mapsmapping/howtomap/) tutorial on mapping.

### Create an experience

We recommend follow the [Unity tutorial](../../unitysdk/tutorial/) as a starting point in developing Immersal powered experiences.

```markdown
// example token
ad9c8853ecda657cc94f71a2b8fbc4524a2a032d8de85f05f6d9a4646bb39249
```
