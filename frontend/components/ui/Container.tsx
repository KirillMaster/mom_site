import type { HTMLAttributes } from 'react';
import { cx } from './cx';

export default function Container({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={cx('mx-auto w-full max-w-6xl px-4', className)} />;
}
