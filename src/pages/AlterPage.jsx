import { useState } from "react";
import { ArrowLeft, MapPin, Users } from "lucide-react";
import BottomNav from "../components/BottomNav";

const DUMMY_ALTERNATIVES = [
  {
    id: 1,
    name: "성북동 한옥마을",
    distance: "2.1km",
    category: "전통 문화",
    categoryColor: "bg-orange-50 text-orange-500",
    status: "여유",
    statusColor: "text-green-500",
    dotColor: "bg-green-400",
    barColor: "bg-green-400",
    barWidth: "w-1/4",
    description: "조용한 골목과 전통 한옥이 어우러진 문화 마을",
  },
  {
    id: 2,
    name: "익선동 골목길",
    distance: "1.8km",
    category: "카페·맛집",
    categoryColor: "bg-blue-50 text-blue-500",
    status: "보통",
    statusColor: "text-yellow-500",
    dotColor: "bg-yellow-400",
    barColor: "bg-yellow-400",
    barWidth: "w-2/4",
    description: "근대 한옥과 트렌디한 카페가 공존하는 골목",
  },
  {
    id: 3,
    name: "부암동 문화거리",
    distance: "2.5km",
    category: "예술·갤러리",
    categoryColor: "bg-purple-50 text-purple-500",
    status: "여유",
    statusColor: "text-green-500",
    dotColor: "bg-green-400",
    barColor: "bg-green-400",
    barWidth: "w-1/4",
    description: "인왕산 자락 아래 예술가들이 모이는 조용한 거리",
  },
  {
    id: 4,
    name: "낙산공원",
    distance: "3.2km",
    category: "자연·공원",
    categoryColor: "bg-green-50 text-green-600",
    status: "여유",
    statusColor: "text-green-500",
    dotColor: "bg-green-400",
    barColor: "bg-green-400",
    barWidth: "w-1/5",
    description: "서울 성곽길을 따라 걷는 도심 속 힐링 공원",
  },
];

function CrowdBar({ barColor, barWidth }) {
  return (
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${barColor} ${barWidth}`} />
    </div>
  );
}

function SpotCard({ spot, onClick }) {
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
            <span>경복궁에서 {spot.distance}</span>
          </div>
        </div>
        <span
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${spot.categoryColor}`}
        >
          {spot.category}
        </span>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed">
        {spot.description}
      </p>

      <div className="flex flex-col gap-1.5">
        <CrowdBar barColor={spot.barColor} barWidth={spot.barWidth} />
        <div className="flex items-center gap-1.5">
          <Users className="w-3 h-3 text-gray-400" />
          <span className={`text-xs font-bold ${spot.statusColor}`}>
            {spot.status}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AlternativeSpots({ originSpot = "경복궁", onBack }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="w-full h-full bg-[#F8FAFC] font-['Pretendard','Noto_Sans_KR',sans-serif] flex flex-col relative overflow-hidden">
      {/* 헤더 */}
      <header className="px-5 py-4 flex items-center gap-3 bg-white shadow-sm shrink-0">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-[17px] font-bold text-gray-900">대안 관광지</h1>
      </header>

      {/* 혼잡 배너 */}
      <div className="mx-5 mt-4 shrink-0">
        <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-red-400 shrink-0 animate-pulse" />
          <span className="text-sm font-bold text-red-500">{originSpot}</span>
          <span className="text-sm text-red-400">— 현재 혼잡</span>
        </div>
        <p className="text-xs text-gray-400 mt-2 px-1">
          혼잡도가 낮은 주변 관광지를 추천합니다
        </p>
      </div>

      {/* 카드 리스트 */}
      <main className="flex-1 overflow-y-auto px-5 py-4 pb-24 flex flex-col gap-3">
        {DUMMY_ALTERNATIVES.map((spot) => (
          <SpotCard key={spot.id} spot={spot} onClick={setSelected} />
        ))}
      </main>

      {/* 바텀시트 오버레이 */}
      {selected && (
        <>
          {/* 딤 배경 */}
          <div
            className="absolute inset-0 bg-black/20 z-40"
            onClick={() => setSelected(null)}
          />
          {/* 시트 */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl px-6 pt-5 pb-6 z-50 flex flex-col gap-4">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />

            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {selected.name}
                </h2>
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  <span>경복궁에서 {selected.distance}</span>
                </div>
              </div>
              <span
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${selected.categoryColor}`}
              >
                {selected.category}
              </span>
            </div>

            <p className="text-sm text-gray-500 leading-relaxed">
              {selected.description}
            </p>

            <div className="flex flex-col gap-1.5">
              <CrowdBar
                barColor={selected.barColor}
                barWidth={selected.barWidth}
              />
              <div className="flex items-center gap-1.5">
                <Users className="w-3 h-3 text-gray-400" />
                <span className={`text-xs font-bold ${selected.statusColor}`}>
                  {selected.status}
                </span>
              </div>
            </div>

            <button className="w-full h-[52px] bg-blue-600 text-white rounded-2xl text-[15px] font-bold active:scale-[0.98] transition-all hover:bg-blue-700">
              길 안내 시작하기
            </button>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
}
