import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MapPin, User, CloudSun, Car, CalendarDays, X, Loader2, Sparkles, Heart, Compass } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import apiClient from '../api/client';
import { useLanguage } from '../contexts/LanguageContext';

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

export default function ListDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const [spot, setSpot] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [addInfo, setAddInfo] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [loadingAddInfo, setLoadingAddInfo] = useState(false);
  const [liked, setLiked] = useState(false);

  const weatherScroll = useDragScroll();

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. 관광지 기본 정보 로드
        const spotRes = await apiClient.get(`/api/spots/${id}?lang=${lang}`);
        if (isMounted) {
        setSpot(spotRes.data);
        setIsLoading(false);
        }
        // 💡 2. 좋아요(찜) 상태 초기 확인 추가!
        try {
          const likesRes = await apiClient.get(`/api/likes?lang=${lang}`);
          // 내 찜 목록(likesRes.data) 중에 현재 관광지 id(area_cd)가 있는지 확인
          const isAlreadyLiked = likesRes.data.some((item) => item.area_cd === id);
          setLiked(isAlreadyLiked); // 있으면 true(빨간 하트), 없으면 false(빈 하트)
        } catch (likeErr) {
          console.error('좋아요 상태 확인 실패:', likeErr);
        }

        // 3. 혼잡도 예측 데이터 로드
        const forecastRes = await apiClient.get(`/api/spots/${id}/forecast?lang=${lang}`);
        setForecast(forecastRes.data.forecast);
        
        // 4. 날씨/교통 등 부가정보 로드
        const infoRes = await apiClient.get(`/api/spots/${id}/additional-info?lang=${lang}`);
        setAddInfo(infoRes.data);

        // 5. 대안 장소 미리보기
        try {
          const altRes = await apiClient.get(`/api/spots/${id}/alternatives?lang=${lang}`);
          setAlternatives(altRes.data.alternatives?.slice(0, 3) || []);
        } catch { /* 대안 없어도 무관 */ }
      } catch (err) {
        console.error('데이터 로드 실패:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [id, lang]);

  // 좋아요 토글
  const handleLike = async () => {
    try {
      if (liked) {
        await apiClient.delete(`/api/likes/${id}`);
      } else {
        await apiClient.post('/api/likes', { area_cd: id });
      }
      setLiked(!liked);
    } catch (error) {
      console.error("좋아요 처리 실패:", error);
    }
  };

  const handleOpenModal = async (type) => {
    setActiveModal(type); 
    setLoadingAddInfo(true); 
    try {
      // 💡 주소 끝에 ?lang=${lang} 추가
      const infoRes = await apiClient.get(`/api/spots/${id}/additional-info?lang=${lang}`);
      setAddInfo(infoRes.data);
    } catch (error) {
      console.error("실시간 부가정보 로드 실패:", error);
    } finally {
      setLoadingAddInfo(false); 
    }
  };

  const getCongestionInfo = (level) => {
    const l = level ? level.toLowerCase() : '';
    if (!l || l === '데이터 없음' || l === 'no data') return { rate: 0, text: lang === 'en' ? 'No Data' : '정보없음', color: 'text-gray-400', bar: 'bg-gray-400' };
    if (l.includes('혼잡') || l.includes('붐빔') || l.includes('crowd')) return { rate: 100, text: lang === 'en' ? 'Crowded' : '혼잡', color: 'text-red-500', bar: 'bg-red-500' };
    if (l.includes('보통') || l.includes('normal')) return { rate: 50, text: lang === 'en' ? 'Normal' : '보통', color: 'text-orange-500', bar: 'bg-orange-400' };
    return { rate: 20, text: lang === 'en' ? 'Relax' : '여유', color: 'text-emerald-500', bar: 'bg-emerald-500' };
  };

  const maxPop = forecast.length > 0 ? Math.max(...forecast.map(d => d.population)) : 1;
  const maxPopItem = forecast.find(d => d.population === maxPop) || { level: '여유' };
  
  const getLevelRatio = (level) => {
      const l = level ? level.toLowerCase() : '';
      if (!l) return 0.35;
      if ((l.includes('붐빔') || l.includes('crowd') || l.includes('혼잡')) && !l.includes('약간')) return 1.0;
      if (l.includes('약간') || l.includes('slightly')) return 0.75;
      if (l.includes('보통') || l.includes('normal')) return 0.55;
      return 0.35; 
  };
  const chartMaxPop = maxPop / getLevelRatio(maxPopItem.level);

  const formatPop = (num) => {
      if (num >= 10000) return (num / 10000).toFixed(1) + '만';
      if (num >= 1000) return (num / 1000).toFixed(1) + '천';
      return num;
  };

  if (isLoading) return (
    <div className="w-full min-h-screen bg-white flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      <p className="text-[14px] font-medium text-gray-400">{lang === 'en' ? 'Loading...' : '불러오는 중...'}</p>
    </div>
  );
  if (!spot) return <div className="p-10 text-center text-gray-500 font-bold">{lang === 'en' ? 'Data not found 😭' : '잘못된 접근이거나 데이터를 찾을 수 없습니다 😭'}</div>;

  const info = getCongestionInfo(spot.congestion_level);

  return (
    <div className="w-full min-h-full bg-white relative pb-20">

      {/* 히어로 이미지 + 오버레이 헤더 */}
      <div className="relative w-full h-[300px]">
        {spot.image_url ? (
          <img src={spot.image_url} alt={spot.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800" />
        )}
        {/* 상단 그라디언트 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />

        {/* 뒤로가기 + 하트 */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-5">
          <button type="button" onClick={() => navigate(-1)} className="w-9 h-9 bg-black/25 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-transform">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button type="button" onClick={handleLike} className="w-9 h-9 bg-black/25 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-transform">
            <Heart className={`w-4.5 h-4.5 transition-colors ${liked ? 'fill-red-400 text-red-400' : 'text-white'}`} />
          </button>
        </div>

        {/* 하단 장소명 + 주소 */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
          <h1 className="text-[22px] font-bold text-white mb-1">{spot.name}</h1>
          <button
            onClick={() => navigate('/map', { state: { selectedSpot: spot.area_cd }})}
            className="flex items-center gap-1.5 active:opacity-70 transition-opacity"
          >
            <MapPin className="w-3.5 h-3.5 text-white/70 shrink-0" />
            <span className="text-[13px] text-white/80 truncate">{spot.address}</span>
          </button>
        </div>
      </div>

      <div>

      {/* 💡 2. 혼잡도 섹션 */}
      <section className="px-5 pt-8 pb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-6">{lang === 'en' ? 'Current Congestion' : '현재 예상 혼잡도'}</h2>
        <div className="mb-6">
          <div className="h-3 rounded-full bg-gray-100 overflow-hidden mb-2">
            <div
              className={`h-full rounded-full ${info.bar} transition-all duration-1000`}
              style={{ width: `${info.rate}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            {[
              { key: 'quiet', label: lang === 'en' ? 'Quiet' : '여유', active: info.text === '여유' || info.text === 'Relax', color: 'text-emerald-500' },
              { key: 'normal', label: lang === 'en' ? 'Normal' : '보통', active: info.text === '보통' || info.text === 'Normal', color: 'text-orange-500' },
              { key: 'crowded', label: lang === 'en' ? 'Crowded' : '혼잡', active: info.text === '혼잡' || info.text === 'Crowded', color: 'text-red-500' },
            ].map(({ key, label, active, color }) => (
              <span key={key} className={active ? `text-[14px] font-bold ${color}` : 'text-[11px] text-gray-300'}>
                {label}
              </span>
            ))}
          </div>
        </div>


        {forecast && forecast.length > 0 && (
          <div className="w-full">
            <div className="flex justify-between items-end mb-6">
                <h3 className="text-lg font-bold text-gray-900">{lang === 'en' ? 'Hourly Forecast' : '시간대별 예상 인구'}</h3>
                <span className="text-[11px] font-medium text-gray-400">{lang === 'en' ? 'Unit: ppl' : '단위: 명 (최대 인구 기준)'}</span>
            </div>
            
            <div className="flex items-end justify-between h-48 px-1">
              {forecast.map((data, index) => {
                const heightPercent = Math.min((data.population / chartMaxPop) * 100, 100);
                // 💡 영어 라벨 분기 적용
                let barColor = 'bg-emerald-400', textColor = 'text-emerald-600', shortLevel = lang === 'en' ? 'Relax' : '여유';
                const l = data.level.toLowerCase();
                if ((l.includes('붐빔') || l.includes('crowd') || l.includes('혼잡')) && !l.includes('약간')) { barColor = 'bg-red-500'; textColor = 'text-red-500'; shortLevel = lang === 'en' ? 'Crowd' : '혼잡'; } 
                else if (l.includes('약간') || l.includes('slightly')) { barColor = 'bg-orange-400'; textColor = 'text-orange-600'; shortLevel = lang === 'en' ? 'Slight' : '약간'; } 
                else if (l.includes('보통') || l.includes('normal')) { barColor = 'bg-yellow-400'; textColor = 'text-yellow-600'; shortLevel = lang === 'en' ? 'Normal' : '보통'; }

                return (
                  <div key={index} className="flex flex-col items-center flex-1 gap-1">
                    <div className="flex flex-col items-center justify-end h-8 mb-1">
                      <span className={`text-[10px] font-black ${textColor} tracking-tighter`}>{shortLevel}</span>
                      <span className="text-[9px] font-semibold text-gray-400 tracking-tighter mt-0.5">
                        {formatPop(data.population)}
                      </span>
                    </div>
                    <div className="w-full h-32 flex items-end justify-center">
                      <div className={`w-3 sm:w-4 rounded-t-md ${barColor} transition-all duration-1000 opacity-90`} style={{ height: `${heightPercent}%` }}></div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 mt-1">{data.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* 섹션 구분선 */}
      <div className="h-2 bg-gray-50" />

      {/* 💡 3. 유용한 정보 및 상세설명 섹션 */}
      <section className="px-5 py-8">
        <h2 className="text-lg font-bold text-gray-900 mb-5">{lang === 'en' ? 'Useful Info' : '유용한 정보'}</h2>
        <div className="grid grid-cols-3 gap-3 mb-10">
          <button onClick={() => handleOpenModal('weather')} className="flex flex-col items-center justify-center py-5 bg-sky-50 rounded-2xl border border-sky-100 active:scale-95 transition-transform">
            <CloudSun className="w-7 h-7 text-sky-500 mb-2.5" />
            <span className="text-xs font-bold text-sky-900">{lang === 'en' ? 'Weather' : '날씨·먼지'}</span>
          </button>
          <button onClick={() => handleOpenModal('traffic')} className="flex flex-col items-center justify-center py-5 bg-emerald-50 rounded-2xl border border-emerald-100 active:scale-95 transition-transform">
            <Car className="w-7 h-7 text-emerald-500 mb-2.5" />
            <span className="text-xs font-bold text-emerald-900">{lang === 'en' ? 'Traffic' : '교통·주차'}</span>
          </button>
          <button onClick={() => handleOpenModal('event')} className="flex flex-col items-center justify-center py-5 bg-purple-50 rounded-2xl border border-purple-100 active:scale-95 transition-transform">
            <CalendarDays className="w-7 h-7 text-purple-500 mb-2.5" />
            <span className="text-xs font-bold text-purple-900">{lang === 'en' ? 'Events' : '행사 정보'}</span>
          </button>
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-4">{lang === 'en' ? 'Spot Info' : '관광지 정보'}</h2>
        <div className="flex flex-col gap-4 text-gray-600 text-sm mb-10 bg-gray-50 p-5 rounded-2xl border border-gray-100">
          <button 
            onClick={() => navigate('/map', { state: { selectedSpot: spot.area_cd }})}
            className="flex items-center gap-3 w-full text-left group active:opacity-50 transition-opacity"
          >
            <MapPin className="w-5 h-5 text-gray-400 shrink-0 group-hover:text-blue-500 transition-colors" />
            <span className="underline underline-offset-4 group-hover:text-blue-600 transition-colors leading-relaxed">
              {spot.address}
            </span>
          </button>
          <div className="w-full h-px bg-gray-200"></div>
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-gray-400 shrink-0" />
            <span>{lang === 'en' ? 'Category' : '카테고리'}: <span className="font-semibold text-gray-800">{spot.category}</span></span>
          </div>
        </div>

        <div className="h-px bg-gray-100 mb-8" />
        <h2 className="text-lg font-bold text-gray-900 mb-4">소개</h2>
        <p className="text-[15px] leading-[1.65] text-gray-600">
          {spot.description || "상세 소개 정보가 없습니다."}
        </p>
      </section>

      </div>{/* 본문 카드 닫기 */}

      {/* 하단 고정 CTA */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-40 pointer-events-none">
        <button
          type="button"
          onClick={() => navigate('/alternatives', { state: { area_cd: id } })}
          className={`pointer-events-auto w-full flex items-center justify-between px-5 h-14 rounded-2xl text-white text-[14px] font-bold active:scale-[0.98] transition-all ${
            info.text === '혼잡' || info.text === 'Crowded'
              ? 'bg-red-500 shadow-[0_8px_24px_rgba(239,68,68,0.4)]'
              : info.text === '보통' || info.text === 'Normal'
              ? 'bg-orange-500 shadow-[0_8px_24px_rgba(249,115,22,0.4)]'
              : 'bg-emerald-500 shadow-[0_8px_24px_rgba(16,185,129,0.4)]'
          }`}
        >
          <div className="flex flex-col items-start">
            <span className="text-[11px] font-medium opacity-75 mb-0.5">
              {info.text === '혼잡' || info.text === 'Crowded'
                ? (lang === 'en' ? 'It\'s pretty crowded here' : '여기 지금 복잡해요')
                : info.text === '보통' || info.text === 'Normal'
                ? (lang === 'en' ? 'Getting a little busy' : '슬슬 사람이 많아지고 있어요')
                : (lang === 'en' ? 'Quiet here, but options await' : '지금은 쾌적해요')}
            </span>
            <div className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 opacity-80" />
              <span>{lang === 'en' ? 'See alternative spots' : '대안 관광지 보러가기'}</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 opacity-60 shrink-0" />
        </button>
      </div>

      <BottomNav />

      {/* 부가정보 모달창 영역 (이전과 동일하게 유지) */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/50 backdrop-blur-sm" onMouseDown={() => setActiveModal(null)}>
          <div 
            className="w-full max-w-md bg-white rounded-4xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 max-h-[85vh] flex flex-col" 
            onMouseDown={(e) => e.stopPropagation()} 
          >
            <button onClick={() => setActiveModal(null)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-full p-2 z-10">
              <X className="w-5 h-5" />
            </button>

            {loadingAddInfo ? (
              <div className="flex flex-col items-center justify-center h-48">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                <p className="text-sm font-semibold text-gray-500">{lang === 'en' ? 'Loading real-time data...' : '실시간 데이터를 가져오는 중...'}</p>
              </div>
            ) : addInfo ? (
              <>
                {activeModal === 'weather' && (
                  <div className="flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                      <CloudSun className="text-sky-500 w-6 h-6" /> {lang === 'en' ? 'Weather & Air' : '날씨 및 대기환경'}
                    </h3>
                    <div className="flex flex-col gap-5 text-gray-700">
                      <div className="bg-linear-to-br from-sky-50 to-blue-50 p-5 rounded-3xl flex justify-between items-center shadow-sm">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-sky-800 mb-1">{lang === 'en' ? 'Current Temp' : '현재 기온'}</span>
                          <span className="text-3xl font-black text-sky-600">{addInfo.weather?.temp}℃</span>
                        </div>
                        <div className="text-right flex flex-col gap-1">
                          <span className="text-sm font-semibold text-gray-600">{lang === 'en' ? 'Humidity' : '습도'}: {addInfo.weather?.humidity}%</span>
                          <span className="text-sm font-semibold text-gray-600">{lang === 'en' ? 'Precipitation' : '강수'}: {addInfo.weather?.msg}</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-gray-800 mb-3">{lang === 'en' ? 'Hourly Weather' : '시간대별 날씨'}</h4>
                        <div ref={weatherScroll.ref} className={`flex gap-3 overflow-x-auto pb-2 ${weatherScroll.className}`} {...weatherScroll.events}>
                          {addInfo.weather?.forecast24?.map((f, i) => (
                            <div key={i} className="flex flex-col items-center bg-gray-50 rounded-2xl p-3 min-w-16 shrink-0 pointer-events-none">
                              <span className="text-xs font-bold text-gray-500 mb-2">{f.time}</span>
                              <span className="text-lg mb-1">{f.sky.includes('구름') ? '☁️' : f.sky.includes('비') ? '🌧️' : '☀️'}</span>
                              <span className="text-sm font-black text-gray-800">{f.temp}℃</span>
                              {f.rain_chance !== "0" && <span className="text-[10px] text-blue-500 font-bold mt-1">{f.rain_chance}%</span>}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 p-4 rounded-2xl">
                          <span className="block text-xs font-bold text-gray-500 mb-1">{lang === 'en' ? 'PM10' : '미세먼지 (PM10)'}</span>
                          <div className="flex items-end gap-2"><span className="text-lg font-black text-gray-800">{addInfo.weather?.pm10}</span><span className="text-xs text-gray-400 mb-1">{addInfo.weather?.pm10_val}㎍/㎥</span></div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl">
                          <span className="block text-xs font-bold text-gray-500 mb-1">{lang === 'en' ? 'PM2.5' : '초미세먼지 (PM2.5)'}</span>
                          <div className="flex items-end gap-2"><span className="text-lg font-black text-gray-800">{addInfo.weather?.pm25}</span><span className="text-xs text-gray-400 mb-1">{addInfo.weather?.pm25_val}㎍/㎥</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeModal === 'traffic' && (
                  <div className="flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2"><Car className="text-emerald-500 w-6 h-6" /> {lang === 'en' ? 'Traffic & Parking' : '교통 및 주차 현황'}</h3>
                    <div className="bg-emerald-50 p-5 rounded-3xl mb-5">
                      <div className="flex justify-between items-end mb-2"><span className="font-bold text-emerald-800">{lang === 'en' ? 'Avg Traffic Speed' : '주변 평균 차량 속도'}</span><span className="text-2xl font-black text-emerald-600">{addInfo.traffic?.speed} <span className="text-sm">km/h</span></span></div>
                      <p className="text-sm font-semibold text-emerald-700 bg-white/60 p-2 rounded-xl mt-3">{addInfo.traffic?.msg}</p>
                    </div>
                    <h4 className="font-bold text-sm text-gray-800 mb-3">{lang === 'en' ? 'Nearby Parking Lots' : '인근 주차장 실시간 현황'}</h4>
                    <div className="flex flex-col gap-3">
                      {addInfo.parking_lots?.length > 0 ? addInfo.parking_lots.map((p, idx) => (
                          <div key={idx} className="bg-gray-50 p-4 rounded-2xl flex justify-between items-center border border-gray-100">
                            <div className="flex flex-col gap-1 w-2/3"><strong className="text-sm text-gray-900 truncate">{p.name}</strong><span className="text-xs text-gray-500">{lang === 'en' ? 'Basic Fee: ' : '기본요금: '}{p.fee > 0 ? `${p.fee}${lang === 'en' ? 'KRW' : '원'}` : (lang === 'en' ? 'No info' : '정보없음')}</span></div>
                            <div className="text-right"><span className="block text-xs text-gray-500 mb-0.5">{lang === 'en' ? 'Available / Total' : '빈자리 / 총면수'}</span><span className="text-lg font-black text-blue-600">{p.cur}</span><span className="text-sm font-bold text-gray-400"> / {p.max}</span></div>
                          </div>
                      )) : <p className="text-gray-500 text-sm text-center py-4 bg-gray-50 rounded-2xl">{lang === 'en' ? 'No parking data.' : '주변 공영/민영 주차장 데이터가 없습니다.'}</p>}
                    </div>
                  </div>
                )}

                {activeModal === 'event' && (
                  <div className="flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2"><CalendarDays className="text-purple-500 w-6 h-6" /> {lang === 'en' ? 'Ongoing Events' : '진행 중인 행사'}</h3>
                    <div className="flex flex-col gap-3">
                      {addInfo.events?.length > 0 ? addInfo.events.map((ev, idx) => (
                          <div key={idx} className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                            <strong className="block text-purple-900 mb-1">{ev.name}</strong>
                            <span className="text-xs text-purple-600/80 font-semibold block mb-1">{ev.period}</span>
                            <span className="text-xs text-purple-800 truncate bg-white/50 px-2 py-1 rounded-md mt-1">📍 {ev.place}</span>
                          </div>
                      )) : <p className="text-gray-500 text-sm text-center py-10 bg-gray-50 rounded-2xl">{lang === 'en' ? 'No current events.' : '현재 예정된 행사가 없습니다.'}</p>}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}