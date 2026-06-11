import { useNavigate } from 'react-router-dom';
import { LogOut, Heart, ChevronRight, Settings } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { getUser, removeToken } from '../api/auth';
import { useLanguage } from '../contexts/LanguageContext';

export default function MyPage() {
  const navigate = useNavigate();
  const user = getUser();
  const { lang } = useLanguage();

  const handleLogout = () => {
    removeToken();
    navigate('/', { replace: true });
  };

  const menuSections = [
    {
      title: lang === 'en' ? 'My Activity' : '나의 활동',
      items: [
        {
          icon: <Heart className="w-4 h-4 text-red-400" />,
          label: lang === 'en' ? 'Saved Spots' : '찜한 관광지',
          onClick: () => navigate('/mypage/likes'),
        },
      ],
    },
    {
      title: lang === 'en' ? 'Account' : '계정',
      items: [
        {
          icon: <Settings className="w-4 h-4 text-gray-400" />,
          label: lang === 'en' ? 'My Info' : '내 정보',
          onClick: () => navigate('/mypage/profile'),
        },
        {
          icon: <LogOut className="w-4 h-4 text-gray-400" />,
          label: lang === 'en' ? 'Logout' : '로그아웃',
          onClick: handleLogout,
          danger: true,
        },
      ],
    },
  ];

  return (
    <div className="w-full min-h-full bg-[#F5F6F8]">

      {/* 헤더 */}
      <header className="px-5 pt-5 pb-3">
        <h1 className="text-[18px] font-bold text-gray-900">{lang === 'en' ? 'My' : '마이'}</h1>
      </header>

      {/* 프로필 카드 */}
      <div className="mx-4 mb-4 bg-white rounded-2xl px-5 py-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <span className="text-[22px] font-bold text-blue-500">
            {(user?.name ?? (lang === 'en' ? 'T' : '여'))[0]}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[17px] font-bold text-gray-900">
            {user?.name ?? (lang === 'en' ? 'Traveler' : '여행자')}{lang === 'ko' ? '님' : ''}
          </h2>
          <p className="text-[12px] text-gray-400 mt-0.5 truncate">{user?.email ?? ''}</p>
        </div>
      </div>

      {/* 메뉴 섹션 */}
      {menuSections.map((section) => (
        <div key={section.title} className="mx-4 mb-3">
          <p className="text-[11px] font-semibold text-gray-400 mb-1.5 px-1">{section.title}</p>
          <div className="bg-white rounded-2xl overflow-hidden">
            {section.items.map((item, i) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className={`w-full flex items-center gap-3 px-5 py-4 active:bg-gray-50 transition-colors ${i !== 0 ? 'border-t border-gray-50' : ''}`}
              >
                {item.icon}
                <span className={`text-[14px] font-medium flex-1 text-left ${item.danger ? 'text-red-400' : 'text-gray-700'}`}>
                  {item.label}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            ))}
          </div>
        </div>
      ))}

      <BottomNav />
    </div>
  );
}
