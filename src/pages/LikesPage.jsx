import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Heart, Loader2, MapPin, ChevronRight } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import apiClient from '../api/client';
import { useLanguage } from '../contexts/LanguageContext';

const getCongestionStyle = (level, lang) => {
  const s = String(level ?? '').toLowerCase();
  if (!s || s === '데이터 없음' || s === 'no data')
    return { label: lang === 'en' ? 'No Data' : '정보없음', bg: 'bg-gray-100', text: 'text-gray-400', dot: 'bg-gray-300' };
  if (s.includes('혼잡') || s.includes('붐빔') || s.includes('crowd'))
    return { label: lang === 'en' ? 'Crowded' : '혼잡', bg: 'bg-red-50', text: 'text-red-500', dot: 'bg-red-500' };
  if (s.includes('보통') || s.includes('normal'))
    return { label: lang === 'en' ? 'Normal' : '보통', bg: 'bg-orange-50', text: 'text-orange-500', dot: 'bg-orange-400' };
  return { label: lang === 'en' ? 'Relax' : '여유', bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' };
};

export default function LikesPage() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const [likes, setLikes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    apiClient.get(`/api/likes?lang=${lang}`)
      .then(res => setLikes(res.data))
      .catch(err => console.error('좋아요 목록 로드 실패:', err))
      .finally(() => setIsLoading(false));
  }, [lang]);

  return (
    <div className="w-full min-h-full bg-white">

      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-5 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center -ml-1 active:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-800" />
          </button>
          <h1 className="text-[17px] font-bold text-gray-900 flex-1">
            {lang === 'en' ? 'Saved Spots' : '찜한 관광지'}
          </h1>
        </div>
      </header>

      <main className="pb-28">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
            <p className="text-[13px] text-gray-400">{lang === 'en' ? 'Loading...' : '불러오는 중...'}</p>
          </div>
        ) : likes.length === 0 ? (
          <div className="py-24 flex flex-col items-center gap-3 px-5">
            <Heart className="w-10 h-10 text-gray-200" strokeWidth={1.5} />
            <div className="text-center">
              <p className="text-[15px] font-semibold text-gray-400">
                {lang === 'en' ? 'No saved spots yet' : '아직 찜한 관광지가 없어요'}
              </p>
              <p className="text-[12px] text-gray-300 mt-1">
                {lang === 'en' ? 'Explore and save your favorite spots' : '마음에 드는 관광지를 찜해보세요'}
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="mt-2 bg-blue-500 text-white text-[13px] font-semibold px-5 py-2.5 rounded-full active:scale-95 transition-transform"
            >
              {lang === 'en' ? 'Explore Spots' : '관광지 둘러보기'}
            </button>
          </div>
        ) : (
          <div>
            <p className="px-5 pt-4 pb-2 text-[12px] font-semibold text-gray-400">
              {lang === 'en' ? `${likes.length} saved` : `저장된 관광지 ${likes.length}곳`}
            </p>
            {likes.map((spot, i) => {
              const status = getCongestionStyle(spot.congestion_level, lang);
              return (
                <button
                  key={spot.area_cd}
                  onClick={() => navigate(`/spots/${spot.area_cd}`)}
                  className={`w-full flex items-center gap-4 px-5 py-4 active:bg-gray-50 transition-colors text-left ${i !== 0 ? 'border-t border-gray-100' : ''}`}
                >
                  {/* 이미지 */}
                  <div className="w-[76px] h-[76px] rounded-2xl overflow-hidden shrink-0 bg-gray-100">
                    {spot.image_url
                      ? <img src={spot.image_url} alt={spot.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400" />
                    }
                  </div>

                  {/* 텍스트 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-gray-900 truncate">{spot.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                      <p className="text-[12px] text-gray-400 truncate">{spot.address}</p>
                    </div>
                    <div className="mt-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${status.bg} ${status.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
