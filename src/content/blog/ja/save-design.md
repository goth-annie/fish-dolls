---
lang: 'ja'
title: 'Save Design'
description: 'キーを使わないセーブシステム'
pubDate: '2025-05-25'
heroImage: '/fish-dolls/images/save-design-icon.png'
---

# 概要

このアセットは、ゲーム内のセーブデータを管理するための汎用的な仕組みを提供します。共有データ、スロットごとのデータ、一時データの3種類を明確に分離し、直感的かつ安全に取り扱うことができます。

---

# はじめに

## 対応バージョン

- Unity 2022.3.12f1 以降を推奨

---

## オプションのインストール手順

### `UniTask` による非同期関数を使用する場合

1. `UniTask` を公式の手順に従ってインストールする
2. `GAME_DATA_MANAGER_SUPPORT_UNITASK` を scripting define symbols に追加

### `MessagePack for C#` を使用する場合

1. `MessagePack for C#` を公式の手順に従ってインストールする
2. データ管理のコアクラスに `[SaveDesignRoot(SerializerType.MessagePack)]` を付与する

---

# SaveDesignRoot 属性について

`SaveDesignRoot` 属性は、ゲーム全体のセーブデータ構成を定義する中核クラスに付与します。この属性が付与されたクラスをもとに、保存・読み込み・初期化などを行うためのエントリポイント（
`SD.Load`, `SD.Save`, `SD.Initialize` など）が自動生成されます。

---

## クラス名 = エントリポイント名

この属性を付与したクラスの名前が、そのまま `SD.Load` や `SD.Save` といったエントリポイントの名前になります。

```csharp
[SaveDesignRoot]
internal partial class SD
{
}

// エントリポイントは SD で始まる
SD.Load
SD.Save

[SaveDesignRoot]
internal partial class MySaveDesignRoot
{
}

// エントリポイントは MySaveDesignRoot で始まる
MySaveDesignRoot.Load
MySaveDesignRoot.Save
```

このクラスは**1プロジェクトに1つのみ**定義する必要があります。定義しない場合、エントリポイントが生成されず、データアクセスができません。

属性によって自動生成されるAPIにより、次のような形で簡潔にデータにアクセスできるようになります：

```csharp
var shared = SD.Load.Shared();
SD.Save.Slot(1);
SD.Initialize.Slot();
```

---

## シリアライザーの切り替え

`[SaveDesignRoot]` のコンストラクタ引数に `SerializerType` を指定することで、使用するシリアライザーを切り替えることができます。

```csharp
[SaveDesignRoot(SerializerType.MessagePack)]
public sealed class SD { ... }
```

対応している`SerializerType`の種類は以下の通りです：

* `SerializerType.Json`（デフォルト）
* `SerializerType.MessagePack`

---

# データの種類

本アセットでは、セーブ対象となるデータを以下の4種類に分類しています。それぞれ役割や保存タイミングが異なるため、用途に応じて使い分ける必要があります。

---

## SharedData（共有データ）

- すべてのセーブスロットで共有されるデータです。
- プレイヤー全体の進行状況やグローバル設定などに適しています。
- 読み込み：`SD.Load.Shared()`  
  保存：`SD.Save.Shared()`  
  初期化：`SD.Initialize.Shared()`

---

## SlotData（スロット固有データ）

- 各セーブスロットに固有のデータです。
- キャラクターの状態、所持アイテム、進行チャプターなど個別のゲーム進行に関わるデータを保持します。
- 読み込み：`SD.Load.Slot(slotIndex or identifier)`  
  保存：`SD.Save.Slot(...)`  
  初期化：`SD.Initialize.Slot()`

---

## SlotMetaData（スロットメタデータ）

- 各セーブスロットに付随するメタ情報です（例：セーブ日時、プレイ時間、表示用サムネイルなど）。
- 実際のセーブデータとは分離され、セーブスロットの一覧表示などに活用できます。
- 読み込み：`SD.Load.SlotMeta(slotIndex or identifier, out var meta)`  
  保存：スロットメタデータは `SD.Save.Slot(...)` の実行時に自動的に保存されます（使用例：セーブ日時、合計プレイ時間など）。

### 注意事項

* **毎回新規インスタンスが生成される**  
  `SlotMetaData` は保存時に旧インスタンスを再利用せず、必ず **新しいインスタンス** を生成して書き込みます。

* **初期値は必ず自前で設定する**  
  そのため _フィールド初期化子_ または _コンストラクタ_ 内で、  
  必要な値（セーブ日時・プレイ時間など）を必ず設定してください。  
  読み込み後に値を上書きする運用は想定されていません。

* **読み込んだメタ情報からの「引き継ぎ」は非推奨**  
  既存 `SlotMetaData` の値を保持・加算・差分更新する、といったワークフローはサポートしていません。  
  「最新の状態を丸ごと書き換える」ことを前提に設計されています。

---

## TempData（一時データ）

- 永続保存されない一時的なデータです。
- ゲームセッション中にのみ有効なフラグや一時的な状態の保存に使用します。
- どのタイミングでリセットされるかは、`TempDataResetTiming` により制御できます。
    - 例：ゲーム開始時、スロット切り替え時、アプリ終了時など

### リセットタイミングの設定

クラスに`[TempData]`属性を付けることで一時データとして認識されます。

リセットタイミングは`TempDataResetTiming`を指定できます。

```csharp
[TempData(resetTiming: TempDataResetTiming.OnGameStart)]
internal sealed class SomeTempData { ... }
```

利用可能なリセットタイミングは以下の通りです：

* OnGameStart：ゲーム起動時にリセットする
* OnSharedDataLoad（デフォルト）：共有データ初期化時または読み込み時にリセットする
* OnSlotDataLoad：スロット初期化時または読み込み時にリセットする
* Manual：手動でリセットする

この分類によって、プレイヤーの体験に応じた柔軟なデータ管理が可能になります。

---

## データ間の依存関係の設定

各データ属性（`[SharedData]`, `[SlotData]`, `[TempData]` など）には、**他のデータ型への依存関係を明示的に指定することができます
**。

これにより、**指定された依存先のデータが先にシリアライズ／デシリアライズされるようになります**。  
データの整合性や初期化順序に依存がある場合に利用してください。

---

### 使用方法

属性のコンストラクタに `Type` 型で依存先を指定します：

```csharp
[SharedData(typeof(AudioSettings), typeof(ScreenSettings))]
public sealed class GameSettings { ... }
```

この例では、`AudioSettings` and `ScreenSettings` → `GameSettings` の順に処理が行われます（シリアライズ・デシリアライズともに）。

---

### 注意点

* **依存先として指定する型は、同じ種類のデータ属性（`[SharedData]`, `[SlotData]`, `[TempData]` 等）を持っている必要があります。
  **
    * 例：`[SharedData(...)]` が依存できるのは他の `[SharedData]` のみ
* `[TempData]` の場合、さらに**リセットタイミングが一致**している必要があります。
* **循環依存はできません。**（A → B → C → A のような構造はビルド時にエラーになります）
* 複数の依存先がある場合、それぞれが解決された後に自分が処理されます（トポロジカルソートによって順序決定されます）。

---

### 活用例

依存順制御は以下のような状況に便利です：

* データAの `OnAfterDeserialize()` でデータBにアクセスしたい
* データCが他の設定データの値を集約して使用する
* データ間でリソース共有や初期化の依存関係がある

この機能により、大規模なセーブデータ構造でも**安全で順序保証されたデータ初期化**を実現できます。

---

## データパスによる階層管理

各データクラスに付与する属性（`[SharedData]`, `[SlotData]`, `[TempData]` など）には、オプションで「パス」を指定することができます。

このパスは、内部的なデータ管理のための名前空間のような役割を果たし、同じ種類のデータが複数ある場合にも、衝突せずに個別に管理できるようになります。

---

### 使用例

```csharp
[SharedData("Settings"), Serializable]
public class Audio { ... }

// namespace: MyGame
[SharedData("Settings"), Serializable]
public class Screen { ... }

// namespace: MyGame.Something
[SharedData("Settings/Something"), Serializable]
public class Screen { ... }
```

この例では、保存先や識別に使われるキーが以下のように階層構造になります：

* `SD.Shared.Settings.Audio`
* `SD.Shared.Settings.Screen`
* `SD.Shared.Settings.Something.Screen`

これにより、整理された構造で複数のデータを扱うことができ、大規模なプロジェクトでも柔軟にスケーラブルなデータ設計が可能になります。

---

# 使い方

## `ISaveDesignConfig` インターフェース

Save Design の機能を使用する前に、**ファイル関連の設定を提供するクラスを実装し、Save Design に登録する必要があります**。
これを行うために実装するのが `ISaveDesignConfig` インターフェースです。

このインターフェースは、Save Design がデータをどこに・どのように保存／読み込みするかを定義します。
この設定がない場合、セーブやロードは行われません。

#### 実装が必要なメソッド

| メソッド名                               | 説明                                                                                      |
|-------------------------------------|-----------------------------------------------------------------------------------------|
| `string GetSaveDataDirectoryPath()` | セーブファイルが保存されるディレクトリパスを返します。通常は `Application.persistentDataPath` などの書き込み可能な永続パスを返してください。 |
| `string GetSharedDataFileName()`    | 共有データを保存するためのファイル名（拡張子なし）を返します。                                                         |
| `string GetSlotDataFileName()`      | スロットごとのデータを保存するファイル名（拡張子なし）を返します。                                                       |
| `string GetFileExtension()`         | セーブファイルに使用する拡張子（例：`"dat"` や `"json"`）を返します。                                             |

これらの設定は、`SD.Load`、`SD.Save`、`SD.Initialize` のいずれかを呼び出す**前に必ず登録してください**。

---

## データの初期化について

セーブデータは、新しいゲームを開始する際に明示的に初期化する必要があります。  
この初期化は `SD.Initialize` を通じて行い、**既存のセーブデータが存在しない場合にのみ実行するべきです**。

### 初期化の対象

- `SharedData`（共有データ）
- `SlotData`（スロットごとのデータ）

`TempData`（一時データ）は実行時に都度初期化されるため、`Initialize` の対象ではありません。

---

### 使用例

```csharp
// 共有データを初期化
SD.Initialize.Shared();

// スロットデータを初期化
SD.Initialize.Slot();
```

---

### 注意事項

* **既存のセーブデータがある状態で** `Initialize` **を実行すると、内容が上書きされます。**
* 通常のプレイでは `Load` を使ってデータを読み込み、`Initialize` は新規ゲーム用に限定してください。

---

### IAfterInitializeCallback について

`IAfterInitializeCallback` は、データの**初期化直後に一度だけ**処理を実行したいときに使用するコールバックインターフェースです。
このインターフェースを実装したデータクラスでは、次の条件で **`void OnAfterInitialize()`** が呼び出されます。

#### 呼び出されるタイミング

* `SD.Initialize.Shared()` または `SD.Initialize.Slot()` を通じて **新しいデータを生成したとき**
* `SD.Load` において、セーブファイルに対象のデータが存在しなかったために **新しいインスタンスが生成されたとき**
  （バージョン違いや新規追加など）

#### 呼び出されないケース

* `SD.Load` において、既存セーブデータにそのデータが含まれており、正常に復元された場合（すでに存在するデータには呼ばれません）

#### 主な用途

* 初期状態における特別な値の設定や関連データの初期リンク
* バージョン移行で新しく追加されたデータのデフォルト値のセットアップ
* データ構造に対する一度限りの初期補正

#### 使用例

```csharp
public class PlayerSettings : IAfterInitializeCallback
{
    public int GraphicsQuality;

    public void OnAfterInitialize()
    {
        // 初期化時のみ実行される（Loadで存在していた場合は呼ばれない）
        GraphicsQuality = 2;
    }
}
```

#### 備考

* `IAfterInitializeCallback` は「OnAfterDeserialize」とも「OnAfterLoad」とも異なり、
  **“新しいインスタンスとして初めて使われるとき” だけに限定**された初期化フックです。
* 実行タイミングの保証が必要な処理（例：未設定値の補完など）に適しています。
* `SlotMetaData` と `TempData` には使用できません。

---

## データの読み込み

共有データは以下のように初期化と合わせて実装することを推奨します。

```csharp
// まず先に既存の共有データを読み込む
if (!SD.Load.Shared())
{
    // 読み込めなければ初期化する
    SD.Initialize.Shared();
}
```

---

以下はスロット固有のデータを読み込むページの実装例です。

まずは容量の小さいスロットメタ情報を読み込めるか確認し、読み込めたらその内容をセーブスロットに表示します。

読み込めなければそのセーブスロットにはセーブデータが保存されていないことを表しています。

```csharp
// ロード画面に表示するセーブスロットのUIリスト
SlotUI[] slotUIList;

// 現在のロード画面のページに表示するセーブスロットの情報を更新する
public void UpdateLoadPage(int pageIndex)
{
    int baseSlotIndex = pageIndex * slotUIList.Length;
    for(int i = 0; i < slotUIList.Length; i++)
    {
        // ロード画面のページ数とスロット数からスロット番号を求める
        int slotIndex = baseSlotIndex + i;
        
        // 求めたスロット番号からセーブデータのメタ情報を取得する
        if (SD.Load.SlotMeta(slotIndex, out var meta))
        {
            // メタ情報を使ってこのスロットに保存されているデータの内容を表示する
            slotUIList[i].UpdateUI(slotIndex, meta);
        }
        else
        {
            // メタ情報がなければこのスロットにはセーブデータがないことを伝える
            slotUIList[i].UpdateUI(slotIndex, "no data");
        }
    }
}

// ロード画面のセーブスロットがクリックされたときにスロット固有のデータを読み込む
public void LoadSlotData(int slotIndex)
{
    // スロット番号からセーブデータを読み込む
    if (SD.Load.Slot(slotIndex))
    {
        // 正常に読み込めたら次のシーンへ遷移する
        SceneManager.LoadScene("Next Scene");
    }
    else
    {
        // データが読み込めなかったことを伝える
        Debug.LogError("セーブデータが読み込めませんでした。");
    }
}
```

---

## データの保存について

データの保存は `SD.Save` を通じて行います。`SharedData` と `SlotData` はそれぞれ個別に保存できるため、必要なタイミングで明示的に保存処理を呼び出してください。

---

### 保存の基本

```csharp
// 共有データの保存
SD.Save.Shared();

// スロット番号でスロットデータを保存
SD.Save.Slot(0);

// 識別子（例: "autosave"）でスロットデータを保存
SD.Save.Slot("autosave");
```

---

### 保存タイミングの例

* チェックポイント通過時
* 明示的なセーブ操作（セーブメニューなど）
* アプリ終了前
* 自動セーブ（オートセーブ識別子など）

---

### **注意事項**

> * 保存処理は**必要なときに明示的に呼び出す**必要があります。データの変更だけでは自動保存されません。
> * スロットメタデータ（セーブ日時など）は `Save.Slot(...)` 実行時に自動的に更新されます。

---

## 読み書き時のコールバック用インターフェース

| インターフェース                  | 役割                           | コールバック                |
|---------------------------|------------------------------|-----------------------|
| **`IAfterLoadCallback`**  | データ読み込み直後の後処理を実装したいときに使用します。 | `void OnAfterLoad()`  |
| **`IBeforeSaveCallback`** | データ保存直前の前処理を実装したいときに使用します。   | `void OnBeforeSave()` |

---

### 動作タイミング

* `SD.Load.…` でオブジェクトがデシリアライズされた後、インスタンスが **`IAfterLoadCallback`** を実装していれば *
  *`OnAfterLoad()`** がメインスレッド上で自動実行されます。

* `SD.Save.…` でシリアライズを行う直前、インスタンスが **`IBeforeSaveCallback`** を実装していれば **`OnBeforeSave()`**
  が呼び出されます。

---

### 主な用途

| シナリオ                          | 使用する IF               | 例                                            |
|-------------------------------|-----------------------|----------------------------------------------|
| 読み込んだフィールドを基にキャッシュや派生値を再計算したい | `IAfterLoadCallback`  | ランタイム専用のリスト再生成、辞書構築、サムネイル再作成 など              |
| 保存前に整合性チェックや値の補正を行いたい         | `IBeforeSaveCallback` | 無効参照の除去、カウンタの上限補正、`lastSavedAt` タイムスタンプ更新 など |

> **備考:**
> * `TempData` に実装してもコールバックが呼ばれることはありません。
> * これらのコールバックには軽量な処理のみを記述することを推奨します。重い処理は後段で非同期実行するか、ロード後に別タスクで処理してください。
> * `Load.Async` や `Save.Async` などの非同期関数で読み書きする場合はコールバック内でUnityAPIが使用できません。

---

## CurrentSlotIndex について

`SD.CurrentSlotIndex` は、現在読み込まれているスロット固有のデータの**スロット番号（`int`）**を表す読み取り専用プロパティです。

- **取得方法：** `SD.CurrentSlotIndex`
- **初期値：** `-1`（スロットが未読み込みの状態を表します）

---

### 自動更新のタイミング

`CurrentSlotIndex` の値は、以下の操作によって自動的に更新されます：

| 操作                         | CurrentSlotIndex の変化 |
|----------------------------|----------------------|
| `SD.Initialize.Slot()`     | `-1` に設定される          |
| `SD.Load.Slot(identifier)` | `-1` に設定される          |
| `SD.Load.Slot(slotIndex)`  | `slotIndex` が設定される   |
| `SD.Save.Slot(slotIndex)`  | `slotIndex` が設定される   |
| `SD.Save.Slot(identifier)` | **変更なし**（そのままの値を維持）  |

---

### 用途

- スロット番号に応じた処理の分岐
- 自動セーブ時に「前回のスロット番号を使って保存」などの制御
- ロード時にメタ情報との整合性を確認する処理 など

---

### 注意点

- `CurrentSlotIndex` は読み取り専用です。スクリプトから変更することはできません。
- 識別子ベース（`string identifier`）での読み書きでは `CurrentSlotIndex` は更新されません。スロット番号と関連付ける必要がある処理では
  `int slotIndex` を使用してください。

---

## 非同期処理

### UniTask 対応

プロジェクトに`UniTask`を導入し、以下のスクリプティングシンボルを定義することで、UniTask ベースの非同期関数が自動生成されます。

```
GAME_DATA_MANAGER_SUPPORT_UNITASK
```

---

### Unity Awaitable 対応（Unity 2023.1 以降）

Unity 2023.1 以降の環境では、`Async`クラスは`Awaitable`を返す関数を標準で生成します。追加のパッケージや依存は不要です。

ただし、`GAME_DATA_MANAGER_SUPPORT_UNITASK`が定義されている場合は、UniTask が優先されて Awaitable は生成されません。

---

### 使用方法

セーブデータの読み書きは、`Async` クラスを使用することで非同期で実行することができます。

これはロードやセーブにかかる時間が長くなる可能性がある場合（特にモバイルやWebGLなど）に便利です。

```csharp
await SD.Load.Async.Shared();
await SD.Load.Async.Slot(0);
await SD.Save.Async.Slot("autosave");
```

---

### 注意事項：データの初期化時にUnity APIは使用できません

`SD.Load.Async` および `SD.Save.Async` による非同期処理では、  
データのインスタンス化（コンストラクタの実行やフィールド初期化子の評価など）が**メインスレッド外のスレッドで実行される可能性があります
**。

そのため、以下のような **Unity API（例：`Transform`、`GameObject`、`Resources.Load` など）を**  
**データクラスの初期化タイミングで使用することはできません。**

---

#### ❌ 使用できない例（クラッシュや例外の原因）

```csharp
[SlotData]
public sealed class PlayerData
{
    // NG: 非同期読み込み時にメインスレッド外で評価される可能性がある
    public string PlayerName = GameObject.Find("Player").name;

    // NG: コンストラクタ内でUnityオブジェクトにアクセス
    public PlayerData()
    {
        var go = GameObject.FindWithTag("Player");
    }
}
```

---

### ✅ 対応方法

* Unity API を使用する必要がある処理は、データの読み込み後に手動で初期化してください。
* または、Unity API とは無関係な純粋データとして保持し、ロジック側で補完する設計にしてください。
* これは非同期の読み書き関数を使用する場合の注意点であり、 `SD.Load.Shared()` のような同期的な読み書き関数を使用する場合は問題ありません。

**補足：** 同様の制約は `MessagePack` を使用したシリアライズでも発生するため、非同期に読み書きを行いたいのであればデータクラスを
**データ保持に特化した純粋なモデルクラス** として設計することを推奨します。

---

## スロット番号の代わりに識別子で読み書きする

本アセットでは、セーブスロットの読み書き時に整数のスロット番号 (`int slotIndex`)
を使用するだけでなく、任意の文字列識別子 (`string identifier`) を用いることも可能です。

この機能は以下のような用途に便利です：

- オートセーブやチェックポイントなど、スロット番号とは別管理したいセーブ
- 名前付きスロット（例: `"autosave"`, `"checkpoint-1"`）による柔軟な管理

---

### 例：識別子での読み書き

```csharp
// 読み込み
SD.Load.Slot("autosave");

// 書き込み
SD.Save.Slot("autosave");

// 非同期処理
await SD.Load.Async.Slot("autosave");
await SD.Save.Async.Slot("autosave");
````

---

## セーブデータのバージョン管理とマイグレーション（任意）

データ構造の変更に対応するため、必要に応じて `Version` フィールドをデータに追加し、読み込み時に手動でバージョンチェックやマイグレーション処理を行うことが可能です。

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
            // バージョン０からの変換処理
            ...
            Version = 1;
        }
        
        if (Version == 1)
        {
            // バージョン１からの変換処理
            ...
            Version = 2;
        }
    }
}
```

---

## データの暗号化について

本アセットでは、セーブデータの暗号化は**デフォルトでは無効**になっていますが、  
必要に応じてユーザーが独自に暗号化機能を組み込めるよう設計されています。

---

### 暗号化の組み込み方法

暗号化／復号処理は、`SaveDesign.Runtime.Encryptor` クラスに定義された  
**部分メソッド（`partial method`）** を通じて自由に実装できます。

以下の `EncryptCore` および `DecryptCore` を任意の場所で `partial` として実装してください：

```csharp
// 暗号化処理（保存前に呼び出されます）
static partial void EncryptCore(ref byte[] data);

// 複合化処理（読み込み後に呼び出されます）
static partial void DecryptCore(ref byte[] data);
```

この仕組みにより、自由に暗号化ロジックを組み込むことが可能です。

---

### エディタ拡張：AES + HMAC による暗号化＋改ざん検知の自動生成

より簡単に暗号化を導入したい場合は、AES + HMAC対応のエディタ拡張を使用することができます。

---

#### 手順：

1. Unityエディタの上部メニューから `Tools > Game Data Manager > Encrypt Settings` を開きます。
2. AES鍵とHMAC鍵を入力します（推奨：32文字のランダム英数字）。
3. `Generate Encryptor.cs` ボタンを押します。

これにより、暗号化と改ざん検知を備えた `Encryptor.cs` が自動生成され、
セーブデータの保存前に暗号化、読み込み後に復号＋HMAC検証が実行されるようになります。

---

### 注意事項

暗号化機能を組み込むのであれば、ゲームのリリース前に組み込んでください。

すでにリリースしているゲームに後から暗号化機能を組み込んでしまうと、**暗号化前のセーブデータが読み込めなくなります。**

---

## データの読み書き中に発生した例外の扱いについて

`SD.Load` と `SD.Save` はデータの読み書き中に例外が発生した場合は例外を投げずに `false` を返します。

どのような例外が発生したかを確認したい場合、 `[SaveDesignRoot]` を付与したクラスに自動的に定義される以下の部分メソッドを実装してください。

```csharp
static partial void OnGameDataError(Exception e);
```

---

## 本アセットのディレクトリ構成

```
Save Design/
├── Runtime/             # 実行時スクリプト
├── Editor/              # エディタ拡張
├── Resources/           # 設定データ
└── Samples/             # 使用例・サンプル（必要なければ削除しても大丈夫）
```

---

## ライセンスに関する注意事項（ソースジェネレータによる参照）

本アセットのソースジェネレータは、以下のライブラリの型や関数名をコード出力時に参照することがあります：

- [UniTask](https://github.com/Cysharp/UniTask)（MIT License）
- [MessagePack for C#](https://github.com/MessagePack-CSharp/MessagePack-CSharp)（MIT License）

これらのライブラリはアセットには含まれておらず、オプション機能としてサポートされています。  
ただし、**ソースジェネレータの出力にライブラリの型や関数が含まれる場合は、MITライセンスに基づきライセンス表示が必要**です。

ライセンス表示の責任は、該当ライブラリを使用するプロジェクトの開発者にあります。  
詳しくは各ライブラリのリポジトリおよびライセンスをご確認ください。
