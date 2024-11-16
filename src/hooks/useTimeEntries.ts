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
      // Base query with company filter
      let queryConstraints = [
        where('companyId', '==', company.id)
      ];

      // Add user filter if not a manager or if specific userId is requested
      if (userId) {
        queryConstraints.push(where('userId', '==', userId));
      } else if (!isManager) {
        queryConstraints.push(where('userId', '==', user.uid));
      }

      // Add date range filters if provided
      if (startDate) {
        queryConstraints.push(where('date', '>=', startDate));
      }
      if (endDate) {
        queryConstraints.push(where('date', '<=', endDate));
      }

      // Add ordering
      queryConstraints.push(orderBy('date', 'asc'));

      const q = query(collection(db, 'timeEntries'), ...queryConstraints);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const timeEntryData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
            approvedAt: doc.data().approvedAt?.toDate(),
          })) as TimeEntry[];

          console.log('Fetched time entries:', timeEntryData); // Debug log
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
  }, [user, company, startDate, endDate, userId, isManager]);

  return { entries, loading, error };
}