// src/pages/ChatPage.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Bot, User, Sparkles, Loader2 } from "lucide-react";
import BottomNav from "../components/BottomNav";
import apiClient from "../api/client";

export default function ChatPage() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // 초기 인사말 세팅
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content: "안녕하세요! NOA 맞춤형 쾌적 여행 비서입니다 ✨\n원하시는 여행지 스타일이나 현재 계신 곳을 말씀해 주시면, 안 붐비고 딱 맞는 곳을 찾아드릴게요!\n(예: 비 오는 날 갈만한 조용한 실내 데이트 코스 알려줘)"
    }
  ]);

  // 메시지가 추가될 때마다 맨 아래로 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    // 1. 사용자 메시지를 화면에 즉시 추가
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await apiClient.post("/api/chat/", { message: userMessage });
      
      // 💡 응답받은 AI 메시지에 spot 데이터(카드 UI용)도 함께 저장
      setMessages(prev => [...prev, { 
        role: "ai", 
        content: response.data.reply,
        spot: response.data.spot // 👈 AI가 골라준 장소 데이터
      }]);
    } catch (error) {
      console.error("챗봇 API 통신 에러:", error);
      setMessages(prev => [...prev, { 
        role: "ai", 
        content: "앗, 서버와 연결이 불안정해요 😭 잠시 후 다시 시도해 주세요." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 상단 헤더 */}
      <header className="bg-white px-5 py-4 flex items-center justify-between shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-purple-100 p-2 rounded-xl">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-gray-900 leading-tight">NOA Fit</h1>
            <p className="text-[11px] text-gray-500">AI 맞춤 쾌적 장소 큐레이터</p>
          </div>
        </div>
      </header>

      {/* 채팅 목록 영역 */}
      <main className="flex-1 overflow-y-auto p-5 pb-20 flex flex-col gap-5">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            
            {/* 프로필 아이콘 */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-blue-600" : "bg-purple-600"}`}>
              {msg.role === "user" ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
            </div>

            {/* 말풍선 + 💡 추천 장소 카드 UI 추가 영역 */}
            <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-sm
              ${msg.role === "user" ? "bg-blue-600 text-white rounded-tr-sm" : "bg-white text-gray-800 border border-gray-100 rounded-tl-sm"}
            `}>
              {/* 기본 텍스트 */}
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {/* 💡 AI가 장소 데이터(spot)를 줬다면 예쁜 카드 버튼을 렌더링합니다! */}
              {msg.spot && (
                <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                  <img 
                    src={msg.spot.image_url || 'https://via.placeholder.com/300'} 
                    alt={msg.spot.name} 
                    className="w-full h-28 object-cover bg-gray-100" 
                  />
                  <div className="p-3">
                    <h4 className="font-bold text-gray-900 text-[15px] mb-3 truncate">
                      {msg.spot.name}
                    </h4>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => navigate(`/spots/${msg.spot.area_cd}`)} 
                        className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-[13px] font-semibold active:scale-95 transition-transform"
                      >
                        상세 정보
                      </button>
                      <button 
                        onClick={() => navigate(`/map`, { state: { selectedSpot: msg.spot.area_cd }})} 
                        className="flex-1 bg-purple-50 text-purple-700 py-2 rounded-lg text-[13px] font-semibold active:scale-95 transition-transform"
                      >
                        지도 보기
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* 로딩 표시 (AI가 생각 중일 때) */}
        {isLoading && (
          <div className="flex gap-3 flex-row">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white px-4 py-4 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* 하단 입력창 */}
      <div className="absolute bottom-15 left-0 w-full bg-white border-t border-gray-100 p-3 pb-4 shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
        <form onSubmit={handleSend} className="flex items-center gap-2 bg-gray-100 rounded-full p-1.5 pl-4 pr-1.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="어떤 곳을 찾으시나요?"
            className="flex-1 bg-transparent text-[14px] outline-none text-gray-800 placeholder:text-gray-400"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-purple-600 p-2.5 rounded-full text-white disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 pl-0.5" />}
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}