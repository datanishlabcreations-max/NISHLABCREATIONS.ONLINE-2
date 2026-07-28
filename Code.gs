// ============================================================
//  NISHLAB PERSONAL TASK MANAGER — Code.gs
//  Roles: Trainer | Content Dev | Website Dev | Software Dev
//         Course Creation | Schedule | Sales | Payments | Notifications | Inquiries
// ============================================================

const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const SHEETS = {
  TASKS:         "Tasks",
  SCHEDULE:      "Schedule",
  SALES:         "Sales",
  PAYMENTS:      "Payments",
  INQUIRIES:     "Inquiries",
  NOTIFICATIONS: "Notifications",
  COURSES:       "Courses"
};

// ── ENTRY POINTS ──────────────────────────────────────────────
function doGet(e) {
  return HtmlService
    .createHtmlOutputFromFile("index")
    .setTitle("NISHLAB Task Manager")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ── SHEET BOOTSTRAP ───────────────────────────────────────────
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configs = {
    Tasks:         ["ID","Title","Role","Priority","Status","DueDate","Notes","CreatedAt"],
    Schedule:      ["ID","Title","Date","Time","Duration","Type","Location","Notes","CreatedAt"],
    Sales:         ["ID","LeadName","Phone","Email","Course","Stage","FollowUpDate","Notes","CreatedAt"],
    Payments:      ["ID","StudentName","Course","Amount","Mode","Status","Date","Reference","Notes"],
    Inquiries:     ["ID","Name","Phone","Email","Course","Source","Status","Response","CreatedAt"],
    Notifications: ["ID","Title","Message","Type","Scheduled","Status","CreatedAt"],
    Courses:       ["ID","Title","Category","Duration","Price","Status","Students","Notes"]
  };
  for (const [name, headers] of Object.entries(configs)) {
    let sh = ss.getSheetByName(name);
    if (!sh) {
      sh = ss.insertSheet(name);
      sh.appendRow(headers);
      sh.getRange(1, 1, 1, headers.length).setBackground("#1a1a2e").setFontColor("#d4af37").setFontWeight("bold");
      sh.setFrozenRows(1);
    }
  }
  return { success: true, message: "All sheets ready!" };
}

// ── UTILS ─────────────────────────────────────────────────────
function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name);
}

function genID(prefix) {
  return prefix + "-" + Date.now().toString(36).toUpperCase();
}

function sheetToObjects(sh) {
  const data = sh.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] instanceof Date ? Utilities.formatDate(row[i], Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm") : row[i]; });
    return obj;
  });
}

// ── DASHBOARD STATS ───────────────────────────────────────────
function getDashboardStats() {
  try {
    setupSheets();
    const tasks     = sheetToObjects(getSheet("Tasks"));
    const sales     = sheetToObjects(getSheet("Sales"));
    const payments  = sheetToObjects(getSheet("Payments"));
    const inquiries = sheetToObjects(getSheet("Inquiries"));
    const schedule  = sheetToObjects(getSheet("Schedule"));

    const today = new Date();
    const todayStr = Utilities.formatDate(today, Session.getScriptTimeZone(), "yyyy-MM-dd");

    return {
      tasks: {
        total:    tasks.length,
        pending:  tasks.filter(t => t.Status === "Pending").length,
        inprog:   tasks.filter(t => t.Status === "In Progress").length,
        done:     tasks.filter(t => t.Status === "Done").length,
        overdue:  tasks.filter(t => t.Status !== "Done" && t.DueDate && t.DueDate < todayStr).length
      },
      sales: {
        total:   sales.length,
        hot:     sales.filter(s => s.Stage === "Hot").length,
        converted: sales.filter(s => s.Stage === "Converted").length,
        followup: sales.filter(s => s.FollowUpDate && s.FollowUpDate.startsWith(todayStr)).length
      },
      payments: {
        total:    payments.length,
        received: payments.filter(p => p.Status === "Received").length,
        pending:  payments.filter(p => p.Status === "Pending").length,
        revenue:  payments.filter(p => p.Status === "Received").reduce((a, p) => a + (Number(p.Amount) || 0), 0)
      },
      inquiries: {
        total: inquiries.length,
        new:   inquiries.filter(i => i.Status === "New").length,
        responded: inquiries.filter(i => i.Status === "Responded").length
      },
      schedule: {
        today: schedule.filter(s => s.Date && s.Date.startsWith(todayStr)).length,
        upcoming: schedule.filter(s => s.Date && s.Date > todayStr).length
      }
    };
  } catch(e) {
    return { error: e.message };
  }
}

// ── TASKS CRUD ────────────────────────────────────────────────
function getTasks(filters) {
  let tasks = sheetToObjects(getSheet("Tasks"));
  if (filters) {
    if (filters.role   && filters.role   !== "All") tasks = tasks.filter(t => t.Role   === filters.role);
    if (filters.status && filters.status !== "All") tasks = tasks.filter(t => t.Status === filters.status);
    if (filters.priority && filters.priority !== "All") tasks = tasks.filter(t => t.Priority === filters.priority);
  }
  return tasks.reverse();
}

function addTask(data) {
  const sh = getSheet("Tasks");
  const id = genID("TSK");
  const now = new Date();
  sh.appendRow([id, data.title, data.role, data.priority, data.status || "Pending", data.dueDate || "", data.notes || "", Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm")]);
  return { success: true, id };
}

function updateTaskStatus(id, status) {
  const sh = getSheet("Tasks");
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sh.getRange(i + 1, 5).setValue(status);
      return { success: true };
    }
  }
  return { success: false, message: "Task not found" };
}

function deleteTask(id) {
  const sh = getSheet("Tasks");
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) { sh.deleteRow(i + 1); return { success: true }; }
  }
  return { success: false };
}

// ── SCHEDULE CRUD ─────────────────────────────────────────────
function getSchedule() {
  return sheetToObjects(getSheet("Schedule")).reverse();
}

function addScheduleItem(data) {
  const sh = getSheet("Schedule");
  const id = genID("SCH");
  const now = new Date();
  sh.appendRow([id, data.title, data.date, data.time, data.duration || "", data.type || "Class", data.location || "", data.notes || "", Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm")]);
  return { success: true, id };
}

function deleteScheduleItem(id) {
  const sh = getSheet("Schedule");
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) { sh.deleteRow(i + 1); return { success: true }; }
  }
  return { success: false };
}

// ── SALES CRUD ────────────────────────────────────────────────
function getSales() {
  return sheetToObjects(getSheet("Sales")).reverse();
}

function addSalesLead(data) {
  const sh = getSheet("Sales");
  const id = genID("SLS");
  const now = new Date();
  sh.appendRow([id, data.name, data.phone, data.email || "", data.course || "", data.stage || "New", data.followUpDate || "", data.notes || "", Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm")]);
  return { success: true, id };
}

function updateSalesStage(id, stage) {
  const sh = getSheet("Sales");
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) { sh.getRange(i + 1, 6).setValue(stage); return { success: true }; }
  }
  return { success: false };
}

// ── PAYMENTS CRUD ─────────────────────────────────────────────
function getPayments() {
  return sheetToObjects(getSheet("Payments")).reverse();
}

function addPayment(data) {
  const sh = getSheet("Payments");
  const id = genID("PAY");
  sh.appendRow([id, data.studentName, data.course, data.amount, data.mode || "UPI", data.status || "Received", data.date || "", data.reference || "", data.notes || ""]);
  return { success: true, id };
}

// ── INQUIRIES CRUD ────────────────────────────────────────────
function getInquiries() {
  return sheetToObjects(getSheet("Inquiries")).reverse();
}

function addInquiry(data) {
  const sh = getSheet("Inquiries");
  const id = genID("INQ");
  const now = new Date();
  sh.appendRow([id, data.name, data.phone, data.email || "", data.course || "", data.source || "Direct", data.status || "New", data.response || "", Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm")]);
  return { success: true, id };
}

function updateInquiryStatus(id, status, response) {
  const sh = getSheet("Inquiries");
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sh.getRange(i + 1, 7).setValue(status);
      if (response) sh.getRange(i + 1, 8).setValue(response);
      return { success: true };
    }
  }
  return { success: false };
}

// ── NOTIFICATIONS ─────────────────────────────────────────────
function getNotifications() {
  return sheetToObjects(getSheet("Notifications")).reverse();
}

function addNotification(data) {
  const sh = getSheet("Notifications");
  const id = genID("NOT");
  const now = new Date();
  sh.appendRow([id, data.title, data.message, data.type || "Info", data.scheduled || "", "Active", Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm")]);
  return { success: true, id };
}

function deleteNotification(id) {
  const sh = getSheet("Notifications");
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) { sh.deleteRow(i + 1); return { success: true }; }
  }
  return { success: false };
}

// ── COURSES ───────────────────────────────────────────────────
function getCourses() {
  return sheetToObjects(getSheet("Courses")).reverse();
}

function addCourse(data) {
  const sh = getSheet("Courses");
  const id = genID("CRS");
  sh.appendRow([id, data.title, data.category, data.duration, data.price, data.status || "Active", 0, data.notes || ""]);
  return { success: true, id };
}
