import json

def generate_gas():
    try:
        with open(r'd:\Hackverse\final_data.json', 'r', encoding='utf-16') as f:
            students = json.load(f)
    except:
        with open(r'd:\Hackverse\final_data.json', 'r', encoding='utf-8') as f:
            students = json.load(f)
    
    gas_start = """/**
 * SMART PLACEMENT OS - BACKEND API (v2.0)
 * Optimized for Section D Data
 */

function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (action === 'getStudents') {
    return createResponse(getStudents(ss));
  } else if (action === 'getCompanies') {
    return createResponse(getCompanies(ss));
  }
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  sheets.forEach(s => { if (s.getName() !== 'Sheet1') ss.deleteSheet(s); });
  
  createStudentsSheet(ss);
  createCompaniesSheet(ss);
}

function getStudents(ss) {
  const sheet = ss.getSheetByName('Students') || createStudentsSheet(ss);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  return values.slice(1).map(row => {
    let student = {};
    headers.forEach((header, i) => { 
      let val = row[i];
      if (header === 'id') val = String(val).replace(/\\.0$/, '');
      student[header] = val; 
    });
    if (student.skills && typeof student.skills === 'string') {
      student.skills = student.skills.split(',').map(s => s.trim());
    }
    return student;
  });
}

function getCompanies(ss) {
  const sheet = ss.getSheetByName('Companies') || createCompaniesSheet(ss);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  return values.slice(1).map(row => {
    let company = {};
    headers.forEach((header, i) => { company[header] = row[i]; });
    if (company.required_skills && typeof company.required_skills === 'string') {
      company.required_skills = company.required_skills.split(',').map(s => s.trim());
    }
    return company;
  });
}

function createStudentsSheet(ss) {
  const sheet = ss.insertSheet('Students');
  sheet.getRange("A:A").setNumberFormat("@");
  sheet.appendRow(['id', 'name', 'dept', 'cgpa', 'total_backlogs', 'active_backlogs', 'skills', 'hackathons', 'certifications', 'resume_link', 'githubLink', 'domain']);
  const data = [
"""

    gas_end = """
  ];
  data.forEach(row => sheet.appendRow(row));
  return sheet;
}

function createCompaniesSheet(ss) {
  const sheet = ss.insertSheet('Companies');
  sheet.appendRow(['id', 'name', 'required_skills', 'priority_skills', 'min_cgpa', 'allowed_backlogs']);
  const data = [
    ["C001", "Google India", "Python, Java, DSA", "DSA, System Design", 7.5, 0],
    ["C002", "Razorpay", "Node, SQL, Go", "Node", 8.0, 1],
    ["C003", "Microsoft", "C#, Azure, SQL", "Cloud Architecture", 8.5, 0],
    ["C004", "TCS", "Java, C++, SQL", "Java", 6.0, 2],
    ["C005", "Zoho", "C, Web Development", "Problem Solving", 7.0, 0]
  ];
  data.forEach(row => sheet.appendRow(row));
  return sheet;
}
"""

    with open(r'd:\Hackverse\APPS_SCRIPT_FINAL.txt', 'w') as f:
        f.write(gas_start)
        for s in students:
            row = [
                s['id'], s['name'], s['dept'], s['cgpa'], 
                s['total_backlogs'], s['active_backlogs'], 
                ", ".join(s['skills']), s['hackathons'], 
                s['certifications'], s['resume_link'], 
                s['githubLink'], s['domain']
            ]
            f.write(f"    {json.dumps(row)},\n")
        f.write(gas_end)

if __name__ == "__main__":
    generate_gas()
