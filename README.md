# ホテル清掃シフト・報酬管理システム

旅館・ホテルの客室清掃スタッフのシフト管理と、変動単価に基づく報酬の自動集計を行う運用ツールです。

---

## 主な機能

| 画面 | 内容 |
|------|------|
| **清掃割当** | 日付ごとに出勤スタッフを登録し、部屋ごとに担当者を割り当て |
| **スタッフ用シフト指定** | スタッフが自分の希望出勤日・休み希望日を入力 |
| **報酬集計** | 日次・週次・月次の報酬を自動集計して一覧表示 |
| **マスタ設定** | スタッフ情報の管理、部屋ごとのデフォルト単価の設定 |

## 技術スタック

| 分類 | 技術 |
|------|------|
| フロントエンド | React 19 / TypeScript |
| スタイリング | Tailwind CSS 4 |
| データ | localStorage（サーバー不要） |
| ビルド | Vite 6 |
| デプロイ | Cloudflare Pages |

🖥️ **[デモを見る](https://laronkontol-shift-system.pages.dev/)**

## ローカル実行

```bash
git clone https://github.com/tatagen/laronkontol-shift-system.git
cd laronkontol-shift-system
npm install
npm run dev
```

環境変数は不要です。ブラウザの localStorage にデータが保存されます。

## デプロイ（Cloudflare Pages）

| 設定 | 値 |
|------|----|
| ビルドコマンド | `npm run build` |
| 出力ディレクトリ | `dist` |
| 環境変数 | なし |
