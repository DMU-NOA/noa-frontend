import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Globe, Loader2, MapPin, SlidersHorizontal } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import apiClient from '../api/client';

const FILTERS = ['전체', '🍃 쾌적한 곳', '🌳 공원·자연', '🏛️ 역사·문화', '🛍️ 핫플레이스'];

// 💡 [추가] 카테고리 필터 마우스 드래그 스크롤을 위한 커스텀 훅
function useDragScroll() {
  const ref = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const events = {
    onMouseDown: (e) => {
      if (!ref.current) return;
      setIsDragging(true);
      setStartX(e.pageX - ref.current.offsetLeft);
      setScrollLeft(ref.current.scrollLeft);
    },
    onMouseLeave: () => setIsDragging(false),
    onMouseUp: () => setIsDragging(false),
    onMouseMove: (e) => {
      if (!isDragging || !ref.current) return;
      e.preventDefault();
      const x = e.pageX - ref.current.offsetLeft;
      const walk = (x - startX) * 1.5; 
      ref.current.scrollLeft = scrollLeft - walk;
    }
  };

  return { ref, events, className: isDragging ? 'cursor-grabbing select-none' : 'cursor-grab select-none' };
}

export default function Home() {
  const navigate = useNavigate();
  const [spots, setSpots] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [activeFilter, setActiveFilter] = useState('전체');

  // 드래그 훅 연결
  const filterScroll = useDragScroll();

  const fetchDefaultSpots = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/api/spots');
      setSpots(response.data.data);
      setRecommendations([]);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!keyword.trim()) {
      fetchDefaultSpots();
      return;
    }
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/api/spots/search?keyword=${keyword}`);
      setSpots(response.data.results);
      setRecommendations(response.data.recommendations);
      setActiveFilter('전체'); 
    } catch (error) {
      console.error("검색 실패:", error);
      setSpots([]);
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getCongestionStyle = (level) => {
    const safeLevel = String(level ?? "");
    if (!safeLevel || safeLevel === '데이터 없음') return { dot: 'bg-gray-300', text: 'text-gray-500', label: '정보없음' };
    if (safeLevel.includes('혼잡') || safeLevel.includes('붐빔')) return { dot: 'bg-red-500', text: 'text-red-600', label: '혼잡' };
    if (safeLevel.includes('보통')) return { dot: 'bg-orange-400', text: 'text-orange-600', label: '보통' };
    return { dot: 'bg-emerald-500', text: 'text-emerald-700', label: '여유' };
  };

  useEffect(() => {
    fetchDefaultSpots();
  }, []);

  const filteredSpots = spots.filter(spot => {
    if (activeFilter === '전체') return true;
    if (activeFilter === '🍃 쾌적한 곳') return spot.congestion_level?.includes('여유') || spot.congestion_level?.includes('보통');
    if (activeFilter === '🌳 공원·자연') return spot.category?.includes('공원') || spot.category?.includes('자연') || spot.category?.includes('숲');
    if (activeFilter === '🏛️ 역사·문화') return spot.category?.includes('궁궐') || spot.category?.includes('박물관') || spot.category?.includes('미술관') || spot.category?.includes('역사');
    if (activeFilter === '🛍️ 핫플레이스') return spot.category?.includes('상권') || spot.category?.includes('특구') || spot.category?.includes('거리');
    return true;
  });

  return (
    <div className="w-full min-h-screen bg-white font-['Pretendard','Noto_Sans_KR',sans-serif] pb-24 relative">
      
      {/* 1. 상단 헤더 */}
      <header className="px-5 py-4 flex justify-between items-center bg-white sticky top-0 z-30">
        <h1 className="text-2xl font-black text-blue-600 tracking-tight">NOA</h1>
        <button className="flex items-center text-xs font-bold text-gray-500 bg-gray-50 rounded-full px-3 py-1.5 active:scale-95 transition-transform">
          <Globe className="w-3.5 h-3.5 mr-1.5" /> 한 / EN
        </button>
      </header>

      {/* 💡 2. 검색창 + 필터바 통합 블록 (틈이 벌어지지 않도록 하나로 묶음) */}
      <div className="bg-white sticky top-[62px] z-20 border-b border-gray-100 shadow-[0_4px_15px_rgba(0,0,0,0.02)]">
        {/* 검색창 영역 */}
        <div className="px-5 pb-3 pt-1">
          <div className="relative">
            <input
              type="text"
              placeholder="어디로 떠나고 싶으신가요?"
              className="w-full bg-gray-100 text-gray-900 font-medium rounded-2xl py-3.5 px-5 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/20 border-transparent text-[15px] placeholder:text-gray-400 shadow-inner"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
              onClick={handleSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 rounded-xl active:scale-95 transition-transform"
            >
              <Search className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* 카테고리 필터 영역 (마우스 드래그 적용) */}
        {!keyword && (
          <div className="px-5 pb-3">
            <div 
              ref={filterScroll.ref}
              className={`flex items-center gap-2 overflow-x-auto pb-1 ${filterScroll.className}`} 
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              {...filterScroll.events}
            >
              <div className="flex items-center justify-center p-2 rounded-full bg-gray-50 shrink-0 border border-gray-100 pointer-events-none">
                <SlidersHorizontal className="w-4 h-4 text-gray-400" />
              </div>
              {FILTERS.map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-bold transition-all ${
                    activeFilter === filter 
                      ? 'bg-gray-900 text-white shadow-md' 
                      : 'bg-white border border-gray-200 text-gray-600 active:bg-gray-50'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. 리스트 메인 영역 */}
      <main className="pt-4">
        {keyword && (
          <h2 className="px-5 text-lg font-black text-gray-900 mb-5">
            &apos;{keyword}&apos; 검색 결과 <span className="text-blue-600">{filteredSpots.length}</span>건
          </h2>
        )}
        
        {/* 💡 카드 리스트 래퍼 (gap을 없애고 대신 카드 하단에 두꺼운 여백을 넣음) */}
        <div className="flex flex-col">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
              <p className="text-sm font-bold">서울의 핫플레이스를 탐색 중입니다...</p>
            </div>
          ) : filteredSpots.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
              <span className="text-4xl mb-3">👻</span>
              <p className="text-[15px] font-bold text-gray-600">조건에 맞는 장소가 없어요.</p>
              <p className="text-sm mt-1">다른 키워드나 필터를 선택해 보세요!</p>
            </div>
          ) : (
            filteredSpots.map((spot) => {
              const status = getCongestionStyle(spot.congestion_level);
              return (
                // 💡 4. 카드 구분선 추가: 아래쪽에 두꺼운 회색 선(border-b-[8px])으로 공간 분리!
                <div 
                  key={spot.area_cd}
                  onClick={() => navigate(`/spots/${spot.area_cd}`)} 
                  className="flex flex-col group cursor-pointer active:bg-gray-50 transition-colors duration-300 pb-8 pt-4 px-5 border-b-[8px] border-gray-50 last:border-b-0" 
                >
                  <div className="w-full h-64 rounded-3xl overflow-hidden bg-gray-100 relative mb-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100/50"> 
                    <img 
                      src={spot.image_url || 'https://via.placeholder.com/400'} 
                      alt={spot.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                    
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center shadow-sm">
                      <span className={`w-2.5 h-2.5 rounded-full ${status.dot} mr-2 animate-pulse`}></span>
                      <span className={`text-[13px] font-black tracking-tight ${status.text}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full">
                      <span className="text-[11px] font-bold text-white tracking-wider">{spot.category}</span>
                    </div>
                  </div>

                  <div className="px-1 flex flex-col gap-1.5"> 
                    <h3 className="text-[19px] font-black text-gray-900 truncate">{spot.name}</h3> 
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <MapPin className="w-4 h-4 shrink-0 text-gray-400" />
                      <p className="text-[14px] font-medium truncate">{spot.address}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {keyword && recommendations.length > 0 && (
          <section className="mt-8 px-5 pt-8 border-t-[8px] border-gray-50">
            <h3 className="text-[19px] font-black text-gray-900 mb-5 flex items-center gap-2">
              <span className="text-2xl">✨</span> 이런 곳은 어떠세요?
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {recommendations.map((rec) => (
                <div 
                  key={rec.area_cd}
                  onClick={() => navigate(`/spots/${rec.area_cd}`)} 
                  className="shrink-0 w-40 flex flex-col gap-2 active:scale-95 transition-transform cursor-pointer" 
                >
                  <img src={rec.image_url} alt={rec.name} className="w-40 h-40 rounded-3xl object-cover shadow-sm bg-gray-100" />
                  <div className="px-1">
                    <h4 className="font-bold text-[15px] text-gray-900 truncate">{rec.name}</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">{rec.address}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}