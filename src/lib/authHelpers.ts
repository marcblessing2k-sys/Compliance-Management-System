/** Maps phone or email login identifiers to the Supabase Auth email. */
export function toLoginEmail(identifier: string): string {
  const trimmed = identifier.trim();
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  const digits = trimmed.replace(/\D/g, '');
  return `${digits}@phone.cms.local`;
}

export function isEmailIdentifier(identifier: string): boolean {
  return identifier.includes('@');
}
