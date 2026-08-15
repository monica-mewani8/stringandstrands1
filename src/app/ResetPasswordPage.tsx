import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Lock, CheckCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // When arriving at this page, Supabase auth uses the #access_token fragment 
    // in the URL to establish a temporary session for password reset.
    // Ensure we actually have the required hash in the URL to show user errors early.
    if (!window.location.hash.includes('access_token') && !window.location.hash.includes('error=')) {
      // NOTE: We might also be here if the session is already active.
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await updatePassword(password);
      if (error) throw new Error(error);
      setSuccess(true);
      setTimeout(() => navigate('/'), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF0F5] flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(255,45,116,0.15)] w-full max-w-md p-8 relative">
          {!success ? (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-[#FFD1E3] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock size={24} className="text-[#FF2D74]" />
                </div>
                <h2 className="text-2xl font-bold text-[#FF2D74] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Set New Password
                </h2>
                <p className="text-sm text-[#D41E5C]">
                  Please enter your new password below.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFD1E3]" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New Password" required minLength={6} className="w-full pl-10 pr-4 py-3.5 bg-white border-2 border-[#FFD1E3] rounded-2xl text-[#B3184F] placeholder-[#FFD1E3] focus:outline-none focus:border-[#FF2D74] transition-colors text-sm" />
                </div>
                
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFD1E3]" />
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" required minLength={6} className="w-full pl-10 pr-4 py-3.5 bg-white border-2 border-[#FFD1E3] rounded-2xl text-[#B3184F] placeholder-[#FFD1E3] focus:outline-none focus:border-[#FF2D74] transition-colors text-sm" />
                </div>

                {error && <p className="text-xs text-[#FF2D74] bg-[#FFD1E3]/50 px-4 py-2 rounded-xl">{error}</p>}
                
                <button type="submit" disabled={loading} className="w-full py-3.5 bg-[#FF2D74] text-white rounded-2xl font-bold text-sm tracking-wide hover:bg-[#D41E5C] transition-all shadow-[0_4px_14px_rgba(255,45,116,0.3)] hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0">
                  {loading ? 'Updating…' : 'Update Password ✨'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-[#FFD1E3] rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={32} className="text-[#FF2D74]" />
              </div>
              <h2 className="text-2xl font-bold text-[#FF2D74] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                Password Updated!
              </h2>
              <p className="text-sm text-[#D41E5C] mb-6">Your password has been successfully updated.</p>
              <p className="text-xs text-[#D41E5C]/70">Redirecting to homepage...</p>
              <button onClick={() => navigate('/')} className="mt-6 w-full py-3 bg-[#FF2D74] text-white rounded-2xl font-bold text-sm hover:bg-[#D41E5C] transition-colors">
                Go to Homepage
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
