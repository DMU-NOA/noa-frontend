import { useState, useEffect } from 'react';
import { Search, Globe, Loader2 } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import apiClient from '../api/client';

export default function Home() {
  const [spots, setSpots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  const fetchDefaultSpots = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/api/spots');
      setSpots(response.data);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!keyword.trim()) {
      fetchDefaultSpots(); // 검색어가 없으면 다시 기본 리스트로
      return;
    }

    try {
      setIsLoading(true);
      // 백엔드의 검색 엔드포인트 호출
      const response = await apiClient.get(`/api/spots/search?keyword=${keyword}`);
      setSpots(response.data);
    } catch (error) {
      console.error("검색 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDefaultSpots();
  }, []);
  
  return (
    <div className="w-full h-full bg-[#F8FAFC] font-['Pretendard','Noto_Sans_KR',sans-serif]">
      <header className="px-6 py-4 flex justify-between items-center bg-white shadow-sm">
        <h1 className="text-xl font-black text-blue-600 tracking-tight">NOA</h1>
        <button className="flex items-center text-xs font-semibold text-gray-500 border border-gray-200 rounded-full px-3 py-1 hover:bg-gray-50 transition-colors">
          <Globe className="w-3.5 h-3.5 mr-1.5" /> 한 / EN
        </button>
      </header>

      {/* 검색 바: 입력 및 엔터 이벤트 연결 */}
      <div className="px-6 py-3 bg-white sticky top-0 z-10">
        <div className="relative">
          <input
            type="text"
            placeholder="관광지를 검색하세요"
            className="w-full bg-gray-50 text-gray-800 rounded-xl py-3 px-5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/10 border border-gray-100 text-sm"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()} // 엔터 치면 검색 실행
          />
          <Search 
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 cursor-pointer" 
            onClick={handleSearch} // 돋보기 아이콘 클릭 시에도 검색
          />
        </div>
      </div>

      <main className="px-6 py-6 pb-24">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          {keyword ? `'${keyword}' 검색 결과` : "서울 주요 관광지"}
        </h2>
        
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <div className="py-10 flex flex-col items-center justify-center text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
              <p className="text-sm font-medium">정보를 불러오는 중입니다...</p>
            </div>
          ) : spots.length === 0 ? (
            <div className="py-10 text-center text-gray-400">
              <p className="text-sm font-medium">검색 결과가 없습니다.</p>
              <p className="text-xs mt-1">다른 키워드로 검색해 보세요.</p>
            </div>
          ) : (
            spots.map((spot) => (
              <div 
                key={spot.id} 
                className="bg-white rounded-3xl flex items-center shadow-[0_6px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden active:scale-[0.98] transition-transform" 
              >
                <div className="w-36 h-36 bg-gray-100 overflow-hidden shrink-0"> 
                  <img src={spot.image} alt={spot.name} className="w-full h-full object-cover" />
                </div>
                
                <div className="p-5 flex-1 flex flex-col gap-2"> 
                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-[16px] font-bold text-gray-900">{spot.name}</h3> 
                    <p className="text-xs text-gray-400 line-clamp-1">{spot.location}</p>
                  </div>

                  <div className="flex items-center mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${spot.dotColor} mr-2`}></span>
                    <span className={`text-xs font-bold ${spot.textColor}`}>
                      {spot.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <BottomNav activeTab="home" />
    </div>
  );
}