import { render, screen, fireEvent } from '@testing-library/react';
import ExhibitionTimeline from './ExhibitionTimeline';
import { exhibitions } from '@/data/biography';

describe('ExhibitionTimeline', () => {
  it('opens with the recent years and keeps the archive behind a button', () => {
    render(<ExhibitionTimeline />);

    expect(screen.getByText(exhibitions[0].year)).toBeInTheDocument();
    expect(screen.queryByText(exhibitions[exhibitions.length - 1].year)).not.toBeInTheDocument();
  });

  it('shows every year once the visitor asks for the archive', () => {
    render(<ExhibitionTimeline />);

    fireEvent.click(screen.getByRole('button', { name: /Показать ранние выставки/ }));

    expect(screen.getByText(exhibitions[exhibitions.length - 1].year)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Показать ранние выставки/ })).not.toBeInTheDocument();
  });
});
