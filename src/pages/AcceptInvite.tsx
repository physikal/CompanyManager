import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';

interface InviteData {
  email: string;
  role: string;
  companyId: string;
  companyName: string;
  status: string;
}

interface RegisterFormData {
  firstName: string;
  lastName: string;
  password: string;
  address: string;
}

export function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invite, setInvite] = useState<InviteData | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>();

  useEffect(() => {
    const fetchInvite = async () => {
      const inviteId = searchParams.get('id');
      if (!inviteId) {
        setError('Invalid invitation link');
        setLoading(false);
        return;
      }

      try {
        const inviteDoc = await getDoc(doc(db, 'invites', inviteId));
        if (!inviteDoc.exists()) {
          setError('Invitation not found');
          return;
        }

        const inviteData = inviteDoc.data() as InviteData;
        if (inviteData.status !== 'pending') {
          setError('This invitation has already been used');
          return;
        }

        setInvite(inviteData);
      } catch (err) {
        setError('Failed to load invitation');
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [searchParams]);

  const onSubmit = async (data: RegisterFormData) => {
    if (!invite) return;

    setLoading(true);
    setError('');

    try {
      // Create the user account
      const { user } = await createUserWithEmailAndPassword(
        auth,
        invite.email,
        data.password
      );

      // Create user document
      await setDoc(doc(db, 'users', user.uid), {
        email: invite.email,
        firstName: data.firstName,
        lastName: data.lastName,
        address: data.address,
        role: invite.role,
        companyId: invite.companyId,
        createdAt: new Date(),
      });

      // Update invite status
      const inviteId = searchParams.get('id');
      if (inviteId) {
        await updateDoc(doc(db, 'invites', inviteId), {
          status: 'accepted',
          acceptedAt: new Date(),
        });
      }

      // Redirect to dashboard
      navigate('/');
    } catch (err) {
      setError('Failed to create account. Please try again.');
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Error</h2>
            <p className="mt-2 text-sm text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Accept Invitation
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            You've been invited to join {invite?.companyName}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="firstName" className="sr-only">
                First Name
              </label>
              <input
                id="firstName"
                {...register('firstName', { required: true })}
                type="text"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="First Name"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="sr-only">
                Last Name
              </label>
              <input
                id="lastName"
                {...register('lastName', { required: true })}
                type="text"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Last Name"
              />
            </div>
            <div>
              <label htmlFor="address" className="sr-only">
                Address
              </label>
              <input
                id="address"
                {...register('address', { required: true })}
                type="text"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Address"
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                type="email"
                disabled
                value={invite?.email || ''}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-gray-50"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                {...register('password', { required: true, minLength: 6 })}
                type="password"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          {Object.keys(errors).length > 0 && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">
                Please fill in all required fields
              </div>
            </div>
          )}

          <div>
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Accept & Create Account'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}