# next_instruction.md
# 更新: 2026-05-23 by Codex / Claude Cowork
# 状態: Item 1-6 完了、deploy @51 実機確認 OK

---

## 現状

| ファイル | 状態 |
|---|---|
| コード.js | ✅ 完了（同日入替判定、getAvailabilityData、getOccupiedRooms、checkRoomConflict、getReservations 更新済み） |
| index.html Item 1-3 | ✅ 完了（入替可 / 要確認 / CO 凡例、時刻変更時 checkRooms 再実行） |
| admin.html Item 4 | ✅ 完了（ALL_DATA ベース描画を維持し、CO / CI / 未承認△ 表示） |
| admin.html Item 5 | ✅ 完了（部屋別チャートで同日入替、競合、清掃○分表示） |
| デバッグ関数削除 Item 6 | ✅ 完了（debugReservationNo / _debug3336 / _debugGetByNo3336 / _debugGet3336 削除） |
| 実機確認 | ✅ 完了（deploy @51） |

---

## @51 実装方針

- 稼働中システムのため、admin.html は既存の ALL_DATA ベース描画を維持
- admin.html を getAvailabilityData() に寄せる共通化版は不採用
- 最小差分で Item 1-6 を反映

---

## 実機確認結果（2026-05-23 / deploy @51）

- [x] ?page=admin 宿泊管理タブが従来どおり表示される
- [x] ?page=admin カレンダータブで CO / CI / 未承認△ / 入替表示が崩れていない
- [x] ?page=admin 部屋別チャートで入替が `清掃○分` と表示される
- [x] ?page=form 申請フォームが壊れていない
- [x] Ctrl+F5 で強制リロード確認済み

---

## 次回開始時の確認

```powershell
git status
git log --oneline -1
git rev-list --count HEAD
Get-Content .\next_instruction.md
```

期待値:
- `git status` が clean
- 最新 commit が `Item 1-6 対応（最小差分版）/ deploy @51`
- `git rev-list --count HEAD` は 10（Item 1-6 / @51 commit 時点）

---

## 次タスク候補

1. GitHub リモート連携の確認・整理
2. 過去 Git 履歴に残る Script ID の整理
3. TANTOU_EMAIL の本番値戻し準備
4. Redrock / Bedrock 関連修正

## 注意

- TANTOU_EMAIL は現在テスト値（nipposoumu26@gmail.com のみ）
- 本番移行時は `"nipposoumu26@gmail.com,f_kokubo@nippoltd.co.jp"` に戻す
- `desktop.ini` は commit 対象外