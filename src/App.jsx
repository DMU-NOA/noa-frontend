import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';

function App() {
  return (
    <BrowserRouter>
      {/* 바탕은 회색(bg-gray-100), 중앙에 모바일 사이즈(max-w-md)의 하얀색(bg-white) 앱 화면 띄우기 */}
      <div className="min-h-screen bg-gray-100 flex justify-center font-sans text-gray-800">
        <div className="w-full max-w-md bg-white h-screen relative overflow-hidden flex flex-col shadow-2xl">
          
          <div className="flex-1 overflow-y-auto pb-16">
            <Routes>
              <Route path="/" element={<Home />} />
            </Routes>
          </div>

        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;