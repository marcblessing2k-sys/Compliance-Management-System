import { ComplianceItem } from '../types/compliance';

export const businessProcesses = [
  'Lead Management',
  'Project Management',
  'Task Management',
  'Timesheet Management',
  'Ticketing and Complaint Handling',
  'External Employee Continuation',
  'Expense Management',
  'Financial Request & Refund Processing',
  'Reporting and Documentation',
  'Data Governance & Audit Compliance'
];

export const categories = [
  'Documentation',
  'Training',
  'Systems Access',
  'Policies',
  'Performance',
  'Compliance'
];

export const categoryRequirements: Record<string, { requirement: string; priority: 'HIGH' | 'MEDIUM' | 'LOW' }[]> = {
  Documentation: [
    { requirement: 'Process documentation completed and approved', priority: 'HIGH' },
    { requirement: 'Standard operating procedures (SOPs) updated', priority: 'MEDIUM' },
    { requirement: 'Templates and forms properly filed', priority: 'MEDIUM' }
  ],
  Training: [
    { requirement: 'Process-specific training completed', priority: 'HIGH' },
    { requirement: 'System training and certification obtained', priority: 'HIGH' },
    { requirement: 'Refresher training scheduled', priority: 'LOW' }
  ],
  'Systems Access': [
    { requirement: 'System access permissions configured', priority: 'HIGH' },
    { requirement: 'Integration points tested and verified', priority: 'HIGH' },
    { requirement: 'Backup and recovery procedures in place', priority: 'MEDIUM' }
  ],
  Policies: [
    { requirement: 'Relevant policies acknowledged and signed', priority: 'HIGH' },
    { requirement: 'Escalation procedures documented', priority: 'MEDIUM' },
    { requirement: 'Quality standards defined and approved', priority: 'MEDIUM' }
  ],
  Performance: [
    { requirement: 'KPIs and metrics defined', priority: 'HIGH' },
    { requirement: 'Performance monitoring dashboard configured', priority: 'MEDIUM' },
    { requirement: 'Review schedule established', priority: 'LOW' }
  ],
  Compliance: [
    { requirement: 'Regulatory requirements verified', priority: 'HIGH' },
    { requirement: 'Audit trail mechanisms implemented', priority: 'HIGH' },
    { requirement: 'Compliance checks scheduled', priority: 'MEDIUM' }
  ]
};

export function generateDefaultChecklistItems(): Omit<ComplianceItem, 'id' | 'status' | 'evidence' | 'responsible' | 'targetDate'>[] {
  const items: Omit<ComplianceItem, 'id' | 'status' | 'evidence' | 'responsible' | 'targetDate'>[] = [];

  businessProcesses.forEach(businessProcess => {
    categories.forEach(category => {
      categoryRequirements[category].forEach(req => {
        items.push({
          businessProcess,
          category,
          requirement: req.requirement,
          priority: req.priority
        });
      });
    });
  });

  return items;
}

export const defaultChecklistItems = generateDefaultChecklistItems();

export function getEndOfMonth(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  const lastDay = new Date(year, month + 1, 0);
  return lastDay.toISOString().split('T')[0];
}

export function createEmptyChecklist(employeeName?: string, currentDate?: Date): ComplianceItem[] {
  const date = currentDate || new Date();
  const endOfMonth = getEndOfMonth(date);

  return defaultChecklistItems.map((item, index) => ({
    ...item,
    id: `item-${index + 1}`,
    status: 'Not Started' as const,
    evidence: '',
    responsible: employeeName || '',
    targetDate: endOfMonth
  }));
}
