/**
 * ============================================================================
 * GEMINI ACADEMY - BACKEND & DATABASE MANAGER (APPS SCRIPT)
 * ============================================================================
 */

function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('Gemini Academy - Enterprise Portal')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ============================================================================
// HỆ THỐNG KẾT NỐI DATABASE (DYNAMIC JSON MAPPER)
// ============================================================================
function getSheetDataAsObjects_(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  var data = sheet.getDataRange().getDisplayValues(); 
  if (data.length <= 1) return []; 
  
  var headers = data[0].map(function(h) { return h.toString().trim().toLowerCase(); });
  var rows = [];
  
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    var hasData = false;
    for (var j = 0; j < headers.length; j++) {
      if (headers[j]) { 
        obj[headers[j]] = data[i][j];
        if (data[i][j] !== "") hasData = true;
      }
    }
    if (hasData && obj['stt'] !== "") {
      rows.push(obj);
    }
  }
  return rows;
}

// ============================================================================
// MODULE API CUNG CẤP DỮ LIỆU CHO PORTAL
// ============================================================================

function verifyLogin(username, password, roleType) {
  try {
    username = username.toString().trim();
    password = password.toString().trim();

    if (roleType === 'admin') {
      var staffList = getSheetDataAsObjects_("NHAN_VIEN");
      var user = staffList.find(function(nv) { return nv['username'] === username && nv['password'] === password; });
      
      if (user) {
        if (user['trạng thái'] !== 'Đang Làm Việc') return { success: false, message: "Tài khoản đã bị khóa!" };
        return {
          success: true,
          userData: {
            id: user['mã nhân viên'],
            name: user['họ và tên'],
            role: user['mã chức vụ'], 
            permissions: user['quyền truy cập'] || 'all', 
            avatarText: user['họ và tên'].split(' ').pop(), 
            type: 'admin'
          }
        };
      }
    } else if (roleType === 'parent') {
      var studentList = getSheetDataAsObjects_("HOC_VIEN");
      var parent = studentList.find(function(hs) { return hs['username portal'] === username && hs['password portal'] === password; });
      
      if (parent) {
        if (parent['trạng thái'] === 'Đã Nghỉ') return { success: false, message: "Tài khoản học viên đã ngưng hoạt động." };
        return {
          success: true,
          userData: {
            id: parent['mã học viên'],
            studentName: parent['họ và tên'],
            name: "Phụ Huynh em " + parent['họ và tên'].split(' ').pop(),
            role: "Phụ Huynh",
            permissions: "portal-only",
            avatarText: parent['họ và tên'].split(' ').pop(),
            type: 'parent'
          }
        };
      }
    }
    return { success: false, message: "Sai tên đăng nhập hoặc mật khẩu!" };
  } catch (error) {
    return { success: false, message: "Lỗi máy chủ: " + error.message };
  }
}

function getDashboardStats() {
  try {
    var students = getSheetDataAsObjects_("HOC_VIEN");
    var activeStudents = students.filter(function(s) { return s['trạng thái'] === 'Đang Học'; }).length;
    var classes = getSheetDataAsObjects_("DANH_MUC_LOP");
    
    return {
      success: true,
      data: {
        totalStudents: activeStudents,
        totalClasses: classes.length > 0 ? classes.length : 12
      }
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function getClassSchedules() {
  try {
    return { success: true, data: getSheetDataAsObjects_("LICH_CA_HOC") };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function getStudentList() {
  try {
    return { success: true, data: getSheetDataAsObjects_("HOC_VIEN") };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function getFinanceData() {
  try {
    var invoices = getSheetDataAsObjects_("HOA_DON");
    var expenses = getSheetDataAsObjects_("KHOAN_CHI");
    return {
      success: true,
      data: {
        invoices: invoices,
        expenses: expenses
      }
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}