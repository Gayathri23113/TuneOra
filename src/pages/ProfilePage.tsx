import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth as firebaseAuth } from '../firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { Music } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [loading, user, navigate]);

  const email = user?.email || (firebaseAuth?.currentUser?.email ?? '');
  const fullName = user?.fullName || (firebaseAuth?.currentUser?.displayName ?? '');

  const handleResetPassword = async () => {
    // Deprecated: kept for compatibility but actual password change is handled
    // by the inline form below (handleChangePassword).
  };

  const handleLogout = async () => {
    setIsProcessing(true);
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      console.error('Logout failed', err);
      setMessage('Logout failed. Try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Inline change-password form state & handler ---
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showChangeForm, setShowChangeForm] = useState(false);

  const handleChangePassword = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setMessage(null);

    if (!firebaseAuth || !firebaseAuth.currentUser) {
      setMessage('Firebase not configured or no authenticated user.');
      return;
    }

    if (!oldPassword || !newPassword || !confirmPassword) {
      setMessage('Please fill all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('New password and confirmation do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('New password should be at least 6 characters.');
      return;
    }

    setIsProcessing(true);
    try {
      const user = firebaseAuth.currentUser;
      const emailForCred = user.email;
      if (!emailForCred) {
        throw new Error('No email available for current user.');
      }

      const credential = EmailAuthProvider.credential(emailForCred, oldPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setMessage('Password changed successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Change password failed', err);
      setMessage((err as Error).message || 'Failed to change password.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ fontFamily: 'Times New Roman, serif' }}>
        {/* Dashboard background gradients and lights */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#360c30] via-[#290924] to-[#1b0618]">
          <div className="absolute top-0 left-[15%] w-[400px] h-[400px] bg-[#FFE4C4]/15 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute top-0 right-[15%] w-[400px] h-[400px] bg-[#290924]/25 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        <div className="relative z-10 p-8 flex items-center justify-center min-h-screen">
          <div className="animate-in fade-in slide-in-from-top-4 duration-700">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#FFE4C4] via-white to-[#FFE4C4] bg-clip-text text-transparent mb-3"
                style={{ textShadow: '0 0 10px rgba(255, 228, 196, 0.4), 0 0 20px rgba(255, 228, 196, 0.2)' }}>
              Loading profile...
            </h2>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen relative overflow-hidden pb-32" style={{ fontFamily: 'Times New Roman, serif' }}>
      {/* Dashboard background gradients, lights, and grid floor */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#360c30] via-[#290924] to-[#1b0618]">
        <div className="absolute top-0 left-[15%] w-[400px] h-[400px] bg-[#FFE4C4]/15 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-0 right-[15%] w-[400px] h-[400px] bg-[#290924]/25 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        {/* Dramatic beams */}
        <div className="absolute top-0 left-[20%] w-2 h-full bg-gradient-to-b from-[#FFE4C4]/15 via-[#FFE4C4]/5 to-transparent blur-sm"></div>
        <div className="absolute top-0 right-[20%] w-2 h-full bg-gradient-to-b from-[#FFE4C4]/12 via-[#FFE4C4]/4 to-transparent blur-sm" style={{ animationDelay: '1.5s' }}></div>
        {/* Grid floor */}
        <div className="absolute bottom-0 left-0 right-0 h-80 bg-gradient-to-t from-[#1b0618] via-[#1b0618]/50 to-transparent">
          <div className="absolute inset-0 opacity-[0.15]" style={{
            backgroundImage: 'linear-gradient(#FFE4C4 1.5px, transparent 1.5px), linear-gradient(90deg, #FFE4C4 1.5px, transparent 1.5px)',
            backgroundSize: '60px 60px',
            transform: 'perspective(600px) rotateX(60deg)',
            transformOrigin: 'bottom',
            maskImage: 'linear-gradient(to top, black 0%, transparent 100%)'
          }}></div>
        </div>
        {/* Fog effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1b0618]/80 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(27,6,24,0.4)_100%)]"></div>
      </div>

      <div className="relative z-10 p-8 flex items-center justify-center min-h-screen">
        {/* Glassmorphism card, similar to song cards on Dashboard */}
        <div className="w-full max-w-lg group animate-in fade-in zoom-in duration-500 rounded-2xl backdrop-blur-xl bg-white/[0.03] border border-white/10 shadow-[0_8px_32px_rgba(255,228,196,0.18)] px-8 py-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-[#FFE4C4] via-white to-[#FFE4C4] bg-clip-text text-transparent text-center"
              style={{ textShadow: '0 0 10px rgba(255, 228, 196, 0.4), 0 0 20px rgba(255, 228, 196, 0.2)' }}>
            My Profile
          </h2>
          <div className="mb-6 flex flex-col items-center">
            <div className="mb-3 flex items-center justify-center">
              <Music className="w-16 h-16 text-[#FFE4C4]" />
            </div>
            <div className="w-full flex flex-col items-center">
              <strong className="text-lg font-semibold text-white/85 mb-1" style={{ textShadow: '0 0 7px #FFE4C488' }}>
                Full name
              </strong>
              <div className="text-base text-white/80">{fullName || '—'}</div>
            </div>
            <div className="w-full flex flex-col items-center mt-6">
              <strong className="text-lg font-semibold text-white/85 mb-1" style={{ textShadow: '0 0 7px #FFE4C488' }}>
                Email
              </strong>
              <div className="text-base text-white/80">{email || '—'}</div>
            </div>
          </div>

          {/* Action area: when showChangeForm is false show a Reset password button that reveals inputs;
              when true, show only the inputs (and Cancel/Logout). */}
          <div className="mt-8 flex flex-col items-center gap-6 w-full">
            {!showChangeForm ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowChangeForm(true)}
                  className={`px-6 py-2 rounded-full font-medium transition
                    bg-gradient-to-r from-[#38b000]/80 via-[#2fa400]/80 to-[#1e7a03]
                    text-white shadow-[0_0_12px_rgba(56,176,0,0.18)]
                    hover:brightness-110
                  `}
                >
                  Reset password
                </button>

                <button
                  onClick={handleLogout}
                  disabled={isProcessing}
                  className={`px-6 py-2 rounded-full font-medium transition
                    bg-gradient-to-r from-[#e53e3e]/90 via-[#e53e3e]/80 to-[#290924]
                    text-white shadow-[0_0_16px_rgba(229,62,62,0.3)]
                    hover:bg-[#e53e3e]/100
                    disabled:opacity-60 disabled:cursor-not-allowed
                  `}
                >
                  Logout
                </button>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="w-full flex flex-col items-center gap-3">
              <input
                type="password"
                placeholder="Previous password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-3/4 px-4 py-2 rounded-md bg-white/5 border border-white/10 text-white/90"
                required
              />
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-3/4 px-4 py-2 rounded-md bg-white/5 border border-white/10 text-white/90"
                required
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-3/4 px-4 py-2 rounded-md bg-white/5 border border-white/10 text-white/90"
                required
              />

              <div className="flex items-center gap-4 mt-3">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`px-6 py-2 rounded-full font-medium transition
                    bg-gradient-to-r from-[#38b000]/80 via-[#2fa400]/80 to-[#1e7a03]
                    text-white shadow-[0_0_12px_rgba(56,176,0,0.18)]
                    disabled:opacity-60 disabled:cursor-not-allowed
                  `}
                >
                  {isProcessing ? 'Processing...' : 'Change password'}
                </button>

                <button
                    type="button"
                    onClick={() => setShowChangeForm(false)}
                    disabled={isProcessing}
                    className={`px-6 py-2 rounded-full font-medium transition
                      bg-gradient-to-r from-[#e53e3e]/90 via-[#e53e3e]/80 to-[#290924]
                      text-white shadow-[0_0_16px_rgba(229,62,62,0.3)]
                      hover:bg-[#e53e3e]/100
                      disabled:opacity-60 disabled:cursor-not-allowed
                    `}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
          {message && (
            <div className={`mt-6 text-center text-base font-semibold ${message.includes('sent') ? 'text-[#38b000]' : 'text-[#ff4f68]'}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
