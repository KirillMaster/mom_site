import { ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';

export interface ContactFormState {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  website: string;
}

interface Props {
  formData: ContactFormState;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent) => void;
  isSubmitting: boolean;
  submissionResult: 'success' | 'error' | null;
  errorMessage: string;
  validationError: string | null;
}

const ContactFormFields = ({
  formData, onChange, onSubmit, isSubmitting, submissionResult, errorMessage, validationError,
}: Props) => (
  <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {/*
        Honeypot anti-spam field (@S3-AS1/@S3-AS2). Kept in the
        accessibility tree removed and out of the tab order so
        screen-reader/keyboard users never encounter it, but not
        display:none/visibility:hidden, since some bots skip
        fields hidden that way. Left empty by humans; any bot
        that fills every input trips it and the server silently
        discards the submission.
      */}
      <div
        style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}
        aria-hidden="true"
      >
        <label htmlFor="website">Website</label>
        <input
          type="text"
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={formData.website}
          onChange={onChange}
        />
      </div>
  
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Имя *
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={onChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={onChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>
  
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
          Телефон или мессенджер
        </label>
        <input
          type="tel"
          id="phone"
          value={formData.phone}
          onChange={onChange}
          placeholder="Телефон, Telegram, WhatsApp или MAX"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
        />
        <p className="text-xs text-gray-500 mt-1">Укажите телефон, мессенджер или email — как вам удобнее получить ответ.</p>
      </div>
  
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
          Тема
        </label>
        <input
          type="text"
          id="subject"
          value={formData.subject}
          onChange={onChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
        />
      </div>
  
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
          Сообщение *
        </label>
        <textarea
          id="message"
          rows={6}
          required
          value={formData.message}
          onChange={onChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all duration-200"
        ></textarea>
      </div>
  
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Отправка...' : 'Отправить сообщение'}
      </button>
      <p className="text-xs text-gray-500 text-center mt-3">
        Отправляя форму, вы соглашаетесь с{' '}
        <Link href="/privacy" className="underline hover:text-gray-700">
          политикой конфиденциальности
        </Link>
      </p>
      {submissionResult === 'success' && (
        <p className="text-green-600 text-center mt-4">Сообщение успешно отправлено!</p>
      )}
      {submissionResult === 'error' && (
        <p className="text-red-600 text-center mt-4">{errorMessage}</p>
      )}
      {validationError && (
        <p role="alert" className="text-red-600 text-center mt-4">{validationError}</p>
      )}
    </form>
);

export default ContactFormFields;
