import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import LoginRequired from "./components/LoginRequired";
import Home from "./pages/Home";
import ListDetail from "./pages/ListDetail";
import AlternativeSpots from "./pages/AlterPage";
import { saveToken, isLoggedIn } from "./api/auth";
import MapPage from "./pages/MapPage";
import ChatPage from "./pages/ChatPage";
import MyPage from "./pages/MyPage";
import LikesPage from "./pages/LikesPage";
import ProfilePage from "./pages/ProfilePage";
import { LanguageProvider } from "./contexts/LanguageContext";

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
      navigate("/", { replace: true });
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

function App() {
  return (
    <BrowserRouter>
    <LanguageProvider>
      {/* 바탕은 회색(bg-gray-100), 중앙에 모바일 사이즈(max-w-md)의 하얀색(bg-white) 앱 화면 띄우기 */}
      <div className="min-h-screen bg-gray-100 flex justify-center font-sans text-gray-800">
        <div className="w-full max-w-md bg-white h-screen relative overflow-hidden flex flex-col shadow-2xl">
          <div className="flex-1 overflow-y-auto pb-16">
            <Routes>
              <Route path="/callback" element={<CallbackHandler />} />
              <Route path="/" element={<Home />} />
              <Route path="/list-detail" element={<ListDetail />} />
              <Route path="/spots/:id" element={<ListDetail />} />
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
              <Route
                path="/mypage/profile"
                element={
                  <PrivateRoute>
                    <ProfilePage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/mypage/likes"
                element={
                  <PrivateRoute>
                    <LikesPage />
                  </PrivateRoute>
                }
              />
            </Routes>
          </div>
        </div>
      </div>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
