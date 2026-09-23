# GitHub 同期ガイド (GITHUB_SYNC.md)

## リモート設定情報
- **リポジトリURL**: `git@github.com:mdo3-system/map.git`
- **現在のバージョン**: `v0.1.3`

---

## 安全な Git Pull 手順（バックアップ自動取得）

リモートから最新コードを取り込む前に、ローカル状態を必ずバックアップします。

```bash
# 1. バックアップ取得
node scripts/backup.js v0.1.1 pre-pull

# 2. リモートから最新を取得
git pull origin main
```

---

## 安全な Git Push 手順（バックアップ自動取得）

コードを変更してコミット・プッシュする際の手順です。

```bash
# 1. バックアップ取得
node scripts/backup.js v0.1.1 pre-push

# 2. 変更確認 & ステージング
git status
git add .

# 3. コミット（末尾のバージョン番号 +1 または現在バージョンを明記）
git commit -m "feat: [v0.1.1] 方位5種, 施設記号サイズ変更, テキストプロパティモーダル, 引き出し線強化"

# 4. リモートへプッシュ
git push -u origin main
```

---

## 復元（ロールバック）方法
万が一、リモート更新や誤操作で問題が発生した場合：
1. `_backups/` フォルダを開きます。
2. 戻したい日時のフォルダ（例: `v0.1.1_pre-pull_20260923_XXXXXX`）の中身をプロジェクトルートへコピー＆上書きしてください。
3. すぐに作業前の状態に完全復帰します。
