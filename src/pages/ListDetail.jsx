import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, MapPin, User } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import apiClient from '../api/client';

export default function ListDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [spot, setSpot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpotDetail = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/spots/${id}`);
        setSpot(response.data);
      } catch (error) {
        console.error("상세 정보 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSpotDetail();
  }, [id]);

  // 혼잡도 정보를 객체 하나로 반환
  const getCongestionInfo = (level) => {
    if (!level || level === '데이터 없음') 
      return { rate: 0, text: '정보없음', color: 'text-gray-400', bar: 'bg-gray-400' };
    if (level.includes('혼잡') || level.includes('붐빔')) 
      return { rate: 85, text: '혼잡', color: 'text-red-500', bar: 'bg-red-500' };
    if (level.includes('보통')) 
      return { rate: 50, text: '보통', color: 'text-orange-500', bar: 'bg-orange-400' };
    return { rate: 20, text: '여유', color: 'text-emerald-500', bar: 'bg-emerald-500' };
  };

  if (loading) return <div className="p-10 text-center">로딩 중...</div>;
  if (!spot) return <div className="p-10 text-center">데이터를 찾을 수 없습니다.</div>;

  // info 변수를 정의하고 모든 곳에서 사용
  const info = getCongestionInfo(spot.congestion_level);

  return (
    <div className="w-full min-h-full bg-white">
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
  className="w-full h-16 rounded-2xl bg-blue-600 text-white text-lg font-black mb-6"
>
  대안 관광지 보기
</button>

        <div className="w-full h-52 rounded-3xl overflow-hidden bg-blue-100 mb-5">
          <img
            src={spot.image_url}
            alt={spot.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex items-center text-gray-500 text-sm mb-8">
          <MapPin className="w-5 h-5 mr-2" />
          <span>{spot.address}</span>
        </div>

        <section className="mb-8">
          <h2 className="text-lg font-black text-gray-900 mb-4">현재 예상 혼잡도</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-4 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${info.bar} bg-linear-to-r`}
                  style={{ width: `${info.rate}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-bold mt-2">
                <span className="text-emerald-600">여유</span>
                <span className="text-orange-500">보통</span>
                <span className="text-red-500">혼잡</span>
              </div>
            </div>
            <strong className={`text-2xl font-black ${info.color}`}>{info.text}</strong>
          </div>
        </section>

        <section className="mb-7">
          <div className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 mb-6 ${info.color.replace('text-', 'bg-').replace('500', '50')}`}>
            <span className={`w-3 h-3 rounded-full ${info.bar}`} />
            <span className="text-sm font-black">{info.text}</span>
          </div>

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

        <section className="mb-7">
          <h2 className="text-lg font-black text-gray-900 mb-3">소개</h2>
          <p className="text-sm leading-7 text-gray-600">{spot.description}</p>
        </section>
      </main>

      <BottomNav activeTab="map" />
    </div>
  );
}