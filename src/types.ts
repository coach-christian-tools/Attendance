export type GroupType = 'Rec Team' | 'Splash' | 'Pre-Team' | 'Littles' | 'Age Groupers' | 'Seniors' | 'Masters' | 'Other';

export const GROUPS: GroupType[] = ['Rec Team', 'Splash', 'Pre-Team', 'Littles', 'Age Groupers', 'Seniors', 'Masters', 'Other'];

export interface Athlete {
  id?: string;
  firstName: string;
  lastName: string;
  group: GroupType;
  dob?: string;
  gender?: string;
  swimCloudId?: string;
  [key: string]: any;
}

export type AttendanceStatus = 'present' | 'absent' | 'unmarked';

export interface AttendanceRecord {
  eventId: string;
  date: string;
  records: Record<string, AttendanceStatus>; // athleteId -> status
}
