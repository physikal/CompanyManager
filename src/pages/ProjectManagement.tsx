import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCompany } from '@/hooks/useCompany';
import { useProjects } from '@/hooks/useProjects';
import { useClients } from '@/hooks/useClients';
import { Button } from '@/components/ui/Button';
import { FolderGit2, Plus, X, Edit2, Trash2 } from 'lucide-react';
import type { Project } from '@/types';

interface ProjectFormData {
  name: string;
  clientId: string;
  description?: string;
  status: 'active' | 'completed' | 'on-hold';
}

export function ProjectManagement() {
  const { company } = useCompany();
  const { projects, loading: projectsLoading, error: projectsError } = useProjects();
  const { clients } = useClients();
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { register, handleSubmit, reset, setValue } = useForm<ProjectFormData>();

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setShowForm(true);
    setValue('name', project.name);
    setValue('clientId', project.clientId);
    setValue('description', project.description || '');
    setValue('status', project.status);
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await deleteDoc(doc(db, 'projects', projectId));
      setSuccess('Project deleted successfully!');
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProjectFormData) => {
    if (!company) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editingProject) {
        // Update existing project
        await updateDoc(doc(db, 'projects', editingProject.id), {
          name: data.name,
          clientId: data.clientId,
          description: data.description || '',
          status: data.status,
          updatedAt: serverTimestamp(),
        });
        setSuccess('Project updated successfully!');
      } else {
        // Add new project
        await addDoc(collection(db, 'projects'), {
          name: data.name,
          clientId: data.clientId,
          description: data.description || '',
          status: data.status,
          companyId: company.id,
          teamMembers: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setSuccess('Project added successfully!');
      }

      reset();
      setShowForm(false);
      setEditingProject(null);
    } catch (err) {
      console.error('Error saving project:', err);
      setError(editingProject ? 'Failed to update project' : 'Failed to add project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 sm:px-0 flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your projects and assignments
          </p>
        </div>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            setEditingProject(null);
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
              Add Project
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

      {projectsError && (
        <div className="mb-4 rounded-md bg-yellow-50 p-4">
          <div className="text-sm text-yellow-700">{projectsError}</div>
        </div>
      )}

      {showForm && (
        <div className="bg-white shadow sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingProject ? 'Edit Project' : 'Add New Project'}
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Project Name
                </label>
                <input
                  type="text"
                  {...register('name', { required: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">
                  Client
                </label>
                <select
                  {...register('clientId', { required: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select Client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  {...register('status', { required: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="on-hold">On Hold</option>
                </select>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? (editingProject ? 'Updating...' : 'Adding...') : (editingProject ? 'Update Project' : 'Add Project')}
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
              <h3 className="text-lg font-medium text-gray-900">Projects</h3>
              <p className="mt-2 text-sm text-gray-700">
                A list of all your projects including their status and client.
              </p>
            </div>
          </div>
          <div className="mt-6">
            {projectsLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : projects.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {projects.map((project) => {
                      const client = clients.find(c => c.id === project.clientId);
                      return (
                        <tr key={project.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {project.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {client?.name || 'Unknown Client'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="capitalize">{project.status}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(project)}
                              className="text-blue-600 hover:text-blue-900 mr-2"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(project.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FolderGit2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding your first project.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}