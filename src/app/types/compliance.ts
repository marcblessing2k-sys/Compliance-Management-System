export type ComplianceStatus = 'Compliant' | 'In Progress' | 'Not Started' | 'Non-Compliant' | 'N/A';
export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ComplianceItem {
  id: string;
  businessProcess: string;
  category: string;
  requirement: string;
  priority: Priority;
  status: ComplianceStatus;
  evidence: string;
  responsible: string;
  targetDate: string;
}

export interface EmployeeDetails {
  id: string;
  name: string;
  role: string;
  department: string;
  reviewPeriod: string;
  reviewer: string;
  date: string;
}

export interface ComplianceRecord {
  employee: EmployeeDetails;
  checklist: ComplianceItem[];
  lastUpdated: string;
}

export interface MonthlyArchive {
  id: string;
  month: string;
  year: number;
  records: ComplianceRecord[];
  archivedDate: string;
}
