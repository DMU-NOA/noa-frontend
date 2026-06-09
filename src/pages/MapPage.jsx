// src/pages/MapPage.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Map, MapMarker, CustomOverlayMap } from "react-kakao-maps-sdk";
import { Search, Locate, Heart } from "lucide-react";
import BottomNav from "../components/BottomNav";
import apiClient from "../api/client";
import { useLanguage } from "../contexts/LanguageContext";

export default function MapPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useLanguage();

  const [spots, setSpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.9780 });
  const [keyword, setKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [myPos, setMyPos] = useState({ lat: 37.5665, lng: 126.9780 });
  const [likes, setLikes] = useState([]);
  const [showLikes, setShowLikes] = useState(false);
  const [dragY, setDragY] = useState(0);
  const dragStartY = useRef(null);

  const mapRef = useRef(null);
  
  useEffect(() => {
    const targetSpotId = location.state?.selectedSpot;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        if (!targetSpotId) {
          setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        }
      });
    }

    apiClient.get(`/api/spots?lang=${lang}`).then(res => setSpots(res.data.data));

    apiClient.get(`/api/likes?lang=${lang}`)
      .then(res => setLikes(res.data))
      .catch(err => console.error("찜 목록 가져오기 실패", err));

  }, [lang, location.state?.selectedSpot]);


  useEffect(() => {
    if (spots.length > 0 && location.state?.selectedSpot) {
      const targetSpot = spots.find(s => s.area_cd === location.state.selectedSpot);
      if (targetSpot) {
        setMapCenter({ lat: parseFloat(targetSpot.mapy), lng: parseFloat(targetSpot.mapx) });
        setSelectedSpot(targetSpot);
      }
    }
  }, [spots, location.state]);

  const handleSearch = (e) => {
    const val = e.target.value;
    setKeyword(val);
    if (!val) {
      setSearchResults([]);
      return;
    }
    setSearchResults(spots.filter(s => s.name.includes(val)));
  };

  const handleSpotSelect = (spot) => {
    setSelectedSpot(spot);
    setMapCenter({ lat: parseFloat(spot.mapy), lng: parseFloat(spot.mapx) });
    setSearchResults([]);
    setKeyword("");
    setShowLikes(false);
  };

const handleLocateMe = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setMyPos(newPos);
      setMapCenter(newPos);
      // 👇 이 핵심 코드가 지워졌습니다. 부활시켜주세요!
      mapRef.current?.panTo(new window.kakao.maps.LatLng(newPos.lat, newPos.lng));
    });
  }
};

  const getCongestionColor = (level) => {
    const safeLevel = String(level ?? "").toLowerCase();
    if (safeLevel.includes('붐빔') || safeLevel.includes('혼잡') || safeLevel.includes('crowd')) return '#EF4444';
    if (safeLevel.includes('보통') || safeLevel.includes('약간') || safeLevel.includes('normal')) return '#F97316';
    return '#10B981';
  };

  const startDrag = (startY) => {
    dragStartY.current = startY;
    setDragY(0);

    const onMove = (e) => {
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      const dy = y - dragStartY.current;
      if (dy > 0) setDragY(dy);
    };

    const onEnd = (e) => {
      const y = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
      const dy = y - dragStartY.current;
      dragStartY.current = null;
      if (dy > 60) {
        setShowLikes(false);
      }
      setDragY(0);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchend', onEnd);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchend', onEnd);
  };

  const toggleLike = async (e, spot) => {
    e.stopPropagation();
    const isLiked = likes.some(l => l.area_cd === spot.area_cd);

    try {
      if (isLiked) {
        await apiClient.delete(`/api/likes/${spot.area_cd}`);
        setLikes(prev => prev.filter(l => l.area_cd !== spot.area_cd));
      } else {
        await apiClient.post("/api/likes", { area_cd: spot.area_cd });
        setLikes(prev => [{
            area_cd: spot.area_cd,
            name: spot.name,
            address: spot.address,
            congestion_level: spot.congestion_level
        }, ...prev]);
      }
    } catch (err) {
      console.error("좋아요 토글 실패", err);
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 상단 검색창 */}
      <div className="absolute top-4 left-4 right-4 z-50">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2 flex items-center">
          <Search className="w-5 h-5 text-gray-400 ml-2" />
          <input
            className="w-full p-2 outline-none text-sm"
            placeholder={lang === 'en' ? "Search spots..." : "관광지 검색..."}
            value={keyword}
            onChange={handleSearch}
          />
        </div>
        {searchResults.length > 0 && (
          <div className="bg-white mt-2 rounded-xl shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map(s => (
              <div
                key={s.area_cd}
                className="p-3 border-b text-sm cursor-pointer hover:bg-gray-50"
                onClick={() => handleSpotSelect(s)}
              >
                {s.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 찜한 목록 버튼 */}
      <button
        onClick={() => { setShowLikes(v => !v); setSelectedSpot(null); }}
        className="absolute top-20 right-4 z-50 bg-white p-3 rounded-full shadow-lg active:scale-95 transition-transform flex items-center justify-center"
      >
        <Heart className={`w-6 h-6 ${showLikes ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
      </button>

      {/* 찜한 목록 바텀시트 */}
      {showLikes && (
        <>
          {/* 딤 배경 */}
          <div
            className="absolute inset-0 z-40 bg-black/30"
            onClick={() => setShowLikes(false)}
          />
          {/* 시트 */}
          <div
            className="absolute bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[55%] flex flex-col"
            style={{
              transform: `translateY(${Math.max(0, dragY)}px)`,
              transition: dragY > 0 ? 'none' : 'transform 0.3s ease'
            }}
          >
            {/* 핸들 */}
            <div
              className="flex justify-center pt-4 pb-3 shrink-0 cursor-grab active:cursor-grabbing select-none"
              onMouseDown={(e) => startDrag(e.clientY)}
              onTouchStart={(e) => startDrag(e.touches[0].clientY)}
            >
              <div className="w-9 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {/* 헤더 */}
            <div className="flex items-center px-5 pb-3 shrink-0">
              <Heart className="w-4 h-4 fill-red-500 text-red-500 mr-2" />
              <h3 className="text-[15px] font-bold text-gray-900">
                {lang === 'en' ? 'Saved Spots' : '찜한 장소'}
              </h3>
              <span className="text-[12px] text-gray-400 font-medium ml-1.5">{likes.length}</span>
            </div>

            {/* 구분선 */}
            <div className="h-px bg-gray-100 shrink-0" />

            {/* 리스트 */}
            <div className="overflow-y-auto pb-10 flex-1">
              {likes.length > 0 ? (
                likes.map((spot, i) => {
                  const mapSpot = spots.find(s => s.area_cd === spot.area_cd) || spot;
                  const spotColor = getCongestionColor(spot.congestion_level);
                  return (
                    <button
                      key={spot.area_cd}
                      onClick={() => handleSpotSelect(mapSpot)}
                      className={`w-full flex items-center gap-3.5 px-5 py-3.5 active:bg-gray-50 transition-colors ${i !== 0 ? 'border-t border-gray-50' : ''}`}
                    >
                      <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 bg-gray-100">
                        <img src={mapSpot.image_url || 'https://via.placeholder.com/300'} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-[14px] font-bold text-gray-900 truncate">{spot.name}</p>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{spot.address}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: spotColor }} />
                        <span className="text-[11px] text-gray-500">{spot.congestion_level}</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-14 text-center text-[13px] text-gray-400">
                  {lang === 'en' ? 'No saved spots yet.' : '아직 찜한 장소가 없어요 🥲'}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* 내 위치 이동 버튼 — 찜 버튼 아래, 시트 열리면 숨김 */}
      {!showLikes && (
        <button
          onClick={handleLocateMe}
          className="absolute top-[144px] right-4 z-50 bg-white w-11 h-11 rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-transform border border-gray-100"
        >
          <Locate className="w-5 h-5 text-blue-500" />
        </button>
      )}

      {/* 카카오 맵 */}
      <Map ref={mapRef}
        center={mapCenter}
        isPanto={true}
        onDragEnd={(map) => setMapCenter({ lat: map.getCenter().getLat(), lng: map.getCenter().getLng() })}
        style={{ width: "100%", height: "100%" }}
        level={7}
        onClick={() => { setSelectedSpot(null); }}
      >
      <MapMarker position={myPos} />
        {spots.map((spot) => {
          const isSelected = selectedSpot?.area_cd === spot.area_cd;
          const spotColor = getCongestionColor(spot.congestion_level);
          const isLiked = likes.some(l => l.area_cd === spot.area_cd);

          return (
            <div key={spot.area_cd}>
              <CustomOverlayMap position={{ lat: parseFloat(spot.mapy), lng: parseFloat(spot.mapx) }} zIndex={1}>
                <div
                  onClick={() => handleSpotSelect(spot)}
                  className={`rounded-full border-2 border-white shadow-lg cursor-pointer transition-all duration-300 ${
                    isSelected ? 'w-8 h-8 scale-110 ring-4 ring-blue-400/50' : 'w-5 h-5 hover:scale-110'
                  }`}
                  style={{ backgroundColor: spotColor, opacity: isSelected ? 1 : 0.85 }}
                />
              </CustomOverlayMap>

              {isSelected && (
                <CustomOverlayMap
                  position={{ lat: parseFloat(spot.mapy), lng: parseFloat(spot.mapx) }}
                  yAnchor={1.15}
                  clickable={true}
                  zIndex={10}
                >
                  <div className="bg-white p-4 rounded-3xl shadow-2xl w-56 border border-gray-100 animate-in fade-in zoom-in duration-200 cursor-default relative">

                    <button
                      onClick={(e) => toggleLike(e, spot)}
                      className="absolute top-6 right-6 z-10 bg-white/80 backdrop-blur p-1.5 rounded-full shadow-sm active:scale-90 transition-transform"
                    >
                      <Heart className={`w-5 h-5 ${isLiked ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
                    </button>

                    <img
                      src={spot.image_url || 'https://via.placeholder.com/300'}
                      alt={spot.name}
                      className="w-full h-24 object-cover rounded-xl mb-3 bg-gray-100"
                    />
                    <h4 className="font-black text-gray-900 text-sm mb-1 pr-6 truncate">{spot.name}</h4>
                    <p className="text-[11px] text-gray-500 mb-2 truncate">{spot.address}</p>

                    <div className="flex items-center gap-1.5 mb-3 bg-gray-50 p-1.5 rounded-lg w-fit pr-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: spotColor }} />
                      <span className="text-[11px] font-bold text-gray-700">
                        {lang === 'en' ? 'Currently ' : '현재 '}<span style={{ color: spotColor }}>{spot.congestion_level}</span>
                      </span>
                    </div>

                    <button
                      onClick={() => navigate(`/spots/${spot.area_cd}`)}
                      className="w-full bg-blue-600 text-white text-xs font-bold py-2 rounded-xl active:scale-95 transition-transform"
                    >
                      {lang === 'en' ? 'View Details' : '상세 정보 보기'}
                    </button>
                  </div>
                </CustomOverlayMap>
              )}
            </div>
          );
        })}
      </Map>

      <div className="absolute bottom-0 w-full z-40">
        <BottomNav />
      </div>
    </div>
  );
}
