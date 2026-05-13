import { Search, Globe } from 'lucide-react';
import BottomNav from '../components/BottomNav';

// 더미 데이터 (추후 API 연동 시 이 구조로 매핑됩니다)
const TOURIST_SPOTS = [
  {
    id: 1,
    name: '경복궁',
    location: '서울 종로구',
    status: '혼잡',
    dotColor: 'bg-red-500',
    textColor: 'text-red-600',
    // 고화질 이미지 URL로 대체 (실제 데이터 수신 시 firstimage 등과 매핑)
    image: 'https://images.unsplash.com/photo-1570191913384-60292834b6e2?q=80&w=300'
  },
  {
    id: 2,
    name: '북촌 한옥마을',
    location: '서울 종로구',
    status: '보통',
    dotColor: 'bg-orange-400',
    textColor: 'text-orange-600',
    image: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=300'
  },
  {
    id: 3,
    name: '명동',
    location: '서울 중구',
    status: '여유',
    dotColor: 'bg-green-500',
    textColor: 'text-green-600',
    image: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?q=80&w=300'
  }
];

export default function Home() {
  return (
    <div className="w-full h-full bg-[#F8FAFC] font-['Pretendard','Noto_Sans_KR',sans-serif]">
      <header className="px-6 py-4 flex justify-between items-center bg-white shadow-sm">
        <h1 className="text-xl font-black text-blue-600 tracking-tight">NOA</h1>
        <button className="flex items-center text-xs font-semibold text-gray-500 border border-gray-200 rounded-full px-3 py-1 hover:bg-gray-50 transition-colors">
          <Globe className="w-3.5 h-3.5 mr-1.5" /> 한 / EN
        </button>
      </header>

      <div className="px-6 py-3 bg-white sticky top-0 z-10">
        <div className="relative">
          <input
            type="text"
            placeholder="관광지를 검색하세요"
            className="w-full bg-gray-50 text-gray-800 rounded-xl py-3 px-5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/10 border border-gray-100 text-sm"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
      </div>

      <main className="px-6 py-6 pb-24">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          서울 주요 관광지
        </h2>
        
        <div className="flex flex-col gap-4">
          {TOURIST_SPOTS.map((spot) => (
            <div 
              key={spot.id} 
              className="bg-white rounded-3xl flex items-center shadow-[0_6px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden active:scale-[0.98] transition-transform" 
            >
            
              <div className="w-36 h-36 bg-gray-100 overflow-hidden flex-shrink-0"> 
                <img src={spot.image} alt={spot.name} className="w-full h-full object-cover" />
              </div>
              

              <div className="p-5 flex-1 flex flex-col gap-2"> 
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-[16px] font-bold text-gray-900">{spot.name}</h3> 
                  <p className="text-xs text-gray-400">{spot.location}</p>
                </div>

                <div className="flex items-center mt-0.5">
    <span className={`w-2 h-2 rounded-full ${spot.dotColor} mr-2`}></span>
    <span className={`text-xs font-bold ${spot.textColor}`}>
      {spot.status}
    </span>
  </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <BottomNav activeTab="home" />
    </div>
  );
}