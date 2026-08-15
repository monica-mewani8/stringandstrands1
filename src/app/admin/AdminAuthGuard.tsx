import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase';

interface Props { children: React.ReactNode; }

export default function AdminAuthGuard({ children }: Props) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'denied'>('loading');
  const navigate = useNavigate();

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setStatus('denied'); navigate('/'); return; }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

      if (!profile?.is_admin) { setStatus('denied'); navigate('/'); return; }
      setStatus('ok');
    }
    check();
  }, [navigate]);

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#fdf2f4' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: '#b3184f', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>Verifying access…</p>
        </div>
      </div>
    );
  }

  if (status === 'denied') return null;
  return <>{children}</>;
}
