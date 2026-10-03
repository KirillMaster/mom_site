import { Mail, Phone } from 'lucide-react';

interface ContactDetailsCardProps {
  email?: string;
  phone?: string;
}

const ContactDetailsCard = ({ email, phone }: ContactDetailsCardProps) => (
  <div className="reveal bg-gray-50 p-8 rounded-lg shadow-lg">
    <h2 className="text-3xl md:text-4xl font-serif font-bold mb-8 text-gray-900">
      Мои контакты
    </h2>

    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
          <Mail className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Email</h3>
          <a
            href={`mailto:${email || ''}`}
            className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
          >
            {email}
          </a>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-md">
          <Phone className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Телефон</h3>
          <a
            href={`tel:${phone || ''}`}
            className="text-green-600 hover:text-green-800 transition-colors duration-200"
          >
            {phone}
          </a>
        </div>
      </div>
    </div>
  </div>
);

export default ContactDetailsCard;
