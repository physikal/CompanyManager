import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import type { UserRole } from '@/types';

export function useRBAC() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setRole(userDoc.data().role as UserRole);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const checkPermission = (requiredRole: UserRole): boolean => {
    if (!role) return false;
    
    const roleHierarchy: Record<UserRole, number> = {
      admin: 3,
      manager: 2,
      employee: 1,
    };

    return roleHierarchy[role] >= roleHierarchy[requiredRole];
  };

  return {
    role,
    loading,
    checkPermission,
    isAdmin: role === 'admin',
    isManager: checkPermission('manager'),
    isEmployee: checkPermission('employee'),
  };
}