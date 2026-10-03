import type { HTMLAttributes } from 'react';
import { cx } from './cx';

export default function Section({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return <section {...rest} className={cx('py-16 md:py-24', className)} />;
}
