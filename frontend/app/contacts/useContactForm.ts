import { useState } from 'react';
import { sendContactMessage } from '@/hooks/useApi';
import { getStoredUtm } from '@/lib/utm';
import { Goals, reachGoal } from '@/lib/analytics';
import type { ContactFormState } from './ContactFormFields';

const DEFAULT_ERROR = 'Произошла ошибка при отправке сообщения.';
const RATE_LIMIT_ERROR = 'Слишком много запросов. Пожалуйста, попробуйте немного позже.';

const EMPTY_FORM: ContactFormState = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
  website: '',
};

const errorToMessage = (error: unknown): string => {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return status === 429 ? RATE_LIMIT_ERROR : DEFAULT_ERROR;
};

export const useContactForm = (initial: Pick<ContactFormState, 'subject' | 'message'>) => {
  const [formData, setFormData] = useState<ContactFormState>({ ...EMPTY_FORM, ...initial });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<'success' | 'error' | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>(DEFAULT_ERROR);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const submit = async () => {
    const utm = getStoredUtm();
    await sendContactMessage({ ...formData, ...utm });
    reachGoal(Goals.ContactFormSubmit, { ...utm });
    setSubmissionResult('success');
    alert('Сообщение успешно отправлено!');
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim() && !formData.phone.trim()) {
      setValidationError('Укажите телефон, мессенджер или email');
      return;
    }
    setValidationError(null);
    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      await submit();
    } catch (error: unknown) {
      const message = errorToMessage(error);
      setSubmissionResult('error');
      setErrorMessage(message);
      alert(message);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { formData, isSubmitting, submissionResult, validationError, errorMessage, handleInputChange, handleSubmit };
};
