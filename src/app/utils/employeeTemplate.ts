import * as XLSX from 'xlsx';
import { EmployeeDetails } from '../types/compliance';

export function downloadEmployeeTemplate() {
  const workbook = XLSX.utils.book_new();

  // Instructions Sheet
  const instructionsData = [
    ['Employee Import Template'],
    [''],
    ['INSTRUCTIONS:'],
    ['1. Fill out the "Employees" sheet with your employee information'],
    ['2. Do NOT modify the column headers in the Employees sheet'],
    ['3. Each row represents one employee'],
    ['4. Save the file and upload it back to the system'],
    [''],
    ['COLUMN DESCRIPTIONS:'],
    ['Name - Full name of the employee'],
    ['Role - Job title or position'],
    ['Department - Department or team'],
    ['Review Month - Month for compliance review (e.g., January, February, etc.)'],
    ['Review Year - Year for compliance review (e.g., 2026)'],
    ['Reviewer - Name of the person who will review compliance'],
    [''],
    ['VALID REVIEW MONTHS:'],
    ['January, February, March, April, May, June, July,'],
    ['August, September, October, November, December'],
  ];

  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

  // Template Sheet with headers and example rows
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();

  const templateData = [
    ['Name', 'Role', 'Department', 'Review Month', 'Review Year', 'Reviewer'],
    ['John Doe', 'Senior Employee', 'IT Services', currentMonth, currentYear, 'Jane Smith'],
    ['Sarah Johnson', 'Project Manager', 'Operations', currentMonth, currentYear, 'Michael Brown'],
    ['Robert Lee', 'Business Analyst', 'Finance', currentMonth, currentYear, 'Jane Smith'],
    ['', '', '', currentMonth, currentYear, ''],
  ];

  const templateSheet = XLSX.utils.aoa_to_sheet(templateData);

  // Set column widths
  templateSheet['!cols'] = [
    { wch: 25 }, // Name
    { wch: 25 }, // Role
    { wch: 20 }, // Department
    { wch: 15 }, // Review Month
    { wch: 12 }, // Review Year
    { wch: 25 }, // Reviewer
  ];

  XLSX.utils.book_append_sheet(workbook, templateSheet, 'Employees');

  // Reference Data Sheet
  const referenceData = [
    ['VALID VALUES'],
    [''],
    ['Valid Review Months:'],
    ['January'],
    ['February'],
    ['March'],
    ['April'],
    ['May'],
    ['June'],
    ['July'],
    ['August'],
    ['September'],
    ['October'],
    ['November'],
    ['December'],
  ];

  const referenceSheet = XLSX.utils.aoa_to_sheet(referenceData);
  XLSX.utils.book_append_sheet(workbook, referenceSheet, 'Reference Data');

  // Generate and download
  XLSX.writeFile(workbook, `Employee_Import_Template.xlsx`);
}

export function parseEmployeesFromExcel(file: File): Promise<EmployeeDetails[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // Look for the Employees sheet
        const sheetName = workbook.SheetNames.find(name =>
          name.toLowerCase() === 'employees' ||
          name.toLowerCase() === 'employee list'
        ) || workbook.SheetNames[0];

        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length < 2) {
          reject(new Error('The Excel file is empty or missing data. Please use the template format.'));
          return;
        }

        // Find header row
        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(5, jsonData.length); i++) {
          const row = jsonData[i];
          if (row.some((cell: any) =>
            String(cell).toLowerCase().includes('name') ||
            String(cell).toLowerCase().includes('role')
          )) {
            headerRowIndex = i;
            break;
          }
        }

        const headers = jsonData[headerRowIndex].map((h: any) => String(h).toLowerCase().trim());
        const dataRows = jsonData.slice(headerRowIndex + 1);

        // Map column indices
        const colMap = {
          name: headers.findIndex(h => h.includes('name') && !h.includes('reviewer')),
          role: headers.findIndex(h => h.includes('role')),
          department: headers.findIndex(h => h.includes('department')),
          reviewMonth: headers.findIndex(h => h.includes('month')),
          reviewYear: headers.findIndex(h => h.includes('year')),
          reviewer: headers.findIndex(h => h.includes('reviewer')),
        };

        // Validate required columns exist
        if (colMap.name === -1 || colMap.role === -1 || colMap.department === -1) {
          reject(new Error('Missing required columns. Please ensure "Name", "Role", and "Department" columns exist.'));
          return;
        }

        const employees: EmployeeDetails[] = [];
        const validMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        for (const row of dataRows) {
          // Skip empty rows
          if (!row || row.length === 0 || !row[colMap.name] || !row[colMap.role] || !row[colMap.department]) {
            continue;
          }

          const name = String(row[colMap.name] || '').trim();
          const role = String(row[colMap.role] || '').trim();
          const department = String(row[colMap.department] || '').trim();

          if (!name || !role || !department) {
            continue;
          }

          // Parse review month
          let reviewMonth = new Date().toLocaleString('default', { month: 'long' });
          if (colMap.reviewMonth !== -1 && row[colMap.reviewMonth]) {
            const monthValue = String(row[colMap.reviewMonth]).trim();
            const foundMonth = validMonths.find(m =>
              m.toLowerCase() === monthValue.toLowerCase()
            );
            if (foundMonth) {
              reviewMonth = foundMonth;
            }
          }

          // Parse review year
          let reviewYear = new Date().getFullYear();
          if (colMap.reviewYear !== -1 && row[colMap.reviewYear]) {
            const yearValue = row[colMap.reviewYear];
            if (typeof yearValue === 'number') {
              reviewYear = yearValue;
            } else {
              const parsedYear = parseInt(String(yearValue));
              if (!isNaN(parsedYear) && parsedYear >= 1900 && parsedYear <= 10000) {
                reviewYear = parsedYear;
              }
            }
          }

          const reviewer = colMap.reviewer !== -1 && row[colMap.reviewer]
            ? String(row[colMap.reviewer]).trim()
            : 'Manager';

          employees.push({
            id: `emp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name,
            role,
            department,
            reviewPeriod: `${reviewMonth} ${reviewYear}`,
            reviewer,
            date: new Date().toISOString(),
          });
        }

        if (employees.length === 0) {
          reject(new Error('No valid employee records found in the file. Please check the template format.'));
          return;
        }

        resolve(employees);
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file. Please ensure it is a valid Excel file.'));
    };

    reader.readAsBinaryString(file);
  });
}
