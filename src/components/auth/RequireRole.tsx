import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';

interface RequireRoleProps {
  children: ReactNode;
  role: UserRole;
  fallback?: ReactNode;
}

export function RequireRole({ children, role, fallback }: RequireRoleProps) {
  const { user } = useAuth();

  // Temporary simple role check until we implement proper RBAC
  if (!user) {
    return <Navigate to="/login" />;
  }

  // For now, allow access (will be replaced with proper role checking)
  return <>{children}</>;
}