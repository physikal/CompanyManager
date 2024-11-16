import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';

interface Invite {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'rejected';
  companyId: string;
  createdAt: Date;
}

export function useInvites() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.companyId) return;

    const q = query(
      collection(db, 'invites'),
      where('companyId', '==', user.companyId),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inviteData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Invite[];
      
      setInvites(inviteData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { invites, loading };
}