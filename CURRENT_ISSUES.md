# CURRENT_ISSUES

## 対応済み
- [x] 部屋別チャートの CO 表示短縮（2026-05-17 deploy @48）
- [x] 管理画面パスワード変更 → 2026（2026-05-17 deploy @49）
- [x] FORM_BASE_URL ハードコード削除・動的取得化（2026-05-17 deploy @50）
  - admin.html から Script ID を含む URL を完全除去
  - コード.js で createTemplateFromFile + ScriptApp.getService().getUrl() に変更
- [x] 同日入替対応（2026-05-23 deploy @51）
  - index.html: 入替可 / 要確認 / CO 凡例、時刻変更時の部屋再判定
  - コード.js: 清掃時間に基づく conflict / turnover_warn / turnover 判定
  - admin.html: CO / CI / 未承認△ / 部屋別チャートの清掃○分表示
  - デバッグ一時関数4種を削除

## 実機確認済み
- [x] @50 の実機確認（2026-05-18 会社 PC で完了）
  - ?page=admin 表示、<?= 未展開チェック、リンク動作、?page=form すべて OK
- [x] @51 の実機確認（2026-05-23 完了）
  - ?page=admin: 宿泊管理 / カレンダー / 部屋別チャート OK
  - ?page=form: 申請フォーム OK

## 注意（本番運用前に戻すもの）
- コード.js `TANTOU_EMAIL` が nipposoumu26 のみ（開発中につきテスト値維持）
  - 本番移行時に `"nipposoumu26@gmail.com,f_kokubo@nippoltd.co.jp"` に戻す

## 未対応（次タスク候補）
- GitHub リモート連携
- 過去 Git 履歴に残る Script ID のリセット（git filter-branch 等、別タスク）
- TANTOU_EMAIL の本番値戻し準備
- Redrock / Bedrock 関連修正（別タスクで指示予定）