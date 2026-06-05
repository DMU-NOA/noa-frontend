import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Globe,
  Loader2,
  MapPin,
  SlidersHorizontal,
  Heart,
} from "lucide-react";
import BottomNav from "../components/BottomNav";
import apiClient from "../api/client";
import { isLoggedIn } from "../api/auth";
import { useLanguage } from "../contexts/LanguageContext"; // 💡 언어 전역 상태 가져오기

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
  const { lang, toggleLang } = useLanguage(); // 💡 언어 상태와 변경 함수 꺼내기

  const [spots, setSpots] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [activeFilter, setActiveFilter] = useState('all'); // 💡 필터 상태를 영어 키값으로 관리
  const [likedSet, setLikedSet] = useState(new Set());
  const [toast, setToast] = useState(false);

  const filterScroll = useDragScroll();

  // 💡 다국어 텍스트 사전
  const t = {
    ko: {
      searchPlaceholder: "어디로 떠나고 싶으신가요?",
      searchResult: "검색 결과",
      noDataTitle: "조건에 맞는 장소가 없어요.",
      noDataDesc: "다른 키워드나 필터를 선택해 보세요!",
      loading: "서울의 핫플레이스를 탐색 중입니다...",
      recommendTitle: "이런 곳은 어떠세요?",
      loginRequired: "🔒 로그인이 필요합니다.",
      filters: { 'all': '전체', 'relax': '🍃 쾌적한 곳', 'nature': '🌳 공원·자연', 'history': '🏛️ 역사·문화', 'hotplace': '🛍️ 핫플레이스' }
    },
    en: {
      searchPlaceholder: "Where do you want to go?",
      searchResult: "Search Results",
      noDataTitle: "No places found.",
      noDataDesc: "Try adjusting your filters or search keyword!",
      loading: "Exploring hot places in Seoul...",
      recommendTitle: "How about these places?",
      loginRequired: "🔒 Login Required.",
      filters: { 'all': 'All', 'relax': '🍃 Relaxing', 'nature': '🌳 Nature', 'history': '🏛️ History', 'hotplace': '🛍️ Hotplaces' }
    }
  };

  const fetchDefaultSpots = async () => {
    try {
      setIsLoading(true);
      // 💡 백엔드에 ?lang=en 또는 ?lang=ko 파라미터 전달
      const response = await apiClient.get(`/api/spots?lang=${lang}`);
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
      // 💡 검색 시에도 lang 파라미터 전달
      const response = await apiClient.get(`/api/spots/search?keyword=${keyword}&lang=${lang}`);
      setSpots(response.data.results);
      setRecommendations(response.data.recommendations);
      setActiveFilter('all');
    } catch (error) {
      console.error("검색 실패:", error);
      setSpots([]);
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 💡 영어 혼잡도 데이터('Crowded', 'Normal' 등) 호환 처리
  const getCongestionStyle = (level) => {
    const safeLevel = String(level ?? "").toLowerCase();
    if (!safeLevel || safeLevel === '데이터 없음' || safeLevel === 'no data') return { dot: 'bg-gray-300', text: 'text-gray-500', label: lang === 'en' ? 'No Data' : '정보없음' };
    if (safeLevel.includes('혼잡') || safeLevel.includes('붐빔') || safeLevel.includes('crowd')) return { dot: 'bg-red-500', text: 'text-red-600', label: lang === 'en' ? 'Crowded' : '혼잡' };
    if (safeLevel.includes('보통') || safeLevel.includes('normal') || safeLevel.includes('moderate')) return { dot: 'bg-orange-400', text: 'text-orange-600', label: lang === 'en' ? 'Normal' : '보통' };
    return { dot: 'bg-emerald-500', text: 'text-emerald-700', label: lang === 'en' ? 'Relax' : '여유' };
  };

  // 💡 언어가 바뀔 때마다 데이터를 새로 불러옵니다
  useEffect(() => {
    fetchDefaultSpots();
    // 좋아요 목록 로드
    apiClient
      .get("/api/likes")
      .then((res) => setLikedSet(new Set(res.data.map((l) => l.area_cd))))
      .catch(() => {});
  }, [lang]);

  const showToast = () => {
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  };

  const handleLike = async (e, area_cd) => {
    e.stopPropagation();
    if (!isLoggedIn()) {
      showToast();
      return;
    }
    const isLiked = likedSet.has(area_cd);
    try {
      if (isLiked) {
        await apiClient.delete(`/api/likes/${area_cd}`);
        setLikedSet((prev) => {
          const s = new Set(prev);
          s.delete(area_cd);
          return s;
        });
      } else {
        await apiClient.post("/api/likes", { area_cd });
        setLikedSet((prev) => new Set(prev).add(area_cd));
      }
    } catch (err) {
      console.error("좋아요 실패:", err);
    }
  };

  // 💡 영문 카테고리도 인식할 수 있도록 필터링 로직 확장
  const filteredSpots = spots.filter(spot => {
    const cat = spot.category || "";
    const lvl = spot.congestion_level || "";
    
    if (activeFilter === 'all') return true;
    if (activeFilter === 'relax') return lvl.includes('여유') || lvl.includes('보통') || lvl.toLowerCase().includes('relax') || lvl.toLowerCase().includes('normal') || lvl.toLowerCase().includes('moderate');
    if (activeFilter === 'nature') return cat.includes('공원') || cat.includes('자연') || cat.includes('숲') || cat.toLowerCase().includes('park') || cat.toLowerCase().includes('nature');
    if (activeFilter === 'history') return cat.includes('궁궐') || cat.includes('박물관') || cat.includes('미술관') || cat.includes('역사') || cat.toLowerCase().includes('palace') || cat.toLowerCase().includes('museum') || cat.toLowerCase().includes('heritage');
    if (activeFilter === 'hotplace') return cat.includes('상권') || cat.includes('특구') || cat.includes('거리') || cat.toLowerCase().includes('street') || cat.toLowerCase().includes('district') || cat.toLowerCase().includes('zone');
    return true;
  });

  return (
    <div className="w-full min-h-screen bg-white font-['Pretendard','Noto_Sans_KR',sans-serif] pb-24 relative">
      {/* 로그인 필요 토스트 */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {t[lang].loginRequired}
        </div>
      )}

      {/* 1. 상단 헤더 */}
      <header className="px-5 py-4 flex justify-between items-center bg-white sticky top-0 z-30">
        <h1 className="text-2xl font-black text-blue-600 tracking-tight">NOA</h1>
        {/* 💡 한/영 전환 버튼 */}
        <button 
          onClick={toggleLang}
          className="flex items-center text-xs font-bold text-gray-500 bg-gray-50 rounded-full px-3 py-1.5 active:scale-95 transition-transform"
        >
          <Globe className="w-3.5 h-3.5 mr-1.5 text-blue-500" /> 
          {lang === 'ko' ? '한 / EN' : 'EN / 한'}
        </button>
      </header>

      {/* 2. 검색창 + 필터바 통합 블록 */}
      <div className="bg-white sticky top-15.5 z-20 border-b border-gray-100 shadow-[0_4px_15px_rgba(0,0,0,0.02)]">
        {/* 검색창 영역 */}
        <div className="px-5 pb-3 pt-1">
          <div className="relative">
            <input
              type="text"
              placeholder={t[lang].searchPlaceholder}
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
              {/* 💡 다국어 필터 키 적용 */}
              {Object.keys(t[lang].filters).map(key => (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-bold transition-all ${
                    activeFilter === key 
                      ? 'bg-gray-900 text-white shadow-md' 
                      : 'bg-white border border-gray-200 text-gray-600 active:bg-gray-50'
                  }`}
                >
                  {t[lang].filters[key]}
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
            &apos;{keyword}&apos; {t[lang].searchResult} <span className="text-blue-600">{filteredSpots.length}</span>
          </h2>
        )}
        
        {/* 카드 리스트 래퍼 */}
        <div className="flex flex-col">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
              <p className="text-sm font-bold">{t[lang].loading}</p>
            </div>
          ) : filteredSpots.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
              <span className="text-4xl mb-3">👻</span>
              <p className="text-[15px] font-bold text-gray-600">{t[lang].noDataTitle}</p>
              <p className="text-sm mt-1">{t[lang].noDataDesc}</p>
            </div>
          ) : (
            filteredSpots.map((spot) => {
              const status = getCongestionStyle(spot.congestion_level);
              return (
                <div 
                  key={spot.area_cd}
                  onClick={() => navigate(`/spots/${spot.area_cd}`)} 
                  className="flex flex-col group cursor-pointer active:bg-gray-50 transition-colors duration-300 pb-8 pt-4 px-5 border-b-8 border-gray-50 last:border-b-0" 
                >
                  <div className="w-full h-64 rounded-3xl overflow-hidden bg-gray-100 relative mb-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100/50"> 
                    <img 
                      src={spot.image_url || 'https://via.placeholder.com/400'} 
                      alt={spot.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center shadow-sm">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${status.dot} mr-2 animate-pulse`}
                      ></span>
                      <span
                        className={`text-[13px] font-black tracking-tight ${status.text}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full">
                        <span className="text-[11px] font-bold text-white tracking-wider">
                          {spot.category}
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleLike(e, spot.area_cd)}
                        className="w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                      >
                        <Heart
                          className={`w-4 h-4 transition-colors ${likedSet.has(spot.area_cd) ? "fill-red-500 text-red-500" : "text-gray-400"}`}
                        />
                      </button>
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
          <section className="mt-8 px-5 pt-8 border-t-8 border-gray-50">
            <h3 className="text-[19px] font-black text-gray-900 mb-5 flex items-center gap-2">
              <span className="text-2xl">✨</span> {t[lang].recommendTitle}
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