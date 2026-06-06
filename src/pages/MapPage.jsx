// src/pages/MapPage.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Map, MapMarker, CustomOverlayMap } from "react-kakao-maps-sdk";
import { Search, Locate, Heart, X } from "lucide-react"; // 💡 Heart, X 아이콘 추가
import BottomNav from "../components/BottomNav";
import apiClient from "../api/client";
import { useLanguage } from "../contexts/LanguageContext";

export default function MapPage() {
  const navigate = useNavigate();
  const location = useLocation(); 
  const { lang } = useLanguage(); 
  
  const [spots, setSpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [myPos, setMyPos] = useState({ lat: 37.5665, lng: 126.9780 }); 
  const [keyword, setKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  
  // 💡 찜한 목록 관련 상태 추가
  const [likes, setLikes] = useState([]);
  const [showLikes, setShowLikes] = useState(false);

  const mapRef = useRef(null);

  // 1. 초기 데이터 가져오기
  useEffect(() => {
    const targetSpotId = location.state?.selectedSpot;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        if (!targetSpotId) {
          setMyPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        }
      });
    }
    
    // 전체 관광지 로드
    apiClient.get(`/api/spots?lang=${lang}`).then(res => setSpots(res.data.data));
    
    // 💡 내 찜한 목록 로드
    apiClient.get(`/api/likes?lang=${lang}`)
      .then(res => setLikes(res.data))
      .catch(err => console.error("찜 목록 가져오기 실패", err));

  }, [lang, location.state?.selectedSpot]);

  // 2. 목적지 전달받았을 때 이동
  useEffect(() => {
    if (spots.length > 0 && location.state?.selectedSpot) {
      const targetSpot = spots.find(s => s.area_cd === location.state.selectedSpot);
      if (targetSpot) {
        setMyPos({ lat: parseFloat(targetSpot.mapy), lng: parseFloat(targetSpot.mapx) });
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
    setMyPos({ lat: parseFloat(spot.mapy), lng: parseFloat(spot.mapx) }); 
    setSearchResults([]);
    setShowLikes(false); // 💡 목록에서 장소 클릭 시 리스트 닫기
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMyPos(newPos);
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
  
  // 💡 지도 위 팝업에서 찜(하트) 클릭 시 실행할 함수
  const toggleLike = async (e, spot) => {
    e.stopPropagation(); // 💡 팝업 뒤의 다른 이벤트가 눌리지 않게 막음
    const isLiked = likes.some(l => l.area_cd === spot.area_cd);
    
    try {
      if (isLiked) {
        await apiClient.delete(`/api/likes/${spot.area_cd}`);
        setLikes(prev => prev.filter(l => l.area_cd !== spot.area_cd));
      } else {
        await apiClient.post("/api/likes", { area_cd: spot.area_cd });
        // 낙관적 업데이트: 바로 목록에 추가해서 즉각적인 반응성 확보
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
    <div className="w-full h-screen relative overflow-hidden">
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

      {/* 💡 찜한 목록 버튼 (우측 상단) */}
      <button 
        onClick={() => setShowLikes(!showLikes)}
        className="absolute top-20 right-4 z-50 bg-white p-3 rounded-full shadow-lg active:scale-95 transition-transform flex items-center justify-center"
      >
        <Heart className={`w-6 h-6 ${showLikes ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
      </button>

      {/* 💡 찜한 목록 미니 리스트 모달 */}
      {showLikes && (
        <div className="absolute top-36 right-4 w-64 bg-white rounded-2xl shadow-xl z-50 max-h-80 flex flex-col border border-gray-100 animate-in fade-in slide-in-from-right-4">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Heart className="w-4 h-4 fill-red-500 text-red-500" />
              {lang === 'en' ? "Saved Spots" : "찜한 장소"}
            </h3>
            <button onClick={() => setShowLikes(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-y-auto p-2 flex flex-col gap-1">
            {likes.length > 0 ? (
              likes.map(spot => {
                  // 지도 좌표를 위해 원본 spots 데이터에서 해당 장소를 찾아 결합
                  const mapSpot = spots.find(s => s.area_cd === spot.area_cd) || spot;
                  return (
                    <div 
                        key={spot.area_cd}
                        className="p-2 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                        onClick={() => handleSpotSelect(mapSpot)}
                    >
                        <div className="flex flex-col truncate pr-2">
                            <span className="text-sm font-bold text-gray-800 truncate">{spot.name}</span>
                            <span className="text-[10px] text-gray-500 truncate">{spot.address}</span>
                        </div>
                    </div>
                  );
              })
            ) : (
              <div className="p-4 text-center text-xs text-gray-400">
                {lang === 'en' ? "No saved spots." : "찜한 장소가 없습니다."}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 내 위치 이동 버튼 */}
      <button 
        onClick={handleLocateMe}
        className="absolute bottom-24 right-4 z-50 bg-white p-3 rounded-full shadow-lg active:scale-95 transition-transform"
      >
        <Locate className="w-6 h-6 text-blue-600" />
      </button>

      {/* 🗺️ 카카오 맵 컴포넌트 */}
      <Map
        ref={mapRef}
        center={myPos}
        isPanto={true} 
        onDragEnd={(map) => setMyPos({ lat: map.getCenter().getLat(), lng: map.getCenter().getLng() })} 
        style={{ width: "100%", height: "100%" }}
        level={7}
        onClick={() => { setSelectedSpot(null); setShowLikes(false); }} // 💡 빈 지도 누르면 리스트랑 팝업 닫기
      >
        {/* 내 위치를 나타내는 마커 */}
        <MapMarker position={myPos} />
        
        {/* 121개 관광지 핀 렌더링 */}
        {spots.map((spot) => {
          const isSelected = selectedSpot?.area_cd === spot.area_cd;
          const spotColor = getCongestionColor(spot.congestion_level);
          const isLiked = likes.some(l => l.area_cd === spot.area_cd); // 💡 이 장소가 찜 목록에 있는지 확인

          return (
            <div key={spot.area_cd}>
              {/* 투명 마커 (클릭 이벤트 용도) */}
              <MapMarker 
                position={{ lat: parseFloat(spot.mapy), lng: parseFloat(spot.mapx) }}
                onClick={() => handleSpotSelect(spot)}
                image={{
                  src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
                  size: { width: 0, height: 0 }, 
                }}
              />
              
              {/* 예쁜 색상 동그라미 핀 */}
              <CustomOverlayMap position={{ lat: parseFloat(spot.mapy), lng: parseFloat(spot.mapx) }}>
                <div 
                  onClick={() => handleSpotSelect(spot)} 
                  className={`rounded-full border-2 border-white shadow-lg cursor-pointer transition-all duration-300 ${
                    isSelected ? 'w-8 h-8 scale-110 ring-4 ring-blue-400/50 z-50' : 'w-5 h-5 hover:scale-110'
                  }`}
                  style={{ backgroundColor: spotColor, opacity: isSelected ? 1 : 0.85 }}
                />
              </CustomOverlayMap>

              {/* 핀 클릭 시 나타나는 정보 카드 */}
              {isSelected && (
                <CustomOverlayMap 
                  position={{ lat: parseFloat(spot.mapy), lng: parseFloat(spot.mapx) }} 
                  yAnchor={1.4}
                  clickable={true} 
                >
                  <div className="bg-white p-4 rounded-3xl shadow-2xl w-56 border border-gray-100 animate-in fade-in zoom-in duration-200 cursor-default relative">
                    
                    {/* 💡 카드 우측 상단 찜(하트) 토글 버튼 */}
                    <button 
                      onClick={(e) => toggleLike(e, spot)}
                      className="absolute top-6 right-6 z-10 bg-white/80 backdrop-blur p-1.5 rounded-full shadow-sm hover:scale-110 transition-transform"
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
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: spotColor }}></div>
                      <span className="text-[11px] font-bold text-gray-700">
                        {lang === 'en' ? 'Currently ' : '현재 '} <span style={{ color: spotColor }}>{spot.congestion_level}</span> 
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