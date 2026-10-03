import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';
import { cx } from './cx';

type Variant = 'primary' | 'secondary' | 'ghost';

const base =
  'inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sea focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:opacity-50 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  primary: 'bg-sea text-white hover:bg-sea-700',
  secondary: 'border border-sea text-sea hover:bg-sea-50',
  ghost: 'text-sea hover:underline',
};

type CommonProps = { variant?: Variant };
type LinkProps = CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
type NativeProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

export default function Button(props: LinkProps | NativeProps) {
  const { variant = 'primary', className, ...rest } = props;
  const classes = cx(base, variants[variant], className);
  if (typeof rest.href === 'string') {
    return <Link {...(rest as AnchorHTMLAttributes<HTMLAnchorElement> & { href: string })} className={classes} />;
  }
  const { type = 'button', ...btn } = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return <button type={type} {...btn} className={classes} />;
}
