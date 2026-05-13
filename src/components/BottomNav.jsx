import { Home, Search, Map, User } from 'lucide-react';

export default function BottomNav({ activeTab }) {
  const menus = [
    { id: 'home', icon: Home, label: '홈' },
    { id: 'search', icon: Search, label: '검색' },
    { id: 'map', icon: Map, label: '지도' },
    { id: 'my', icon: User, label: '마이' },
  ];

  return (
    <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-100 flex justify-around py-3 z-50">
      {menus.map((menu) => (
        <button 
          key={menu.id}
          className={`flex flex-col items-center ${activeTab === menu.id ? 'text-blue-500' : 'text-gray-400'}`}
        >
          <menu.icon className="w-6 h-6 mb-1" />
          <span className="text-[10px]">{menu.label}</span>
        </button>
      ))}
    </nav>
  );
}