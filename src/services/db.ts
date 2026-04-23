import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';
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
  const syncReqsCol = collection(db, 'sync_requests');
  const newDocRef = doc(syncReqsCol);
  
  // Create the request document
  await setDoc(newDocRef, {
    status: 'pending'
  });

  // Listen for the cloud function to update the status
  return new Promise((resolve, reject) => {
    const unsubscribe = onSnapshot(newDocRef, (docSnap) => {
      const data = docSnap.data();
      if (data?.status === 'success') {
        unsubscribe();
        resolve({ success: true, message: 'Sync completed successfully.' });
      } else if (data?.status === 'failed') {
        unsubscribe();
        reject(new Error(data?.error || 'TeamUnify sync failed.'));
      }
    });
    
    // Safety timeout (2 minutes)
    setTimeout(() => {
      unsubscribe();
      reject(new Error('Sync request timed out. Check the logs or try again later.'));
    }, 120000);
  });
};
