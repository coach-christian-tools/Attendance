import { startOfDay, endOfDay } from 'date-fns';

export interface GCalEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

export const fetchEventsForDate = async (date: Date): Promise<GCalEvent[]> => {
  const calendarId = encodeURIComponent(import.meta.env.VITE_GOOGLE_CALENDAR_ID);
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  
  const timeMin = startOfDay(date).toISOString();
  const timeMax = endOfDay(date).toISOString();
  
  const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${apiKey}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
  
  const res = await fetch(url);
  if (!res.ok) {
    console.error('Failed to fetch events', await res.text());
    return [];
  }
  
  const data = await res.json();
  return data.items || [];
};
