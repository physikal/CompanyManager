import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Building, Users, ArrowRight } from 'lucide-react';
import type { Company } from '@/types';

export function CompanyCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<'company' | 'employees'>('company');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [companyData, setCompanyData] = useState<Partial<Company> | null>(null);

  const handleCompanySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.currentTarget);
    setLoading(true);
    setError('');

    try {
      const companiesRef = collection(db, 'companies');
      const newCompanyRef = doc(companiesRef);
      
      const newCompanyData: Partial<Company> = {
        id: newCompanyRef.id,
        name: formData.get('name') as string,
        address: formData.get('address') as string,
        primaryContact: {
          name: formData.get('contactName') as string,
          email: formData.get('contactEmail') as string,
          phone: formData.get('contactPhone') as string,
        },
        users: [user.uid],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(newCompanyRef, newCompanyData);
      await updateDoc(doc(db, 'users', user.uid), {
        companyId: newCompanyRef.id,
        role: 'admin',
        updatedAt: serverTimestamp()
      });

      setCompanyData(newCompanyData);
      setStep('employees');
    } catch (err) {
      console.error('Error creating company:', err);
      setError('Failed to create company. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/');
  };

  if (step === 'employees') {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-blue-600" />
              <h2 className="mt-4 text-2xl font-bold text-gray-900">
                Invite Team Members
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Would you like to invite team members to {companyData?.name}?
              </p>
            </div>

            <div className="mt-8 flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="flex items-center"
              >
                Skip for now
              </Button>
              <Button
                onClick={() => navigate('/employees')}
                className="flex items-center"
              >
                Invite Team Members
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center mb-6">
            <Building className="mx-auto h-12 w-12 text-blue-600" />
            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              Create Your Company
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Let's get started by setting up your company profile
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <form onSubmit={handleCompanySubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Company Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                name="address"
                id="address"
                required
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Primary Contact Information
              </h2>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    name="contactName"
                    id="contactName"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    id="contactEmail"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    id="contactPhone"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                className="mr-3"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Company'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}