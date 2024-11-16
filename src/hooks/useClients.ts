import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCompany } from './useCompany';
import type { Client } from '@/types';

export function useClients() {
  const { company } = useCompany();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!company?.id) {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'clients'),
        where('companyId', '==', company.id),
        orderBy('name')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const clientData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
          })) as Client[];

          setClients(clientData);
          setError(null);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching clients:', err);
          if (err.code === 'failed-precondition') {
            setError('Please wait while we set up the database indexes...');
          } else {
            setError('Failed to load clients. Please try again later.');
          }
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up client listener:', err);
      setError('Failed to initialize client list');
      setLoading(false);
    }
  }, [company]);

  return { clients, loading, error };
}