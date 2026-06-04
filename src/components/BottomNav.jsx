import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Map, User, Sparkles } from 'lucide-react';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation(); 

  const getActiveTab = (path) => {
    if (path.startsWith('/chat')) return 'chat';
    if (path.startsWith('/map')) return 'map';
    if (path.startsWith('/login') || path.startsWith('/mypage')) return 'my';
    if (path === '/' || path.startsWith('/spots') || path.startsWith('/alternatives')) return 'home';
    return '';
  };

  const activeTab = getActiveTab(location.pathname);

  const menus = [
    { id: 'home', icon: Home, label: '홈', path: '/', activeColor: 'text-blue-500' },
    // 💡 AI 비서 색상도 text-blue-500으로 통일!
    { id: 'chat', icon: Sparkles, label: 'AI 비서', path: '/chat', activeColor: 'text-blue-500' }, 
    { id: 'map', icon: Map, label: '지도', path: '/map', activeColor: 'text-blue-500' }, 
    { id: 'my', icon: User, label: '마이', path: '/login', activeColor: 'text-blue-500' },
  ];

  const handleNavigation = (path) => {
    if (path !== '#') {
      navigate(path);
    }
  };

  return (
    <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-100 flex justify-around py-3 z-50">
      {menus.map((menu) => (
        <button 
          key={menu.id}
          onClick={() => handleNavigation(menu.path)}
          className={`flex flex-col items-center transition-colors ${
            activeTab === menu.id ? menu.activeColor : 'text-gray-400'
          }`}
        >
          <menu.icon className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">{menu.label}</span>
        </button>
      ))}
    </nav>
  );
}