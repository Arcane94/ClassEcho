export function formatToMonthDayHourMinute(isoString?: string): string {
  if (!isoString) return 'Invalid time';

  const date = new Date(isoString);

  const month = date.getMonth() + 1; // getMonth() is 0-based
  const day = date.getDate();
  let hours = date.getHours();
  const minutes = date.getMinutes();

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // convert to 12-hour format
  const paddedMinutes = minutes.toString().padStart(2, '0');

  return `${month}/${day}, ${hours}:${paddedMinutes} ${ampm}`;
}
