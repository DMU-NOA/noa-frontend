// src/pages/ChatPage.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Loader2, MapPin } from "lucide-react";
import BottomNav from "../components/BottomNav";
import apiClient from "../api/client";
import { useLanguage } from "../contexts/LanguageContext";

const SUGGESTIONS = {
  ko: [
    "☔ 비 오는 날 실내 코스",
    "🧘 혼자 가기 좋은 조용한 곳",
    "💑 안 붐비는 데이트 장소",
    "🌿 주말 힐링 나들이",
  ],
  en: [
    "☔ Indoor spots for rainy days",
    "🧘 Quiet places to go alone",
    "💑 Uncrowded date spots",
    "🌿 Weekend healing trip",
  ],
};

export default function ChatPage() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const messagesEndRef = useRef(null);

  const initMsg = lang === 'en'
    ? "Hello! I'm NOA, your personal travel assistant ✨\nTell me what kind of place you're looking for or where you are, and I'll find the perfect uncrowded spot for you!"
    : "안녕하세요! 저는 NOA, 맞춤형 쾌적 여행 비서예요 ✨\n원하시는 여행지 스타일이나 현재 계신 곳을 말씀해 주시면, 안 붐비고 딱 맞는 곳을 찾아드릴게요!";

  const [messages, setMessages] = useState([
    { role: "ai", content: initMsg }
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;
    setStarted(true);
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setIsLoading(true);

    try {
      const res = await apiClient.post("/api/chat", { message: text, lang });
      const replyData = res.data;
      setMessages(prev => [...prev, {
        role: "ai",
        content: replyData.reply,
        spot: replyData.spot || null,
      }]);
    } catch (err) {
      console.error("챗봇 에러:", err);
      setMessages(prev => [...prev, {
        role: "ai",
        content: lang === 'en' ? "An error occurred. Please try again." : "오류가 발생했습니다. 다시 시도해 주세요.",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = (e) => { e.preventDefault(); sendMessage(input); };
  const handleSuggestion = (text) => sendMessage(text.replace(/^.\s/, ''));

  return (
    <div className="flex flex-col h-full bg-white">

      {/* 헤더 */}
      <header className="bg-white px-5 py-3 flex items-center gap-3 border-b border-gray-100 shrink-0">
        <div className="relative shrink-0">
          <img src="/bot.png" alt="NOA" className="w-9 h-9 rounded-xl object-cover" />
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
        </div>
        <div>
          <h1 className="text-[15px] font-bold text-gray-900 leading-tight">NOA Fit</h1>
          <p className="text-[11px] text-gray-400 leading-tight">AI 맞춤 쾌적 장소 큐레이터</p>
        </div>
      </header>

      {/* 채팅 영역 */}
      <main className="flex-1 overflow-y-auto px-4 py-5 pb-6 flex flex-col gap-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>

            {/* AI 아바타 */}
            {msg.role === "ai" && (
              <img src="/bot.png" alt="NOA" className="w-7 h-7 rounded-xl object-cover shrink-0 mt-0.5" />
            )}

            <div className={`flex flex-col gap-2 ${msg.role === "user" ? "items-end max-w-[78%]" : "items-start max-w-[85%]"}`}>
              {/* 말풍선 */}
              <div className={`px-4 py-3 text-[14px] leading-[1.65] ${
                msg.role === "user"
                  ? "bg-blue-500 text-white rounded-[20px] rounded-tr-[6px]"
                  : "bg-[#F2F3F5] text-gray-800 rounded-[20px] rounded-tl-[6px]"
              }`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>

              {/* 장소 카드 */}
              {msg.spot && (
                <div className="w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                  {/* 상단 이미지 + 지도 pill 오버레이 */}
                  <div className="relative h-36">
                    <img
                      onClick={() => navigate(`/spots/${msg.spot.area_cd}`)}
                      src={msg.spot.image_url || 'https://via.placeholder.com/300'}
                      alt={msg.spot.name}
                      className="w-full h-full object-cover cursor-pointer active:opacity-95"
                    />
                    <button
                      onClick={() => navigate(`/map`, { state: { selectedSpot: msg.spot.area_cd } })}
                      className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-white active:opacity-80"
                      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}
                    >
                      <MapPin className="w-3 h-3" />
                      {lang === 'en' ? 'Map' : '지도 보기'}
                    </button>
                  </div>

                  {/* 하단 정보 + 버튼 */}
                  <div className="px-4 pt-3.5 pb-4">
                    <p className="text-[11px] font-bold text-blue-400 tracking-widest uppercase mb-1">
                      {lang === 'en' ? 'NOA Pick' : 'NOA 픽'}
                    </p>
                    <p className="text-[16px] font-extrabold text-gray-900 truncate mb-3">{msg.spot.name}</p>
                    <button
                      onClick={() => navigate(`/spots/${msg.spot.area_cd}`)}
                      className="w-full bg-blue-600 text-white py-3 rounded-xl text-[14px] font-bold active:opacity-80"
                    >
                      {lang === 'en' ? 'View Details' : '상세 정보 보기'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 추천 질문 칩 */}
        {!started && !isLoading && (
          <div className="flex flex-col gap-2 mt-1">
            <p className="text-[11px] text-gray-400 font-medium px-1">
              {lang === 'en' ? 'Try asking...' : '이렇게 물어보세요'}
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS[lang === 'en' ? 'en' : 'ko'].map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  className="px-3.5 py-2 bg-[#F2F3F5] rounded-2xl text-[13px] text-gray-700 font-medium active:bg-gray-200 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 로딩 */}
        {isLoading && (
          <div className="flex gap-3">
            <img src="/bot.png" alt="NOA" className="w-7 h-7 rounded-xl object-cover shrink-0 mt-0.5" />
            <div className="bg-[#F2F3F5] px-4 py-3.5 rounded-[20px] rounded-tl-[6px] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* 입력창 */}
      <div className="shrink-0 px-4 py-3 pb-4 bg-white border-t border-gray-100">
        <form onSubmit={handleSend} className="flex items-center gap-2 bg-[#F2F3F5] rounded-2xl px-4 py-2.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={lang === 'en' ? "Ask anything..." : "어떤 곳을 찾으시나요?"}
            className="flex-1 bg-transparent text-[14px] outline-none text-gray-800 placeholder:text-gray-400"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center text-white disabled:bg-gray-300 transition-colors shrink-0"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}
