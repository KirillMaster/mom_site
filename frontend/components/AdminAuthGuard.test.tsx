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

jest.mock('./LoadingSpinner', () => {
  return function MockLoadingSpinner() {
    return <div data-testid="loading-spinner">Loading...</div>;
  };
});

const getToken = auth.getToken as jest.Mock;

// Every case renders the same guard around the same child and differs only in
// what auth.getToken() returns, so that is the single knob the helper exposes.
const renderGuard = (token: string | null) => {
  getToken.mockReturnValue(token);
  render(
    <AdminAuthGuard>
      <div>Заявки</div>
    </AdminAuthGuard>
  );
};

describe('AdminAuthGuard', () => {
  beforeEach(() => {
    replace.mockClear();
    getToken.mockReset();
  });

  // @S2-AS1: a logged-out visitor must not see the admin sub-page at all —
  // it redirects to /admin, where the login form lives.
  it('[S2-AS1] redirects to /admin and renders no content without a token', () => {
    renderGuard(null);

    expect(replace).toHaveBeenCalledWith('/admin');
    expect(screen.queryByText('Заявки')).not.toBeInTheDocument();
  });

  // @S2-AS1: a logged-out visitor with an empty token string receives
  // the same treatment as no token.
  it('[S2-AS1] treats empty token string same as null', () => {
    renderGuard('');

    expect(replace).toHaveBeenCalledWith('/admin');
    expect(screen.queryByText('Заявки')).not.toBeInTheDocument();
  });

  // @S2-AS1: with a token the guard is transparent.
  it('[S2-AS1] renders children and does not redirect when a token is present', () => {
    renderGuard('jwt-token');

    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByText('Заявки')).toBeInTheDocument();
  });

  // @S2-AS1: the guard shows a loading state before the token check completes,
  // preventing protected content from briefly flashing.
  it('[S2-AS1] displays loading spinner while checking token', () => {
    renderGuard(null);

    // The effect runs synchronously during render in tests, so the spinner
    // is brief, but it is the only content shown when authorization fails
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  // @S2-AS1: after token is verified, the guard renders the actual content,
  // not the spinner.
  it('[S2-AS1] hides loading spinner when token is present', () => {
    renderGuard('jwt-token');

    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    expect(screen.getByText('Заявки')).toBeInTheDocument();
  });
});
