/**
 * Converts the TODA labels used by legacy accounts and by application forms
 * into one comparable key.  The old database contains names such as
 * "Poblacion TODA", while the form saves "BASTODA (Baliuag Poblacion TODA)".
 */
export function todaKey(value?: string | null): string {
  const normalized = (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  if (!normalized) return '';

  const aliases: Record<string, string[]> = {
    bastoda: ['bastoda', 'baliuag poblacion toda', 'poblacion toda', 'poblacion'],
    smtoda: ['smtoda', 'sabang terminal toda', 'sabang toda', 'sabang'],
    tartoda: ['tartoda', 'tarcan highway toda', 'tarcan toda', 'tarcan'],
    pagtoda: ['pagtoda', 'pagala commercial toda', 'pagala toda', 'pagala'],
  };

  for (const [key, names] of Object.entries(aliases)) {
    if (names.some(name => normalized === name || normalized.includes(name))) return key;
  }

  return normalized;
}

export function belongsToToda(applicationToda?: string | null, presidentToda?: string | null): boolean {
  const applicationKey = todaKey(applicationToda);
  const presidentKey = todaKey(presidentToda);
  return Boolean(applicationKey && presidentKey && applicationKey === presidentKey);
}
