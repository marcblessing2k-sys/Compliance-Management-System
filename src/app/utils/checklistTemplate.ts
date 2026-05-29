import * as XLSX from 'xlsx';
import { ComplianceItem, ComplianceStatus, Priority } from '../types/compliance';

export function downloadChecklistTemplate(employeeName: string) {
  const workbook = XLSX.utils.book_new();

  // Instructions Sheet
  const instructionsData = [
    ['Compliance Checklist Import Template'],
    [''],
    ['INSTRUCTIONS:'],
    ['1. Fill out the "Checklist" sheet with your compliance requirements'],
    ['2. Do NOT modify the column headers in the Checklist sheet'],
    ['3. Each row represents one compliance requirement'],
    ['4. Save the file and upload it back to the system'],
    [''],
    ['COLUMN DESCRIPTIONS:'],
    ['Business Process - Main process category (e.g., Lead Management, Project Management)'],
    ['Category - Sub-category within the business process'],
    ['Requirement - Specific compliance requirement description'],
    ['Priority - Must be one of: High, Medium, Low'],
    ['Status - Must be one of: Compliant, In Progress, Not Started, Non-Compliant, N/A'],
    ['Evidence/Notes - Supporting documentation or notes'],
    ['Responsible - Person responsible (defaults to employee name)'],
    ['Target Date - Deadline in YYYY-MM-DD format'],
    [''],
    ['EXAMPLE BUSINESS PROCESSES:'],
    ['Lead Management, Project Management, Task Management, Timesheet Management,'],
    ['Ticketing and Complaint Handling, External Employee Continuation, Expense Management,'],
    ['Financial Request & Refund Processing, Reporting and Documentation, Data Governance & Audit Compliance'],
  ];

  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

  // Template Sheet with headers and example rows
  const templateData = [
    ['Business Process', 'Category', 'Requirement', 'Priority', 'Status', 'Evidence/Notes', 'Responsible', 'Target Date'],
    ['Lead Management', 'Lead Capture', 'Implement lead capture form on website', 'High', 'In Progress', 'Form created in system', employeeName, getEndOfMonth()],
    ['Lead Management', 'Lead Qualification', 'Define lead scoring criteria', 'Medium', 'Not Started', '', employeeName, getEndOfMonth()],
    ['Project Management', 'Project Planning', 'Create project charter template', 'High', 'Compliant', 'Template approved by management', employeeName, getEndOfMonth()],
    ['', '', '', '', '', '', employeeName, getEndOfMonth()],
  ];

  const templateSheet = XLSX.utils.aoa_to_sheet(templateData);

  // Set column widths
  templateSheet['!cols'] = [
    { wch: 25 }, // Business Process
    { wch: 20 }, // Category
    { wch: 40 }, // Requirement
    { wch: 12 }, // Priority
    { wch: 15 }, // Status
    { wch: 30 }, // Evidence/Notes
    { wch: 20 }, // Responsible
    { wch: 15 }, // Target Date
  ];

  XLSX.utils.book_append_sheet(workbook, templateSheet, 'Checklist');

  // Reference Data Sheet
  const referenceData = [
    ['VALID VALUES'],
    [''],
    ['Priority Options:', '', 'Status Options:'],
    ['High', '', 'Compliant'],
    ['Medium', '', 'In Progress'],
    ['Low', '', 'Not Started'],
    ['', '', 'Non-Compliant'],
    ['', '', 'N/A'],
    [''],
    ['Common Business Processes:'],
    ['Lead Management'],
    ['Project Management'],
    ['Task Management'],
    ['Timesheet Management'],
    ['Ticketing and Complaint Handling'],
    ['External Employee Continuation'],
    ['Expense Management'],
    ['Financial Request & Refund Processing'],
    ['Reporting and Documentation'],
    ['Data Governance & Audit Compliance'],
  ];

  const referenceSheet = XLSX.utils.aoa_to_sheet(referenceData);
  XLSX.utils.book_append_sheet(workbook, referenceSheet, 'Reference Data');

  // Generate and download
  XLSX.writeFile(workbook, `Compliance_Checklist_Template_${employeeName.replace(/\s+/g, '_')}.xlsx`);
}

function getEndOfMonth(): string {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return lastDay.toISOString().split('T')[0];
}

export function parseChecklistFromExcel(file: File, employeeName: string): Promise<ComplianceItem[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // Look for the Checklist sheet
        const sheetName = workbook.SheetNames.find(name =>
          name.toLowerCase() === 'checklist' ||
          name.toLowerCase() === 'compliance checklist'
        ) || workbook.SheetNames[0];

        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length < 2) {
          reject(new Error('The Excel file is empty or missing data. Please use the template format.'));
          return;
        }

        // Find header row (look for "Business Process" or similar)
        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(5, jsonData.length); i++) {
          const row = jsonData[i];
          if (row.some((cell: any) =>
            String(cell).toLowerCase().includes('business') ||
            String(cell).toLowerCase().includes('process')
          )) {
            headerRowIndex = i;
            break;
          }
        }

        const headers = jsonData[headerRowIndex].map((h: any) => String(h).toLowerCase().trim());
        const dataRows = jsonData.slice(headerRowIndex + 1);

        // Map column indices
        const colMap = {
          businessProcess: headers.findIndex(h => h.includes('business') || h.includes('process')),
          category: headers.findIndex(h => h.includes('category')),
          requirement: headers.findIndex(h => h.includes('requirement')),
          priority: headers.findIndex(h => h.includes('priority')),
          status: headers.findIndex(h => h.includes('status')),
          evidence: headers.findIndex(h => h.includes('evidence') || h.includes('notes')),
          responsible: headers.findIndex(h => h.includes('responsible')),
          targetDate: headers.findIndex(h => h.includes('target') || h.includes('date')),
        };

        // Validate required columns exist
        if (colMap.businessProcess === -1 || colMap.requirement === -1) {
          reject(new Error('Missing required columns. Please ensure "Business Process" and "Requirement" columns exist.'));
          return;
        }

        const items: ComplianceItem[] = [];
        const validPriorities: Priority[] = ['High', 'Medium', 'Low'];
        const validStatuses: ComplianceStatus[] = ['Compliant', 'In Progress', 'Not Started', 'Non-Compliant', 'N/A'];

        for (const row of dataRows) {
          // Skip empty rows
          if (!row || row.length === 0 || !row[colMap.businessProcess] || !row[colMap.requirement]) {
            continue;
          }

          const businessProcess = String(row[colMap.businessProcess] || '').trim();
          const requirement = String(row[colMap.requirement] || '').trim();

          if (!businessProcess || !requirement) {
            continue;
          }

          // Parse and validate priority
          let priority: Priority = 'Medium';
          if (colMap.priority !== -1 && row[colMap.priority]) {
            const priorityValue = String(row[colMap.priority]).trim();
            const foundPriority = validPriorities.find(p =>
              p.toLowerCase() === priorityValue.toLowerCase()
            );
            if (foundPriority) {
              priority = foundPriority;
            }
          }

          // Parse and validate status
          let status: ComplianceStatus = 'Not Started';
          if (colMap.status !== -1 && row[colMap.status]) {
            const statusValue = String(row[colMap.status]).trim();
            const foundStatus = validStatuses.find(s =>
              s.toLowerCase() === statusValue.toLowerCase()
            );
            if (foundStatus) {
              status = foundStatus;
            }
          }

          // Parse other fields
          const category = colMap.category !== -1 ? String(row[colMap.category] || '').trim() : 'General';
          const evidence = colMap.evidence !== -1 ? String(row[colMap.evidence] || '').trim() : '';
          const responsible = colMap.responsible !== -1 && row[colMap.responsible]
            ? String(row[colMap.responsible]).trim()
            : employeeName;

          // Parse target date
          let targetDate = getEndOfMonth();
          if (colMap.targetDate !== -1 && row[colMap.targetDate]) {
            const dateValue = row[colMap.targetDate];
            if (dateValue instanceof Date) {
              targetDate = dateValue.toISOString().split('T')[0];
            } else if (typeof dateValue === 'number') {
              // Excel date serial number
              const date = XLSX.SSF.parse_date_code(dateValue);
              targetDate = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
            } else {
              const dateStr = String(dateValue).trim();
              if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                targetDate = dateStr;
              }
            }
          }

          items.push({
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            businessProcess,
            category,
            requirement,
            priority,
            status,
            evidence,
            responsible,
            targetDate,
          });
        }

        if (items.length === 0) {
          reject(new Error('No valid checklist items found in the file. Please check the template format.'));
          return;
        }

        resolve(items);
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
