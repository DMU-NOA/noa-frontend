import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Map, User, Bot } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext'; // 💡 언어 상태 가져오기

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation(); 
  const { lang } = useLanguage(); // 💡 언어 상태 꺼내기

  const getActiveTab = (path) => {
    if (path.startsWith('/chat')) return 'chat';
    if (path.startsWith('/map')) return 'map';
    if (path.startsWith('/login') || path.startsWith('/mypage')) return 'my';
    if (path === '/' || path.startsWith('/spots') || path.startsWith('/alternatives')) return 'home';
    return '';
  };

  const activeTab = getActiveTab(location.pathname);

  // 💡 라벨에 다국어(lang) 조건 적용
  const menus = [
    { id: 'home', icon: Home, label: lang === 'en' ? 'Home' : '홈', path: '/', activeColor: 'text-blue-500' },
    { id: 'chat', icon: Bot, label: lang === 'en' ? 'AI Assistant' : 'AI 비서', path: '/chat', activeColor: 'text-blue-500' },
    { id: 'map', icon: Map, label: lang === 'en' ? 'Map' : '지도', path: '/map', activeColor: 'text-blue-500' }, 
    { id: 'my', icon: User, label: lang === 'en' ? 'My' : '마이', path: '/mypage', activeColor: 'text-blue-500' },
  ];

  const handleNavigation = (path) => {
    if (path !== '#') {
      navigate(path);
    }
  };

  return (
    <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-100 flex justify-around py-3 z-50 shadow-[0_-2px_20px_rgba(0,0,0,0.02)] pb-safe">
      {menus.map((menu) => {
        const Icon = menu.icon;
        const isActive = activeTab === menu.id;

        return (
          <div
            key={menu.id}
            onClick={() => handleNavigation(menu.path)}
            className={`flex flex-col items-center justify-center w-16 gap-1 cursor-pointer transition-all duration-300 ${
              isActive ? menu.activeColor : 'text-gray-400 hover:text-gray-500'
            }`}
          >
            <div className={`relative transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}>
              <Icon
                className="w-6 h-6 transition-colors duration-300"
                strokeWidth={isActive ? 2.5 : 2}
              />
              {isActive && (
                <span className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${menu.activeColor.replace('text-', 'bg-')} animate-in zoom-in`} />
              )}
            </div>
            <span className={`text-[10px] font-bold transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-80 font-semibold'}`}>
              {menu.label}
            </span>
          </div>
        );
      })}
    </nav>
  );
}