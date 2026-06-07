import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { RiKakaoTalkFill } from 'react-icons/ri';
import { loginWithGoogle, loginWithKakao } from '../api/auth';

export default function LoginRequired() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);

  const handleKakao = () => { setLoading('kakao'); loginWithKakao(); };
  const handleGoogle = () => { setLoading('google'); loginWithGoogle(); };

  return (
    <div className="flex flex-col h-full" style={{ background: 'linear-gradient(160deg, #1d4ed8 0%, #3b82f6 50%, #eff6ff 100%)' }}>
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
          <UserRound className="w-7 h-7 text-white" strokeWidth={2} />
        </div>
        <h2 className="text-[26px] font-bold text-white mb-3">로그인이 필요해요</h2>
        <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
          NOA의 모든 기능을 이용하려면<br />로그인해 주세요
        </p>
      </div>

      <div className="bg-white rounded-t-3xl px-6 pt-7 pb-12 flex flex-col gap-3">
        <p className="text-[12px] text-gray-400 text-center mb-1">SNS 계정으로 간편하게 시작하세요</p>

        <button
          onClick={handleKakao}
          disabled={loading !== null}
          className="w-full h-[54px] bg-[#FEE500] rounded-2xl flex items-center px-6 relative active:scale-[0.98] transition-transform disabled:opacity-50 shadow-sm"
        >
          <span className="absolute left-6">
            {loading === 'kakao'
              ? <span className="w-4 h-4 border-2 border-yellow-700 border-t-transparent rounded-full animate-spin block" />
              : <RiKakaoTalkFill size={20} color="#191919" />
            }
          </span>
          <span className="flex-1 text-center text-[15px] font-bold text-[#191919]">
            카카오로 시작하기
          </span>
        </button>

        <button
          onClick={handleGoogle}
          disabled={loading !== null}
          className="w-full h-[54px] bg-white border border-gray-200 rounded-2xl flex items-center px-6 relative active:scale-[0.98] transition-transform disabled:opacity-50 shadow-sm"
        >
          <span className="absolute left-6">
            {loading === 'google'
              ? <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin block" />
              : <FcGoogle size={20} />
            }
          </span>
          <span className="flex-1 text-center text-[15px] font-bold text-gray-800">
            구글로 시작하기
          </span>
        </button>

        <button
          onClick={() => navigate('/')}
          className="pt-2 text-[13px] font-medium text-gray-400 active:text-gray-600 transition-colors text-center"
        >
          지금은 괜찮아요
        </button>
      </div>
    </div>
  );
}
