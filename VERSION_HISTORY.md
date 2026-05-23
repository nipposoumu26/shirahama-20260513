# VERSION_HISTORY

## 2026-05-23 deploy @51
- index.html: カレンダー凡例に CO / 入替可 / 要確認 を追加
- index.html: renderCalendar() の同日入替表示を `入替可` / `要確認` に調整
- index.html: checkinTime / checkoutTime 変更時に checkRooms() を再実行するよう更新
- コード.js: 同日入替判定を追加（清掃120分未満は競合、120〜179分または時刻不明は要確認、180分以上は入替可）
- コード.js: getAvailabilityData / getOccupiedRooms / checkRoomConflict / getReservations を同日入替対応に更新
- admin.html: カレンダーに CO / CI 表示を追加し、未承認の滞在中（初日以外）に `△` を表示
- admin.html: 部屋別チャートで同日入替を表示し、入替ラベルを `清掃○分` 表記に変更
- コード.js: デバッグ一時関数4種を削除（debugReservationNo / _debug3336 / _debugGetByNo3336 / _debugGet3336）
- 実機確認 OK（?page=admin: 宿泊管理 / カレンダー / 部屋別チャート、?page=form）

## 2026-05-17 deploy @49
- admin.html: 部屋別チャート CO 表示短縮（`CO 16:00以降空き` → `CO 16:00` / `チェックアウト後空き` → `CO後空き`）
- コード.js: テストメール送信先を nipposoumu26@gmail.com のみに限定（f_kokubo を除外）
- コード.js: 管理画面パスワードを `shirahama2026` → `2026` に変更
- 実機テスト OK

## 2026-05-17 (復元基準点) deploy @48
- 別PCにて clasp pull で復元
- ローカル Git 初期化（.gitignore 含む）