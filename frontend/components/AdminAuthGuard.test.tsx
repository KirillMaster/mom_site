import { render, screen } from '@testing-library/react';
import AdminAuthGuard from './AdminAuthGuard';
import { auth } from '@/lib/api';
import LoadingSpinner from './LoadingSpinner';

const replace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: (url: string) => replace(url) }),
}));

jest.mock('@/lib/api', () => ({
  auth: { getToken: jest.fn() },
}));

jest.mock('./LoadingSpinner', () => {
  return function MockLoadingSpinner() {
    return <div data-testid="loading-spinner">Loading...</div>;
  };
});

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

  // @S2-AS1: a logged-out visitor with an empty token string receives
  // the same treatment as no token.
  it('[S2-AS1] treats empty token string same as null', () => {
    getToken.mockReturnValue('');

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

  // @S2-AS1: the guard shows a loading state before the token check completes,
  // preventing protected content from briefly flashing.
  it('[S2-AS1] displays loading spinner while checking token', () => {
    getToken.mockReturnValue(null);

    render(
      <AdminAuthGuard>
        <div>Заявки</div>
      </AdminAuthGuard>
    );

    // The effect runs synchronously during render in tests, so the spinner
    // is brief, but it is the only content shown when authorization fails
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  // @S2-AS1: after token is verified, the guard renders the actual content,
  // not the spinner.
  it('[S2-AS1] hides loading spinner when token is present', () => {
    getToken.mockReturnValue('jwt-token');

    render(
      <AdminAuthGuard>
        <div>Заявки</div>
      </AdminAuthGuard>
    );

    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    expect(screen.getByText('Заявки')).toBeInTheDocument();
  });
});
