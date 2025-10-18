---
title: Save Design - Script Reference
description: Full API documentation for Save Design including attributes, interfaces, and auto-generated methods. Ideal for developers integrating Save Design into their Unity project.
pubDate: '2025-05-25'
heroImage: '/fish-dolls/images/save-design.png'
---

# Save Design - Script Reference

## Table of Contents

- Attributes
    - [EncryptorAttribute](#encryptorattribute)
    - [KeepAttribute](#keepattribute)
    - [SaveDesignRootAttribute](#savedesignrootattribute)
    - [SharedDataAttribute](#shareddataattribute)
    - [SlotDataAttribute](#slotdataattribute)
    - [SlotMetaDataAttribute](#slotmetadataattribute)
    - [TempDataAttribute](#tempdataattribute)
- Enums
    - [ExceptionPolicy](#exceptionpolicy)
    - [SerializerType](#serializertype)
    - [TempDataResetTiming](#tempdataresettiming)
- Interfaces
    - [IAfterInitializeCallback](#iafterinitializecallback)
    - [IAfterInitializeOrLoadCallback](#iafterinitializeorloadcallback)
    - [IAfterInitializeOrLoadRollback\<T>](#iafterinitializeorloadrollbackt)
    - [IAfterInitializeRollback\<T>](#iafterinitializerollbackt)
    - [IAfterLoadCallback](#iafterloadcallback)
    - [IAfterLoadRollback\<T>](#iafterloadrollbackt)
    - [IAfterLoadSlotCallback](#iafterloadslotcallback)
    - [IAfterLoadSlotRollback\<T>](#iafterloadslotrollbackt)
    - [IBeforeDeleteCallback](#ibeforedeletecallback)
    - [IBeforeDeleteRollback](#ibeforedeleterollback)
    - [IBeforeDeleteSlotCallback](#ibeforedeleteslotcallback)
    - [IBeforeDeleteSlotRollback](#ibeforedeleteslotrollback)
    - [IBeforeSaveCallback](#ibeforesavecallback)
    - [IBeforeSaveRollback](#ibeforesaverollback)
    - [IBeforeSaveSlotCallback](#ibeforesaveslotcallback)
    - [IBeforeSaveSlotRollback](#ibeforesaveslotrollback)
    - [IDataCipher](#idatacipher)
    - [ISaveDesignConfig](#isavedesignconfig)
- Structs
    - [SlotKey](#slotkey)

---

## EncryptorAttribute

### Overview

Marks a class that provides encryption/decryption for Save Design. The marked class must implement `IDataCipher`.

### Applicable Targets

- `AttributeTargets.Class`
- `Inherited`: `false`
- `AllowMultiple`: `false`

### Parameters

| Name | Type | Req | Description |
|------|------|:---:|-------------|
| —    | —    |  —  | None        |

### Example

```csharp
[Encryptor]
public sealed class AesGcmCipher : IDataCipher
{
    public byte[] Encrypt(byte[] plaintext) { /* ... */ return ciphertext; }
    public byte[] Decrypt(byte[] ciphertext) { /* ... */ return plaintext; }
}
```

### Notes

- For backward compatibility: if a static class with this attribute exists, the framework calls the following static
  methods if present.

```csharp
public static void Encrypt(ref byte[] data)
public static void Decrypt(ref byte[] data)
```

The data is passed by `ref`; replace or mutate the array to reflect encrypted/decrypted bytes.

### See Also

- [IDataCipher](#idatacipher)

---

## KeepAttribute

### Overview

Preserves the value of a field or event even if the data instance is replaced during initialize/load.

### Applicable Targets

- `AttributeTargets.Event | AttributeTargets.Field`
- `Inherited`: `false`
- `AllowMultiple`: `false`

### Parameters

| Name | Type | Req | Description |
|------|------|:---:|-------------|
| —    | —    |  —  | None        |

### Example

```csharp
[SharedData]
public sealed partial class RuntimeCache
{
    [Keep]
    public int LastOpenedTab;
}
```

### Notes

- This attribute does not decide whether a field is persisted. Actual persistence is controlled by the serializer you
  use (e.g., ignore attributes, visibility, custom converters).
- This attribute cannot be used on Slot Meta Data types.
- Its intent is to preserve values when instances are swapped at initialize/load; it is not a directive to persist
  values.

### See Also

- [TempDataAttribute](#tempdataattribute)

---

## SaveDesignRootAttribute

### Overview

Marks a static class as the Save Design "root." The framework wires up core features (initialize, load, save, delete)
and exposes a global access surface. The serializer can be selected via the constructor parameter.

### Applicable Targets

- `AttributeTargets.Class`
- `Inherited`: `false`
- `AllowMultiple`: `false`

### Parameters

| Name             | Type             | Req | Description                                                                   |
|------------------|------------------|:---:|-------------------------------------------------------------------------------|
| `serializerType` | `SerializerType` |  —  | Serializer for save/load. Default if omitted is `SerializerType.JsonUtility`. |

### Example

```csharp
using SaveDesign.Runtime;

[SaveDesignRoot(SerializerType.MemoryPack)]
public static class GameSave { }
```

### Notes

- Apply to a `static` class only.
- Serializer choice affects compatibility; prefer deciding early and plan migration if you change it.

### See Also

- [SerializerType](#serializertype)
- [ISaveDesignConfig](#isavedesignconfig)

---

## SharedDataAttribute

### Overview

Marks a data type shared across all slots. With dependencies specified, (de)serialization happens after those types.

### Applicable Targets

- `AttributeTargets.Class`
- `Inherited`: `false`
- `AllowMultiple`: `false`

### Parameters

| Name             | Type     | Req | Description                 |
|------------------|----------|:---:|-----------------------------|
| `path`           | `string` |  —  | Optional hierarchical path. |
| `dependsOnTypes` | `Type[]` |  —  | Types that this depends on. |

### Example

```csharp
[SharedData("Game")]
public sealed class SharedGameData { /* ... */ }
```

### Notes

- Keep per-slot state out of shared data.
- `path` supports multi-level segments separated by slash (`/`), e.g., `Game/Player/Inventory`.

### See Also

- [SlotDataAttribute](#slotdataattribute)
- [ISaveDesignConfig](#isavedesignconfig)

---

## SlotDataAttribute

### Overview

Marks a per-slot data type. Supports an optional path and dependencies.

### Applicable Targets

- `AttributeTargets.Class`
- `Inherited`: `false`
- `AllowMultiple`: `false`

### Parameters

| Name             | Type     | Req | Description                 |
|------------------|----------|:---:|-----------------------------|
| `path`           | `string` |  —  | Optional hierarchical path. |
| `dependsOnTypes` | `Type[]` |  —  | Types that this depends on. |

### Example

```csharp
[SlotData("Player")]
public sealed class PlayerSlotData { /* ... */ }
```

### Notes

- Design assuming content changes when switching slots.
- `path` supports slash-separated multi-level segments (e.g., `Game/Player/Inventory`).

### See Also

- [SharedDataAttribute](#shareddataattribute)
- [SlotMetaDataAttribute](#slotmetadataattribute)

---

## SlotMetaDataAttribute

### Overview

Marks a slot meta-data type (e.g., thumbnail, playtime, creation time).

### Applicable Targets

- `AttributeTargets.Class`
- `Inherited`: `false`
- `AllowMultiple`: `false`

### Parameters

| Name | Type | Req | Description |
|------|------|:---:|-------------|
| —    | —    |  —  | None        |

### Example

```csharp
[SlotMetaData]
public sealed class SlotInfo { /* ... */ }
```

### Notes

- Meta data is often used for display/selection; keep it small.

### See Also

- [SlotDataAttribute](#slotdataattribute)

---

## TempDataAttribute

### Overview

Marks a non-persistent temporary data type. You can specify reset timing and dependencies.

### Applicable Targets

- `AttributeTargets.Class`
- `Inherited`: `false`
- `AllowMultiple`: `false`

### Parameters

| Name             | Type                  | Req | Description                  |
|------------------|-----------------------|:---:|------------------------------|
| `path`           | `string`              |  —  | Optional hierarchical path.  |
| `resetTiming`    | `TempDataResetTiming` |  —  | When to reset the temp data. |
| `dependsOnTypes` | `Type[]`              |  —  | Types that this depends on.  |

### Example

```csharp
[TempData(TempDataResetTiming.OnSlotDataLoad)]
public sealed class RuntimeCache { /* ... */ }
```

### Notes

- Design the data structure to tolerate re-creation and reset, as it will never be persisted.
- If one temporary data depends on another, their reset timing must be the same to maintain consistency.
- `path` supports slash-separated multi-level segments (e.g., `Game/Player/Inventory`).

### See Also

- [TempDataResetTiming](#tempdataresettiming)
- [KeepAttribute](#keepattribute)

---

## ExceptionPolicy

### Overview

Controls how exceptions are handled during save/load operations.

### Values

| Name             | Description                                   |
|------------------|-----------------------------------------------|
| `Throw`          | Roll back then rethrow (no suppression).      |
| `LogAndSuppress` | Roll back, log, and suppress.                 |
| `Suppress`       | Roll back and silently suppress (no logging). |

---

## SerializerType

### Overview

Specifies the serializer used for save/load.

### Values

| Name             | Description                                       |
|------------------|---------------------------------------------------|
| `JsonUtility`    | Unity’s built-in JSON; simple and human-readable. |
| `MessagePack`    | Fast binary; compact.                             |
| `NewtonsoftJson` | Feature-rich JSON; high flexibility.              |
| `MemoryPack`     | Very fast binary.                                 |

---

## TempDataResetTiming

### Overview

Specifies when to reset temp data.

### Values

| Name               | Description                |
|--------------------|----------------------------|
| `OnSharedDataLoad` | Reset on shared-data load. |
| `OnSlotDataLoad`   | Reset on slot-data load.   |
| `OnGameStart`      | Reset on game start.       |
| `Manual`           | Reset manually.            |

---

## IAfterInitializeCallback

### Overview

Provides post-construction logic (before any load/save).

### Methods

| Signature                  | Description                           | Exceptions |
|----------------------------|---------------------------------------|------------|
| `void OnAfterInitialize()` | Called once right after construction. | —          |

### Timing

- Called synchronously after framework initialization, or when a new instance is created due to version changes.

---

## IAfterInitializeOrLoadCallback

### Overview

Provides logic common to both post-initialize and post-load.  
Called after initialization and after data load.

### Methods

| Signature                        | Description                      | Exceptions |
|----------------------------------|----------------------------------|------------|
| `void OnAfterInitializeOrLoad()` | Called after initialize or load. | —          |

---

## IAfterInitializeOrLoadRollback\<T>

### Overview

Rollback contract to revert external side effects from the above callback (CRTP: specify your own type for `T`).

### Methods

| Signature                                              | Description                   | Exceptions |
|--------------------------------------------------------|-------------------------------|------------|
| `void OnAfterInitializeOrLoadRollback(T previousData)` | Reconcile to known-good data. | —          |

---

## IAfterInitializeRollback\<T>

### Overview

Rollback contract for external side effects from `IAfterInitializeCallback` (CRTP).

### Methods

| Signature                                        | Description                   | Exceptions |
|--------------------------------------------------|-------------------------------|------------|
| `void OnAfterInitializeRollback(T previousData)` | Reconcile to known-good data. | —          |

### Timing

- Called synchronously during rollback after failures.

### Notes

- Rollback is executed only if the corresponding callback was actually invoked.  
  If no rollback is required or supported, this callback is not called.

---

## IAfterLoadCallback

### Overview

Provides post-load logic.

### Methods

| Signature            | Description                    | Exceptions |
|----------------------|--------------------------------|------------|
| `void OnAfterLoad()` | Called immediately after load. | —          |

---

## IAfterLoadRollback\<T>

### Overview

Rollback contract for external side effects from `IAfterLoadCallback` (CRTP).

### Methods

| Signature                                  | Description                   | Exceptions |
|--------------------------------------------|-------------------------------|------------|
| `void OnAfterLoadRollback(T previousData)` | Reconcile to known-good data. | —          |

### Notes

- Rollback is executed only if the corresponding callback was actually invoked.  
  If no rollback is required or supported, this callback is not called.

---

## IAfterLoadSlotCallback

### Overview

Per-slot post-load callback; receives a `SlotKey` identifying the slot.

### Methods

| Signature                        | Description                                | Exceptions |
|----------------------------------|--------------------------------------------|------------|
| `void OnAfterLoad(SlotKey slot)` | Called after the specified slot is loaded. | —          |

### Notes

- Unavailable for shared data or temporary data that resets on shared-data load.

---

## IAfterLoadSlotRollback\<T>

### Overview

Rollback contract for external side effects from `IAfterLoadSlotCallback` (CRTP).

### Methods

| Signature                                                | Description                   | Exceptions |
|----------------------------------------------------------|-------------------------------|------------|
| `void OnAfterLoadRollback(SlotKey slot, T previousData)` | Reconcile for the given slot. | —          |

### Notes

- Rollback is executed only if the corresponding callback was actually invoked.  
  If no rollback is required or supported, this callback is not called.
- Unavailable for shared data or temporary data that resets on shared-data load.

---

## IBeforeDeleteCallback

### Overview

Provides pre-delete hook to release external resources or adjust state.

### Methods

| Signature               | Description                 | Exceptions |
|-------------------------|-----------------------------|------------|
| `void OnBeforeDelete()` | Called right before delete. | —          |

---

## IBeforeDeleteRollback

### Overview

Rollback contract for external side effects from `IBeforeDeleteCallback`.

### Methods

| Signature                       | Description                   | Exceptions |
|---------------------------------|-------------------------------|------------|
| `void OnBeforeDeleteRollback()` | Undo pre-delete side effects. | —          |

### Notes

- Rollback is executed only if the corresponding callback was actually invoked.  
  If no rollback is required or supported, this callback is not called.

---

## IBeforeDeleteSlotCallback

### Overview

Per-slot pre-delete hook; receives a `SlotKey`.

### Methods

| Signature                           | Description                      | Exceptions |
|-------------------------------------|----------------------------------|------------|
| `void OnBeforeDelete(SlotKey slot)` | Called right before slot delete. | —          |

### Notes

- Unavailable for shared data or temporary data that resets on shared-data load.

---

## IBeforeDeleteSlotRollback

### Overview

Rollback contract for external side effects from `IBeforeDeleteSlotCallback`.

### Methods

| Signature                                   | Description                  | Exceptions |
|---------------------------------------------|------------------------------|------------|
| `void OnBeforeDeleteRollback(SlotKey slot)` | Undo for the specified slot. | —          |

### Notes

- Rollback is executed only if the corresponding callback was actually invoked.  
  If no rollback is required or supported, this callback is not called.
- Unavailable for shared data or temporary data that resets on shared-data load.

---

## IBeforeSaveCallback

### Overview

Final pre-serialization hook to prepare data right before saving.

### Methods

| Signature             | Description               | Exceptions |
|-----------------------|---------------------------|------------|
| `void OnBeforeSave()` | Called right before save. | —          |

---

## IBeforeSaveRollback

### Overview

Rollback contract for external side effects from `IBeforeSaveCallback`.

### Methods

| Signature                     | Description                 | Exceptions |
|-------------------------------|-----------------------------|------------|
| `void OnBeforeSaveRollback()` | Undo pre-save side effects. | —          |

### Notes

- Rollback is executed only if the corresponding callback was actually invoked.  
  If no rollback is required or supported, this callback is not called.

---

## IBeforeSaveSlotCallback

### Overview

Per-slot pre-save hook; receives a `SlotKey`.

### Methods

| Signature                         | Description                    | Exceptions |
|-----------------------------------|--------------------------------|------------|
| `void OnBeforeSave(SlotKey slot)` | Called right before slot save. | —          |

### Notes

- Unavailable for shared data or temporary data that resets on shared-data load.

---

## IBeforeSaveSlotRollback

### Overview

Rollback contract for external side effects from `IBeforeSaveSlotCallback`.

### Methods

| Signature                                 | Description                  | Exceptions |
|-------------------------------------------|------------------------------|------------|
| `void OnBeforeSaveRollback(SlotKey slot)` | Undo for the specified slot. | —          |

### Notes

- Rollback is executed only if the corresponding callback was actually invoked.  
  If no rollback is required or supported, this callback is not called.
- Unavailable for shared data or temporary data that resets on shared-data load.

---

## IDataCipher

### Overview

Synchronous, in-memory encryption/decryption for arbitrary byte arrays.

### Methods

| Signature                           | Description                       | Exceptions |
|-------------------------------------|-----------------------------------|------------|
| `byte[] Encrypt(byte[] plaintext)`  | Encrypts plaintext to ciphertext. | -          |
| `byte[] Decrypt(byte[] ciphertext)` | Decrypts ciphertext to plaintext. | -          |

### Properties

| Member | Type | Description |
|--------|------|-------------|
| —      | —    | None        |

### Timing

- Expected to be called synchronously near save/load boundaries (implementation dependent).

### Example

```csharp
public sealed class SimpleXorCipher : IDataCipher
{
    private readonly byte key = 0x5A;
    public byte[] Encrypt(byte[] plaintext) { var b=new byte[plaintext.Length]; for(int i=0;i<b.Length;i++) b[i]=(byte)(plaintext[i]^key); return b; }
    public byte[] Decrypt(byte[] ciphertext) => Encrypt(ciphertext);
}
```

### Notes

- Exceptions thrown here can disrupt read/save/delete flows if they occur at critical boundaries.  
  If an exception is thrown in `Encrypt` or `Decrypt`, the ongoing save/load/delete operation is immediately aborted.
  Subsequent behavior follows the configured `ExceptionPolicy`.
- How exceptions are handled (e.g., log/suppress/propagate) is determined by the configured `ExceptionPolicy`.

---

## ISaveDesignConfig

### Overview

Defines the save directory, file naming rules, file extension, and exception policy.  
Some methods have default implementations that compose full paths.

### Methods

| Signature                                           | Description                                                         | Exceptions |
|-----------------------------------------------------|---------------------------------------------------------------------|------------|
| `string GetSaveDataDirectoryPath()`                 | Save directory path.                                                | —          |
| `string GetSharedDataFileName()`                    | File name for shared data (no extension).                           | —          |
| `string GetSlotDataFileName()`                      | File name prefix for slot data (no extension; identifier appended). | —          |
| `string GetFileExtension()`                         | File extension; empty/whitespace means no extension.                | —          |
| `ExceptionPolicy GetExceptionPolicy()`              | Exception-handling policy.                                          | —          |
| `string GetSharedDataFilePath()`                    | Default implementation: full path for shared data.                  | —          |
| `string GetSlotDataFilePath(string identifier)`     | Default: full path with appended identifier.                        | —          |
| `string GetSlotMetaDataFilePath(string identifier)` | Default: full path for meta (`.meta` or `.meta.{ext}`).             | —          |

### Properties

| Member | Type | Description |
|--------|------|-------------|
| —      | —    | None        |

### Timing

- Expected to be referenced synchronously by the framework during save/load.

### Example

```csharp
public sealed class MySaveConfig : ISaveDesignConfig
{
    public string GetSaveDataDirectoryPath() => System.IO.Path.Combine(UnityEngine.Application.persistentDataPath, "Save");
    public string GetSharedDataFileName() => "shared";
    public string GetSlotDataFileName() => "slot-";
    public string GetFileExtension() => "dat";
    public ExceptionPolicy GetExceptionPolicy() => ExceptionPolicy.LogAndSuppress;
}
```

### Notes

- Save Design uses `System.IO.File` for persistence. On some platforms (e.g., Android), saving outside
  `UnityEngine.Application.persistentDataPath` may fail.
- On WebGL, the save paths returned by `ISaveDesignConfig` are editor-only conveniences. At runtime, data is stored in
  `PlayerPrefs` using internally generated keys.

---

## SlotKey

### Overview

A lightweight value type identifying the save target. Holds a canonical string identifier and, when possible, a numeric
slot index; indicates whether it was treated as a numbered slot.

### Fields / Properties

| Member       | Type     | Description                                    |
|--------------|----------|------------------------------------------------|
| `Identifier` | `string` | Canonical string identifier.                   |
| `SlotNumber` | `int`    | Numeric slot index, or `-1` if unavailable.    |
| `IsNumbered` | `bool`   | Whether the identifier was parsed as a number. |

### Constructor

```csharp
public SlotKey(string identifier)
```

### Methods

- `override string ToString()` — returns `Identifier`.

### Example

```csharp
if (slotKey.IsNumbered)
{
    ...
}
```

### Notes

- If the `identifier` represents a numeric string, `SlotNumber` will be set and `IsNumbered` will return `true`.

---

## Third-Party Licenses

This package may generate code intended to work with the following libraries:

- [MessagePack for C#](https://github.com/MessagePack-CSharp/MessagePack-CSharp) — MIT License
- [Newtonsoft.Json](https://github.com/JamesNK/Newtonsoft.Json) — MIT License
- [MemoryPack](https://github.com/Cysharp/MemoryPack) — MIT License

These libraries are not included in this package. For license details, see `Third-Party Notices.txt`.
