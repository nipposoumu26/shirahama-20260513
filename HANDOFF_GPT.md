# HANDOFF_GPT

Script ID: 1PdxQlNBQZJjlH5wbCN8mWYlLvXf7KD_qLQ-_KKTSNtloLjj5idqXHq18
復元日: 2026-05-17
現在 deploy: @50（2026-05-17 夜 更新）

## 現在の設定（コード.js CONFIG）
- TANTOU_EMAIL: nipposoumu26@gmail.com のみ（テスト中、本番前に戻す）
- ADMIN_PASSWORD: 2026
- NO_OFFSET: 3319

## ファイル構成
- admin.html: 管理画面
- index.html: 予約フォーム
- コード.js: GAS サーバーサイド
- appsscript.json: GAS 設定

## ローカル Git
- ブランチ: master
- コミット数: 4（最新: 7a6df54）
- GitHub: 未連携（予定あり）

## 直近の変更（@50）
- admin.html にハードコードされていた WebアプリURL（Script ID）を削除
- コード.js: createHtmlOutputFromFile('admin') → createTemplateFromFile + evaluate()
- admin.html: FORM_BASE_URL / href を <?= formBaseUrl ?> で動的取得に変更
- ScriptApp.getService().getUrl() で実行時に URL を自動解決

## 実機確認（翌日 会社 PC でやること）
- [ ] ?page=admin が正常に開く
- [ ] ページソース（Ctrl+U）に <?= が残っていない
- [ ] 「申請ページを別タブで開く」ボタン → ?page=form が開く
- [ ] 一覧の詳細ボタン → ?page=form&no=番号 で開く
- [ ] ?page=form（申請フォーム）が壊れていない

## 次のタスク候補
- 実機確認 OK 後、TANTOU_EMAIL を本番値に戻す
  （"nipposoumu26@gmail.com,f_kokubo@nippoltd.co.jp"）
- GitHub リモート連携
- 過去 Git 履歴に残る Script ID の履歴リセット（別タスク）
