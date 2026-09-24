# Project configuration

Zrodlo: https://developers.immersal.com/docs/unitysdk/projectconfiguration/

---

# Project configuration

The **Immersal Project Validation** view should find and fix all issues in the Unity project.

*   Automatic Graphics API must be disabled.
*   IL2CPP scripting backend must be enabled.
*   Allow 'unsafe' code must be enabled.
*   Universal Render Pipeline is recommended.

*   Minimum iOS target version is 12.0.
*   Graphics API must be set to Metal.
*   Camera usage description is required.
*   Location usage description is required if using GPS.
*   ARKit XR-Plugin Provider must be enabled.

*   Minimum Android API Level must be 26 or higher.
*   Graphics API must be set to OpenGLES3.
*   ARM64 target architecture must be enabled.
*   ARCore XR-Plugin Provider must be enabled.
*   Custom Android Manifest with relevant permissions is required.

*   Other platform specific configurations are documented in the platforms section.
