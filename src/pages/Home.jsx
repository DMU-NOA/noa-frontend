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
      filters: { 'all': '전체', 'relax': '쾌적한 곳', 'nature': '공원·자연', 'history': '역사·문화', 'hotplace': '핫플레이스' }
    },
    en: {
      searchPlaceholder: "Where do you want to go?",
      searchResult: "Search Results",
      noDataTitle: "No places found.",
      noDataDesc: "Try adjusting your filters or search keyword!",
      loading: "Exploring hot places in Seoul...",
      recommendTitle: "How about these places?",
      loginRequired: "🔒 Login Required.",
      filters: { 'all': 'All', 'relax': 'Relaxing', 'nature': 'Nature', 'history': 'History', 'hotplace': 'Hotplaces' }
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

  const getCongestionStyle = (level) => {
    const s = String(level ?? "").toLowerCase();
    if (!s || s === '데이터 없음' || s === 'no data') return { bg: 'bg-white/20', text: 'text-white/70', label: lang === 'en' ? 'No Data' : '정보없음' };
    if (s.includes('혼잡') || s.includes('붐빔') || s.includes('crowd')) return { bg: 'bg-red-500/80', text: 'text-white', label: lang === 'en' ? 'Crowded' : '혼잡' };
    if (s.includes('보통') || s.includes('normal') || s.includes('moderate')) return { bg: 'bg-orange-400/80', text: 'text-white', label: lang === 'en' ? 'Normal' : '보통' };
    return { bg: 'bg-emerald-500/80', text: 'text-white', label: lang === 'en' ? 'Quiet' : '여유' };
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
    <div className="w-full min-h-screen bg-[#F5F6F8] pb-24">
      {/* 토스트 */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-gray-900/95 text-white text-[13px] font-medium px-4 py-2.5 rounded-full shadow-lg">
          {t[lang].loginRequired}
        </div>
      )}

      {/* 헤더 */}
      <header className="px-5 py-4 flex justify-between items-center bg-white sticky top-0 z-30">
        <h1 className="text-2xl font-black text-blue-600 tracking-tight">NOA</h1>
        {/* 💡 한/영 전환 버튼 */}
        <button 
          onClick={toggleLang}
          className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 bg-white border border-gray-200 rounded-full px-3 py-1.5 active:scale-95 transition-transform shadow-sm"
        >
          <Globe className="w-3 h-3 text-blue-500" />
          {lang === 'ko' ? '한 / EN' : 'EN / 한'}
        </button>
      </header>

      {/* 검색 + 필터 */}
      <div className="bg-[#F5F6F8] sticky top-[62px] z-20 pb-2">
        <div className="px-4 pb-2">
          <div className="relative">
            <input
              type="text"
              placeholder={t[lang].searchPlaceholder}
              className="w-full bg-white text-gray-900 rounded-2xl py-3.5 pl-5 pr-12 text-[14px] placeholder:text-gray-400 border border-gray-200/80 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-blue-500 active:scale-95 transition-all"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!keyword && (
          <div className="px-4">
            <div
              ref={filterScroll.ref}
              className={`flex items-center gap-2 overflow-x-auto ${filterScroll.className}`}
              style={{ scrollbarWidth: 'none' }}
              {...filterScroll.events}
            >
              <div className="p-1.5 rounded-full bg-white border border-gray-200 shrink-0 pointer-events-none shadow-sm">
                <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
              </div>
              {Object.keys(t[lang].filters).map(key => (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
                    activeFilter === key
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                      : 'bg-white border border-gray-200 text-gray-500 active:bg-gray-50'
                  }`}
                >
                  {t[lang].filters[key]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 리스트 */}
      <main className="px-4 pt-3">
        {keyword && (
          <p className="text-[13px] text-gray-500 mb-3 px-1">
            <span className="font-bold text-gray-900">&apos;{keyword}&apos;</span> {t[lang].searchResult} · <span className="text-blue-500 font-bold">{filteredSpots.length}</span>
          </p>
        )}

        <div className="flex flex-col gap-3">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center gap-3 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <p className="text-[13px]">{t[lang].loading}</p>
            </div>
          ) : filteredSpots.length === 0 ? (
            <div className="py-24 flex flex-col items-center gap-2">
              <span className="text-3xl">👻</span>
              <p className="text-[14px] font-semibold text-gray-600 mt-1">{t[lang].noDataTitle}</p>
              <p className="text-[12px] text-gray-400">{t[lang].noDataDesc}</p>
            </div>
          ) : (
            filteredSpots.map((spot) => {
              const status = getCongestionStyle(spot.congestion_level);
              return (
                <div
                  key={spot.area_cd}
                  onClick={() => navigate(`/spots/${spot.area_cd}`)}
                  className="group cursor-pointer relative w-full h-[220px] rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.1)] active:scale-[0.985] transition-transform duration-150"
                >
                  {/* 풀블리드 이미지 or 폴백 배경 */}
                  {spot.image_url ? (
                    <img
                      src={spot.image_url}
                      alt={spot.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                      <MapPin className="w-10 h-10 text-white/20" />
                    </div>
                  )}

                  {/* 하단 그라디언트 오버레이 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                  {/* 상단 — 혼잡도 배지 + 좋아요 */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-sm ${status.bg} ${status.text}`}>
                      {status.label}
                    </span>
                    <button
                      onClick={(e) => handleLike(e, spot.area_cd)}
                      className="w-8 h-8 bg-black/25 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <Heart className={`w-3.5 h-3.5 ${likedSet.has(spot.area_cd) ? 'fill-red-400 text-red-400' : 'text-white'}`} />
                    </button>
                  </div>

                  {/* 하단 텍스트 */}
                  <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8">
                    <h3 className="text-[17px] font-bold text-white truncate">{spot.name}</h3>
                    <div className="flex items-center gap-1 mt-1 min-w-0">
                      <MapPin className="w-3 h-3 text-white/50 shrink-0" />
                      <span className="text-[12px] text-white/70 truncate">{spot.address}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 추천 섹션 */}
        {keyword && recommendations.length > 0 && (
          <section className="mt-6 pt-5 border-t border-gray-200">
            <h3 className="text-[15px] font-bold text-gray-900 mb-4">{t[lang].recommendTitle}</h3>
            <div className="flex gap-3 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
              {recommendations.map((rec) => (
                <div
                  key={rec.area_cd}
                  onClick={() => navigate(`/spots/${rec.area_cd}`)}
                  className="shrink-0 w-36 cursor-pointer active:scale-95 transition-transform"
                >
                  <img src={rec.image_url} alt={rec.name} className="w-36 h-36 rounded-2xl object-cover bg-gray-100" />
                  <div className="mt-2 px-0.5">
                    <h4 className="text-[13px] font-semibold text-gray-900 truncate">{rec.name}</h4>
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