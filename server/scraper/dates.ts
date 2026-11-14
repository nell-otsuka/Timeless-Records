/** Today's date (YYYY-MM-DD) in the given IANA time zone. */
export const todayIso = (timeZone: string, now = new Date()): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

/** Adds minutes to a local date-time ("2026-11-14T17:30:00"), keeping the same notation. Wall-clock arithmetic: no time zone involved. */
export const addMinutes = (localIso: string, minutes: number): string => {
  const [date = '', time = '00:00:00'] = localIso.split('T');
  const [y, mo, d] = date.split('-').map(Number) as [number, number, number];
  const [h = 0, mi = 0, s = 0] = time.split(':').map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h, mi + minutes, s)).toISOString().slice(0, 19);
};

export const addDays = (iso: string, days: number): string => {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};
