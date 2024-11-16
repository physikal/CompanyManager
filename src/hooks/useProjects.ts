import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCompany } from './useCompany';
import type { Project } from '@/types';

export function useProjects() {
  const { company } = useCompany();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!company?.id) {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'projects'),
        where('companyId', '==', company.id),
        orderBy('name')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const projectData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            startDate: doc.data().startDate?.toDate(),
            endDate: doc.data().endDate?.toDate(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
          })) as Project[];

          setProjects(projectData);
          setError(null);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching projects:', err);
          if (err.code === 'failed-precondition') {
            setError('Setting up database indexes... This is a one-time process and should complete within a few minutes. Please wait.');
          } else {
            setError('Failed to load projects. Please try again later.');
          }
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up project listener:', err);
      setError('Failed to initialize project list');
      setLoading(false);
    }
  }, [company]);

  return { projects, loading, error };
}