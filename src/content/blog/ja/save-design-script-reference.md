---
title: Save Design スクリプトリファレンス
description: Save Design に含まれる属性・インターフェース・自動生成されるメソッドの詳細な API ドキュメントです。
pubDate: '2025-05-25'
heroImage: '/fish-dolls/images/save-design.png'
---

# Save Design - スクリプトリファレンス

## 目次

- 属性（Attributes）
    - [EncryptorAttribute](#encryptorattribute)
    - [KeepAttribute](#keepattribute)
    - [SaveDesignRootAttribute](#savedesignrootattribute)
    - [SharedDataAttribute](#shareddataattribute)
    - [SlotDataAttribute](#slotdataattribute)
    - [SlotMetaDataAttribute](#slotmetadataattribute)
    - [TempDataAttribute](#tempdataattribute)
- 列挙型（Enums）
    - [ExceptionPolicy](#exceptionpolicy)
    - [SerializerType](#serializertype)
    - [TempDataResetTiming](#tempdataresettiming)
- インターフェース（Interfaces）
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
- 構造体（Structs）
    - [SlotKey](#slotkey)

---

## EncryptorAttribute

### 概要

保存データの暗号化/復号を提供する型であることを示します。対象の型は `IDataCipher` を実装している必要があります。

### 適用対象

- `AttributeTargets.Class`
- `Inherited`: `false`
- `AllowMultiple`: `false`

### パラメータ

| 名前 | 型 | 必須 | 説明 |
|----|---|:--:|----|
| —  | — | —  | なし |

### 使用例

```csharp
[Encryptor]
public sealed class AesGcmCipher : IDataCipher
{
    public byte[] Encrypt(byte[] plaintext) { /* ... */ return ciphertext; }
    public byte[] Decrypt(byte[] ciphertext) { /* ... */ return plaintext; }
}
```

### 注意事項

- 後方互換性（過去バージョンとの整合性）を維持するため、この属性を付与した静的クラスが存在する場合、フレームワークは次の静的メソッドを呼び出します。

```csharp
public static void Encrypt(ref byte[] data) { /* ... */ data = ciphertext; }
public static void Decrypt(ref byte[] data) { /* ... */ data = plaintext; }
```

データは `ref` 引数として渡されるため、実装側で配列の差し替えまたは内容の書き換えにより、暗号化／復号後のバイト列を反映してください。

### 関連項目

- [IDataCipher](#idatacipher)

---

## KeepAttribute

### 概要

初期化やロードによりデータインスタンスが差し替わっても、対象のフィールド/イベントの値を保持します。

### 適用対象

- `AttributeTargets.Event | AttributeTargets.Field`
- `Inherited`: `false`
- `AllowMultiple`: `false`

### パラメータ

| 名前 | 型 | 必須 | 説明 |
|----|---|:--:|----|
| —  | — | —  | なし |

### 使用例

```csharp
[SharedData]
public sealed partial class RuntimeCache
{
    [Keep]
    public int LastOpenedTab;
}
```

### 注意事項

- この属性は「保存対象になるかどうか」を決定しません。実際に保存されるかは、使用しているシリアライザの仕様・設定に従って制御してください（例：無視属性の有無、公開範囲、カスタムコンバータなど）。
- この属性はスロットメタデータ型には使用できません。
- 意図は「初期化/ロードでインスタンスが差し替わった場合に、対象フィールド/イベントの値を保持すること」です。永続化の置き換えや強制保存の指定ではありません。

---

## SaveDesignRootAttribute

### 概要

Save Design
の“ルート”となる静的クラスをマークします。フレームワークはこれを起点に初期化・ロード・セーブ・削除などのコア機能を自動的に生成し、グローバルなアクセスポイントを提供します。シリアライザの種類をコンストラクタ引数で切り替え可能です。

### 適用対象

- `AttributeTargets.Class`
- `Inherited`: `false`
- `AllowMultiple`: `false`

### パラメータ

| 名前               | 型                | 必須 | 説明                                                            |
|------------------|------------------|:--:|---------------------------------------------------------------|
| `serializerType` | `SerializerType` | —  | 保存/読込に用いるシリアライザの種類。未指定時の既定値は `SerializerType.JsonUtility` です。 |

### 使用例

```csharp
using SaveDesign.Runtime;

[SaveDesignRoot(SerializerType.MemoryPack)]
public static class GameSave { }
```

### 注意事項

- 対象は必ず `static` クラスにしてください。
- シリアライザの選択は互換性に影響します。開発初期に決定し、変更時は移行手順を検討してください。

### 関連項目

- [SerializerType](#serializertype)
- [ISaveDesignConfig](#isavedesignconfig)

---

## SharedDataAttribute

### 概要

全スロットで共有されるデータ型を示します。依存関係を指定すると、指定型の後にシリアライズ/デシリアライズされます。

### 適用対象

- `AttributeTargets.Class`
- `Inherited`: `false`
- `AllowMultiple`: `false`

### パラメータ

| 名前               | 型        | 必須 | 説明                     |
|------------------|----------|:--:|------------------------|
| `path`           | `string` | —  | 任意の階層パス。アクセスや構造の整理に使用。 |
| `dependsOnTypes` | `Type[]` | —  | 依存する型の配列。これらの後に処理されます。 |

### 使用例

```csharp
[SharedData("Game")]
public sealed class SharedGameData { /* ... */ }
```

### 注意事項

- 共有データは全スロットに共通であるため、スロット固有の状態は保持しないでください。
- `path` はスラッシュ（`/`）区切りで複数階層を指定できます（例: `Game/Player/Inventory`）。

### 関連項目

- [SlotDataAttribute](#slotdataattribute)
- [ISaveDesignConfig](#isavedesignconfig)

---

## SlotDataAttribute

### 概要

スロット固有データ型を示します。任意のパスや依存関係を指定可能です。

### 適用対象

- `AttributeTargets.Class`
- `Inherited`: `false`
- `AllowMultiple`: `false`

### パラメータ

| 名前               | 型        | 必須 | 説明        |
|------------------|----------|:--:|-----------|
| `path`           | `string` | —  | 任意の階層パス。  |
| `dependsOnTypes` | `Type[]` | —  | 依存する型の配列。 |

### 使用例

```csharp
[SlotData("Player")]
public sealed class PlayerSlotData { /* ... */ }
```

### 注意事項

- スロット固有データはスロット切替えで内容が変わることを前提に設計します。
- `path` はスラッシュ（`/`）区切りで複数階層を指定できます（例: `Game/Player/Inventory`）。

### 関連項目

- [SharedDataAttribute](#shareddataattribute)
- [SlotMetaDataAttribute](#slotmetadataattribute)

---

## SlotMetaDataAttribute

### 概要

スロットに紐づくメタデータ型を示します（例：サムネイル、プレイ時間、作成日時など）。

### 適用対象

- `AttributeTargets.Class`
- `Inherited`: `false`
- `AllowMultiple`: `false`

### パラメータ

| 名前 | 型 | 必須 | 説明 |
|----|---|:--:|----|
| —  | — | —  | なし |

### 使用例

```csharp
[SlotMetaData]
public sealed class SlotInfo { /* ... */ }
```

### 注意事項

- メタデータは表示や選択用途が多く、サイズを小さく保つと良いです。

### 関連項目

- [SlotDataAttribute](#slotdataattribute)

---

## TempDataAttribute

### 概要

永続化しない一時データ型を示します。リセットタイミング（`TempDataResetTiming`）や依存関係を指定できます。

### 適用対象

- `AttributeTargets.Class`
- `Inherited`: `false`
- `AllowMultiple`: `false`

### パラメータ

| 名前               | 型                     | 必須 | 説明         |
|------------------|-----------------------|:--:|------------|
| `path`           | `string`              | —  | 任意の階層パス。   |
| `resetTiming`    | `TempDataResetTiming` | —  | リセットタイミング。 |
| `dependsOnTypes` | `Type[]`              | —  | 依存する型の配列。  |

### 使用例

```csharp
[TempData(TempDataResetTiming.OnSlotDataLoad)]
public sealed class RuntimeCache { /* ... */ }
```

### 注意事項

- 永続化しない前提で設計し、再生成/リセットに耐えられる構造にしてください。
- 一時データが他の一時データに依存する場合は、**リセットタイミングを同一にする必要があります**。  
  異なるリセットタイミングを設定すると、依存関係の整合性が崩れ、想定外のデータ状態になる可能性があります。
- `path` はスラッシュ（`/`）区切りで複数階層を指定できます（例: `Game/Player/Inventory`）。

### 関連項目

- [TempDataResetTiming](#tempdataresettiming)
- [KeepAttribute](#keepattribute)

---

## ExceptionPolicy

### 概要

保存/読込処理中に発生した例外の扱い方を制御します。

### 列挙値

| 名前               | 値 | 説明                     |
|------------------|--:|------------------------|
| `Throw`          | — | ロールバック後に例外を再スロー（抑制なし）。 |
| `LogAndSuppress` | — | ロールバック後にログ出力し、例外を抑制。   |
| `Suppress`       | — | ロールバック後に静かに抑制（ログなし）。   |

### 注意事項

- 運用環境では `Throw` 以外を選ぶことでユーザー体験を守れる場合があります。

---

## SerializerType

### 概要

保存/読込に用いるシリアライザの種類を指定します。

### 列挙値

| 名前               | 値 | 説明                          |
|------------------|--:|-----------------------------|
| `JsonUtility`    | — | Unity 標準の JSON。人間可読でデバッグ向き。 |
| `MessagePack`    | — | 高速・小サイズのバイナリ。               |
| `NewtonsoftJson` | — | 高機能な JSON。カスタマイズ性重視。        |
| `MemoryPack`     | — | 非常に高速なバイナリ。                 |

### 注意事項

- 途中変更は互換性に影響します。必要なら移行ツールを用意してください。

---

## TempDataResetTiming

### 概要

`TempData` のリセットタイミングを指定します。

### 列挙値

| 名前                 | 値 | 説明               |
|--------------------|--:|------------------|
| `OnSharedDataLoad` | — | 共有データ読込時にリセット。   |
| `OnSlotDataLoad`   | — | スロットデータ読込時にリセット。 |
| `OnGameStart`      | — | ゲーム起動時にリセット。     |
| `Manual`           | — | 手動でリセット。         |

### 注意事項

- `Manual` を設定したデータをリセットするには、 `SD.Temp.Example = new Example();` のように直接代入してください。

---

## IAfterInitializeCallback

### 概要

インスタンス生成直後（ロード/セーブ前）に実行したい処理を提供します。

### メンバー

#### メソッド

| シグネチャ                      | 説明                   | 例外 |
|----------------------------|----------------------|----|
| `void OnAfterInitialize()` | 生成直後に一度だけ呼ばれるコールバック。 | —  |

### 呼び出しタイミング

- 初期化時
- バージョン変更によりデータ読み込み時に既存データに含まれていない場合

---

## IAfterInitializeOrLoadCallback

### 概要

初期化直後またはロード直後に共通して実行したい処理を提供します。

### メンバー（メソッド）

| シグネチャ                            | 説明                  | 例外 |
|----------------------------------|---------------------|----|
| `void OnAfterInitializeOrLoad()` | 初期化直後またはロード直後に呼ばれる。 | —  |

### 呼び出しタイミング

- 初期化時
- 読み込み時

---

## IAfterInitializeOrLoadRollback\<T>

### 概要

`IAfterInitializeOrLoadCallback` の外部副作用を取り消すためのロールバック契約（CRTP）。

### メンバー（メソッド）

| シグネチャ                                                  | 説明             | 例外 |
|--------------------------------------------------------|----------------|----|
| `void OnAfterInitializeOrLoadRollback(T previousData)` | 既知の正常データへ巻き戻す。 | —  |

### 注意事項

ロールバックは、**対応するコールバックが実際に呼び出された場合にのみ実行**されます。  
対となるコールバックが呼び出されなかった場合、またはコールバック自体が実装されていない場合には、ロールバックは呼び出されません。

---

## IAfterInitializeRollback\<T>

### 概要

`IAfterInitializeCallback` 実装で外部副作用を発生させた場合に、それを取り消すためのロールバック契約（CRTP: 自身の型を `T`
に指定）。

### メンバー

#### メソッド

| シグネチャ                                            | 説明             | 例外 |
|--------------------------------------------------|----------------|----|
| `void OnAfterInitializeRollback(T previousData)` | 既知の正常データへ巻き戻す。 | —  |

### 呼び出しタイミング

- 失敗時の巻き戻しフェーズで同期的に呼び出されます。

### 注意事項

ロールバックは、**対応するコールバックが実際に呼び出された場合にのみ実行**されます。  
対となるコールバックが呼び出されなかった場合、またはコールバック自体が実装されていない場合には、ロールバックは呼び出されません。

---

## IAfterLoadCallback

### 概要

データのロード直後に実行したい処理を提供します。

### メンバー（メソッド）

| シグネチャ                | 説明          | 例外 |
|----------------------|-------------|----|
| `void OnAfterLoad()` | ロード直後に呼ばれる。 | —  |

---

## IAfterLoadRollback\<T>

### 概要

`IAfterLoadCallback` 実装の外部副作用を取り消すロールバック契約（CRTP）。

### メンバー（メソッド）

| シグネチャ                                      | 説明             | 例外 |
|--------------------------------------------|----------------|----|
| `void OnAfterLoadRollback(T previousData)` | 既知の正常データへ巻き戻す。 | —  |

### 注意事項

ロールバックは、**対応するコールバックが実際に呼び出された場合にのみ実行**されます。  
対となるコールバックが呼び出されなかった場合、またはコールバック自体が実装されていない場合には、ロールバックは呼び出されません。

---

## IAfterLoadSlotCallback

### 概要

スロットを識別する `SlotKey` を受け取り、ロード直後にスロット単位の後処理を行います。

### メンバー（メソッド）

| シグネチャ                            | 説明                 | 例外 |
|----------------------------------|--------------------|----|
| `void OnAfterLoad(SlotKey slot)` | 指定スロットのロード直後に呼ばれる。 | —  |

### 注意事項

- **共有データ**および、**共有データの読み込み時にリセットするよう設定された一時データ**
  では、このコールバックを使用することはできません。  
  これらのデータはスロット単位での読み込み処理に含まれないため、`IAfterLoadSlotCallback` の呼び出し対象外となります。
- ロールバックは、**対応するコールバックが実際に呼び出された場合にのみ実行**されます。  
  対となるコールバックが呼び出されなかった場合、またはコールバック自体が実装されていない場合には、ロールバックは呼び出されません。

---

## IAfterLoadSlotRollback\<T>

### 概要

`IAfterLoadSlotCallback` の外部副作用を取り消すロールバック契約（CRTP）。

### メンバー（メソッド）

| シグネチャ                                                    | 説明              | 例外 |
|----------------------------------------------------------|-----------------|----|
| `void OnAfterLoadRollback(SlotKey slot, T previousData)` | 指定スロットについて巻き戻す。 | —  |

### 注意事項

**共有データ**および、**共有データの読み込み時にリセットするよう設定された一時データ**
では、このコールバックを使用することはできません。  
これらのデータはスロット単位での読み込み処理に含まれないため、`IAfterLoadSlotCallback` の呼び出し対象外となります。

---

## IBeforeDeleteCallback

### 概要

データ削除直前に外部リソースの解放や状態調整を行います。

### メンバー（メソッド）

| シグネチャ                   | 説明         | 例外 |
|-------------------------|------------|----|
| `void OnBeforeDelete()` | 削除直前に呼ばれる。 | —  |

---

## IBeforeDeleteRollback

### 概要

`IBeforeDeleteCallback` の外部副作用を取り消します。

### メンバー（メソッド）

| シグネチャ                           | 説明                | 例外 |
|---------------------------------|-------------------|----|
| `void OnBeforeDeleteRollback()` | 削除直前フックの副作用を巻き戻す。 | —  |

### 注意事項

ロールバックは、**対応するコールバックが実際に呼び出された場合にのみ実行**されます。  
対となるコールバックが呼び出されなかった場合、またはコールバック自体が実装されていない場合には、ロールバックは呼び出されません。

---

## IBeforeDeleteSlotCallback

### 概要

スロットを識別する `SlotKey` を受け取り、スロット単位で削除直前の前処理を行います。

### メンバー（メソッド）

| シグネチャ                               | 説明                | 例外 |
|-------------------------------------|-------------------|----|
| `void OnBeforeDelete(SlotKey slot)` | 指定スロットの削除直前に呼ばれる。 | —  |

### 注意事項

**共有データ**および、**共有データの読み込み時にリセットするよう設定された一時データ**
では、このコールバックを使用することはできません。  
これらのデータはスロット単位での読み込み処理に含まれないため、`IAfterLoadSlotCallback` の呼び出し対象外となります。

---

## IBeforeDeleteSlotRollback

### 概要

`IBeforeDeleteSlotCallback` の外部副作用を取り消します。

### メンバー（メソッド）

| シグネチャ                                       | 説明              | 例外 |
|---------------------------------------------|-----------------|----|
| `void OnBeforeDeleteRollback(SlotKey slot)` | 指定スロットについて巻き戻す。 | —  |

### 注意事項

- **共有データ**および、**共有データの読み込み時にリセットするよう設定された一時データ**
  では、このコールバックを使用することはできません。  
  これらのデータはスロット単位での読み込み処理に含まれないため、`IAfterLoadSlotCallback` の呼び出し対象外となります。
- ロールバックは、**対応するコールバックが実際に呼び出された場合にのみ実行**されます。  
  対となるコールバックが呼び出されなかった場合、またはコールバック自体が実装されていない場合には、ロールバックは呼び出されません。

---

## IBeforeSaveCallback

### 概要

シリアライズ直前にデータを整える最終フックを提供します。

### メンバー（メソッド）

| シグネチャ                 | 説明         | 例外 |
|-----------------------|------------|----|
| `void OnBeforeSave()` | 保存直前に呼ばれる。 | —  |

---

## IBeforeSaveRollback

### 概要

`IBeforeSaveCallback` による外部副作用を取り消します。

### メンバー（メソッド）

| シグネチャ                         | 説明                | 例外 |
|-------------------------------|-------------------|----|
| `void OnBeforeSaveRollback()` | 保存直前フックの副作用を巻き戻す。 | —  |

### 注意事項

ロールバックは、**対応するコールバックが実際に呼び出された場合にのみ実行**されます。  
対となるコールバックが呼び出されなかった場合、またはコールバック自体が実装されていない場合には、ロールバックは呼び出されません。

---

## IBeforeSaveSlotCallback

### 概要

スロットを識別する `SlotKey` を受け取り、スロット単位で保存直前の前処理を行います。

### メンバー（メソッド）

| シグネチャ                             | 説明                | 例外 |
|-----------------------------------|-------------------|----|
| `void OnBeforeSave(SlotKey slot)` | 指定スロットの保存直前に呼ばれる。 | —  |

### 注意事項

**共有データ**および、**共有データの読み込み時にリセットするよう設定された一時データ**
では、このコールバックを使用することはできません。  
これらのデータはスロット単位での読み込み処理に含まれないため、`IAfterLoadSlotCallback` の呼び出し対象外となります。

---

## IBeforeSaveSlotRollback

### 概要

`IBeforeSaveSlotCallback` の外部副作用を取り消します。

### メンバー（メソッド）

| シグネチャ                                     | 説明              | 例外 |
|-------------------------------------------|-----------------|----|
| `void OnBeforeSaveRollback(SlotKey slot)` | 指定スロットについて巻き戻す。 | —  |

### 注意事項

- **共有データ**および、**共有データの読み込み時にリセットするよう設定された一時データ**
  では、このコールバックを使用することはできません。  
  これらのデータはスロット単位での読み込み処理に含まれないため、`IAfterLoadSlotCallback` の呼び出し対象外となります。
- ロールバックは、**対応するコールバックが実際に呼び出された場合にのみ実行**されます。  
  対となるコールバックが呼び出されなかった場合、またはコールバック自体が実装されていない場合には、ロールバックは呼び出されません。

---

## IDataCipher

### 概要

任意のバイト列を同期的に暗号化/復号します。入出力はいずれも `byte[]` です。

### メンバー

#### メソッド

| シグネチャ                               | 説明         | 例外 |
|-------------------------------------|------------|----|
| `byte[] Encrypt(byte[] plaintext)`  | 平文を暗号文へ変換。 | -  |
| `byte[] Decrypt(byte[] ciphertext)` | 暗号文を平文へ復元。 | -  |

#### プロパティ

| メンバー | 型 | 説明 |
|------|---|----|
| —    | — | なし |

### 実装例

```csharp
public sealed class SimpleXorCipher : IDataCipher
{
    private readonly byte key = 0x5A;
    public byte[] Encrypt(byte[] plaintext) { var b=new byte[plaintext.Length]; for(int i=0;i<b.Length;i++) b[i]=(byte)(plaintext[i]^key); return b; }
    public byte[] Decrypt(byte[] ciphertext) => Encrypt(ciphertext);
}
```

### 注意事項

`Encrypt` または `Decrypt` メソッド内で例外をスローすると、**進行中の読み込み／保存／削除処理が即座に中断**されます。  
その後の挙動（例外の再スロー、抑制、ログ出力など）は、設定されている **`ExceptionPolicy`** に従って処理されます。

---

## ISaveDesignConfig

### 概要

保存先ディレクトリ、ファイル名、拡張子、例外ポリシーなど、保存システムの基本設定を提供します。一部メソッドには既定実装があり、パス結合を行います。

### メンバー

#### メソッド

| シグネチャ                                               | 説明                                       | 例外 |
|-----------------------------------------------------|------------------------------------------|----|
| `string GetSaveDataDirectoryPath()`                 | 保存ディレクトリの取得。                             | —  |
| `string GetSharedDataFileName()`                    | 共有データのファイル名（拡張子なし）。                      | —  |
| `string GetSlotDataFileName()`                      | スロットデータのファイル名（拡張子なし、識別子は後置）。             | —  |
| `string GetFileExtension()`                         | 保存ファイルの拡張子。空/空白なら拡張子なし扱い。                | —  |
| `ExceptionPolicy GetExceptionPolicy()`              | 例外ポリシーの取得。                               | —  |
| `string GetSharedDataFilePath()`                    | 既定実装: ディレクトリ/ファイル名/拡張子からフルパス生成。          | —  |
| `string GetSlotDataFilePath(string identifier)`     | 既定実装: `identifier` を付加したフルパス生成。          | —  |
| `string GetSlotMetaDataFilePath(string identifier)` | 既定実装: `.meta`（または `.meta.{ext}`）のフルパス生成。 | —  |

#### プロパティ

| メンバー | 型 | 説明 |
|------|---|----|
| —    | — | なし |

### 実装例

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

### 注意事項

- セーブデータの保存には内部的に **`System.IO.File`** が使用されます。  
  そのため、**Android** など一部のプラットフォームでは、`UnityEngine.Application.persistentDataPath` 配下でなければ正常に保存できません。
- **WebGL** 環境では、`ISaveDesignConfig` から取得した保存先パスやファイル名は **エディタ実行時のみ有効** です。  
  実際のランタイムでは、内部で自動生成されたキーを使用して **`PlayerPrefs`** にデータが保存されます。

---

## SlotKey

### 概要

保存対象を表す読み取り専用ハンドル。文字列識別子と（可能なら）数値スロットを持ち、数値スロットとして保存されたかを判別できます。  
値型で軽量に扱えます。

### フィールド／プロパティ

| メンバー         | 型        | 説明                |
|--------------|----------|-------------------|
| `Identifier` | `string` | 正規化済みの文字列識別子。     |
| `SlotNumber` | `int`    | 数値スロット。なければ `-1`。 |
| `IsNumbered` | `bool`   | 数値スロットとして解釈されたか。  |

### コンストラクタ

```csharp
public SlotKey(string identifier)
```

### メソッド

- `override string ToString()` — `Identifier` を返します。

### 使用例

```csharp
if (slotKey.IsNumbered)
{
    /* スロット番号を使った処理 */
}
```

### 注意事項

- `identifier` が数値文字列の場合は `SlotNumber` が設定され `IsNumbered` が `true` になります。

---

## サードパーティ ライセンス

本パッケージは、以下のライブラリを参照するコードを生成する可能性があります：

- [MessagePack for C#](https://github.com/MessagePack-CSharp/MessagePack-CSharp) — MIT License
- [Newtonsoft.Json](https://github.com/JamesNK/Newtonsoft.Json) — MIT License
- [MemoryPack](https://github.com/Cysharp/MemoryPack) — MIT License

これらのライブラリは**パッケージに含まれていません**。
ライセンスの詳細については、 `Third-Party Notices.txt` を参照してください。