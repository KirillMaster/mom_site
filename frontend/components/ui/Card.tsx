import type { HTMLAttributes } from 'react';
import { cx } from './cx';

export default function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={cx('rounded-md border border-line bg-paper-50', className)} />;
}
