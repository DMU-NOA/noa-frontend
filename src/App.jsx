import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import Home from "./pages/Home";
import ListDetail from "./pages/ListDetail";
import LoginPage from "./pages/Login";
import AlternativeSpots from "./pages/AlterPage";
import { saveToken, isLoggedIn } from "./api/auth";
import MapPage from "./pages/MapPage";
import ChatPage from "./pages/ChatPage";
import MyPage from "./pages/MyPage";

// 소셜 로그인 후 백엔드가 /?token=xxx 로 리다이렉트 → 토큰 저장 후 홈으로 이동
function CallbackHandler() {
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const token = params.get("token");
    if (token) {
      saveToken(token);
      navigate("/", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [navigate, search]);

  return null;
}

// 로그인 안 된 상태면 로그인 안내 페이지로
function PrivateRoute({ children }) {
  if (!isLoggedIn()) {
    return <LoginRequired />;
  }
  return children;
}

// 로그인 필요 안내 화면
function LoginRequired() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="text-5xl mb-5">🔒</div>
      <h2 className="text-xl font-black text-gray-900 mb-2">로그인이 필요합니다</h2>
      <p className="text-sm text-gray-500 mb-8 leading-relaxed">
        이 기능은 로그인 후 이용할 수 있어요.<br />
        로그인하고 더 많은 기능을 사용해보세요!
      </p>
      <button
        onClick={() => navigate('/login')}
        className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl active:scale-95 transition-transform shadow-md shadow-blue-200"
      >
        로그인하러 가기
      </button>
      <button
        onClick={() => navigate('/')}
        className="mt-3 text-sm font-semibold text-gray-400"
      >
        홈으로 돌아가기
      </button>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      {/* 바탕은 회색(bg-gray-100), 중앙에 모바일 사이즈(max-w-md)의 하얀색(bg-white) 앱 화면 띄우기 */}
      <div className="min-h-screen bg-gray-100 flex justify-center font-sans text-gray-800">
        <div className="w-full max-w-md bg-white h-screen relative overflow-hidden flex flex-col shadow-2xl">
          <div className="flex-1 overflow-y-auto pb-16">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/callback" element={<CallbackHandler />} />
              <Route path="/" element={<Home />} />
              <Route
                path="/list-detail"
                element={
                  <PrivateRoute>
                    <ListDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="/spots/:id"
                element={
                  <PrivateRoute>
                    <ListDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="/alternatives"
                element={
                  <PrivateRoute>
                    <AlternativeSpots />
                  </PrivateRoute>
                }
              />
              <Route path="/alternatives" element={<AlternativeSpots />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
              <Route
                path="/mypage"
                element={
                  <PrivateRoute>
                    <MyPage />
                  </PrivateRoute>
                }
              />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
