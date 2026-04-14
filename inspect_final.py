import openpyxl
import json

file_path = r"C:\Users\iamra\Downloads\final.xlsx"

try:
    wb = openpyxl.load_workbook(file_path, data_only=True)
    sheet = wb.active
    
    data = []
    # Read first 10 rows to see headers and some data
    for row in sheet.iter_rows(max_row=10, values_only=True):
        data.append(row)
    
    print(json.dumps(data, indent=2))
except Exception as e:
    print(f"Error: {e}")
