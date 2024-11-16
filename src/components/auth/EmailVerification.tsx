import { useState } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Mail } from 'lucide-react';

export function EmailVerification() {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!user || user.emailVerified) {
    return null;
  }

  const handleResend = async () => {
    if (!user) return;

    setSending(true);
    try {
      await sendEmailVerification(user);
      setSent(true);
    } catch (error) {
      console.error('Error sending verification email:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <Mail className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            Please verify your email address.
            {!sent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResend}
                disabled={sending}
                className="ml-2 underline"
              >
                {sending ? 'Sending...' : 'Resend verification email'}
              </Button>
            )}
            {sent && (
              <span className="ml-2 text-green-600">
                Verification email sent!
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}