# HANDOFF_GPT

Script ID: 1PdxQlNBQZJjlH5wbCN8mWYlLvXf7KD_qLQ-_KKTSNtloLjj5idqXHq18
復元日: 2026-05-17
現在 deploy: @51（2026-05-23 更新）

## 現在の設定（コード.js CONFIG）
- TANTOU_EMAIL: nipposoumu26@gmail.com のみ（テスト中・開発中につき本番前に戻す）
- ADMIN_PASSWORD: 2026
- NO_OFFSET: 3319

## ファイル構成
- admin.html: 管理画面
- index.html: 予約フォーム
- コード.js: GAS サーバーサイド
- appsscript.json: GAS 設定

## ローカル Git
- ブランチ: main
- コミット数: 10（Item 1-6 / @51 commit 時点）
- GitHub: origin/main 連携済み。追加のリモート整理は次タスク候補

## 直近の変更（@51）
- index.html: 入替可 / 要確認 / CO 表示、時刻変更時の部屋再判定を追加
- コード.js: 同日入替判定を追加し、清掃時間に基づき conflict / turnover_warn / turnover を返すよう更新
- admin.html: ALL_DATA ベース描画を維持し、CO / CI / 未承認△ / 部屋別チャートの清掃○分表示を追加
- コード.js: デバッグ一時関数4種を削除
- getAvailabilityData 共通化版の admin.html 変更は不採用

## 実機確認（2026-05-23 @51 完了）
- [x] ?page=admin 宿泊管理タブが従来どおり表示される
- [x] ?page=admin カレンダーで CO / CI / 未承認△ / 入替表示が出る
- [x] ?page=admin 部屋別チャートで `清掃○分` が表示される
- [x] ?page=form 申請フォームが壊れていない
- [x] clasp push 後に Ctrl+F5 で強制リロード確認済み

## 次のタスク候補
- GitHub リモート連携の確認・整理
- 過去 Git 履歴に残る Script ID の履歴リセット（別タスク）
- TANTOU_EMAIL を本番値に戻す準備
  - `"nipposoumu26@gmail.com,f_kokubo@nippoltd.co.jp"` に変更予定
- Redrock / Bedrock 関連修正（別タスクで指示予定）