// 白浜荘 GAS予約システム
var STATUS_PENDING = '未承認';
var STATUS_APPROVED = '承認';
var STATUS_REJECTED = '却下';

var CONFIG = {
  TANTOU_EMAIL:   "nipposoumu26@gmail.com,f_kokubo@nippoltd.co.jp",
  TANTOU_NAME:    "小久保",
  ITO_EMAIL:      "k_itou@nippoltd.co.jp",
  SS_URL:         "https://docs.google.com/spreadsheets/d/1cIaZjRsphLC12GRkke1GKRsIfozkiIiyj84oIjnMfzc/edit",
  CALENDAR_ID:    "",
  ADMIN_PASSWORD: "shirahama2026",
  NO_OFFSET:      3319
};

var PRICES = {
  STAY: { adult: 1000, child: 500, infant: 0 }
};

var DINNER_MASTER = [
  'A(1500)', 'B(2500)', 'C(3500)', '洋食(1800)', '大皿洋食(1800)',
  '特(要相談)', 'お子様用(1000)', '舟盛(要相談)', '鯛茶漬け(800)', 'ハンバーガープレート(800)'
];
var BREAKFAST_MASTER = ['和食(650)', '洋食(650)'];

function getMealMenu() {
  return { dinner: DINNER_MASTER, breakfast: BREAKFAST_MASTER };
}

var COL = {
  DATE:0, NAME:1, PHONE:2, EMAIL:3, CHECKIN:4, CHECKOUT:5,
  ADULTS:6, CHILDREN:7, INFANTS:8, ROSTER:9, ROOMS:10,
  MEALS:11, MEMO:12, TANTOU:13, ITO:14,
  DEPT:15, NIGHTS:16, STAY_FEE:17, MEAL_FEE:18, TOTAL:19,
  CHECKIN_TIME:20, CHECKOUT_TIME:21, NO:22
};

var HEADERS = [
  "タイムスタンプ","氏名","電話番号","メール",
  "チェックイン","チェックアウト","大人","小人","小人未満",
  "宿泊者名簿","部屋割り","食事詳細","備考",
  "小久保承認","伊藤承認",
  "所属","泊数","宿泊料","食事代","合計",
  "チェックイン時間","チェックアウト時刻","予約No"
];

function doGet(e) {
  var page = e && e.parameter && e.parameter.page;

  if (page === 'admin') {
    return HtmlService.createHtmlOutputFromFile('admin')
      .setTitle('白浜荘 予約管理')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('白浜荘 宿泊申請')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function setupSheet() {
  var ss = SpreadsheetApp.openByUrl(CONFIG.SS_URL);
  var sheet = ss.getSheetByName("予約申請一覧");
  if (!sheet) sheet = ss.insertSheet("予約申請一覧");
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#4472c4").setFontColor("white").setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
  for (var c = 1; c <= HEADERS.length; c++) { try { sheet.autoResizeColumn(c); } catch (e) {} }
  return "ヘッダー設定完了 (" + HEADERS.length + "列)";
}

function setupMailMasterSheet() {
  var ss = SpreadsheetApp.openByUrl(CONFIG.SS_URL);
  if (ss.getSheetByName('メールアドレスマスター')) return 'シートは既に存在します';
  var sheet = ss.insertSheet('メールアドレスマスター');
  sheet.getRange(1, 1, 1, 3).setValues([['氏名','メールアドレス','役割']]);
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#4472c4').setFontColor('white').setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
  sheet.getRange(2, 1, 4, 3).setValues([
    ['小久保','f_kokubo@nippoltd.co.jp','担当'],
    ['伊藤','k_itou@nippoltd.co.jp','承認者'],
    ['','','白浜管理者'],
    ['システム管理','nipposoumu26@gmail.com','システム管理']
  ]);
  return 'メールアドレスマスター シートを作成しました';
}

function getPrices() { return PRICES; }

function getAvailabilityData(year, month) {
  try {
    var ss = SpreadsheetApp.openByUrl(CONFIG.SS_URL);
    var src = ss.getSheetByName("予約申請一覧");
    var resData = src.getDataRange().getValues();
    var reservations = [];
    for (var i = 1; i < resData.length; i++) {
      var row = resData[i];
      var ci = row[COL.CHECKIN], co = row[COL.CHECKOUT];
      if (!ci || !co) continue;
      var ciDate = new Date(ci), coDate = new Date(co);
      if (isNaN(ciDate.getTime()) || isNaN(coDate.getTime())) continue;
      reservations.push({
        checkin: ciDate.getTime(), checkout: coDate.getTime(),
        roomsStr: String(row[COL.ROOMS] || ""),
        roomNums: extractRoomNumbers_(String(row[COL.ROOMS] || "")),
        isApproved: (row[COL.ITO] === STATUS_APPROVED)
      });
    }
    var rooms = ["202","203","205","206","207","301","302","303","305","306"];
    var daysInMonth = new Date(year, month, 0).getDate();
    var days = [];
    for (var day = 1; day <= daysInMonth; day++) {
      var date = new Date(year, month-1, day); date.setHours(0,0,0,0);
      var dt = date.getTime();
      var roomStatus = {};
      rooms.forEach(function(r) {
        var status = 'available';
        for (var j = 0; j < reservations.length; j++) {
          var res = reservations[j];
          if (dt >= res.checkin && dt < res.checkout && res.roomNums.indexOf(r) !== -1) {
            status = res.isApproved ? 'occupied' : 'pending'; break;
          }
        }
        roomStatus[r] = status;
      });
      days.push({ day: day, dow: date.getDay(), rooms: roomStatus });
    }
    return { days: days, rooms: rooms };
  } catch(e) { return { error: e.toString() }; }
}

function processForm(data) {
  if (!data.name || !data.email || !data.checkin || !data.checkout) throw new Error("必須項目が未入力です");
  var ciD = new Date(data.checkin), coD = new Date(data.checkout);
  if (isNaN(ciD.getTime()) || isNaN(coD.getTime())) throw new Error("日付の形式が不正です");
  if (ciD >= coD) throw new Error("チェックアウトはチェックイン翌日以降を指定してください");
  if (String(data.name).length > 100) throw new Error("氏名が長すぎます");

  var rosterSource = data.roomAssignments || data.roster;
  var counts = countRoster(rosterSource);
  var nights = Math.max(1, Math.round((coD - ciD) / 86400000));
  var stayFee = calcStayFee(counts, nights);
  var mealTotal = calcMealTotal(data.meals);
  var grandTotal = stayFee + mealTotal;

  var ss = SpreadsheetApp.openByUrl(CONFIG.SS_URL);
  var sheet = ss.getSheetByName("予約申請一覧");
  var tz = ss.getSpreadsheetTimeZone() || "Asia/Tokyo";

  // checkRoomConflict に渡す部屋番号文字列を生成
  var roomsStr = data.roomAssignments
    ? data.roomAssignments.map(function(r) { return r.room; }).join(",")
    : (data.rooms || "");

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  var bookingNo;
  try {
    var conflict = checkRoomConflict(roomsStr, data.checkin, data.checkout, sheet);
    if (conflict.length > 0) throw new Error("以下の部屋がすでに予約済みです: " + conflict.join(", "));
    bookingNo = getNextBookingNo_(sheet);
    var row = [];
    row[COL.DATE] = new Date();
    row[COL.NAME] = data.name;
    row[COL.PHONE] = data.phone || "";
    row[COL.EMAIL] = data.email;
    row[COL.CHECKIN] = data.checkin;
    row[COL.CHECKOUT] = data.checkout;
    row[COL.ADULTS] = counts.adults;
    row[COL.CHILDREN] = counts.children;
    row[COL.INFANTS] = counts.infants;
    row[COL.ROSTER] = formatRoster(rosterSource);
    row[COL.ROOMS] = data.roomAssignments ? formatRooms(data.roomAssignments) : (data.rooms || "");
    row[COL.MEALS] = data.meals || "";
    row[COL.MEMO] = data.memo || "";
    row[COL.TANTOU] = STATUS_PENDING;
    row[COL.ITO] = STATUS_PENDING;
    row[COL.DEPT] = data.dept || "";
    row[COL.NIGHTS] = nights;
    row[COL.STAY_FEE] = stayFee;
    row[COL.MEAL_FEE] = mealTotal;
    row[COL.TOTAL] = grandTotal;
    row[COL.CHECKIN_TIME] = data.checkinTime || "";
    row[COL.CHECKOUT_TIME] = data.checkoutTime || "";
    row[COL.NO] = bookingNo;
    sheet.appendRow(row);
  } finally { lock.releaseLock(); }

  var bookingId = "SR-" + Utilities.formatDate(new Date(), tz, "yyyyMMdd") + "-" + String(bookingNo).padStart(4, "0");

  // 通知用にフォーマット済み文字列をセット
  var notifData = Object.assign({}, data);
  notifData.roster = rosterSource;
  notifData.rooms = row[COL.ROOMS];

  try {
    sendNotification(notifData, {
      stayFee: stayFee, mealTotal: mealTotal, grandTotal: grandTotal,
      nights: nights, counts: counts, bookingId: bookingId
    });
  } catch(e) { Logger.log("メール送信失敗: " + e.toString()); }

  return {
    success: true, bookingId: bookingId, bookingNo: bookingNo,
    stayFee: stayFee, mealTotal: mealTotal, grandTotal: grandTotal,
    nights: nights, name: data.name, checkin: data.checkin, checkout: data.checkout,
    rooms: row[COL.ROOMS]
  };
}

function getOccupiedRooms(ci, co) {
  var ss = SpreadsheetApp.openByUrl(CONFIG.SS_URL);
  var sheet = ss.getSheetByName("予約申請一覧");
  var data = sheet.getDataRange().getValues();
  var occupied = [], tentative = [];
  var tStart = new Date(ci), tEnd = new Date(co);
  for (var i = 1; i < data.length; i++) {
    var rci = data[i][COL.CHECKIN], rco = data[i][COL.CHECKOUT];
    if (!rci || !rco) continue;
    var rS = new Date(rci), rE = new Date(rco);
    if (isNaN(rS.getTime()) || isNaN(rE.getTime())) continue;
    if (tStart < rE && tEnd > rS && data[i][COL.TANTOU] !== STATUS_REJECTED && data[i][COL.ITO] !== STATUS_REJECTED) {
      var roomsStr = String(data[i][COL.ROOMS] || "");
      var extractedRooms = extractRoomNumbers_(roomsStr);
      var resName = String(data[i][COL.NAME] || "");
      var isTentative = resName.indexOf("管理者押さえ：仮押さえ") === 0;
      var target = isTentative ? tentative : occupied;
      ["202","203","205","206","207","301","302","303","305","306"].forEach(function(n) {
        if (extractedRooms.indexOf(n) !== -1) target.push(n);
      });
    }
  }
  return { occupiedRooms: occupied, tentativeRooms: tentative };
}

function getReservations(password) {
  if (password !== CONFIG.ADMIN_PASSWORD) throw new Error("パスワードが違います");
  var ss = SpreadsheetApp.openByUrl(CONFIG.SS_URL);
  var sheet = ss.getSheetByName("予約申請一覧");
  var tz = ss.getSpreadsheetTimeZone() || 'Asia/Tokyo';
  var data = sheet.getDataRange().getValues();
  var results = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[COL.NAME]) continue;
    results.push({
      rowIndex: i + 1,
      no: row[COL.NO] || (CONFIG.NO_OFFSET + i),
      timestamp: row[COL.DATE] ? Utilities.formatDate(new Date(row[COL.DATE]), tz, 'yyyy/MM/dd HH:mm') : '',
      name: row[COL.NAME],
      phone: row[COL.PHONE] || "",
      email: row[COL.EMAIL] || "",
      checkin: row[COL.CHECKIN] ? new Date(row[COL.CHECKIN]).toISOString().slice(0,10) : "",
      checkout: row[COL.CHECKOUT] ? new Date(row[COL.CHECKOUT]).toISOString().slice(0,10) : "",
      adults: Number(row[COL.ADULTS]) || 0,
      children: Number(row[COL.CHILDREN]) || 0,
      infants: Number(row[COL.INFANTS]) || 0,
      roster: row[COL.ROSTER] || "",
      rooms: row[COL.ROOMS] || "",
      meals: row[COL.MEALS] || "",
      memo: row[COL.MEMO] || "",
      tantou: row[COL.TANTOU] || STATUS_PENDING,
      ito: row[COL.ITO] || STATUS_PENDING,
      dept: row[COL.DEPT] || "",
      nights: Number(row[COL.NIGHTS]) || 0,
      stayFee: Number(row[COL.STAY_FEE]) || 0,
      mealFee: Number(row[COL.MEAL_FEE]) || 0,
      total: Number(row[COL.TOTAL]) || 0
    });
  }
  results.reverse();
  return { reservations: results };
}

// Date型またはその他の値を "HH:mm" 文字列に変換する。Date以外はそのまま文字列化。
function toTimeString_(v, tz) {
  if (!v) return "";
  if (v instanceof Date) return Utilities.formatDate(v, tz, "HH:mm");
  return String(v);
}

function getReservationByNo(no) {
  var ss = SpreadsheetApp.openByUrl(CONFIG.SS_URL);
  var sheet = ss.getSheetByName("予約申請一覧");
  var tz = ss.getSpreadsheetTimeZone() || 'Asia/Tokyo';
  var data = sheet.getDataRange().getValues();
  var noNum = parseInt(no, 10);

  // 1st pass: COL.NO が存在する行のみ実予約Noで検索（優先）
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[COL.NAME]) continue;
    if (!row[COL.NO]) continue;
    if (parseInt(row[COL.NO], 10) === noNum) {
      return {
        no:           row[COL.NO],
        name:         row[COL.NAME],
        phone:        row[COL.PHONE]        || "",
        email:        row[COL.EMAIL]        || "",
        dept:         row[COL.DEPT]         || "",
        checkin:      row[COL.CHECKIN]  ? new Date(row[COL.CHECKIN]).toISOString().slice(0,10)  : "",
        checkout:     row[COL.CHECKOUT] ? new Date(row[COL.CHECKOUT]).toISOString().slice(0,10) : "",
        checkinTime:  toTimeString_(row[COL.CHECKIN_TIME],  tz),
        checkoutTime: toTimeString_(row[COL.CHECKOUT_TIME], tz),
        roster:       row[COL.ROSTER] || "",
        rooms:        row[COL.ROOMS]  || "",
        meals:        row[COL.MEALS]  || "",
        memo:         row[COL.MEMO]   || "",
        stayFee:      Number(row[COL.STAY_FEE])  || 0,
        mealFee:      Number(row[COL.MEAL_FEE])  || 0,
        total:        Number(row[COL.TOTAL])      || 0
      };
    }
  }

  // 2nd pass: COL.NO が空の旧データ行のみ fallbackNo で検索
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[COL.NAME]) continue;
    if (row[COL.NO]) continue;
    var fallbackNo = (CONFIG.NO_OFFSET || 0) + i;
    if (fallbackNo === noNum) {
      return {
        no:           fallbackNo,
        name:         row[COL.NAME],
        phone:        row[COL.PHONE]        || "",
        email:        row[COL.EMAIL]        || "",
        dept:         row[COL.DEPT]         || "",
        checkin:      row[COL.CHECKIN]  ? new Date(row[COL.CHECKIN]).toISOString().slice(0,10)  : "",
        checkout:     row[COL.CHECKOUT] ? new Date(row[COL.CHECKOUT]).toISOString().slice(0,10) : "",
        checkinTime:  toTimeString_(row[COL.CHECKIN_TIME],  tz),
        checkoutTime: toTimeString_(row[COL.CHECKOUT_TIME], tz),
        roster:       row[COL.ROSTER] || "",
        rooms:        row[COL.ROOMS]  || "",
        meals:        row[COL.MEALS]  || "",
        memo:         row[COL.MEMO]   || "",
        stayFee:      Number(row[COL.STAY_FEE])  || 0,
        mealFee:      Number(row[COL.MEAL_FEE])  || 0,
        total:        Number(row[COL.TOTAL])      || 0
      };
    }
  }

  return null;
}

function getMealSummary(password) {
  if (password !== CONFIG.ADMIN_PASSWORD) throw new Error("パスワードが違います");
  var ss = SpreadsheetApp.openByUrl(CONFIG.SS_URL);
  var sheet = ss.getSheetByName("予約申請一覧");
  var data = sheet.getDataRange().getValues();
  var tz = ss.getSpreadsheetTimeZone() || "Asia/Tokyo";
  var days_ja = ["日","月","火","水","木","金","土"];
  var summary = {};

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[COL.NAME] || !row[COL.CHECKIN] || !row[COL.MEALS]) continue;
    if (row[COL.TANTOU] === STATUS_REJECTED || row[COL.ITO] === STATUS_REJECTED) continue;
    var isApproved = row[COL.TANTOU] === STATUS_APPROVED && row[COL.ITO] === STATUS_APPROVED;
    var ci = new Date(row[COL.CHECKIN]);
    if (isNaN(ci.getTime())) continue;

    String(row[COL.MEALS]).split(/\n+/).forEach(function(line) {
      line = line.trim();
      var m = line.match(/(\d+)日目\s+(夕食|朝食)\s+(.+?)\((\d+)\)[x×](\d+)/);
      if (!m) { m = line.match(/(\d+)日目\s+(夕食|朝食)\s+(.+?)[x×](\d+)/); if (!m) return; }
      var dayOff = parseInt(m[1], 10) - 1;
      var kbn = m[2];
      var menu = m[3].replace(/\s*\(\s*\d+\s*\)\s*$/, '').trim();
      var qty = parseInt(m[5] || m[4], 10);
      if (!qty) return;
      var d = new Date(ci); d.setDate(d.getDate() + dayOff);
      var dateKey = Utilities.formatDate(d, tz, "yyyy-MM-dd");
      var dateDisp = (d.getMonth()+1) + '/' + d.getDate() + '(' + days_ja[d.getDay()] + ')';
      var key = dateKey + '|' + kbn + '|' + menu;
      if (!summary[key]) summary[key] = { dateKey: dateKey, date: dateDisp, meal: kbn, menu: menu, qty: 0, breakdownMap: {} };
      summary[key].qty += qty;
      var repKey = String(row[COL.NAME]) + (isApproved ? "" : "*");
      summary[key].breakdownMap[repKey] = (summary[key].breakdownMap[repKey] || 0) + qty;
    });
  }

  var rows = Object.keys(summary).map(function(k) {
    var r = summary[k];
    r.breakdown = Object.keys(r.breakdownMap).map(function(name) { return name + '×' + r.breakdownMap[name]; }).join('、');
    return r;
  });
  rows.sort(function(a, b) {
    if (a.dateKey !== b.dateKey) return a.dateKey < b.dateKey ? -1 : 1;
    if (a.meal !== b.meal) return a.meal === '夕食' ? -1 : 1;
    return a.menu < b.menu ? -1 : (a.menu > b.menu ? 1 : 0);
  });
  return { meals: rows };
}

function updateApproval(rowIndex, no, approver, status, password) {
  if (password !== CONFIG.ADMIN_PASSWORD) throw new Error("パスワードが違います");

  rowIndex = parseInt(rowIndex, 10);
  if (isNaN(rowIndex) || rowIndex < 2) throw new Error("不正な行番号");
  if ([STATUS_PENDING, STATUS_APPROVED, STATUS_REJECTED].indexOf(status) === -1) throw new Error("不正なステータス");
  if (!["tantou", "ito"].includes(approver)) throw new Error("不正な承認者");

  var col = approver === "tantou" ? COL.TANTOU + 1 : COL.ITO + 1;
  var ss = SpreadsheetApp.openByUrl(CONFIG.SS_URL);
  var sheet = ss.getSheetByName("予約申請一覧");

  var actualNo = sheet.getRange(rowIndex, COL.NO + 1).getValue();
  if (String(actualNo) !== String(no)) {
    throw new Error("行がずれています。画面を更新(リロード)してください。");
  }

  sheet.getRange(rowIndex, col).setValue(status);
  return { success: true };
}

function addAdminBlockToSheet(data, password) {
  if (password !== CONFIG.ADMIN_PASSWORD) throw new Error("パスワードが違います");
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var ci = new Date(data.checkin), co = new Date(data.checkout);
    var nights = Math.round((co - ci) / 86400000);
    if (isNaN(ci.getTime()) || isNaN(co.getTime()) || nights <= 0) throw new Error("日付が不正です");

    var ss = SpreadsheetApp.openByUrl(CONFIG.SS_URL);
    var sheet = ss.getSheetByName("予約申請一覧");
    var conflict = checkRoomConflict(data.rooms, data.checkin, data.checkout, sheet);
    if (conflict.length > 0) throw new Error("既に予約済みの部屋があります: " + conflict.join(", "));

    var nextNo = getNextBookingNo_(sheet);
    var row = [];
    row[COL.DATE] = new Date();
    row[COL.NAME] = "管理者押さえ：" + (data.type || "仮押さえ");
    row[COL.PHONE] = "";
    row[COL.EMAIL] = "";
    row[COL.CHECKIN] = data.checkin;
    row[COL.CHECKOUT] = data.checkout;
    row[COL.ADULTS] = 0;
    row[COL.CHILDREN] = 0;
    row[COL.INFANTS] = 0;
    row[COL.ROSTER] = "";
    row[COL.ROOMS] = data.rooms;
    row[COL.MEALS] = "";
    row[COL.MEMO] = data.memo || "";
    row[COL.TANTOU] = STATUS_APPROVED;
    row[COL.ITO] = STATUS_APPROVED;
    row[COL.DEPT] = "管理者";
    row[COL.NIGHTS] = nights;
    row[COL.STAY_FEE] = 0;
    row[COL.MEAL_FEE] = 0;
    row[COL.TOTAL] = 0;
    row[COL.CHECKIN_TIME] = "";
    row[COL.CHECKOUT_TIME] = "";
    row[COL.NO] = nextNo;
    sheet.appendRow(row);
    return { success: true, bookingNo: nextNo };
  } finally { lock.releaseLock(); }
}

function getMailMaster(password) {
  if (password !== CONFIG.ADMIN_PASSWORD) throw new Error("パスワードが違います");
  var ss = SpreadsheetApp.openByUrl(CONFIG.SS_URL);
  var sheet = ss.getSheetByName('メールアドレスマスター');
  if (!sheet) return { rows: [] };
  var data = sheet.getDataRange().getValues();
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    rows.push({ name: data[i][0], email: data[i][1], role: data[i][2] });
  }
  return { rows: rows };
}

function saveMailMaster(rows, password) {
  if (password !== CONFIG.ADMIN_PASSWORD) throw new Error("パスワードが違います");
  var filtered = rows.filter(function(r) { return r.name || r.email || r.role; });
  var ss = SpreadsheetApp.openByUrl(CONFIG.SS_URL);
  var sheet = ss.getSheetByName('メールアドレスマスター');
  if (!sheet) throw new Error('メールアドレスマスターシートがありません');
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 3).clearContent();
  if (filtered.length > 0) {
    var values = filtered.map(function(r) { return [r.name || '', r.email || '', r.role || '']; });
    sheet.getRange(2, 1, values.length, 3).setValues(values);
  }
  return { success: true, saved: filtered.length };
}

function getNextBookingNo_(sheet) {
  var data = sheet.getDataRange().getValues();
  var maxNo = CONFIG.NO_OFFSET;
  for (var i = 1; i < data.length; i++) {
    var no = Number(data[i][COL.NO]);
    if (!isNaN(no) && no > maxNo) maxNo = no;
  }
  return maxNo + 1;
}

// rooms列テキストまたはカンマ区切り文字列から部屋番号の配列を抽出する
function extractRoomNumbers_(roomsText) {
  if (!roomsText) return [];
  var s = String(roomsText).trim();
  // "202,302" 形式（processFormが生成するカンマ区切り）
  if (/^\d+(,\d+)*$/.test(s)) {
    return s.split(',').map(function(n) { return n.trim(); }).filter(Boolean);
  }
  // テキスト形式（新インデントフォーマット・旧形式・管理者押さえ）
  var rooms = [];
  s.split('\n').forEach(function(line) {
    if (/^\s/.test(line)) return; // インデント行（宿泊者行）をスキップ
    var m = line.match(/^(\d+)/);
    if (m) rooms.push(m[1]);
  });
  return rooms;
}

function checkRoomConflict(roomsStr, checkin, checkout, sheet) {
  if (!roomsStr) return [];
  var data = sheet.getDataRange().getValues();
  var tStart = new Date(checkin); tStart.setHours(0,0,0,0);
  var tEnd = new Date(checkout); tEnd.setHours(0,0,0,0);
  var requested = extractRoomNumbers_(roomsStr);
  if (requested.length === 0) return [];
  var conflicts = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[COL.TANTOU] === STATUS_REJECTED || row[COL.ITO] === STATUS_REJECTED) continue;
    var rci = row[COL.CHECKIN], rco = row[COL.CHECKOUT];
    if (!rci || !rco) continue;
    var rS = new Date(rci); rS.setHours(0,0,0,0);
    var rE = new Date(rco); rE.setHours(0,0,0,0);
    if (isNaN(rS) || isNaN(rE)) continue;
    if (tStart < rE && tEnd > rS) {
      var existingRooms = extractRoomNumbers_(String(row[COL.ROOMS] || ""));
      requested.forEach(function(n) {
        if (existingRooms.indexOf(n) !== -1 && conflicts.indexOf(n) === -1) conflicts.push(n);
      });
    }
  }
  return conflicts;
}

function countRoster(source) {
  var c = { adults: 0, children: 0, infants: 0 };
  if (!source || source.length === 0) return c;
  var guests = (source[0] && source[0].guests)
    ? source.reduce(function(acc, r) { return acc.concat(r.guests || []); }, [])
    : source;
  guests.forEach(function(p) {
    if (!p || !p.name) return;
    if (p.kbn === "大人") c.adults++;
    else if (p.kbn === "小人") c.children++;
    else if (p.kbn === "小人未満") c.infants++;
  });
  return c;
}

function calcStayFee(counts, nights) {
  return (counts.adults * PRICES.STAY.adult + counts.children * PRICES.STAY.child + counts.infants * PRICES.STAY.infant) * nights;
}

function calcMealTotal(mealsStr) {
  if (!mealsStr) return 0;
  var total = 0;
  String(mealsStr).split('\n').forEach(function(line) {
    var match = line.match(/\((\d+)\)[x×](\d+)/);
    if (match) total += parseInt(match[1]) * parseInt(match[2]);
  });
  return total;
}

function formatRoster(source) {
  if (!source || source.length === 0) return "";
  var guests = (source[0] && source[0].guests)
    ? source.reduce(function(acc, r) { return acc.concat(r.guests || []); }, [])
    : source;
  return guests.map(function(p, i) {
    var attrs = [];
    if (p.age) attrs.push(p.age + "歳");
    if (p.kbn) attrs.push(p.kbn);
    if (p.gender) attrs.push(p.gender);
    if (p.relation) attrs.push(p.relation);
    if (p.allergy === "あり") attrs.push("アレルギーあり");
    else if (p.allergy === "なし") attrs.push("アレルギーなし");
    else attrs.push("アレルギー未確認");
    var s = (i+1) + ". " + (p.name || "");
    if (attrs.length > 0) s += "(" + attrs.join("・") + ")";
    return s;
  }).join("\n");
}

function formatRooms(roomAssignments) {
  if (!roomAssignments || roomAssignments.length === 0) return "";
  return roomAssignments.map(function(room) {
    var lines = [room.room + " " + (room.roomname || "") + ":"];
    (room.guests || []).forEach(function(g, i) {
      var attrs = [];
      if (g.age) attrs.push(g.age + "歳");
      if (g.kbn) attrs.push(g.kbn);
      if (g.gender) attrs.push(g.gender);
      if (g.relation) attrs.push(g.relation);
      if (g.allergy === "あり") attrs.push("アレルギーあり");
      else if (g.allergy === "なし") attrs.push("アレルギーなし");
      lines.push("  " + (i+1) + ". " + (g.name || "") + "(" + attrs.join("・") + ")");
    });
    return lines.join("\n");
  }).join("\n");
}

function sendNotification(data, fees) {
  var fmt = function(n) { return Number(n).toLocaleString("ja-JP"); };
  var subject = "【白浜荘】予約申請: " + data.name + "様 (" + data.checkin + "〜" + data.checkout + ")";
  var body = [
    "白浜荘 予約申請を受け付けました。",
    "受付番号: " + (fees.bookingId || ""),
    "",
    "■ 申込者",
    "氏名 : " + data.name,
    "所属 : " + (data.dept || ""),
    "電話 : " + (data.phone || ""),
    "メール: " + (data.email || ""),
    "",
    "■ 利用日",
    "チェックイン : " + data.checkin + " (" + (data.checkinTime || "") + ")",
    "チェックアウト: " + data.checkout + " (" + (data.checkoutTime || "") + ")",
    "泊数 : " + fees.nights + "泊",
    "",
    "■ 人数",
    "大人: " + fees.counts.adults + "名 / 小人: " + fees.counts.children + "名 / 小人未満: " + fees.counts.infants + "名",
    "",
    "■ 宿泊者名簿",
    formatRoster(data.roster) || "(なし)",
    "",
    "■ 部屋",
    data.rooms || "(未指定)",
    "",
    "■ 食事",
    data.meals || "(なし)",
    "",
    "■ 料金",
    "宿泊料: " + fmt(fees.stayFee) + " 円",
    "食事代: " + fmt(fees.mealTotal) + " 円",
    "合計  : " + fmt(fees.grandTotal) + " 円",
    "",
    "■ 備考",
    data.memo || "(なし)",
    "",
    "----",
    "スプレッドシート: " + CONFIG.SS_URL
  ].join("\n");

  var toEmails = CONFIG.TANTOU_EMAIL;
  try {
    var ss = SpreadsheetApp.openByUrl(CONFIG.SS_URL);
    var mailSheet = ss.getSheetByName('メールアドレスマスター');
    if (mailSheet) {
      var mailData = mailSheet.getDataRange().getValues();
      var emails = [];
      for (var i = 1; i < mailData.length; i++) {
        var email = String(mailData[i][1] || '').trim();
        var role = String(mailData[i][2] || '').trim();
        if (email && (role === '担当' || role === 'システム管理')) emails.push(email);
      }
      if (emails.length > 0) toEmails = emails.join(',');
    }
  } catch(e) {}

  MailApp.sendEmail({ to: toEmails, subject: subject, body: body });
  if (data.email) {
    MailApp.sendEmail({ to: data.email, subject: "【受付控え】" + subject, body: "下記の内容で予約申請を受け付けました。\n\n" + body });
  }
}

// ─── DEBUG: 一時関数 ── 確認後に削除すること ────────────────────────────────
function debugReservationNo(targetNo) {
  var ss = SpreadsheetApp.openByUrl(CONFIG.SS_URL);
  var sheet = ss.getSheetByName("予約申請一覧");
  var data = sheet.getDataRange().getValues();
  var offset = CONFIG.NO_OFFSET; // 3319

  var logs = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var sheetNo   = row[COL.NO];
    var name      = row[COL.NAME] || "";
    var calcA     = offset + i;       // CONFIG.NO_OFFSET + i
    var calcB     = offset + i + 1;   // CONFIG.NO_OFFSET + i + 1
    var getResNo  = sheetNo || calcA; // getReservations() の no 計算値

    var hit = (
      String(sheetNo) === String(targetNo) ||
      calcA === targetNo ||
      calcB === targetNo ||
      name.indexOf("ニッポー太郎") !== -1
    );
    if (!hit) continue;

    logs.push({
      i:               i,
      "i+1":           i + 1,
      NO_OFFSET:       offset,
      "OFFSET+i":      calcA,
      "OFFSET+i+1":    calcB,
      "row[COL.NO]":   sheetNo,
      "row[COL.NAME]": name,
      checkin:         row[COL.CHECKIN]  ? new Date(row[COL.CHECKIN]).toISOString().slice(0,10)  : "",
      checkout:        row[COL.CHECKOUT] ? new Date(row[COL.CHECKOUT]).toISOString().slice(0,10) : "",
      "getReservations_no": getResNo
    });
  }

  Logger.log("=== debugReservationNo(" + targetNo + ") ===");
  if (logs.length === 0) {
    Logger.log("該当行なし");
  } else {
    logs.forEach(function(entry) { Logger.log(JSON.stringify(entry)); });
  }
}
function _debug3336() { debugReservationNo(3336); }

// getReservationByNo を直接呼び出してログに出す
function _debugGetByNo3336() {
  var result = getReservationByNo(3336);
  Logger.log("=== _debugGetByNo3336 ===");
  Logger.log("result: " + JSON.stringify(result));
  if (!result) {
    // 見つからない場合、各行の COL.NO 型と値をログ
    var ss = SpreadsheetApp.openByUrl(CONFIG.SS_URL);
    var sheet = ss.getSheetByName("予約申請一覧");
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[COL.NAME]) continue;
      var rawNo = row[COL.NO];
      Logger.log("i=" + i + " typeof=" + typeof rawNo + " value=" + rawNo + " parsed=" + parseInt(rawNo, 10));
    }
  }
}
/**
 * 予約No.3336 の取得結果をサーバーサイドで直接確認する
 */
function _debugGet3336() {
  var targetNo = 3336;
  Logger.log("=== _debugGet3336 START (target: " + targetNo + ") ===");

  try {
    var r = getReservationByNo(targetNo);

    if (r === null) {
      Logger.log("結果: null (getReservationByNo 内で一致する行が見つかりませんでした)");
    } else {
      var json = JSON.stringify(r);
      Logger.log("結果: データ取得成功");
      Logger.log("戻り値オブジェクト: " + json);

      for (var key in r) {
        if (r[key] instanceof Date) {
          Logger.log("【警告】プロパティ '" + key + "' は Date型 です。通信エラーの原因になります。");
        }
      }
    }
  } catch (e) {
    Logger.log("【エラー】実行中に例外が発生しました: " + e.toString());
  }

  Logger.log("=== _debugGet3336 END ===");
}
// ────────────────────────────────────────────────────────────────────────────