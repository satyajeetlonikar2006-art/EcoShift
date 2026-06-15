import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
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
import { auth } from '@/services/firebase';
import { logActivity, getActivities, getWeeklyActivities, deleteActivity } from '../firebaseDB';

// Mock firebase/firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  serverTimestamp: vi.fn(),
  Timestamp: { fromDate: vi.fn() },
  orderBy: vi.fn(),
  limit: vi.fn(),
}));

const mockAddDoc = addDoc as Mock;
const mockGetDocs = getDocs as Mock;
const mockDeleteDoc = deleteDoc as Mock;
const mockCollection = collection as Mock;
const mockQuery = query as Mock;
const mockWhere = where as Mock;
const mockDoc = doc as Mock;
const mockServerTimestamp = serverTimestamp as Mock;
const mockTimestampFromDate = Timestamp.fromDate as Mock;
const mockOrderBy = orderBy as Mock;
const mockLimit = limit as Mock;

describe('firebaseDB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue('mock-collection-ref');
    mockQuery.mockReturnValue('mock-query');
    mockWhere.mockReturnValue('mock-where-constraint');
    mockDoc.mockReturnValue('mock-doc-ref');
    mockServerTimestamp.mockReturnValue('mock-server-timestamp');
    mockOrderBy.mockReturnValue('mock-order-by');
    mockLimit.mockReturnValue('mock-limit');
    mockTimestampFromDate.mockReturnValue('mock-timestamp');
  });

  describe('logActivity', () => {
    const activityData = {
      category: 'transport' as const,
      activityType: 'car',
      co2Impact: 2.5,
      description: 'Drove to work',
      distance: 10,
      date: new Date('2026-06-10'),
    };

    it('should create a document and return the activity', async () => {
      mockAddDoc.mockResolvedValue({ id: 'new-doc-id' });

      const result = await logActivity(activityData);

      expect(mockCollection).toHaveBeenCalledWith({}, 'activities');
      expect(mockAddDoc).toHaveBeenCalledWith('mock-collection-ref', {
        userId: 'test-user',
        ...activityData,
        createdAt: 'mock-server-timestamp',
        updatedAt: 'mock-server-timestamp',
      });

      expect(result.id).toBe('new-doc-id');
      expect(result.userId).toBe('test-user');
      expect(result.category).toBe('transport');
      expect(result.activityType).toBe('car');
      expect(result.co2Impact).toBe(2.5);
      expect(result.description).toBe('Drove to work');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw when user is not authenticated', async () => {
      // Temporarily set currentUser to null
      const originalCurrentUser = (auth as any).currentUser;
      (auth as any).currentUser = null;

      await expect(logActivity(activityData)).rejects.toThrow('User not authenticated');

      // Restore
      (auth as any).currentUser = originalCurrentUser;
    });

    it('should propagate errors from addDoc', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockAddDoc.mockRejectedValue(new Error('Firestore write failed'));

      await expect(logActivity(activityData)).rejects.toThrow('Firestore write failed');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to log activity:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should use serverTimestamp for createdAt and updatedAt', async () => {
      mockAddDoc.mockResolvedValue({ id: 'doc-123' });

      await logActivity(activityData);

      const addDocCallArg = mockAddDoc.mock.calls[0][1];
      expect(addDocCallArg.createdAt).toBe('mock-server-timestamp');
      expect(addDocCallArg.updatedAt).toBe('mock-server-timestamp');
      expect(mockServerTimestamp).toHaveBeenCalledTimes(2);
    });

    it('should include all activity data fields in the Firestore document', async () => {
      mockAddDoc.mockResolvedValue({ id: 'doc-456' });

      const fullActivityData = {
        category: 'food' as const,
        activityType: 'beef',
        co2Impact: 5.0,
        description: 'Ate a steak',
        amount: 300,
        date: new Date('2026-06-12'),
      };

      await logActivity(fullActivityData);

      const addDocCallArg = mockAddDoc.mock.calls[0][1];
      expect(addDocCallArg.category).toBe('food');
      expect(addDocCallArg.activityType).toBe('beef');
      expect(addDocCallArg.co2Impact).toBe(5.0);
      expect(addDocCallArg.amount).toBe(300);
      expect(addDocCallArg.userId).toBe('test-user');
    });
  });

  describe('getActivities', () => {
    it('should query Firestore with correct constraints', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });

      await getActivities('user-1');

      expect(mockCollection).toHaveBeenCalledWith({}, 'activities');
      expect(mockWhere).toHaveBeenCalledWith('userId', '==', 'user-1');
      expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
      expect(mockLimit).toHaveBeenCalledWith(100);
      expect(mockQuery).toHaveBeenCalled();
      expect(mockGetDocs).toHaveBeenCalledWith('mock-query');
    });

    it('should map Firestore docs to Activity objects', async () => {
      const mockDate = new Date('2026-06-10');
      const mockToDate = vi.fn().mockReturnValue(mockDate);

      mockGetDocs.mockResolvedValue({
        docs: [
          {
            id: 'doc-1',
            data: () => ({
              userId: 'user-1',
              category: 'transport',
              activityType: 'car',
              co2Impact: 2.5,
              description: 'Drove to work',
              date: { toDate: mockToDate },
              createdAt: { toDate: mockToDate },
              updatedAt: { toDate: mockToDate },
            }),
          },
          {
            id: 'doc-2',
            data: () => ({
              userId: 'user-1',
              category: 'food',
              activityType: 'beef',
              co2Impact: 5.0,
              description: 'Lunch',
              date: { toDate: mockToDate },
              createdAt: { toDate: mockToDate },
              updatedAt: { toDate: mockToDate },
            }),
          },
        ],
      });

      const result = await getActivities('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('doc-1');
      expect(result[0].category).toBe('transport');
      expect(result[0].date).toEqual(mockDate);
      expect(result[1].id).toBe('doc-2');
      expect(result[1].category).toBe('food');
    });

    it('should handle docs without toDate method (fallback to new Date)', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [
          {
            id: 'doc-3',
            data: () => ({
              userId: 'user-1',
              category: 'home',
              activityType: 'heating',
              co2Impact: 3.0,
              description: 'Heating',
              date: null,
              createdAt: null,
              updatedAt: null,
            }),
          },
        ],
      });

      const result = await getActivities('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].date).toBeInstanceOf(Date);
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].updatedAt).toBeInstanceOf(Date);
    });

    it('should return empty array when no documents exist', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });

      const result = await getActivities('user-1');

      expect(result).toEqual([]);
    });

    it('should propagate errors from getDocs', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetDocs.mockRejectedValue(new Error('Permission denied'));

      await expect(getActivities('user-1')).rejects.toThrow('Permission denied');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch activities:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getWeeklyActivities', () => {
    it('should use a date filter for the last 7 days', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });

      await getWeeklyActivities('user-1');

      expect(mockTimestampFromDate).toHaveBeenCalledTimes(1);
      // Verify the date passed to Timestamp.fromDate is roughly 7 days ago
      const dateArg = mockTimestampFromDate.mock.calls[0][0] as Date;
      const now = new Date();
      const sevenDaysAgoApprox = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      // Allow 5 seconds of tolerance
      expect(Math.abs(dateArg.getTime() - sevenDaysAgoApprox.getTime())).toBeLessThan(5000);

      expect(mockWhere).toHaveBeenCalledWith('userId', '==', 'user-1');
      expect(mockWhere).toHaveBeenCalledWith('createdAt', '>=', 'mock-timestamp');
      expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
    });

    it('should map Firestore docs to Activity objects', async () => {
      const mockDate = new Date('2026-06-12');
      const mockToDate = vi.fn().mockReturnValue(mockDate);

      mockGetDocs.mockResolvedValue({
        docs: [
          {
            id: 'weekly-doc-1',
            data: () => ({
              userId: 'user-1',
              category: 'transport',
              activityType: 'bus',
              co2Impact: 0.5,
              description: 'Bus ride',
              date: { toDate: mockToDate },
              createdAt: { toDate: mockToDate },
              updatedAt: { toDate: mockToDate },
            }),
          },
        ],
      });

      const result = await getWeeklyActivities('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('weekly-doc-1');
      expect(result[0].activityType).toBe('bus');
      expect(result[0].date).toEqual(mockDate);
    });

    it('should return empty array when no weekly activities exist', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });

      const result = await getWeeklyActivities('user-1');

      expect(result).toEqual([]);
    });

    it('should propagate errors from getDocs', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetDocs.mockRejectedValue(new Error('Query failed'));

      await expect(getWeeklyActivities('user-1')).rejects.toThrow('Query failed');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch weekly activities:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should not apply a limit constraint (unlike getActivities)', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });

      await getWeeklyActivities('user-1');

      // getWeeklyActivities does NOT call limit()
      expect(mockLimit).not.toHaveBeenCalled();
    });
  });

  describe('deleteActivity', () => {
    it('should call deleteDoc with correct doc reference', async () => {
      mockDeleteDoc.mockResolvedValue(undefined);

      await deleteActivity('activity-123');

      expect(mockDoc).toHaveBeenCalledWith({}, 'activities', 'activity-123');
      expect(mockDeleteDoc).toHaveBeenCalledWith('mock-doc-ref');
    });

    it('should resolve successfully when deletion succeeds', async () => {
      mockDeleteDoc.mockResolvedValue(undefined);

      await expect(deleteActivity('activity-456')).resolves.toBeUndefined();
    });

    it('should propagate errors from deleteDoc', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockDeleteDoc.mockRejectedValue(new Error('Delete failed'));

      await expect(deleteActivity('activity-789')).rejects.toThrow('Delete failed');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to delete activity:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
