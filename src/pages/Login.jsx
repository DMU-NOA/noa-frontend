import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { RiKakaoTalkFill } from "react-icons/ri";
import { loginWithGoogle, loginWithKakao } from "../api/auth";

const PROVIDERS = [
  {
    id: "Kakao",
    label: "카카오로 시작하기",
    icon: <RiKakaoTalkFill size={22} color="#191919" />,
    className: "bg-[#FEE500] border-[#FEE500]",
    textClassName: "text-[#191919]",
    spinnerClassName: "border-yellow-600 border-t-transparent",
    action: loginWithKakao,
  },
  {
    id: "Google",
    label: "구글로 시작하기",
    icon: <FcGoogle size={22} />,
    className: "bg-white border-gray-200 shadow-sm hover:bg-gray-50",
    textClassName: "text-gray-900",
    spinnerClassName: "border-gray-300 border-t-gray-600",
    action: loginWithGoogle,
  },
];

export default function LoginPage() {
  const [loadingProvider, setLoadingProvider] = useState(null);

  const handleSocialLogin = (provider, action) => {
    if (loadingProvider) return;
    setLoadingProvider(provider);
    action(); // 백엔드 OAuth URL로 리다이렉트 (페이지 이동이라 로딩 상태는 시각적 피드백용)
  };

  return (
    <div className="w-full h-full bg-white font-['Pretendard','Noto_Sans_KR',sans-serif] flex flex-col items-center justify-between px-6 py-16">
      {/* 브랜딩 */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <h1 className="text-7xl font-black text-blue-600 tracking-tighter">
          NOA
        </h1>
        <p className="text-sm text-gray-400 text-center leading-relaxed">
          붐비지 않는 나만의 여행지를 찾아보세요
        </p>
      </div>

      {/* 버튼 영역 */}
      <div className="w-full max-w-xs flex flex-col gap-3">
        {PROVIDERS.map(
          ({ id, label, icon, className, textClassName, spinnerClassName, action }) => (
            <button
              key={id}
              type="button"
              disabled={loadingProvider !== null}
              onClick={() => handleSocialLogin(id, action)}
              className={`w-full h-[54px] border rounded-2xl flex items-center px-5 relative active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
            >
              <span className="absolute left-5">
                {loadingProvider === id ? (
                  <span
                    className={`w-4 h-4 border-2 rounded-full animate-spin block ${spinnerClassName}`}
                  />
                ) : (
                  icon
                )}
              </span>
              <span
                className={`flex-1 text-center text-[15px] font-bold ${textClassName}`}
              >
                {loadingProvider === id ? "로그인 중..." : label}
              </span>
            </button>
          ),
        )}

        {/* 약관 */}
        <p className="text-center text-xs text-gray-400 leading-relaxed mt-2">
          계속 진행하면{" "}
          <button
            type="button"
            className="text-gray-500 underline underline-offset-2 font-medium"
          >
            이용약관
          </button>{" "}
          및{" "}
          <button
            type="button"
            className="text-gray-500 underline underline-offset-2 font-medium"
          >
            개인정보처리방침
          </button>
          에 동의합니다.
        </p>
      </div>
    </div>
  );
}
