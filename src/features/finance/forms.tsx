import { useId, useRef, useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Feedback } from '../../components/feedback';
import { ApiError } from '../../api/client';
export function Field({
  label,
  children,
  ...props
}: ComponentProps<'input'> & { label: string; children?: ReactNode }) {
  const id = useId();
  return (
    <div className="finance-field">
      <Label htmlFor={id}>{label}</Label>
      {children ? (
        <select
          id={id}
          className="finance-select"
          name={props.name}
          required={props.required}
          defaultValue={props.defaultValue}
          disabled={props.disabled}
        >
          {children}
        </select>
      ) : (
        <Input id={id} {...props} />
      )}
    </div>
  );
}
export function FinanceForm({
  submit,
  children,
  button = 'Salvar',
  reset = true,
}: {
  submit: (data: FormData) => Promise<unknown>;
  children: ReactNode;
  button?: string;
  reset?: boolean;
}) {
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  return (
    <form
      className="finance-form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (inFlight.current) return;
        const form = event.currentTarget;
        const data = new FormData(form);
        inFlight.current = true;
        setBusy(true);
        setError('');
        setMessage('');
        try {
          await submit(data);
          if (reset) form.reset();
          setMessage('Registro salvo.');
        } catch (failure) {
          setError(
            failure instanceof ApiError
              ? failure.message
              : failure instanceof Error && failure.name !== 'ZodError'
                ? failure.message
                : 'Confira os campos informados.',
          );
        } finally {
          inFlight.current = false;
          setBusy(false);
        }
      }}
    >
      <fieldset disabled={busy} className="finance-fields">
        {children}
      </fieldset>
      <div className="ui-form-feedback">{error && <Feedback>{error}</Feedback>}
      {message && <Feedback success>{message}</Feedback>}</div>
      <Button disabled={busy} type="submit">
        {busy ? 'Salvando…' : button}
      </Button>
    </form>
  );
}
