export type GroupType = 'Splash' | 'Pre-Team' | 'Littles' | 'Age Groupers' | 'Seniors' | 'Masters' | 'Rec Team';

export const GROUPS: GroupType[] = ['Splash', 'Pre-Team', 'Littles', 'Age Groupers', 'Seniors', 'Masters', 'Rec Team'];

export interface Athlete {
  id?: string;
  firstName: string;
  lastName: string;
  group: GroupType;
  dob?: string;
  gender?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'unmarked';

export interface AttendanceRecord {
  eventId: string;
  date: string;
  records: Record<string, AttendanceStatus>; // athleteId -> status
}
