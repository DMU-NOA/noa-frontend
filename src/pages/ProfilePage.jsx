import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, User } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { getUser } from '../api/auth';
import { useLanguage } from '../contexts/LanguageContext';

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = getUser();
  const { lang } = useLanguage();

  const fields = [
    {
      icon: <User className="w-4 h-4 text-gray-400" />,
      label: lang === 'en' ? 'Name' : '이름',
      value: user?.name ?? (lang === 'en' ? 'Traveler' : '여행자'),
    },
    {
      icon: <Mail className="w-4 h-4 text-gray-400" />,
      label: lang === 'en' ? 'Email' : '이메일',
      value: user?.email ?? '-',
    },
  ];

  return (
    <div className="w-full min-h-full bg-[#F5F6F8]">
      <header className="px-5 py-4 bg-white flex items-center gap-3 border-b border-gray-50">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-full active:bg-gray-100 transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-[17px] font-bold text-gray-900">{lang === 'en' ? 'My Info' : '내 정보'}</h1>
      </header>

      {/* 아바타 */}
      <div className="flex flex-col items-center pt-10 pb-6">
        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-3">
          <span className="text-[32px] font-bold text-blue-500">
            {(user?.name ?? (lang === 'en' ? 'T' : '여'))[0]}
          </span>
        </div>
        <p className="text-[17px] font-bold text-gray-900">
          {user?.name ?? (lang === 'en' ? 'Traveler' : '여행자')}
        </p>
      </div>

      {/* 정보 목록 */}
      <div className="mx-4">
        <div className="bg-white rounded-2xl overflow-hidden">
          {fields.map((field, i) => (
            <div
              key={field.label}
              className={`flex items-center gap-4 px-5 py-4 ${i !== 0 ? 'border-t border-gray-50' : ''}`}
            >
              {field.icon}
              <div className="flex-1">
                <p className="text-[11px] font-semibold text-gray-400 mb-0.5">{field.label}</p>
                <p className="text-[14px] font-medium text-gray-800">{field.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
