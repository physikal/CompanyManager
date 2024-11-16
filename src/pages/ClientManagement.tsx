import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCompany } from '@/hooks/useCompany';
import { useClients } from '@/hooks/useClients';
import { Button } from '@/components/ui/Button';
import { Building, Plus, X, Edit2, Trash2 } from 'lucide-react';
import type { Client } from '@/types';

interface ClientFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export function ClientManagement() {
  const { company } = useCompany();
  const { clients, loading: clientsLoading, error: clientsError } = useClients();
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { register, handleSubmit, reset, setValue } = useForm<ClientFormData>();

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setShowForm(true);
    setValue('name', client.name);
    setValue('email', client.email);
    setValue('phone', client.phone);
    setValue('address', client.address);
    setValue('notes', client.notes || '');
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await deleteDoc(doc(db, 'clients', clientId));
      setSuccess('Client deleted successfully!');
    } catch (err) {
      console.error('Error deleting client:', err);
      setError('Failed to delete client');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ClientFormData) => {
    if (!company) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editingClient) {
        // Update existing client
        await updateDoc(doc(db, 'clients', editingClient.id), {
          name: data.name,
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          notes: data.notes || '',
          updatedAt: serverTimestamp(),
        });
        setSuccess('Client updated successfully!');
      } else {
        // Add new client
        await addDoc(collection(db, 'clients'), {
          name: data.name,
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          notes: data.notes || '',
          companyId: company.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setSuccess('Client added successfully!');
      }

      reset();
      setShowForm(false);
      setEditingClient(null);
    } catch (err) {
      console.error('Error saving client:', err);
      setError(editingClient ? 'Failed to update client' : 'Failed to add client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 sm:px-0 flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your client relationships
          </p>
        </div>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            setEditingClient(null);
            reset();
          }}
          className="flex items-center"
        >
          {showForm ? (
            <>
              <X className="h-5 w-5 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-5 w-5 mr-2" />
              Add Client
            </>
          )}
        </Button>
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

      {showForm && (
        <div className="bg-white shadow sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingClient ? 'Edit Client' : 'Add New Client'}
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Client Name
                </label>
                <input
                  type="text"
                  {...register('name', { required: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  {...register('phone')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  type="text"
                  {...register('address')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? (editingClient ? 'Updating...' : 'Adding...') : (editingClient ? 'Update Client' : 'Add Client')}
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
              <h3 className="text-lg font-medium text-gray-900">Clients</h3>
              <p className="mt-2 text-sm text-gray-700">
                A list of all your clients including their name and contact information.
              </p>
            </div>
          </div>
          <div className="mt-6">
            {clientsLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : clients.length > 0 ? (
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
                        Phone
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {clients.map((client) => (
                      <tr key={client.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {client.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {client.email || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {client.phone || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {client.address || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(client)}
                            className="text-blue-600 hover:text-blue-900 mr-2"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(client.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Building className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No clients</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding your first client.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}