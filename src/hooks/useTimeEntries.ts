import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { useRBAC } from './useRBAC';
import { useCompany } from './useCompany';
import type { TimeEntry } from '@/types';

export function useTimeEntries(startDate?: Date, endDate?: Date, userId?: string) {
  const { user } = useAuth();
  const { company } = useCompany();
  const { isManager } = useRBAC();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !company?.id) {
      setLoading(false);
      return;
    }

    try {
      // Base query constraints
      const queryConstraints = [where('companyId', '==', company.id)];

      // Add user filter
      if (userId) {
        queryConstraints.push(where('userId', '==', userId));
      } else if (!isManager) {
        queryConstraints.push(where('userId', '==', user.uid));
      }

      // Add date range filters
      if (startDate) {
        const startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0);
        queryConstraints.push(where('date', '>=', Timestamp.fromDate(startOfDay)));
      }
      
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        queryConstraints.push(where('date', '<=', Timestamp.fromDate(endOfDay)));
      }

      // Add ordering
      queryConstraints.push(orderBy('date', 'asc'));

      const q = query(collection(db, 'timeEntries'), ...queryConstraints);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const timeEntryData = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              date: data.date?.toDate(),
              createdAt: data.createdAt?.toDate(),
              updatedAt: data.updatedAt?.toDate(),
              approvedAt: data.approvedAt?.toDate(),
              duration: Number(data.duration),
              description: data.description || '',
              status: data.status || 'draft',
              projectId: data.projectId,
              userId: data.userId,
              companyId: data.companyId,
              createdBy: data.createdBy,
              updatedBy: data.updatedBy,
            } as TimeEntry;
          });

          setEntries(timeEntryData);
          setError(null);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching time entries:', err);
          setError('Failed to load time entries');
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up time entries listener:', err);
      setError('Failed to initialize time entries');
      setLoading(false);
    }
  }, [user?.uid, company?.id, startDate?.getTime(), endDate?.getTime(), userId, isManager]);

  return { entries, loading, error };
}