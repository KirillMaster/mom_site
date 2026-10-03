import { Mail, Phone } from 'lucide-react';

interface ContactDetailsCardProps {
  email?: string;
  phone?: string;
}

const ContactDetailsCard = ({ email, phone }: ContactDetailsCardProps) => (
  <div className="reveal bg-paper-50 border border-line p-8 rounded-md">
    <h2 className="text-3xl md:text-4xl font-serif font-semibold mb-8 text-ink">
      Мои контакты
    </h2>

    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-sea rounded-full flex items-center justify-center">
          <Mail className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-ink">Email</h3>
          <a
            href={`mailto:${email || ''}`}
            className="text-sea underline underline-offset-4 hover:text-sea-700 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sea"
          >
            {email}
          </a>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-sea rounded-full flex items-center justify-center">
          <Phone className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-ink">Телефон</h3>
          <a
            href={`tel:${phone || ''}`}
            className="text-sea underline underline-offset-4 hover:text-sea-700 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sea"
          >
            {phone}
          </a>
        </div>
      </div>
    </div>
  </div>
);

export default ContactDetailsCard;
