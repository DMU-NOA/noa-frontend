import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Heart, MapPin, Loader2, ChevronRight } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import apiClient from '../api/client';
import { getUser, removeToken } from '../api/auth';

const getCongestionStyle = (level) => {
  const s = String(level ?? '');
  if (!s || s === '데이터 없음') return { dot: 'bg-gray-300', text: 'text-gray-400', label: '정보없음' };
  if (s.includes('혼잡') || s.includes('붐빔')) return { dot: 'bg-red-500', text: 'text-red-500', label: '혼잡' };
  if (s.includes('보통')) return { dot: 'bg-orange-400', text: 'text-orange-500', label: '보통' };
  return { dot: 'bg-emerald-500', text: 'text-emerald-600', label: '여유' };
};

export default function MyPage() {
  const navigate = useNavigate();
  const user = getUser();
  const [likes, setLikes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/api/likes')
      .then(res => setLikes(res.data))
      .catch(err => console.error('좋아요 목록 로드 실패:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogout = () => {
    removeToken();
    navigate('/login', { replace: true });
  };

  return (
    <div className="w-full min-h-full bg-[#F8FAFC] font-['Pretendard','Noto_Sans_KR',sans-serif]">
      {/* 헤더 */}
      <header className="px-6 py-5 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">안녕하세요 👋</p>
            <h1 className="text-xl font-black text-gray-900">{user?.name ?? '여행자'}님</h1>
            <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-full px-3 py-1.5 hover:bg-gray-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> 로그아웃
          </button>
        </div>
      </header>

      <main className="px-6 py-6 pb-24">
        {/* 좋아요 목록 */}
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 fill-red-500 text-red-500" />
          <h2 className="text-lg font-bold text-gray-900">찜한 관광지</h2>
          <span className="text-sm font-bold text-blue-500 ml-auto">{likes.length}곳</span>
        </div>

        {isLoading ? (
          <div className="py-10 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
            <p className="text-sm font-medium">불러오는 중...</p>
          </div>
        ) : likes.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-gray-400">
            <Heart className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-sm font-medium">찜한 관광지가 없습니다</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 text-xs font-bold text-blue-500 border border-blue-200 px-4 py-2 rounded-full"
            >
              관광지 둘러보기
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {likes.map((spot) => {
              const status = getCongestionStyle(spot.congestion_level);
              return (
                <div
                  key={spot.area_cd}
                  onClick={() => navigate(`/spots/${spot.area_cd}`)}
                  className="bg-white rounded-3xl flex items-center shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <div className="w-28 h-28 bg-gray-100 overflow-hidden shrink-0">
                    <img src={spot.image_url} alt={spot.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4 flex-1 flex flex-col gap-1.5">
                    <h3 className="text-[15px] font-bold text-gray-900">{spot.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{spot.address}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                      <span className={`text-xs font-bold ${status.text}`}>{status.label}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 mr-4 shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
