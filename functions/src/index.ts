import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

admin.initializeApp();

// Configure nodemailer with your email service
const transporter = nodemailer.createTransport({
  // Configure your email service here
  // For example, using Gmail:
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const sendEmployeeInvite = functions.https.onCall(async (data, context) => {
  // Verify the caller is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to send invites'
    );
  }

  const { inviteId, email, companyName } = data;

  try {
    // Get the company data to verify the sender has permission
    const callerDoc = await admin.firestore()
      .collection('users')
      .doc(context.auth.uid)
      .get();
    
    const callerData = callerDoc.data();
    if (!callerData || !['admin', 'manager'].includes(callerData.role)) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Must be an admin or manager to send invites'
      );
    }

    // Send the invitation email
    const inviteUrl = `${process.env.APP_URL}/accept-invite?id=${inviteId}`;
    
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Invitation to join ${companyName}`,
      html: `
        <h2>You've been invited to join ${companyName}</h2>
        <p>Click the link below to accept the invitation and create your account:</p>
        <a href="${inviteUrl}">${inviteUrl}</a>
        <p>This invitation will expire in 7 days.</p>
      `
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending invite:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to send invitation'
    );
  }
});