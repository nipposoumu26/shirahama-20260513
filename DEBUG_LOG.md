# DEBUG_LOG

## 2026-05-23
- deploy @51 実機確認完了
  - ?page=admin: 宿泊管理タブ表示 OK
  - ?page=admin: カレンダータブで CO / CI / 未承認△ / 入替表示 OK
  - ?page=admin: 部屋別チャートで入替 `清掃○分` 表示 OK
  - ?page=form: 申請フォーム表示・部屋候補表示 OK
- Item 1-6 対応を最小差分方針で確定
  - admin.html は ALL_DATA ベース描画を維持
  - getAvailabilityData 共通化版は不採用
- コード.js 末尾の DEBUG 一時関数を削除
- TANTOU_EMAIL は開発中につきテスト値（nipposoumu26 のみ）維持

## 2026-05-18
- @50 実機確認完了（会社 PC）
  - ?page=admin 正常表示、<?= 未展開なし、リンク動作、?page=form すべて OK
- FORM_BASE_URL 動的取得対応をクローズ
- TANTOU_EMAIL は開発中につきテスト値（nipposoumu26 のみ）維持

## 2026-05-17
- clasp pull 成功（4ファイル）
- clasp status: 4ファイル tracked 確認
- admin.html CO 表示短縮 → clasp push → deploy @48
- コード.js TANTOU_EMAIL / ADMIN_PASSWORD 修正 → clasp push → deploy @49
- 実機テスト OK