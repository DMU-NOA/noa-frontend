import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Map, MapMarker, CustomOverlayMap } from "react-kakao-maps-sdk";
import { Search, Locate } from "lucide-react";
import BottomNav from "../components/BottomNav";
import apiClient from "../api/client";

export default function MapPage() {
  const navigate = useNavigate();
  const [spots, setSpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [myPos, setMyPos] = useState({ lat: 37.5665, lng: 126.9780 });
  const [keyword, setKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const mapRef = useRef(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setMyPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
    apiClient.get("/api/spots").then(res => setSpots(res.data.data));
  }, []);

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
    if (mapRef.current) {
      mapRef.current.setCenter(new window.kakao.maps.LatLng(spot.mapy, spot.mapx));
    }
    setSearchResults([]);
  };

  // 💡 혼잡도 색상을 결정하는 헬퍼 함수 (코드 깔끔하게 정리)
  const getCongestionColor = (level) => {
    const safeLevel = String(level ?? "");
    if (safeLevel.includes('붐빔') || safeLevel.includes('혼잡')) return '#EF4444'; // 빨강
    if (safeLevel.includes('보통') || safeLevel.includes('약간')) return '#F97316'; // 주황
    return '#10B981'; // 초록
  };
  
  return (
    <div className="w-full h-screen relative">
      {/* 검색바 & 결과 리스트 */}
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
        onClick={() => mapRef.current.setCenter(new window.kakao.maps.LatLng(myPos.lat, myPos.lng))}
        className="absolute bottom-24 right-4 z-50 bg-white p-3 rounded-full shadow-lg"
      >
        <Locate className="w-6 h-6 text-blue-600" />
      </button>

      {/* 지도 */}
      <Map
        ref={mapRef}
        center={myPos}
        style={{ width: "100%", height: "100%" }}
        level={7}
        onClick={() => setSelectedSpot(null)}
      >
        {/* 내 위치 핀 */}
        <MapMarker position={myPos} />
        
        {/* 관광지 핀 반복문 */}
        {spots.map((spot) => {
          const isSelected = selectedSpot?.area_cd === spot.area_cd;
          const spotColor = getCongestionColor(spot.congestion_level);

          return (
            <div key={spot.area_cd}>
              {/* 1. 투명 마커 */}
              <MapMarker 
                position={{ lat: spot.mapy, lng: spot.mapx }}
                onClick={() => handleSpotSelect(spot)}
                image={{
                  src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
                  size: { width: 0, height: 0 }, 
                }}
              />
              
              {/* 2. 시각적 디자인 */}
              <CustomOverlayMap position={{ lat: spot.mapy, lng: spot.mapx }}>
                <div 
                  onClick={() => handleSpotSelect(spot)} 
                  className={`rounded-full border-2 border-white shadow-lg cursor-pointer transition-all duration-300 ${
                    isSelected ? 'w-8 h-8 scale-110 ring-4 ring-blue-400/50 z-50' : 'w-5 h-5 hover:scale-110'
                  }`}
                  style={{ backgroundColor: spotColor, opacity: isSelected ? 1 : 0.85 }}
                />
              </CustomOverlayMap>

              {/* 3. 모달 */}
              {isSelected && (
                <CustomOverlayMap position={{ lat: spot.mapy, lng: spot.mapx }} yAnchor={1.4}>
                  <div 
                    className="bg-white p-4 rounded-3xl shadow-2xl w-56 border border-gray-100 animate-in fade-in zoom-in duration-200 cursor-default"
                    onClick={(e) => e.stopPropagation()} // 💡 클릭이 지도로 뚫고 들어가는 것 방지
                  >
                    <img 
                      src={spot.image_url} 
                      alt={spot.name} 
                      className="w-full h-24 object-cover rounded-xl mb-3 bg-gray-100" 
                    />
                    <h4 className="font-black text-gray-900 text-sm mb-1 truncate">{spot.name}</h4>
                    <p className="text-[11px] text-gray-500 mb-2 truncate">{spot.address}</p>

                    {/* 💡 추가된 부분: 혼잡도 뱃지 */}
                    <div className="flex items-center gap-1.5 mb-3 bg-gray-50 p-1.5 rounded-lg w-fit pr-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: spotColor }}></div>
                      <span className="text-[11px] font-bold text-gray-700">
                        현재 <span style={{ color: spotColor }}>{spot.congestion_level}</span>
                      </span>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // 💡 버튼 클릭 시에도 이벤트 전파 방지
                        navigate(`/spots/${spot.area_cd}`);
                      }}
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

      {/* 하단 네비게이션 */}
      <div className="absolute bottom-0 w-full z-40">
        <BottomNav activeTab="map" />
      </div>
    </div>
  );
}