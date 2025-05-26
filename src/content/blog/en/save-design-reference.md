# Save Design Reference 📘

Version 1.0.0 · Last updated May 25 2025

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)  
   2.1 [Supported Versions](#21-supported-versions)  
   2.2 [Installation](#22-installation)
3. [SaveDesignRoot Attribute](#3-savedesignroot-attribute)
4. [Data Types](#4-data-types)
5. [Usage](#5-usage)
6. [Asynchronous Processing](#6-asynchronous-processing)
7. [Identifier‑Based Slots](#7-identifierbased-slots)
8. [Version Management & Migration](#8-version-management--migration)
9. [Data Encryption](#9-data-encryption)
10. [Exception Handling](#10-exception-handling)
11. [Directory Structure](#11-directory-structure)
12. [License Notes](#12-license-notes)

---

## 1. Introduction

Save Design is a **type‑safe, attribute‑based** save/load framework for Unity.  
It separates data into **Shared**, **Slot‑specific**, and **Temporary** categories, generating intuitive entry‑points
such as `GameData.Load` and `GameData.Save` for you.

---

## 2. Getting Started

### 2.1 Supported Versions

* Unity **2022.3.12f1** or newer (LTS recommended)

### 2.2 Installation

#### 2.2.1 UniTask (Optional)

1. Install **UniTask** via its official package.
2. Add `GAME_DATA_MANAGER_SUPPORT_UNITASK` to **Project Settings ▶ Player ▶ Scripting Define Symbols**.

#### 2.2.2 MessagePack (Optional)

1. Install **MessagePack for C#**.
2. Add `[(SerializerType.MessagePack)]` to your core save class.

---

## 3. SaveDesignRoot Attribute

`SaveDesignRoot` marks the single class that defines the overall save‑data layout.

### 3.1 Class Name = Entry‑Point Name

```csharp
[SaveDesignRoot]
internal partial class GameData { }
// ➜ GameData.Load / GameData.Save / GameData.Initialize
```

### 3.2 Switching the Serializer

```csharp
[SaveDesignRoot(SerializerType.MessagePack)]
public sealed class GameData { }
```

Supported: `SerializerType.Json` (default) | `SerializerType.MessagePack`

---

## 4. Data Types

### 4.1 SharedData

`GameData.Load.Shared()` / `Save.Shared()` — Data shared by *all* slots.

### 4.2 SlotData

`GameData.Load.Slot(index)` — Data unique to each slot.

### 4.3 SlotMetaData

Small metadata (timestamp, play‑time, thumbnail) auto‑saved with `Save.Slot()`.

### 4.4 TempData

Non‑persistent runtime data. Reset timing controlled by `TempDataResetTiming`.

### 4.5 Dependencies

Use attribute constructor to enforce initialization order:

```csharp
[SharedData(typeof(AudioSettings), typeof(ScreenSettings))]
public sealed class GameSettings { }
```

### 4.6 Hierarchical Paths

Prevent naming collisions with path strings:

```csharp
[SharedData("Settings/Graphics")]
public class ResolutionSettings { }
```

---

## 5. Usage

### 5.1 Initialization

```csharp
GameData.Initialize.Shared(); // shared
GameData.Initialize.Slot();   // slot
```

### 5.2 Loading

```csharp
if (!GameData.Load.Shared())
    GameData.Initialize.Shared();
```

### 5.3 Saving

```csharp
GameData.Save.Shared();
GameData.Save.Slot(0);
```

### 5.4 Callback Interfaces

| Interface                  | Timing                        | Method                |
|----------------------------|-------------------------------|-----------------------|
| `IAfterLoadCallback`       | Immediately **after load**    | `OnAfterLoad()`       |
| `IBeforeSaveCallback`      | Just **before save**          | `OnBeforeSave()`      |
| `IAfterInitializeCallback` | Once **after initialization** | `OnAfterInitialize()` |

### 5.5 CurrentSlotIndex

`GameData.CurrentSlotIndex` → `int` (−1 if none).

---

## 6. Asynchronous Processing

```csharp
await GameData.Load.Async.Shared();
await GameData.Save.Async.Slot("autosave");
```

> **Note** : Constructors run on a background thread—avoid Unity API inside them.

---

## 7. Identifier‑Based Slots

```csharp
GameData.Save.Slot("checkpoint-1");
GameData.Load.Slot("autosave");
```

---

## 8. Version Management & Migration

Add a `Version` field and upgrade logic in `OnAfterDeserialize()`.

---

## 9. Data Encryption

Implement partial methods in `Encryptor` or use the built‑in AES+HMAC generator (
`Tools ▶ Game Data Manager ▶ Encrypt Settings`).

---

## 10. Exception Handling

Implement `static partial void OnGameDataError(Exception e);` to capture serialization errors.

---

## 11. Directory Structure

```text
Assets/
├── Runtime/
├── Editor/
├── Resources/
└── Samples/
```

---

## 12. License Notes

Save Design references **UniTask** and **MessagePack‑C#**, both licensed under MIT.  
Include their licenses in your final application if the generated code references these libraries.

---

> © 2025 Fish dolls. All rights reserved.
