import { forwardRef, useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { cx } from './cx';
import { Field, fieldClasses, useFieldIds } from './Field';

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string; hint?: string };

const Textarea = forwardRef<HTMLTextAreaElement, Props>(function Textarea(
  { label, error, hint, className, id, ...rest },
  ref,
) {
  const ids = useFieldIds(useId(), id, error, hint);
  return (
    <Field label={label} error={error} hint={hint} ids={ids}>
      <textarea
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

export default Textarea;
