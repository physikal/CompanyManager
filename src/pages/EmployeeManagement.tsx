import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, where, onSnapshot, setDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth, db, firebaseConfig } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { useRBAC } from '@/hooks/useRBAC';
import { Button } from '@/components/ui/Button';
import { Users, Plus, X, UserPlus, Mail, Edit2, Trash2 } from 'lucide-react';
import type { User } from '@/types';

interface InviteFormData {
  email: string;
  role: 'manager' | 'employee';
}

interface ManualAddFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'manager' | 'employee';
}

interface EditEmployeeFormData {
  firstName: string;
  lastName: string;
  role: 'manager' | 'employee';
}

// Initialize a secondary Firebase app for user creation
const secondaryApp = initializeApp(firebaseConfig, 'secondary');
const secondaryAuth = getAuth(secondaryApp);

export function EmployeeManagement() {
  const { user } = useAuth();
  const { company } = useCompany();
  const { isAdmin } = useRBAC();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showManualAddForm, setShowManualAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [employees, setEmployees] = useState<User[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  
  const { register: registerInvite, handleSubmit: handleInviteSubmit, reset: resetInvite } = 
    useForm<InviteFormData>();
  
  const { register: registerManual, handleSubmit: handleManualSubmit, reset: resetManual } = 
    useForm<ManualAddFormData>();

  const { register: registerEdit, handleSubmit: handleEditSubmit, reset: resetEdit, setValue: setEditValue } = 
    useForm<EditEmployeeFormData>();

  useEffect(() => {
    if (!company?.id) return;

    const q = query(
      collection(db, 'users'),
      where('companyId', '==', company.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const employeeData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      
      setEmployees(employeeData);
      setEmployeesLoading(false);
    });

    return () => unsubscribe();
  }, [company]);

  const handleEdit = (employee: User) => {
    setEditingEmployee(employee);
    setShowEditForm(true);
    setShowInviteForm(false);
    setShowManualAddForm(false);
    
    setEditValue('firstName', employee.firstName);
    setEditValue('lastName', employee.lastName);
    setEditValue('role', employee.role);
  };

  const handleDelete = async (employeeId: string) => {
    if (!isAdmin) {
      setError('Only administrators can delete employees');
      return;
    }

    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Delete user document
      await deleteDoc(doc(db, 'users', employeeId));
      
      // Update company's users array
      if (company) {
        await updateDoc(doc(db, 'companies', company.id), {
          users: employees.filter(e => e.id !== employeeId).map(e => e.id),
          updatedAt: serverTimestamp(),
        });
      }

      setSuccess('Employee deleted successfully');
    } catch (err) {
      console.error('Error deleting employee:', err);
      setError('Failed to delete employee');
    } finally {
      setLoading(false);
    }
  };

  const onInviteSubmit = async (data: InviteFormData) => {
    if (!user || !company) {
      setError('Company information not found');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const inviteRef = await addDoc(collection(db, 'invites'), {
        email: data.email,
        role: data.role,
        status: 'pending',
        companyId: company.id,
        companyName: company.name,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });

      const functions = getFunctions();
      const sendInvite = httpsCallable(functions, 'sendEmployeeInvite');
      await sendInvite({
        inviteId: inviteRef.id,
        email: data.email,
        companyName: company.name,
      });

      setSuccess('Invitation sent successfully!');
      resetInvite();
      setShowInviteForm(false);
    } catch (err) {
      console.error('Error sending invite:', err);
      setError('Failed to send invite. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onManualAddSubmit = async (data: ManualAddFormData) => {
    if (!user || !company) {
      setError('Company information not found');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create user with secondary auth instance
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        data.email,
        data.password
      );

      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        companyId: company.id,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });

      // Update company's users array
      await updateDoc(doc(db, 'companies', company.id), {
        users: [...(company.users || []), userCredential.user.uid],
        updatedAt: serverTimestamp(),
      });

      setSuccess('Team member added successfully!');
      resetManual();
      setShowManualAddForm(false);
    } catch (err: any) {
      console.error('Error adding team member:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters');
      } else {
        setError('Failed to add team member. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onEditSubmit = async (data: EditEmployeeFormData) => {
    if (!editingEmployee) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateDoc(doc(db, 'users', editingEmployee.id), {
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        updatedAt: serverTimestamp(),
      });

      setSuccess('Employee updated successfully!');
      resetEdit();
      setShowEditForm(false);
      setEditingEmployee(null);
    } catch (err) {
      console.error('Error updating employee:', err);
      setError('Failed to update employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 sm:px-0 flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your team members and send invites
          </p>
        </div>
        <div className="flex space-x-4">
          <Button
            onClick={() => {
              setShowInviteForm(!showInviteForm);
              setShowManualAddForm(false);
              setShowEditForm(false);
              setEditingEmployee(null);
            }}
            className="flex items-center"
          >
            {showInviteForm ? (
              <>
                <X className="h-5 w-5 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Mail className="h-5 w-5 mr-2" />
                Invite Employee
              </>
            )}
          </Button>
          <Button
            onClick={() => {
              setShowManualAddForm(!showManualAddForm);
              setShowInviteForm(false);
              setShowEditForm(false);
              setEditingEmployee(null);
            }}
            className="flex items-center"
          >
            {showManualAddForm ? (
              <>
                <X className="h-5 w-5 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5 mr-2" />
                Add Manually
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-4">
          <div className="text-sm text-green-700">{success}</div>
        </div>
      )}

      {showInviteForm && (
        <div className="bg-white shadow sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Invite New Employee
            </h3>
            <form onSubmit={handleInviteSubmit(onInviteSubmit)} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  {...registerInvite('email', { required: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  {...registerInvite('role', { required: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Invite'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showManualAddForm && (
        <div className="bg-white shadow sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add Team Member Manually
            </h3>
            <form onSubmit={handleManualSubmit(onManualAddSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    {...registerManual('firstName', { required: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    {...registerManual('lastName', { required: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  {...registerManual('email', { required: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Initial Password
                </label>
                <input
                  type="password"
                  {...registerManual('password', { required: true, minLength: 6 })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                <p className="mt-1 text-sm text-gray-500">
                  The user can change their password after first login.
                </p>
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  {...registerManual('role', { required: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Team Member'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditForm && editingEmployee && (
        <div className="bg-white shadow sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Edit Employee
            </h3>
            <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    {...registerEdit('firstName', { required: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    {...registerEdit('lastName', { required: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  {...registerEdit('role', { required: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingEmployee(null);
                  }}
                  className="mr-3"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
              <p className="mt-2 text-sm text-gray-700">
                A list of all employees in your company including their name, role, and email.
              </p>
            </div>
          </div>
          <div className="mt-6">
            {employeesLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : employees.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employees.map((employee) => (
                      <tr key={employee.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {employee.firstName} {employee.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {employee.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="capitalize">{employee.role}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(employee)}
                            className="text-blue-600 hover:text-blue-900 mr-2"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {isAdmin && employee.id !== user?.uid && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(employee.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No employees</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by inviting your first team member.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}