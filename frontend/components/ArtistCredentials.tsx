'use client';

import { Award } from 'lucide-react';
import { credentials } from '@/data/biography';

/**
 * Memberships and awards, as cards. A buyer deciding on a painting reads this
 * as proof the work is worth its price, so it appears on both the home page
 * and the about page.
 */
const ArtistCredentials = ({ limit }: { limit?: number }) => {
  const shown = typeof limit === 'number' ? credentials.slice(0, limit) : credentials;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {shown.map((credential, index) => (
        <div
          key={credential.title}
          className="reveal bg-paper-50 rounded-md border border-line p-6 h-full"
        >
          <Award className="w-8 h-8 text-ochre-700 mb-3" />
          <h3 className="text-lg font-semibold mb-2">
            {credential.title}
          </h3>
          <p className="text-sm text-ink-500 leading-relaxed">{credential.detail}</p>
        </div>
      ))}
    </div>
  );
};

export default ArtistCredentials;
