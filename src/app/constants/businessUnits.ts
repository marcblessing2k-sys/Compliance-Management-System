export const BUSINESS_UNIT_IDS = ['BU1', 'BU2', 'BU3', 'SHARE_UNIT'] as const;
export type BusinessUnitId = (typeof BUSINESS_UNIT_IDS)[number];

export const BUSINESS_UNIT_LABELS: Record<BusinessUnitId, string> = {
  BU1: 'CMS-BU1-CONSULTING',
  BU2: 'CMS-BU2-SOFTWARE DEVELOPMENT',
  BU3: 'CMS-BU3-COOPERATIVE',
  SHARE_UNIT: 'CMS-SHARE-UNIT'
};

export const BUSINESS_UNIT_META: Record<
  BusinessUnitId,
  { description: string; color: string; icon: string }
> = {
  BU1: {
    description: 'Consulting business unit compliance tracking and management',
    color: 'from-[#5B9BD5] to-[#4682B4]',
    icon: '📊'
  },
  BU2: {
    description: 'Software development business unit compliance tracking',
    color: 'from-[#FFE54D] to-[#FFD700]',
    icon: '💻'
  },
  BU3: {
    description: 'Cooperative business unit compliance tracking',
    color: 'from-[#87CEEB] to-[#5B9BD5]',
    icon: '🤝'
  },
  SHARE_UNIT: {
    description:
      'Central support unit overseeing finance, administration, office operations, and team management',
    color: 'from-[#6A5ACD] to-[#483D8B]',
    icon: '🏢'
  }
};

export function isBusinessUnitId(value: string): value is BusinessUnitId {
  return BUSINESS_UNIT_IDS.includes(value as BusinessUnitId);
}

export function getBusinessUnitLabel(id: BusinessUnitId): string {
  return BUSINESS_UNIT_LABELS[id];
}
