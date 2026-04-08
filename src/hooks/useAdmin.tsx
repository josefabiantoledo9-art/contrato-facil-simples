import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { checkIsAdmin } from '@/services/admin';

export function useAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    checkIsAdmin().then((result) => {
      if (!cancelled) {
        setIsAdmin(result);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [user, authLoading]);

  return { isAdmin, loading: loading || authLoading };
}
