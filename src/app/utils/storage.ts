import { ComplianceItem, EmployeeDetails, ComplianceRecord, MonthlyArchive } from '../types/compliance';
import { getEndOfMonth, createEmptyChecklist } from '../data/checklistTemplate';
import { requireSupabase } from '../../lib/supabase';

export { createEmptyChecklist, getEndOfMonth };

type DbEmployee = {
  id: string;
  business_unit: string;
  name: string;
  role: string;
  department: string;
  review_period: string;
  reviewer: string;
  review_date: string;
  updated_at: string;
};

type DbComplianceItem = {
  id: string;
  employee_id: string;
  business_process: string;
  category: string;
  requirement: string;
  priority: string;
  status: string;
  evidence: string;
  responsible: string;
  target_date: string | null;
  sort_order: number;
  updated_at: string;
};

function mapEmployee(row: DbEmployee): EmployeeDetails {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    department: row.department,
    reviewPeriod: row.review_period,
    reviewer: row.reviewer,
    date: row.review_date
  };
}

function mapComplianceItem(row: DbComplianceItem): ComplianceItem {
  return {
    id: row.id,
    businessProcess: row.business_process,
    category: row.category,
    requirement: row.requirement,
    priority: row.priority as ComplianceItem['priority'],
    status: row.status as ComplianceItem['status'],
    evidence: row.evidence,
    responsible: row.responsible,
    targetDate: row.target_date ?? ''
  };
}

function recordFromRows(employee: DbEmployee, items: DbComplianceItem[]): ComplianceRecord {
  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);
  const lastUpdated = sorted.reduce(
    (latest, item) => (item.updated_at > latest ? item.updated_at : latest),
    employee.updated_at
  );
  return {
    employee: mapEmployee(employee),
    checklist: sorted.map(mapComplianceItem),
    lastUpdated
  };
}

function getClient() {
  return requireSupabase();
}

async function assertEmployeeInBusinessUnit(employeeId: string, businessUnit: string): Promise<void> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('employees')
    .select('business_unit')
    .eq('id', employeeId)
    .maybeSingle();

  if (error) throw error;
  if (data && data.business_unit !== businessUnit) {
    throw new Error('This employee belongs to a different business unit and cannot be modified here.');
  }
}

async function assertArchiveInBusinessUnit(archiveId: string, businessUnit: string): Promise<void> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('monthly_archives')
    .select('business_unit')
    .eq('id', archiveId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return;
  if (data.business_unit !== businessUnit) {
    throw new Error('This archive belongs to a different business unit.');
  }
}

export async function loadComplianceRecords(businessUnit: string): Promise<ComplianceRecord[]> {
  const supabase = getClient();

  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('*')
    .eq('business_unit', businessUnit)
    .order('name');

  if (empError) throw empError;
  if (!employees?.length) return [];

  const employeeIds = employees.map(e => e.id);
  const { data: items, error: itemsError } = await supabase
    .from('compliance_items')
    .select('*')
    .in('employee_id', employeeIds);

  if (itemsError) throw itemsError;

  return employees.map(emp =>
    recordFromRows(
      emp as DbEmployee,
      (items ?? []).filter(i => i.employee_id === emp.id) as DbComplianceItem[]
    )
  );
}

export async function saveComplianceRecord(
  record: ComplianceRecord,
  businessUnit: string
): Promise<void> {
  const supabase = getClient();
  await assertEmployeeInBusinessUnit(record.employee.id, businessUnit);

  const { error: empError } = await supabase.from('employees').upsert({
    id: record.employee.id,
    business_unit: businessUnit,
    name: record.employee.name,
    role: record.employee.role,
    department: record.employee.department,
    review_period: record.employee.reviewPeriod,
    reviewer: record.employee.reviewer,
    review_date: record.employee.date,
    updated_at: new Date().toISOString()
  });

  if (empError) throw empError;

  await supabase.from('compliance_items').delete().eq('employee_id', record.employee.id);

  const rows = record.checklist.map((item, index) => ({
    employee_id: record.employee.id,
    business_process: item.businessProcess,
    category: item.category,
    requirement: item.requirement,
    priority: item.priority,
    status: item.status,
    evidence: item.evidence,
    responsible: item.responsible,
    target_date: item.targetDate || null,
    sort_order: index,
    updated_at: new Date().toISOString()
  }));

  const { data: inserted, error: itemsError } = await supabase
    .from('compliance_items')
    .insert(rows)
    .select();

  if (itemsError) throw itemsError;

  record.checklist = (inserted ?? []).map(mapComplianceItem);
}

export async function saveComplianceRecords(
  records: ComplianceRecord[],
  businessUnit: string
): Promise<void> {
  for (const record of records) {
    await saveComplianceRecord(record, businessUnit);
  }
}

export async function createEmployeeRecord(
  employee: EmployeeDetails,
  businessUnit: string
): Promise<ComplianceRecord> {
  const supabase = getClient();
  const checklist = createEmptyChecklist(employee.name);

  const { data: emp, error: empError } = await supabase
    .from('employees')
    .insert({
      business_unit: businessUnit,
      name: employee.name,
      role: employee.role,
      department: employee.department,
      review_period: employee.reviewPeriod,
      reviewer: employee.reviewer,
      review_date: employee.date
    })
    .select()
    .single();

  if (empError) throw empError;

  const itemRows = checklist.map((item, index) => ({
    employee_id: emp.id,
    business_process: item.businessProcess,
    category: item.category,
    requirement: item.requirement,
    priority: item.priority,
    status: item.status,
    evidence: item.evidence,
    responsible: item.responsible,
    target_date: item.targetDate || null,
    sort_order: index
  }));

  const { data: items, error: itemsError } = await supabase
    .from('compliance_items')
    .insert(itemRows)
    .select();

  if (itemsError) throw itemsError;

  return recordFromRows(emp as DbEmployee, (items ?? []) as DbComplianceItem[]);
}

export async function deleteEmployeeRecord(employeeId: string, businessUnit: string): Promise<void> {
  const supabase = getClient();
  await assertEmployeeInBusinessUnit(employeeId, businessUnit);
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', employeeId)
    .eq('business_unit', businessUnit);
  if (error) throw error;
}

export async function loadArchives(businessUnit: string): Promise<MonthlyArchive[]> {
  const supabase = getClient();

  const { data: archives, error } = await supabase
    .from('monthly_archives')
    .select('*, archive_snapshots(*)')
    .eq('business_unit', businessUnit)
    .order('year', { ascending: false });

  if (error) throw error;

  return (archives ?? []).map(arch => {
    const snapshots = (arch.archive_snapshots ?? []) as Array<{
      employee_data: EmployeeDetails;
      checklist_data: ComplianceItem[];
      last_updated: string | null;
    }>;
    const records: ComplianceRecord[] = snapshots.map(s => ({
      employee: s.employee_data,
      checklist: s.checklist_data,
      lastUpdated: s.last_updated ?? arch.archived_at
    }));
    return {
      id: arch.id,
      month: arch.month,
      year: arch.year,
      records,
      archivedDate: arch.archived_at
    } satisfies MonthlyArchive;
  });
}

export async function saveArchive(
  month: string,
  year: number,
  businessUnit: string
): Promise<import('../types/compliance').MonthlyArchive> {
  const supabase = getClient();
  const records = await loadComplianceRecords(businessUnit);
  const archiveId = `${year}-${month}-${businessUnit}`;

  const { data: { user } } = await supabase.auth.getUser();

  const { error: archError } = await supabase.from('monthly_archives').upsert({
    id: archiveId,
    business_unit: businessUnit,
    month,
    year,
    archived_at: new Date().toISOString(),
    created_by: user?.id ?? null
  });

  if (archError) throw archError;

  await supabase.from('archive_snapshots').delete().eq('archive_id', archiveId);

  const snapshots = records.map(r => ({
    archive_id: archiveId,
    employee_data: r.employee,
    checklist_data: r.checklist,
    last_updated: r.lastUpdated
  }));

  if (snapshots.length) {
    const { error: snapError } = await supabase.from('archive_snapshots').insert(snapshots);
    if (snapError) throw snapError;
  }

  const monthIndex = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(month);
  const nextMonthEnd = getEndOfMonth(new Date(year, monthIndex + 1, 1));

  for (const record of records) {
    const updated = {
      ...record,
      checklist: record.checklist.map(item => ({ ...item, targetDate: nextMonthEnd })),
      lastUpdated: new Date().toISOString()
    };
    await saveComplianceRecord(updated, businessUnit);
  }

  return {
    id: archiveId,
    month,
    year,
    records,
    archivedDate: new Date().toISOString()
  };
}

export async function loadArchive(archiveId: string, businessUnit: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('monthly_archives')
    .select('*, archive_snapshots(*)')
    .eq('id', archiveId)
    .eq('business_unit', businessUnit)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const snapshots = (data.archive_snapshots ?? []) as Array<{
    employee_data: EmployeeDetails;
    checklist_data: ComplianceItem[];
    last_updated: string | null;
  }>;

  return {
    id: data.id,
    month: data.month,
    year: data.year,
    records: snapshots.map(s => ({
      employee: s.employee_data,
      checklist: s.checklist_data,
      lastUpdated: s.last_updated ?? data.archived_at
    })),
    archivedDate: data.archived_at
  };
}

export async function deleteArchive(archiveId: string, businessUnit: string): Promise<void> {
  const supabase = getClient();
  await assertArchiveInBusinessUnit(archiveId, businessUnit);
  const { error } = await supabase
    .from('monthly_archives')
    .delete()
    .eq('id', archiveId)
    .eq('business_unit', businessUnit);
  if (error) throw error;
}
