import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, MapPin, Users, Loader2 } from "lucide-react";
import BottomNav from "../components/BottomNav";
import apiClient from "../api/client";
import { useLanguage } from "../contexts/LanguageContext";

// 혼잡도 레벨에 따른 UI 정보 매핑
const getCongestionInfo = (level, lang) => {
  const l = String(level ?? '').toLowerCase();
  if (!l || l === '데이터 없음' || l === 'no data') 
    return { rate: '0%', text: lang === 'en' ? 'No Data' : '정보없음', color: 'text-gray-400', bar: 'bg-gray-400 w-[10%]' };
  if (l.includes('혼잡') || l.includes('붐빔') || l.includes('crowd')) 
    return { rate: '85%', text: lang === 'en' ? 'Crowded' : '혼잡', color: 'text-red-500', bar: 'bg-red-500 w-[85%]' };
  if (l.includes('보통') || l.includes('normal')) 
    return { rate: '50%', text: lang === 'en' ? 'Normal' : '보통', color: 'text-orange-500', bar: 'bg-orange-400 w-[50%]' };
  return { rate: '20%', text: lang === 'en' ? 'Relax' : '여유', color: 'text-emerald-500', bar: 'bg-emerald-500 w-[20%]' };
};

// 프로그레스 바 컴포넌트
function CrowdBar({ barClass }) {
  return (
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${barClass}`} />
    </div>
  );
}

// 개별 관광지 카드 컴포넌트
function SpotCard({ spot, onClick, lang }) {
  const info = getCongestionInfo(spot.congestion_level, lang);
  
  return (
    <div
      onClick={() => onClick(spot)}
      className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-5 flex flex-col gap-3 active:scale-[0.98] transition-transform cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[16px] font-bold text-gray-900">{spot.name}</h3>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <MapPin className="w-3 h-3" />
            <span className="truncate max-w-[200px]">{spot.address}</span>
          </div>
        </div>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 bg-blue-50 text-blue-500">
          {spot.category}
        </span>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
        {spot.description}
      </p>

      <div className="flex flex-col gap-1.5">
        <CrowdBar barClass={info.bar} />
        <div className="flex items-center gap-1.5">
          <Users className="w-3 h-3 text-gray-400" />
          <span className={`text-xs font-bold ${info.color}`}>
            {info.text}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AlternativeSpots() { 
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useLanguage();
  // ListDetail에서 넘겨준 area_cd 받기
  const originAreaCd = location.state?.area_cd;

  const [originSpot, setOriginSpot] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(true);
  

useEffect(() => {
    if (!originAreaCd) return;

    const fetchAlternatives = async () => {
      try {
        setLoading(true);
        // 💡 1. 원본 장소 정보 (lang 추가)
        const originRes = await apiClient.get(`/api/spots/${originAreaCd}?lang=${lang}`);
        setOriginSpot(originRes.data);

        // 💡 2. 대안 장소 리스트 (lang 추가)
        const altRes = await apiClient.get(`/api/spots/${originAreaCd}/alternatives?lang=${lang}`);
        setAlternatives(altRes.data);
      } catch (error) {
        console.error("대안 관광지 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlternatives();
  }, [originAreaCd, lang]); // 💡 의존성 배열에 lang 추가

  // 카드를 클릭했을 때 해당 장소의 상세 페이지로 이동
  const handleCardClick = (spot) => {
    // 💡 라우터 설정에 따라 주소가 다를 수 있습니다. (예: '/spot/', '/detail/' 등)
    // ListDetail 페이지로 연결되는 주소로 맞춰주세요.
    navigate(`/spots/${spot.area_cd}`); 
  };

  if (loading) return (
    <div className="w-full min-h-screen bg-white flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      <p className="text-[14px] font-medium text-gray-400">{lang === 'en' ? 'Loading...' : '불러오는 중...'}</p>
    </div>
  );
  if (!originSpot) return <div className="p-10 text-center text-gray-500">{lang === 'en' ? 'Invalid access.' : '잘못된 접근입니다.'}</div>;

  const originInfo = getCongestionInfo(originSpot?.congestion_level, lang);

  return (
    <div className="w-full min-h-full bg-[#F8FAFC] flex flex-col relative overflow-hidden">
      {/* 헤더 */}
      <header className="px-5 py-4 flex items-center gap-3 bg-white shadow-sm shrink-0">
        <button
          onClick={() => navigate(-1)} 
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-[17px] font-bold text-gray-900">{lang === 'en' ? 'Alternative Spots' : '대안 관광지'}</h1>
      </header>

      {/* 💡 원본 관광지 혼잡 배너 (실제 데이터 반영) */}
      <div className="mx-5 mt-4 shrink-0">
        <div className={`border rounded-2xl px-4 py-3 flex items-center gap-2.5 ${originInfo.color.replace('text-', 'bg-').replace('500', '50')} ${originInfo.color.replace('text-', 'border-').replace('500', '100')}`}>
          <span className={`w-2 h-2 rounded-full shrink-0 animate-pulse ${originInfo.color.replace('text-', 'bg-')}`} />
          <span className={`text-sm font-bold ${originInfo.color}`}>{originSpot.name}</span>
          <span className={`text-sm opacity-80 ${originInfo.color}`}>— {lang === 'en' ? 'Currently' : '현재'} {originInfo.text}</span>
        </div>
        <p className="text-xs text-gray-400 mt-2 px-1">
          {lang === 'en' ? 'Recommending less crowded spots with a similar theme' : '비슷한 테마의 덜 붐비는 관광지를 추천합니다'}
        </p>
      </div>

      {/* 카드 리스트 */}
      <main className="flex-1 overflow-y-auto px-5 py-4 pb-24 flex flex-col gap-3">
        {alternatives.length > 0 ? (
          alternatives.map((spot) => (
            // 💡 lang={lang} 추가!
            <SpotCard key={spot.area_cd} spot={spot} onClick={handleCardClick} lang={lang} />
          ))
        ) : (
          <div className="text-center text-gray-500 mt-10 text-sm">
            {lang === 'en' ? 'No alternative spots to recommend.' : '추천할 대안 관광지가 없습니다.'}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}