import { useNavigate } from 'react-router-dom';
import { Home, Search, Map, User } from 'lucide-react';

export default function BottomNav({ activeTab }) {
  const navigate = useNavigate();

  const menus = [
    { id: 'home', icon: Home, label: '홈', path: '/' },
    { id: 'search', icon: Search, label: '검색', path: '#' }, // 나중에 구현
    { id: 'map', icon: Map, label: '지도', path: '/map' }, // 나중에 구현
    { id: 'my', icon: User, label: '마이', path: '/login' },
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
          className={`flex flex-col items-center ${activeTab === menu.id ? 'text-blue-500' : 'text-gray-400'}`}
        >
          <menu.icon className="w-6 h-6 mb-1" />
          <span className="text-[10px]">{menu.label}</span>
        </button>
      ))}
    </nav>
  );
}