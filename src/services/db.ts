import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebase';
import type { Athlete, AttendanceRecord, AttendanceStatus } from '../types';

const athletesCol = collection(db, 'athletes');
const attendanceCol = collection(db, 'attendance');

export const getAthletes = async (): Promise<Athlete[]> => {
  const snapshot = await getDocs(athletesCol);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Athlete));
};

export const addAthlete = async (athlete: Omit<Athlete, 'id'>): Promise<string> => {
  const newDocRef = doc(athletesCol);
  await setDoc(newDocRef, athlete);
  return newDocRef.id;
};

export const updateAthlete = async (id: string, data: Partial<Athlete>): Promise<void> => {
  const docRef = doc(athletesCol, id);
  await updateDoc(docRef, data as any);
};

export const deleteAthlete = async (id: string): Promise<void> => {
  const docRef = doc(athletesCol, id);
  await deleteDoc(docRef);
};

export const getAttendance = async (eventId: string, date: string): Promise<Record<string, AttendanceStatus>> => {
  const docId = `${eventId}_${date}`;
  const docRef = doc(attendanceCol, docId);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return (snapshot.data() as AttendanceRecord).records || {};
  }
  return {};
};

export const saveAttendance = async (eventId: string, date: string, records: Record<string, AttendanceStatus>): Promise<void> => {
  const docId = `${eventId}_${date}`;
  const docRef = doc(attendanceCol, docId);
  await setDoc(docRef, { eventId, date, records }, { merge: true });
};

export const getAllAttendance = async (): Promise<AttendanceRecord[]> => {
  const snapshot = await getDocs(attendanceCol);
  return snapshot.docs.map(d => d.data() as AttendanceRecord);
};

export const triggerSync = async (): Promise<any> => {
  const functions = getFunctions(db.app);
  const syncFunction = httpsCallable(functions, 'triggerTeamUnifySync');
  const result = await syncFunction();
  return result.data;
};
