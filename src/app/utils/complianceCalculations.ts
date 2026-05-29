import { ComplianceItem, ComplianceStatus } from '../types/compliance';

export function calculateComplianceRate(items: ComplianceItem[]): number {
  const applicableItems = items.filter(item => item.status !== 'N/A');
  if (applicableItems.length === 0) return 100;

  const compliantItems = applicableItems.filter(item => item.status === 'Compliant');
  return Math.round((compliantItems.length / applicableItems.length) * 100);
}

export function calculateNonComplianceRate(items: ComplianceItem[]): number {
  const complianceRate = calculateComplianceRate(items);
  // If 100% compliant, non-compliance rate should be 0%
  return complianceRate === 100 ? 0 : 100 - complianceRate;
}

export function getComplianceByCategory(items: ComplianceItem[]): Record<string, { total: number; compliant: number; rate: number }> {
  const categories: Record<string, { total: number; compliant: number; rate: number }> = {};

  items.forEach(item => {
    if (item.status === 'N/A') return;

    if (!categories[item.category]) {
      categories[item.category] = { total: 0, compliant: 0, rate: 0 };
    }

    categories[item.category].total++;
    if (item.status === 'Compliant') {
      categories[item.category].compliant++;
    }
  });

  Object.keys(categories).forEach(category => {
    const { total, compliant } = categories[category];
    categories[category].rate = total > 0 ? Math.round((compliant / total) * 100) : 0;
  });

  return categories;
}

export function getComplianceByBusinessProcess(items: ComplianceItem[]): Record<string, { total: number; compliant: number; rate: number }> {
  const processes: Record<string, { total: number; compliant: number; rate: number }> = {};

  items.forEach(item => {
    if (item.status === 'N/A') return;

    if (!processes[item.businessProcess]) {
      processes[item.businessProcess] = { total: 0, compliant: 0, rate: 0 };
    }

    processes[item.businessProcess].total++;
    if (item.status === 'Compliant') {
      processes[item.businessProcess].compliant++;
    }
  });

  Object.keys(processes).forEach(process => {
    const { total, compliant } = processes[process];
    processes[process].rate = total > 0 ? Math.round((compliant / total) * 100) : 0;
  });

  return processes;
}

export function getStatusCounts(items: ComplianceItem[]): Record<ComplianceStatus, number> {
  const counts: Record<ComplianceStatus, number> = {
    'Compliant': 0,
    'In Progress': 0,
    'Not Started': 0,
    'Non-Compliant': 0,
    'N/A': 0
  };

  items.forEach(item => {
    counts[item.status]++;
  });

  return counts;
}

export function getHighPriorityIssues(items: ComplianceItem[]): ComplianceItem[] {
  return items.filter(
    item => item.priority === 'HIGH' && (item.status === 'Non-Compliant' || item.status === 'Not Started')
  );
}

export function getRatingLabel(rate: number): { label: string; color: string } {
  if (rate >= 90) return { label: 'Excellent', color: 'text-green-600' };
  if (rate >= 75) return { label: 'Good', color: 'text-blue-600' };
  if (rate >= 60) return { label: 'Fair', color: 'text-yellow-600' };
  return { label: 'Needs Improvement', color: 'text-red-600' };
}
