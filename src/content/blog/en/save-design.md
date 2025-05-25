---
lang: 'en'
title: 'Save Design'
description: 'Keyless save system'
pubDate: '2025-05-25'
heroImage: '/fish-dolls/images/save-design-icon.png'
---

# Overview

This asset provides a general‑purpose system for managing in‑game save data.  
It clearly separates three data categories—**shared data**, **slot‑specific data**, and **temporary data**—so that each
can be handled intuitively and safely.

# Getting Started

## Supported Versions

- Unity **2022.3.12f1** or later is recommended

## Installation Procedure

### Using asynchronous functions with `UniTask

1. Install `UniTask` according to the official instructions.
2. Add `GAME_DATA_MANAGER_SUPPORT_UNITASK` to scripting define symbols

### If you use `MessagePack for C#

1. Install `MessagePack for C#` following the official instructions.
2. Add `[GameDataManager(SerializerType.MessagePack)]` to the core data management class.

# About the `GameDataManager` Attribute

The **`GameDataManager`** attribute is applied to the core class that defines the overall save‑data layout of your
game.  
From this class, entry points such as **`GameData.Load`**, **`GameData.Save`**, and **`GameData.Initialize`** are
auto‑generated for you.

### Class Name = Entry‑Point Name

The name of the class marked with `GameDataManager` becomes the root of all generated entry points.

If you annotate a class called `GD` with `GameDataManager`, you will access it as `GD.Load`, `GD.Save`, etc.

```csharp
[GameDataManager]
internal partial class GameData { }

// Entry points start with GameData
GameData.Load
GameData.Save

[GameDataManager]
internal partial class GD { }

// Entry points start with GD
GD.Load
GD.Save
```

Only **one** `GameDataManager` class may exist per project.  
If you omit it, no entry points are generated and data access will fail.

The generated API lets you interact with data in a single line:

```csharp
var shared = GameData.Load.Shared();
GameData.Save.Slot(1);
GameData.Initialize.Slot();
```

### Switching the Serializer

Pass a `SerializerType` argument to `GameDataManager` to switch the serializer.

```csharp
[GameDataManager(SerializerType.MessagePack)]
public sealed class GameData { ... }
```

Supported serializer types:

* `SerializerType.Json` (default)
* `SerializerType.MessagePack`

# Types of Data

This asset classifies save targets into **four** data types.  
Each has different responsibilities and save timing, so choose appropriately.

## SharedData (Shared)

* Data shared across **all** save slots
* Great for global settings or player‑wide progress
* **Load** `GameData.Load.Shared()`  
  **Save** `GameData.Save.Shared()`  
  **Initialize** `GameData.Initialize.Shared()`

## SlotData (Slot‑Specific)

* Data unique to each save slot
* Holds character state, inventory, story chapter, etc.
* **Load** `GameData.Load.Slot(slotIndex or identifier)`  
  **Save** `GameData.Save.Slot(...)`  
  **Initialize** `GameData.Initialize.Slot()`

## SlotMetaData (Slot Metadata)

* Metadata attached to each slot (e.g., save time, play time, thumbnail)
* Stored separately from main data and useful for slot lists
* **Load** `GameData.Load.SlotMeta(slotIndex or identifier, out var meta)`
* **Save** Automatically updated when `GameData.Save.Slot(...)` is executed (e.g., timestamp, total play time)

### Notes

* **A new instance is created each time**.  
  `SlotMetaData` does not reuse old instances when saving, but always creates and writes **a new instance**.

* **Always set the initial value yourself**.  
  Therefore, in the _field initializer_ or _constructor_,  
  Be sure to set the required values (save date/time, play time, etc.).  
  It is not expected to overwrite values after loading.

* **“Takeover” from loaded meta information is deprecated**.  
  The workflow of keeping, adding, and incrementally updating existing `SlotMetaData` values is not supported.  
  It is designed to “rewrite the entire latest state”.

## TempData (Temporary)

* Non‑persistent data that is **not** saved
* Holds flags or runtime‑only state valid during the current session
* Reset timing is controlled by **`TempDataResetTiming`** (e.g., on game start, slot switch, app exit)

### Setting the Reset Timing

A class is recognized as TempData by adding the `[TempData]` attribute.

```csharp
[TempData(resetTiming: TempDataResetTiming.OnGameStart)]
internal sealed class SomeTempData { ... }
```

Available timings:

* **OnGameStart** – reset on game launch
* **OnSharedDataLoad** (default) – reset when shared data is initialized or loaded
* **OnSlotDataLoad** – reset when a slot is initialized or loaded
* **Manual** – reset only when called explicitly

This classification enables flexible data management tailored to the player experience.

## Setting Data Dependencies

Each data attribute (`[SharedData]`, `[SlotData]`, `[TempData]`, …) can explicitly specify **dependencies** on other
data types.

This guarantees that specified dependencies are serialized/deserialized **before** the current data—useful when
initialization order matters.

### How to Use

```csharp
[SharedData(typeof(AudioSettings), typeof(ScreenSettings))]
public sealed class GameSettings { ... }
```

In this example **`AudioSettings`** and **`ScreenSettings`** are processed before `GameSettings`.

### Notes

* Dependency targets **must** have the same attribute type.  
  E.g. a `[SharedData]` class may depend only on other `[SharedData]` classes.
* For `[TempData]`, the dependency must also have the **same reset timing**.
* **Circular dependencies** are not allowed (A → B → C → A).
* With multiple dependencies, a topological sort determines execution order.

### Typical Use Cases

* Accessing data B inside `OnAfterDeserialize()` of data A
* Data C aggregates values from other configuration data
* Sharing resources or ensuring correct initialization order

This feature enables safe, ordered initialization even in large‑scale save schemes.

## Hierarchical Management with Data Paths

Each data attribute lets you optionally specify a **path** string that works like a namespace, preventing collisions
between multiple data sets of the same type.

```csharp
[SharedData("Settings"), Serializable]
public class Audio { }

[SharedData("Settings"), Serializable]          // MyGame namespace
public class Screen { }

[SharedData("Settings/Something"), Serializable] // MyGame.Something namespace
public class Screen { }
```

Turn out as follows:

* `GameData.Shared.Settings.Audio`
* `GameData.Shared.Settings.Screen`
* `GameData.Shared.Settings.Something.Screen`

Clean, scalable design—even in large projects.

# Usage

## Data Initialization

Call `GameData.Initialize` when starting a **new** game.  
Only call it when **no** existing save data is present.

### Targets

* SharedData
* SlotData

(TempData resets automatically according to its timing.)

```csharp
GameData.Initialize.Shared(); // shared data
GameData.Initialize.Slot();   // slot data
```

> **Caution:** Executing `Initialize` while save data exists will overwrite it.  
> In normal play, use `Load` for existing saves and reserve `Initialize` for new‑game scenarios.

## Loading Data

It is recommended that shared data be implemented in conjunction with initialization as follows.

```csharp
// Load existing shared data first
if (!GameData.Load.Shared())
{
    // If not readable, initialize.
    GameData.Initialize.Shared();
}
```

---

Below is an example implementation of a page that loads slot-specific data.

First, it checks to see if it can load the slot meta information, which is small in size, and if it can, it displays its
contents in the save slot.

If it cannot be loaded, it indicates that no save data is stored in that save slot.

```csharp
// UI list of save slots to be displayed on load screen
SlotUI[] slotUIList;

// Update the save slot information displayed on the current load screen page
public void UpdateLoadPage(int pageIndex)
{
    int baseSlotIndex = pageIndex * slotUIList.Length;
    for (int i = 0; i < slotUIList.Length; i++)
    {
        // Find the slot number from the number of pages and slots on the load screen.
        int slotIndex = baseSlotIndex + i;

        // Obtain meta-information about the saved data from the obtained slot number
        if (GameData.Load.SlotMeta(slotIndex, out var meta))
        {
            // Display the contents of the data stored in this slot using meta information
            slotUIList[i].UpdateUI(slotIndex, meta);
        }
        else
        {
            // Tells you that there is no save data in this slot if there is no meta information
            slotUIList[i].UpdateUI(slotIndex, "no data");
        }
    }
}

// Load slot-specific data when a save slot on the load screen is clicked
public void LoadSlotData(int slotIndex)
{
    // Load saved data from slot number
    if (GameData.Load.Slot(slotIndex))
    {
        // Transition to the next scene if successfully read.
        SceneManager.LoadScene("Next Scene");
    }
    else
    {
        // Tell them that the data could not be read.
        Debug.LogError("Unable to load save data.");
    }
}
```

### About IAfterInitializeCallback

`IAfterInitializeCallback` is a callback interface used when you want to perform **once** immediately after *
*initialization** of data.
For data classes implementing this interface, **void OnAfterInitialize()`** will be called under the following
conditions.

---

#### When to be called

* When new data is generated **through `GameData.Initialize.Shared()` or `GameData.Initialize.Slot()`**.
* In `GameData.Load`, when a new instance is created **because the target data did not exist in the save file** (
  different version, new addition, etc.)

---

#### Cases not called for

* In `GameData.Load`, if the data is included in the existing saved data and successfully restored (not called for data
  that already exists)

---

#### Main applications

* Initial linking of special values and related data in the initial state
* Setup of default values for newly added data in version migration
* One-time initial correction to data structure

---

#### Examples of Use

```csharp
public class PlayerSettings : IAfterInitializeCallback
{
    public int GraphicsQuality;

    public void OnAfterInitialize()
    {
        // Executed only at initialization (not called if present at Load)
        GraphicsQuality = 2;
    }
}
```

---

#### Notes

* Unlike “OnAfterDeserialize” and “OnAfterLoad”, `IAfterInitializeCallback` is not an “OnAfterDeserialize” or
  “OnAfterLoad”,
  **It is an initialization hook that is limited** to “the first time it is used as a new instance”.
* Suitable for processes that require guaranteed execution timing (e.g., completion of unset values).
* Cannot be used for `SlotMetaData` and `TempData`.

---

## Saving Data

Invoke `GameData.Save` explicitly when needed.

```csharp
GameData.Save.Shared();     // shared data
GameData.Save.Slot(0);      // slot by index
GameData.Save.Slot("autosave"); // slot by identifier
```

Typical timings:

* After checkpoints
* Manual save via menu
* Before application quit
* Automatic save (autosave identifiers)

> * You must call a save method explicitly; merely changing data never triggers an automatic save.
> * Slot metadata (timestamp, play time) updates automatically during `Save.Slot(...)`.

## Load / Save Callback Interfaces

| Interface                 | Purpose                                                                                         | Callback Method       |
|---------------------------|-------------------------------------------------------------------------------------------------|-----------------------|
| **`IAfterLoadCallback`**  | Implement this interface when a data class needs post-processing **after it has been loaded**.  | `void OnAfterLoad()`  |
| **`IBeforeSaveCallback`** | Implement this interface when a data class must perform processing **just before it is saved**. | `void OnBeforeSave()` |

### How It Works

* During `GameData.Load.…`, the framework deserializes the object and then, if the instance implements *
  *`IAfterLoadCallback`**, automatically calls **`OnAfterLoad()`** on the main thread.

* During `GameData.Save.…`, right before serialization, the framework checks whether the instance implements *
  *`IBeforeSaveCallback`** and, if so, calls **`OnBeforeSave()`**.

### Typical Use-Cases

| Scenario                                                             | Interface             | Example Task                                                                                 |
|----------------------------------------------------------------------|-----------------------|----------------------------------------------------------------------------------------------|
| Re-build cached or derived values that rely on freshly loaded fields | `IAfterLoadCallback`  | Re-calculate runtime-only lists, rebuild dictionaries, refresh visual thumbnails, etc.       |
| Ensure data consistency or clamp values before writing to disk       | `IBeforeSaveCallback` | Remove invalid references, cap counters to a maximum, update a “lastSavedAt” timestamp, etc. |

> **Tip:**
> * Implementing it in `TempData` will not cause a callback to be called.
> * Keep the logic in these callbacks lightweight; heavy operations should be deferred or performed asynchronously to
    avoid blocking the save/load process.
> * UnityAPI cannot be used in callbacks when reading or writing with asynchronous functions such as `Load.Async` or
    `Save.Async`.

## About `CurrentSlotIndex`

`GameData.CurrentSlotIndex` is a **read‑only** property indicating the numeric slot currently loaded.

* Initial value: `-1` (no slot loaded)

| Operation                        | Effect on `CurrentSlotIndex`         |
|----------------------------------|--------------------------------------|
| `GameData.Initialize.Slot()`     | sets to `-1`                         |
| `GameData.Load.Slot(identifier)` | sets to `-1`                         |
| `GameData.Load.Slot(slotIndex)`  | set to `slotIndex`                   |
| `GameData.Save.Slot(slotIndex)`  | set to `slotIndex`                   |
| `GameData.Save.Slot(identifier)` | **unchanged** (value is not updated) |

Use cases:

* Branch logic by slot number
* Re‑use last slot number for autosave
* Consistency checks when saving/loading

> `CurrentSlotIndex` is unchanged by identifier‑based methods.

## Asynchronous Processing

### UniTask Support

UniTask-based asynchronous functions are automatically generated by introducing `UniTask` into your project and defining
the following scripting symbols.

```
GAME_DATA_MANAGER_SUPPORT_UNITASK
```

### Unity Awaitable Support (Unity 2023.1+)

In Unity 2023.1 and later, the `Async` class generates a function that returns `Awaitable` by default. No additional
packages or dependencies are required.

However, if `GAME_DATA_MANAGER_SUPPORT_UNITASK` is defined, UniTask will take precedence and Awaitable will not be
generated.

### Basic Usage

```csharp
await GameData.Load.Async.Shared();
await GameData.Load.Async.Slot(0);
await GameData.Save.Async.Slot("autosave");
```

### Important: No Unity API in Constructors

In asynchronous processing via `GameData.Load.Async` and `GameData.Save.Async`,
Async, data instantiation (e.g., executing constructors and evaluating field initializers)
**may be performed in a thread outside the main thread.**

Therefore, the following **Unity APIs (e.g., Transform, GameObject, Resources.Load, etc.)
cannot be used at data class initialization time.**

```csharp
[SlotData]
public sealed class PlayerData
{
    // ❌ May execute on background thread
    public string playerName = GameObject.Find("Player").name;

    public PlayerData()
    {
        // ❌ Unity API call in ctor
        var go = GameObject.FindWithTag("Player");
    }
}
```

#### ✅ How to handle

* Processes that require the use of the Unity API should be initialized manually after the data is loaded.
* Or, keep the data as pure data unrelated to the Unity API and design it to be complemented on the logic side.
* This is a caveat when using asynchronous read/write functions, and is not a problem when using synchronous read/write
  functions such as `GameData.Load.Shared()`.

> Similar restrictions apply to serialization using `MessagePack`, so if you want to read and write asynchronously, it
> is recommended that you design your data class as a **pure model class dedicated to data retention**.

## Identifier‑Based Slots

In addition to using an integer slot number (`int slotIndex`) when reading/writing save slots, this asset can also use
an arbitrary string identifier (`string identifier`).

This feature is useful for the following applications

- Saves that you want to manage separately from the slot number, such as autosaves, checkpoints, etc.
- Flexible management with named slots (e.g. `“autosave”`, `“checkpoint-1”`)

```csharp
GameData.Load.Slot("autosave");
GameData.Save.Slot("checkpoint-1");
```

## Versioning and migration of saved data (optional)

To accommodate changes in data structure, a `Version` field can be added to the data as needed to allow manual version
checking and migration processing on read.

```csharp
[SlotData, Serializable]
public class PlayerData : ISerializationCallbackReceiver
{
    public int Version;
    public int Level;
    public string Name;
    
    public void OnBeforeSerialize() { ... }
    
    public void OnAfterDeserialize()
    {
        if (Version == 0)
        {
            // Conversion process from version 0
            ...
            Version = 1;
        }
        
        if (Version == 1)
        {
            // Conversion process from version 1
            ...
            Version = 2;
        }
    }
}
```

## Data Encryption

Encryption is **disabled by default**, but you can plug in your own logic by implementing two partial methods in
`GameDataManager.Runtime.Encryptor`.

```csharp
static partial void EncryptCore(ref byte[] data);
static partial void DecryptCore(ref byte[] data);
```

### AES + HMAC Editor Extension

If you want to deploy encryption more easily, you can use the AES + HMAC compatible editor extension.

1. Unity menu **Tools ▶ Game Data Manager ▶ Encrypt Settings**
2. Enter AES and HMAC keys (32‑char random recommended)
3. Click **Generate Encryptor.cs**

An `Encryptor.cs` file is generated that automatically encrypts before saving and decrypts (with HMAC validation) after
loading.

> If you are going to incorporate encryption, please do so before the game is released.
> If you incorporate encryption later in a game that has already been released, **the saved data before encryption will
> not be readable. **

## Handling of Exceptions Occurring While Reading or Writing Data

`GameData.Load` and `GameData.Save` will return `false` without throwing an exception if an exception occurs while
reading or writing data.

If you want to check what kind of exception was thrown, implement the following partial method, which is automatically
defined in the class with `[GameDataManager]`.

```csharp
static partial void OnGameDataError(Exception e);
```

# Directory Structure

```
Assets/
├── Runtime/    # Runtime scripts
├── Editor/     # Editor extensions
├── Resources/  # Config assets
└── Samples/    # Usage examples (optional)
```

## Licensing notes (referenced by source generator)

The source generator for this asset may reference the following library types and function names when outputting code:

- [UniTask](https://github.com/Cysharp/UniTask)（MIT License）
- [MessagePack for C#](https://github.com/MessagePack-CSharp/MessagePack-CSharp)（MIT License）
  These libraries are not included in the assets and are supported as optional features.  
  However, **if the output of the source generator contains library types or functions, they must be licensed under the
  MIT License**.

The responsibility for displaying the license rests with the developer of the project using the library.  
Please check the repository and license of each library for details.
