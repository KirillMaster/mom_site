import { render, screen, fireEvent } from '@testing-library/react';
import ExhibitionTimeline from './ExhibitionTimeline';
import { exhibitions } from '@/data/biography';

const entryFor = (year: string) => screen.getByText(year).closest('li');

describe('ExhibitionTimeline', () => {
  it('opens with the recent years and keeps the archive behind a button', () => {
    render(<ExhibitionTimeline />);

    expect(entryFor(exhibitions[0].year)).not.toHaveClass('hidden');
    // The early years stay in the markup for search engines, only out of sight.
    expect(entryFor(exhibitions[exhibitions.length - 1].year)).toHaveClass('hidden');
  });

  it('shows every year once the visitor asks for the archive', () => {
    render(<ExhibitionTimeline />);

    fireEvent.click(screen.getByRole('button', { name: /Показать ранние выставки/ }));

    expect(entryFor(exhibitions[exhibitions.length - 1].year)).not.toHaveClass('hidden');
    expect(screen.queryByRole('button', { name: /Показать ранние выставки/ })).not.toBeInTheDocument();
  });
});
