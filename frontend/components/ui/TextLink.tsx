import Link from 'next/link';
import type { AnchorHTMLAttributes } from 'react';
import { cx } from './cx';

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export default function TextLink({ className, ...rest }: Props) {
  return (
    <Link
      {...rest}
      className={cx(
        'text-sea underline underline-offset-4 hover:text-sea-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sea',
        className,
      )}
    />
  );
}
