import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, auth, isMockMode } from './firebase';
import { Activity } from '@/types';

const ACTIVITIES_COLLECTION = 'activities';

// Detect if we are in offline mock mode (e.g. previewing locally with mock credentials)
const isMock = () => isMockMode;

// Retrieve activities from local storage
const getLocalActivities = (): Activity[] => {
  const data = localStorage.getItem('ecoshift_activities');
  if (!data) return [];
  try {
    return JSON.parse(data).map((item: any) => ({
      ...item,
      date: new Date(item.date),
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    }));
  } catch (e) {
    return [];
  }
};

// Save activities to local storage
const saveLocalActivities = (activities: Activity[]) => {
  localStorage.setItem('ecoshift_activities', JSON.stringify(activities));
};

/**
 * Log an activity to Firestore
 */
export async function logActivity(
  activityData: Omit<Activity, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<Activity> {
  if (isMock()) {
    const newActivity: Activity = {
      id: 'mock-act-' + Math.random().toString(36).substring(2, 9),
      userId: 'mock-guest-uid-123',
      ...activityData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const activities = getLocalActivities();
    saveLocalActivities([newActivity, ...activities]);
    return newActivity;
  }

  try {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    const docRef = await addDoc(collection(db, ACTIVITIES_COLLECTION), {
      userId: auth.currentUser.uid,
      ...activityData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      userId: auth.currentUser.uid,
      ...activityData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Failed to log activity:', error);
    throw error;
  }
}

/**
 * Get all activities for current user
 */
export async function getActivities(userId: string): Promise<Activity[]> {
  if (isMock()) {
    // Return all local storage activities for the mockup preview
    return getLocalActivities().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  try {
    const q = query(
      collection(db, ACTIVITIES_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate?.() || new Date(),
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      } as Activity;
    });
  } catch (error) {
    console.error('Failed to fetch activities:', error);
    throw error;
  }
}

/**
 * Get activities from the last 7 days
 */
export async function getWeeklyActivities(userId: string): Promise<Activity[]> {
  if (isMock()) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return getLocalActivities()
      .filter(a => a.createdAt >= oneWeekAgo)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const q = query(
      collection(db, ACTIVITIES_COLLECTION),
      where('userId', '==', userId),
      where('createdAt', '>=', Timestamp.fromDate(oneWeekAgo)),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate?.() || new Date(),
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      } as Activity;
    });
  } catch (error) {
    console.error('Failed to fetch weekly activities:', error);
    throw error;
  }
}

/**
 * Delete an activity
 */
export async function deleteActivity(activityId: string): Promise<void> {
  if (isMock()) {
    const activities = getLocalActivities();
    const filtered = activities.filter(a => a.id !== activityId);
    saveLocalActivities(filtered);
    return;
  }

  try {
    await deleteDoc(doc(db, ACTIVITIES_COLLECTION, activityId));
  } catch (error) {
    console.error('Failed to delete activity:', error);
    throw error;
  }
}
