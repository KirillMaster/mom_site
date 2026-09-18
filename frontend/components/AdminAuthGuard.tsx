'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';

interface AdminAuthGuardProps {
  children: ReactNode;
}

/**
 * Blocks rendering of an admin sub-page until a token is present, redirecting
 * to /admin otherwise. The login form lives on /admin itself — there is no
 * separate /admin/login route in this application.
 *
 * The API rejects unauthenticated admin requests with 401 regardless, so this
 * guard is about not showing a broken page to a logged-out visitor, not about
 * protecting the data.
 */
const AdminAuthGuard = ({ children }: AdminAuthGuardProps) => {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (auth.getToken()) {
      setIsAuthorized(true);
    } else {
      router.replace('/admin');
    }
  }, [router]);

  if (!isAuthorized) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
};

export default AdminAuthGuard;
