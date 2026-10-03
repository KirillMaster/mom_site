import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cx } from './cx';
import { Field, fieldClasses, useFieldIds } from './Field';

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string };

const Input = forwardRef<HTMLInputElement, Props>(function Input({ label, error, hint, className, id, ...rest }, ref) {
  const ids = useFieldIds(id, error, hint);
  return (
    <Field label={label} error={error} hint={hint} ids={ids}>
      <input
        {...rest}
        ref={ref}
        id={ids.field}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        className={cx(fieldClasses, className)}
      />
    </Field>
  );
});

export default Input;
