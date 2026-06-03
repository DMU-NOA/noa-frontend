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
  }, []);

  return null;
}

// 로그인 안 된 상태면 /login으로 보내는 가드
function PrivateRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return children;
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
              <Route
                path="/"
                element={
                  //<PrivateRoute>
                    <Home />
                  //</PrivateRoute>
                }
              />
              <Route
                path="/list-detail"
                element={
                  //<PrivateRoute>
                    <ListDetail />
                  //</PrivateRoute>
                }
              />
              <Route
                path="/spots/:id"
                element={
                  //<PrivateRoute>
                    <ListDetail />
                  //</PrivateRoute>
                }
              />
              <Route
                path="/alternatives"
                element={
                  //<PrivateRoute>
                    <AlternativeSpots />
                  //</PrivateRoute>
                }
              />
              <Route path="/alternatives" element={<AlternativeSpots />} />
              <Route path="/map" element={<MapPage />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
