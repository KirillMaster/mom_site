import { render, screen } from '@testing-library/react';
import AdminAuthGuard from './AdminAuthGuard';
import { auth } from '@/lib/api';

const replace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: (url: string) => replace(url) }),
}));

jest.mock('@/lib/api', () => ({
  auth: { getToken: jest.fn() },
}));

const getToken = auth.getToken as jest.Mock;

describe('AdminAuthGuard', () => {
  beforeEach(() => {
    replace.mockClear();
    getToken.mockReset();
  });

  // @S2-AS1: a logged-out visitor must not see the admin sub-page at all —
  // it redirects to /admin, where the login form lives.
  it('[S2-AS1] redirects to /admin and renders no content without a token', () => {
    getToken.mockReturnValue(null);

    render(
      <AdminAuthGuard>
        <div>Заявки</div>
      </AdminAuthGuard>
    );

    expect(replace).toHaveBeenCalledWith('/admin');
    expect(screen.queryByText('Заявки')).not.toBeInTheDocument();
  });

  // @S2-AS1: with a token the guard is transparent.
  it('[S2-AS1] renders children and does not redirect when a token is present', () => {
    getToken.mockReturnValue('jwt-token');

    render(
      <AdminAuthGuard>
        <div>Заявки</div>
      </AdminAuthGuard>
    );

    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByText('Заявки')).toBeInTheDocument();
  });
});
