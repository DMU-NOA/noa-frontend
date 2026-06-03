import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Globe, Loader2 } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import apiClient from '../api/client';

export default function Home() {
  const navigate = useNavigate();
  const [spots, setSpots] = useState([]);
  const [recommendations, setRecommendations] = useState([]); // 💡 추천 목록 상태 추가
  const [isLoading, setIsLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  // 기본 목록 불러오기
  const fetchDefaultSpots = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/api/spots');
      setSpots(response.data.data);
      setRecommendations([]); // 검색 결과 초기화
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 검색 로직
  const handleSearch = async () => {
    if (!keyword.trim()) {
      fetchDefaultSpots();
      return;
    }

    try {
      setIsLoading(true);
      // 백엔드의 새로운 검색 API 구조에 맞춰 results와 recommendations를 받음
      const response = await apiClient.get(`/api/spots/search?keyword=${keyword}`);
      setSpots(response.data.results);
      setRecommendations(response.data.recommendations);
    } catch (error) {
      console.error("검색 실패:", error);
      setSpots([]);
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

const getCongestionStyle = (level) => {
    // 💡 데이터가 null/undefined면 빈 문자열로, 아니면 무조건 문자열로 변환
    const safeLevel = String(level ?? "");

    if (!safeLevel || safeLevel === '데이터 없음') 
      return { dot: 'bg-gray-300', text: 'text-gray-400', label: '정보없음' };
    if (safeLevel.includes('혼잡') || safeLevel.includes('붐빔')) 
      return { dot: 'bg-red-500', text: 'text-red-500', label: '혼잡' };
    if (safeLevel.includes('보통')) 
      return { dot: 'bg-orange-400', text: 'text-orange-500', label: '보통' };
    return { dot: 'bg-emerald-500', text: 'text-emerald-600', label: '여유' };
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

      <div className="px-6 py-3 bg-white sticky top-0 z-10">
        <div className="relative">
          <input
            type="text"
            placeholder="관광지를 검색하세요"
            className="w-full bg-gray-50 text-gray-800 rounded-xl py-3 px-5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/10 border border-gray-100 text-sm"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Search 
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 cursor-pointer" 
            onClick={handleSearch}
          />
        </div>
      </div>

      <main className="px-6 py-6 pb-24">
        {/* 1. 검색 결과 섹션 */}
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
            </div>
          ) : (
            spots.map((spot) => {
              const status = getCongestionStyle(spot.congestion_level);
              return (
                <div 
                  key={spot.area_cd}
                  onClick={() => navigate(`/spots/${spot.area_cd}`)} 
                  className="bg-white rounded-3xl flex items-center shadow-[0_6px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden active:scale-[0.98] transition-transform cursor-pointer" 
                >
                  <div className="w-36 h-36 bg-gray-100 overflow-hidden shrink-0"> 
                    <img src={spot.image_url} alt={spot.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-5 flex-1 flex flex-col gap-2"> 
                    <div className="flex flex-col gap-0.5">
                      <h3 className="text-[16px] font-bold text-gray-900">{spot.name}</h3> 
                      <p className="text-xs text-gray-400 line-clamp-1">{spot.address}</p>
                    </div>
                    <div className="flex items-center mt-0.5">
                      <span className={`w-2 h-2 rounded-full ${status.dot} mr-2`}></span>
                      <span className={`text-xs font-bold ${status.text}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 2. 비슷한 테마 추천 섹션 */}
        {keyword && recommendations.length > 0 && (
          <section className="mt-10">
            <h3 className="text-lg font-bold text-gray-900 mb-4">비슷한 테마의 장소</h3>
            <div className="flex flex-col gap-4">
              {recommendations.map((rec) => (
                <div 
                  key={rec.area_cd}
                  onClick={() => navigate(`/spots/${rec.area_cd}`)} 
                  className="bg-white rounded-3xl flex items-center shadow-[0_6px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-4 active:scale-[0.98] transition-transform cursor-pointer" 
                >
                  <img src={rec.image_url} alt={rec.name} className="w-20 h-20 rounded-2xl object-cover" />
                  <div className="ml-4 flex-1">
                    <h4 className="font-bold text-sm text-gray-900">{rec.name}</h4>
                    <p className="text-xs text-gray-400 mt-1">{rec.address}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <BottomNav activeTab="home" />
    </div>
  );
}