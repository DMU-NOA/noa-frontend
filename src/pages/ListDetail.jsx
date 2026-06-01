import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, MapPin, User, CloudSun, Car, CalendarDays, X, Loader2 } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import apiClient from '../api/client';

// 💡 [커스텀 훅] 마우스 좌클릭 드래그 스크롤 기능
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
      const walk = (x - startX) * 1.5; // 스크롤 속도
      ref.current.scrollLeft = scrollLeft - walk;
    }
  };

  return {
    ref,
    events,
    className: isDragging ? 'cursor-grabbing select-none' : 'cursor-grab select-none'
  };
}

export default function ListDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [spot, setSpot] = useState(null);
  const [forecast, setForecast] = useState([]);
  
  // 💡 실시간 부가정보 관리를 위한 상태
  const [addInfo, setAddInfo] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null); 
  const [loadingAddInfo, setLoadingAddInfo] = useState(false); // 모달창 내부 로딩 상태

  // 드래그 스크롤 훅 (시간대별 날씨용)
  const weatherScroll = useDragScroll();

  // 1. 최초 렌더링 시: 상세 정보와 예측 혼잡도만 빠르게 호출
  useEffect(() => {
    const fetchSpotDetail = async () => {
      try {
        setLoading(true);
        const [spotRes, forecastRes] = await Promise.all([
          apiClient.get(`/api/spots/${id}`),
          apiClient.get(`/api/spots/${id}/forecast`)
        ]);
        
        setSpot(spotRes.data);
        setForecast(forecastRes.data.forecast);
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSpotDetail();
  }, [id]);

  // 2. 💡 모달 버튼 클릭 시: 해당 시점의 실시간 부가정보 API 호출
  const handleOpenModal = async (type) => {
    setActiveModal(type); // 모달창 즉시 띄움
    setLoadingAddInfo(true); // 스피너 온
    try {
      const infoRes = await apiClient.get(`/api/spots/${id}/additional-info`);
      setAddInfo(infoRes.data);
    } catch (error) {
      console.error("실시간 부가정보 로드 실패:", error);
    } finally {
      setLoadingAddInfo(false); // 스피너 오프
    }
  };

  const getCongestionInfo = (level) => {
    if (!level || level === '데이터 없음') 
      return { rate: 0, text: '정보없음', color: 'text-gray-400', bar: 'bg-gray-400' };
    if (level.includes('혼잡') || level.includes('붐빔')) 
      return { rate: 85, text: '혼잡', color: 'text-red-500', bar: 'bg-red-500' };
    if (level.includes('보통')) 
      return { rate: 50, text: '보통', color: 'text-orange-500', bar: 'bg-orange-400' };
    return { rate: 20, text: '여유', color: 'text-emerald-500', bar: 'bg-emerald-500' };
  };

  const maxPop = forecast.length > 0 ? Math.max(...forecast.map(d => d.population)) : 1;
  const maxPopItem = forecast.find(d => d.population === maxPop) || { level: '여유' };
  
  const getLevelRatio = (level) => {
      if (!level) return 0.35;
      if (level.includes('붐빔') && !level.includes('약간')) return 1.0;
      if (level.includes('약간')) return 0.75;
      if (level.includes('보통')) return 0.55;
      return 0.35; 
  };
  const chartMaxPop = maxPop / getLevelRatio(maxPopItem.level);

  const formatPop = (num) => {
      if (num >= 10000) return (num / 10000).toFixed(1) + '만';
      if (num >= 1000) return (num / 1000).toFixed(1) + '천';
      return num;
  };

  if (loading) return <div className="p-10 text-center text-gray-500">데이터를 불러오는 중...</div>;
  if (!spot) return <div className="p-10 text-center">데이터를 찾을 수 없습니다.</div>;

  const info = getCongestionInfo(spot.congestion_level);

  return (
    <div className="w-full min-h-full bg-white relative">
      <main className="px-6 pt-6 pb-28">
        <div className="flex items-center gap-3 mb-5">
          <button type="button" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-7 h-7 text-gray-900" />
          </button>
          <h1 className="text-2xl font-black text-gray-900">{spot.name}</h1>
        </div>

        <button
          type="button"
          onClick={() => navigate('/alternatives', { state: { area_cd: id } })} 
          className="w-full h-16 rounded-2xl bg-blue-600 text-white text-lg font-black mb-6 active:scale-[0.98] transition-transform shadow-md shadow-blue-200"
        >
          대안 관광지 보기
        </button>

        <div className="w-full h-52 rounded-3xl overflow-hidden bg-blue-100 mb-5 relative">
          <img src={spot.image_url} alt={spot.name} className="w-full h-full object-cover" />
        </div>

        <div className="flex items-center text-gray-500 text-sm mb-8">
          <MapPin className="w-5 h-5 mr-2" />
          <span>{spot.address}</span>
        </div>

        {/* 1. 현재 예상 혼잡도 */}
        <section className="mb-10">
          <h2 className="text-lg font-black text-gray-900 mb-4">현재 예상 혼잡도</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-4 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${info.bar} bg-linear-to-r transition-all duration-1000`}
                  style={{ width: `${info.rate}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-bold mt-2">
                <span className="text-emerald-600">여유</span>
                <span className="text-orange-500">보통</span>
                <span className="text-red-500">혼잡</span>
              </div>
            </div>
            <div className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 mb-6 ${info.color.replace('text-', 'bg-').replace('500', '50')}`}>
            <span className={`w-3 h-3 rounded-full ${info.bar}`} />
            <span className="text-sm font-black">{info.text}</span>
          </div>
          </div>
        </section>

        {/* 2. 시간대별 예상 혼잡도 차트 (모양 유지) */}
        {forecast && forecast.length > 0 && (
          <section className="mb-10 w-full">
            <div className="flex justify-between items-end mb-4">
                <h2 className="text-lg font-black text-gray-900">시간대별 예상 인구</h2>
                <span className="text-[11px] font-medium text-gray-500">단위: 명 (최대 인구 기준)</span>
            </div>
            
            <div className="flex items-end justify-between h-48 px-1">
              {forecast.map((data, index) => {
                const heightPercent = Math.min((data.population / chartMaxPop) * 100, 100);
                
                let barColor = 'bg-emerald-400';
                let textColor = 'text-emerald-600';
                let shortLevel = '여유';
                
                if (data.level.includes('붐빔') && !data.level.includes('약간')) {
                    barColor = 'bg-red-500'; textColor = 'text-red-500'; shortLevel = '혼잡';
                } else if (data.level.includes('약간')) {
                    barColor = 'bg-orange-400'; textColor = 'text-orange-600'; shortLevel = '약간';
                } else if (data.level.includes('보통')) {
                    barColor = 'bg-yellow-400'; textColor = 'text-yellow-600'; shortLevel = '보통';
                }

                return (
                  <div key={index} className="flex flex-col items-center flex-1 gap-1">
                    <div className="flex flex-col items-center justify-end h-8 mb-1">
                      <span className={`text-[10px] font-black ${textColor} tracking-tighter`}>{shortLevel}</span>
                      <span className="text-[9px] font-semibold text-gray-400 tracking-tighter mt-[2px]">
                        {formatPop(data.population)}
                      </span>
                    </div>
                    <div className="w-full h-32 flex items-end justify-center">
                      <div 
                        className={`w-3 sm:w-4 rounded-t-md ${barColor} transition-all duration-1000 opacity-90`}
                        style={{ height: `${heightPercent}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 mt-1">{data.time}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 3. 유용한 정보 버튼 그룹 */}
        <section className="mb-10">
          <h2 className="text-lg font-black text-gray-900 mb-4">유용한 정보</h2>
          <div className="grid grid-cols-3 gap-3">
            <button 
              onClick={() => handleOpenModal('weather')}
              className="flex flex-col items-center justify-center p-4 bg-sky-50 rounded-2xl border border-sky-100 active:scale-95 transition-transform"
            >
              <CloudSun className="w-7 h-7 text-sky-500 mb-2" />
              <span className="text-sm font-bold text-sky-900">날씨·먼지</span>
            </button>
            
            <button 
              onClick={() => handleOpenModal('traffic')}
              className="flex flex-col items-center justify-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100 active:scale-95 transition-transform"
            >
              <Car className="w-7 h-7 text-emerald-500 mb-2" />
              <span className="text-sm font-bold text-emerald-900">교통·주차</span>
            </button>

            <button 
              onClick={() => handleOpenModal('event')}
              className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-2xl border border-purple-100 active:scale-95 transition-transform"
            >
              <CalendarDays className="w-7 h-7 text-purple-500 mb-2" />
              <span className="text-sm font-bold text-purple-900">행사 정보</span>
            </button>
          </div>
        </section>

        {/* 관광지 정보 */}
        <section className="mb-7">

          <h2 className="text-lg font-black text-gray-900 mb-4">관광지 정보</h2>
          <div className="flex flex-col gap-3 text-gray-600 text-sm">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <span>{spot.address}</span>
            </div>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <span>카테고리: {spot.category}</span>
            </div>
          </div>
        </section>

        {/* 소개 */}
        <section className="mb-7">
          <h2 className="text-lg font-black text-gray-900 mb-3">소개</h2>
          <p className="text-sm leading-7 text-gray-600">{spot.description}</p>
        </section>
      </main>

      <BottomNav activeTab="map" />

      {/* 💡 부가정보 모달창 영역 */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/50 backdrop-blur-sm" onMouseDown={() => setActiveModal(null)}>
          <div 
            className="w-full max-w-md bg-white rounded-[2rem] p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 max-h-[85vh] flex flex-col" 
            onMouseDown={(e) => e.stopPropagation()} 
          >
            <button onClick={() => setActiveModal(null)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-full p-2 z-10">
              <X className="w-5 h-5" />
            </button>

            {/* 로딩 스피너 (버튼 클릭 직후) */}
            {loadingAddInfo ? (
              <div className="flex flex-col items-center justify-center h-48">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                <p className="text-sm font-semibold text-gray-500">실시간 데이터를 가져오는 중...</p>
              </div>
            ) : addInfo ? (
              <>
                {/* ☀️ 날씨 모달 */}
                {activeModal === 'weather' && (
                  <div className="flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                      <CloudSun className="text-sky-500 w-6 h-6" /> 날씨 및 대기환경
                    </h3>
                    <div className="flex flex-col gap-5 text-gray-700">
                      <div className="bg-gradient-to-br from-sky-50 to-blue-50 p-5 rounded-3xl flex justify-between items-center shadow-sm">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-sky-800 mb-1">현재 기온</span>
                          <span className="text-3xl font-black text-sky-600">{addInfo.weather?.temp}℃</span>
                        </div>
                        <div className="text-right flex flex-col gap-1">
                          <span className="text-sm font-semibold text-gray-600">습도: {addInfo.weather?.humidity}%</span>
                          <span className="text-sm font-semibold text-gray-600">강수: {addInfo.weather?.msg}</span>
                        </div>
                      </div>

                      {/* 💡 24시간 예보 (마우스 드래그 적용) */}
                      <div>
                        <h4 className="font-bold text-sm text-gray-800 mb-3">시간대별 날씨</h4>
                        <div 
                          ref={weatherScroll.ref}
                          className={`flex gap-3 overflow-x-auto pb-2 ${weatherScroll.className}`}
                          style={weatherScroll.style}
                          {...weatherScroll.events}
                        >
                          {addInfo.weather?.forecast24?.map((f, i) => (
                            <div key={i} className="flex flex-col items-center bg-gray-50 rounded-2xl p-3 min-w-[4rem] flex-shrink-0 pointer-events-none">
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
                          <span className="block text-xs font-bold text-gray-500 mb-1">미세먼지 (PM10)</span>
                          <div className="flex items-end gap-2">
                            <span className="text-lg font-black text-gray-800">{addInfo.weather?.pm10}</span>
                            <span className="text-xs text-gray-400 mb-1">{addInfo.weather?.pm10_val}㎍/㎥</span>
                          </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl">
                          <span className="block text-xs font-bold text-gray-500 mb-1">초미세먼지 (PM2.5)</span>
                          <div className="flex items-end gap-2">
                            <span className="text-lg font-black text-gray-800">{addInfo.weather?.pm25}</span>
                            <span className="text-xs text-gray-400 mb-1">{addInfo.weather?.pm25_val}㎍/㎥</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 🚗 교통 및 주차 모달 */}
                {activeModal === 'traffic' && (
                  <div className="flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                      <Car className="text-emerald-500 w-6 h-6" /> 교통 및 주차 현황
                    </h3>
                    
                    <div className="bg-emerald-50 p-5 rounded-3xl mb-5">
                      <div className="flex justify-between items-end mb-2">
                        <span className="font-bold text-emerald-800">주변 평균 차량 속도</span>
                        <span className="text-2xl font-black text-emerald-600">{addInfo.traffic?.speed} <span className="text-sm">km/h</span></span>
                      </div>
                      <p className="text-sm font-semibold text-emerald-700 bg-white/60 p-2 rounded-xl mt-3">{addInfo.traffic?.msg}</p>
                    </div>

                    <h4 className="font-bold text-sm text-gray-800 mb-3">인근 주차장 실시간 현황</h4>
                    <div className="flex flex-col gap-3">
                      {addInfo.parking_lots && addInfo.parking_lots.length > 0 ? (
                        addInfo.parking_lots.map((p, idx) => (
                          <div key={idx} className="bg-gray-50 p-4 rounded-2xl flex justify-between items-center border border-gray-100">
                            <div className="flex flex-col gap-1 w-2/3">
                              <strong className="text-sm text-gray-900 truncate">{p.name}</strong>
                              <span className="text-xs text-gray-500">기본요금: {p.fee > 0 ? `${p.fee}원` : '무료/정보없음'}</span>
                            </div>
                            <div className="text-right">
                              <span className="block text-xs text-gray-500 mb-0.5">빈자리 / 총면수</span>
                              <span className="text-lg font-black text-blue-600">{p.cur}</span>
                              <span className="text-sm font-bold text-gray-400"> / {p.max}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm text-center py-4 bg-gray-50 rounded-2xl">주변 공영/민영 주차장 데이터가 없습니다.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 🎪 행사 모달 */}
                {activeModal === 'event' && (
                  <div className="flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                      <CalendarDays className="text-purple-500 w-6 h-6" /> 진행 중인 행사
                    </h3>
                    <div className="flex flex-col gap-3">
                      {addInfo.events && addInfo.events.length > 0 ? (
                        addInfo.events.map((ev, idx) => (
                          <div key={idx} className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                            <strong className="block text-purple-900 mb-1">{ev.name}</strong>
                            <span className="text-xs text-purple-600/80 font-semibold block mb-1">{ev.period}</span>
                            <span className="text-xs text-purple-800 block truncate bg-white/50 inline-block px-2 py-1 rounded-md mt-1">📍 {ev.place}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm text-center py-10 bg-gray-50 rounded-2xl">현재 예정된 행사가 없습니다.</p>
                      )}
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