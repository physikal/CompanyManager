import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'manager' | 'employee';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  companyId: string;
  firstName: string;
  lastName: string;
  managerId?: string;
}

export interface Company {
  id: string;
  name: string;
  address: string;
  primaryContact: {
    name: string;
    email: string;
    phone: string;
  };
  users: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  companyId: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  companyId: string;
  teamMembers: string[];
  status: 'active' | 'completed' | 'on-hold';
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeEntry {
  id: string;
  userId: string;
  projectId: string;
  date: Date;
  duration: number; // in minutes
  description: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
}

export interface PayPeriod {
  startDate: Date;
  endDate: Date;
  status: 'open' | 'closed';
}