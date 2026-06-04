// src/pages/MapPage.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Map, MapMarker, CustomOverlayMap } from "react-kakao-maps-sdk";
import { Search, Locate } from "lucide-react";
import BottomNav from "../components/BottomNav";
import apiClient from "../api/client";

export default function MapPage() {
  const navigate = useNavigate();
  const location = useLocation(); 
  
  const [spots, setSpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [myPos, setMyPos] = useState({ lat: 37.5665, lng: 126.9780 }); // 화면 중심 좌표
  const [keyword, setKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const mapRef = useRef(null);

  // 1. 초기 렌더링 시 데이터 가져오기 및 내 위치 잡기
  useEffect(() => {
    // 💡 [핵심 해결] 챗봇이나 상세페이지에서 넘어온 목적지가 있는지 미리 확인합니다.
    const targetSpotId = location.state?.selectedSpot;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        // 💡 목적지가 "없을 때만" 지도를 내 GPS 위치로 맞춥니다! (튕김 현상 원천 차단)
        if (!targetSpotId) {
          setMyPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        }
      });
    }
    
    apiClient.get("/api/spots").then(res => setSpots(res.data.data));
  }, []); // 빈 배열로 두어 최초 1회만 실행

  // 2. 장소 목록이 불러와졌고, 넘어온 목적지가 있다면 그곳으로 이동
  useEffect(() => {
    if (spots.length > 0 && location.state?.selectedSpot) {
      const targetSpot = spots.find(s => s.area_cd === location.state.selectedSpot);
      if (targetSpot) {
        setMyPos({ lat: targetSpot.mapy, lng: targetSpot.mapx });
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
    setMyPos({ lat: spot.mapy, lng: spot.mapx }); // 💡 핀 클릭 시 화면을 그곳으로 이동
    setSearchResults([]);
  };

  // 💡 내 위치 버튼 눌렀을 때 GPS 다시 찾아서 이동
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
    const safeLevel = String(level ?? "");
    if (safeLevel.includes('붐빔') || safeLevel.includes('혼잡')) return '#EF4444'; 
    if (safeLevel.includes('보통') || safeLevel.includes('약간')) return '#F97316'; 
    return '#10B981'; 
  };
  
  return (
    <div className="w-full h-screen relative">
      {/* 상단 검색창 */}
      <div className="absolute top-4 left-4 right-4 z-50">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2 flex items-center">
          <Search className="w-5 h-5 text-gray-400 ml-2" />
          <input 
            className="w-full p-2 outline-none text-sm"
            placeholder="관광지 검색..."
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
        isPanto={true} // 💡 스르륵 부드럽게 이동하는 애니메이션 추가!
        onDragEnd={(map) => setMyPos({ lat: map.getCenter().getLat(), lng: map.getCenter().getLng() })} // 💡 지도 드래그 후 다른 상태가 변했을 때 튕기는 현상 완벽 방지
        style={{ width: "100%", height: "100%" }}
        level={7}
        onClick={() => setSelectedSpot(null)}
      >
        {/* 내 위치를 나타내는 마커 */}
        <MapMarker position={myPos} />
        
        {/* 121개 관광지 핀 렌더링 */}
        {spots.map((spot) => {
          const isSelected = selectedSpot?.area_cd === spot.area_cd;
          const spotColor = getCongestionColor(spot.congestion_level);

          return (
            <div key={spot.area_cd}>
              {/* 투명 마커 (클릭 이벤트 용도) */}
              <MapMarker 
                position={{ lat: spot.mapy, lng: spot.mapx }}
                onClick={() => handleSpotSelect(spot)}
                image={{
                  src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
                  size: { width: 0, height: 0 }, 
                }}
              />
              
              {/* 예쁜 색상 동그라미 핀 */}
              <CustomOverlayMap position={{ lat: spot.mapy, lng: spot.mapx }}>
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
                  position={{ lat: spot.mapy, lng: spot.mapx }} 
                  yAnchor={1.4}
                  clickable={true} 
                >
                  <div className="bg-white p-4 rounded-3xl shadow-2xl w-56 border border-gray-100 animate-in fade-in zoom-in duration-200 cursor-default">
                    <img 
                      src={spot.image_url || 'https://via.placeholder.com/300'} 
                      alt={spot.name} 
                      className="w-full h-24 object-cover rounded-xl mb-3 bg-gray-100" 
                    />
                    <h4 className="font-black text-gray-900 text-sm mb-1 truncate">{spot.name}</h4>
                    <p className="text-[11px] text-gray-500 mb-2 truncate">{spot.address}</p>

                    <div className="flex items-center gap-1.5 mb-3 bg-gray-50 p-1.5 rounded-lg w-fit pr-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: spotColor }}></div>
                      <span className="text-[11px] font-bold text-gray-700">
                        현재 <span style={{ color: spotColor }}>{spot.congestion_level}</span>
                      </span>
                    </div>

                    <button 
                      onClick={() => navigate(`/spots/${spot.area_cd}`)}
                      className="w-full bg-blue-600 text-white text-xs font-bold py-2 rounded-xl active:scale-95 transition-transform"
                    >
                      상세 정보 보기
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