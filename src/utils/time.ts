import { startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns';

export function minutesToHoursAndMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}:${remainingMinutes.toString().padStart(2, '0')}`;
}

export function hoursAndMinutesToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return (hours * 60) + minutes;
}

export function formatDate(date: Date): string {
  return format(date, 'EEE, MMM d, yyyy');
}

export function formatShortDate(date: Date): string {
  return format(date, 'EEE, MMM d');
}

export function isValidTimeFormat(timeString: string): boolean {
  return /^([0-9]|[1-9][0-9]):([0-5][0-9])$/.test(timeString);
}

export function getWeekDays(date: Date = new Date()) {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Start week on Monday
  const end = endOfWeek(date, { weekStartsOn: 1 });
  
  return eachDayOfInterval({ start, end });
}

export function calculateTotalHours(entries: { duration: number }[]): string {
  const totalMinutes = entries.reduce((sum, entry) => sum + entry.duration, 0);
  return minutesToHoursAndMinutes(totalMinutes);
}