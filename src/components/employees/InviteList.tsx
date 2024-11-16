import { useInvites } from '@/hooks/useInvites';
import { Button } from '@/components/ui/Button';
import { Mail, Clock } from 'lucide-react';

export function InviteList() {
  const { invites, loading } = useInvites();

  if (loading) return null;

  if (invites.length === 0) return null;

  return (
    <div className="mt-6 bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900">Pending Invites</h3>
        <div className="mt-4 divide-y divide-gray-200">
          {invites.map((invite) => (
            <div key={invite.id} className="py-4 flex items-center justify-between">
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-gray-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{invite.email}</p>
                  <p className="text-sm text-gray-500">Role: {invite.role}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-500">
                  {new Date(invite.createdAt).toLocaleDateString()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-4"
                  onClick={() => {/* Implement resend invite */}}
                >
                  Resend
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}