export const BUSINESS_UNIT_IDS = ['BU1', 'BU2', 'BU3'] as const;
export type BusinessUnitId = (typeof BUSINESS_UNIT_IDS)[number];

export const BUSINESS_UNIT_LABELS: Record<BusinessUnitId, string> = {
  BU1: 'CMS-BU1-CONSULTING',
  BU2: 'CMS-BU2-SOFTWARE DEVELOPMENT',
  BU3: 'CMS-BU3-COOPERATIVE'
};

export function isBusinessUnitId(value: string): value is BusinessUnitId {
  return BUSINESS_UNIT_IDS.includes(value as BusinessUnitId);
}

export function getBusinessUnitLabel(id: BusinessUnitId): string {
  return BUSINESS_UNIT_LABELS[id];
}
