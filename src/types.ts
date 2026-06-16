export type GroupType = 'Rec Team' | 'Splash' | 'Pre-Team' | 'Littles' | 'Age Groupers' | 'Seniors' | 'Masters' | 'Other';

export const GROUPS: GroupType[] = ['Rec Team', 'Splash', 'Pre-Team', 'Littles', 'Age Groupers', 'Seniors', 'Masters', 'Other'];

export interface Athlete {
  id?: string;
  firstName: string;
  lastName: string;
  group: GroupType;
  dob?: string;
  gender?: string;
  [key: string]: any;
}

export type AttendanceStatus = 'present' | 'absent' | 'unmarked';

export interface GuestAttendance {
  firstName: string;
  lastName: string;
  status: AttendanceStatus;
}

export interface AttendanceRecord {
  eventId: string;
  date: string;
  records: Record<string, AttendanceStatus>; // athleteId -> status
  guests?: Record<string, GuestAttendance>; // guestId -> GuestAttendance
  note?: string;
  groupOverride?: string;
}
