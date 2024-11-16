import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import type { Company } from '@/types';

export function useCompany() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!user) {
        setCompany(null);
        setLoading(false);
        return;
      }

      try {
        // First get the user's document to get their companyId
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        
        if (!userData?.companyId) {
          setCompany(null);
          setLoading(false);
          return;
        }

        // Then fetch the company document using the companyId
        const companyDoc = await getDoc(doc(db, 'companies', userData.companyId));
        if (companyDoc.exists()) {
          setCompany({
            id: companyDoc.id,
            ...companyDoc.data(),
            createdAt: companyDoc.data().createdAt?.toDate(),
            updatedAt: companyDoc.data().updatedAt?.toDate(),
          } as Company);
        } else {
          setError('Company not found');
        }
      } catch (err) {
        console.error('Error fetching company:', err);
        setError('Failed to fetch company data');
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [user]);

  return { company, loading, error };
}