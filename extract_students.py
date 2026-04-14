import openpyxl
import json

file_path = r"C:\Users\iamra\Downloads\Placement_Patent_Competetion Details (1).xlsx"

def extract_data():
    wb = openpyxl.load_workbook(file_path, data_only=True)
    sheet = wb.active
    
    students = []
    # Skip header row
    for row in sheet.iter_rows(min_row=2, values_only=True):
        if not row[1]: continue # Skip empty rows
        
        # Mapping based on observation:
        # Index 1: Name
        # Index 2: Reg No
        # Index 3: Section
        # Index 4: CGPA
        # Index 5: Arrears (Yes/No)
        # Index 6: Certs
        # Index 7: Competitions
        # Index 8: Patents
        
        student = {
            "id": str(row[2]),
            "name": str(row[1]),
            "dept": "CSE", # Default for this batch
            "cgpa": round(float(row[4] or 0), 2),
            "total_backlogs": 1 if str(row[5]).lower() == 'yes' else 0,
            "active_backlogs": 1 if str(row[5]).lower() == 'yes' else 0,
            "skills": "Python, Java, DSA", # Default placeholder
            "hackathons": int(row[7] or 0),
            "certifications": int(row[6] or 0),
            "resume_link": ""
        }
        students.append(student)
    
    return students

if __name__ == "__main__":
    students = extract_data()
    print(json.dumps(students))
