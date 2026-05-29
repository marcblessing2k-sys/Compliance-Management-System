-- Support fast, isolated queries per business unit (BU1 / BU2 / BU3)
create index if not exists employees_business_unit_idx on public.employees (business_unit);
create index if not exists monthly_archives_business_unit_idx on public.monthly_archives (business_unit);
