import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  MapPin,
  User,
  CreditCard,
  MapPinned,
  Layers,
} from 'lucide-react';
import BottomNav from '../components/BottomNav';

export default function ListDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const spot = {
    id: id || 1,
    name: '경복궁',
    image: 'https://images.unsplash.com/photo-1601621915196-2621bfb0cd6e?q=80&w=1200',
    location: '서울 종로구 사직로 161',
    address: '서울 종로구 사직로 161',
    congestionRate: 82,
    status: '혼잡',
    capacity: '5,000명',
    parking: '120대 가능',
    description:
      '조선 시대 왕실의 생활공간으로 사용된 궁궐로, 자연과 어우러진 정원과 동물원이 있어 여유롭게 산책하기 좋습니다.',
    festival: {
      title: '종로 한옥 음악회',
      date: '2026.05.03 ~ 05.05',
      distance: '0.3km',
    },
  };

  const weeklyData = [
    { day: '오늘', value: 82, color: 'bg-red-500' },
    { day: '내일', value: 74, color: 'bg-orange-400' },
    { day: '수', value: 42, color: 'bg-emerald-500' },
    { day: '목', value: 48, color: 'bg-emerald-500' },
    { day: '금', value: 62, color: 'bg-orange-400' },
    { day: '토', value: 86, color: 'bg-red-500' },
    { day: '일', value: 78, color: 'bg-red-500' },
  ];

  return (
    <div className="w-full min-h-full bg-white">
      <main className="px-6 pt-6 pb-28">
        <div className="flex items-center gap-3 mb-5">
          <button type="button" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-7 h-7 text-gray-900" />
          </button>

          <h1 className="text-2xl font-black text-gray-900">
            {spot.name}
          </h1>
        </div>

        {/* 대안 관광지 버튼 - 상단 배치 */}
        <button
          type="button"
          className="w-full h-16 rounded-2xl bg-blue-600 text-white text-lg font-black mb-6"
        >
          대안 관광지 보기
        </button>

        <div className="w-full h-52 rounded-3xl overflow-hidden bg-blue-100 mb-5">
          <img
            src={spot.image}
            alt={spot.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex items-center text-gray-500 text-sm mb-8">
          <MapPin className="w-5 h-5 mr-2" />
          <span>{spot.address || spot.location}</span>
        </div>

        <section className="mb-8">
          <h2 className="text-lg font-black text-gray-900 mb-4">
            현재 예상 혼잡도
          </h2>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-4 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-orange-400 to-red-500"
                  style={{ width: `${spot.congestionRate}%` }}
                />
              </div>

              <div className="flex justify-between text-xs font-bold mt-2">
                <span className="text-emerald-600">여유</span>
                <span className="text-orange-500">보통</span>
                <span className="text-red-500">혼잡</span>
              </div>
            </div>

            <strong className="text-2xl font-black text-red-500">
              {spot.congestionRate}%
            </strong>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-black text-gray-900 mb-4">
            향후 7일 혼잡도 예측
          </h2>

          <div className="flex items-end justify-between h-36">
            {weeklyData.map((item) => (
              <div
                key={item.day}
                className="flex flex-col items-center justify-end gap-2"
              >
                <div
                  className={`w-10 rounded-t-md ${item.color}`}
                  style={{ height: `${item.value}px` }}
                />
                <span className="text-xs text-gray-500">{item.day}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 아래 스크롤 상세 정보 영역 */}
        <section className="mb-7">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 rounded-xl px-4 py-2 mb-6">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-sm font-black">여유</span>
          </div>

          <h2 className="text-lg font-black text-gray-900 mb-4">
            관광지 정보
          </h2>

          <div className="flex flex-col gap-3 text-gray-600 text-sm">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <span>{spot.address}</span>
            </div>

            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <span>수용인원: {spot.capacity}</span>
            </div>

            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <span>주차: {spot.parking}</span>
            </div>
          </div>
        </section>

        <section className="mb-7">
          <h2 className="text-lg font-black text-gray-900 mb-3">
            소개
          </h2>

          <p className="text-sm leading-7 text-gray-600">
            {spot.description}
          </p>
        </section>

        <section className="mb-7">
          <h2 className="text-lg font-black text-gray-900 mb-4">
            주변 축제/행사
          </h2>

          <div className="bg-[#F8F7FF] rounded-2xl p-5 flex gap-4 items-center">
            <div className="w-2 h-16 rounded-full bg-blue-500" />

            <div>
              <h3 className="text-base font-black text-gray-900">
                {spot.festival.title}
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                {spot.festival.date} · {spot.festival.distance}
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="h-24 bg-slate-100 rounded-2xl flex items-center justify-center">
            <MapPinned className="w-10 h-10 text-gray-300" />
          </div>
        </section>
      </main>

      <BottomNav activeTab="map" />
    </div>
  );
}