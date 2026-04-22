export type GroupType = 'Rec Team' | 'Splash' | 'Pre-Team' | 'Littles' | 'Age Groupers' | 'Seniors' | 'Masters';

export const GROUPS: GroupType[] = ['Rec Team', 'Splash', 'Pre-Team', 'Littles', 'Age Groupers', 'Seniors', 'Masters'];

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
