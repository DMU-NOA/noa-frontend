import { useEffect, useState } from 'react';

/** 기존 React 화면에서 <TravelBalanceGameModal /> 을 배치하면 버튼이 나타납니다. */
export default function TravelBalanceGameModal({ gameUrl = 'http://127.0.0.1:8001/' }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return undefined;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = oldOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={triggerStyle}>
        내 여행 취향 찾기
      </button>
      {open && (
        <div role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }} style={backdropStyle}>
          <section role="dialog" aria-modal="true" aria-label="서울 여행 취향 밸런스 게임" style={dialogStyle}>
            <button type="button" aria-label="게임 닫기" onClick={() => setOpen(false)} style={closeStyle}>✕</button>
            <iframe title="서울 여행 취향 밸런스 게임" src={gameUrl} style={frameStyle} />
          </section>
        </div>
      )}
    </>
  );
}

const triggerStyle = { background: '#159a83', color: '#fff', border: 0, borderRadius: 12, padding: '12px 20px', fontSize: 16, fontWeight: 700, cursor: 'pointer' };
const backdropStyle = { position: 'fixed', inset: 0, background: 'rgba(8, 32, 29, .65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 };
const dialogStyle = { width: 'min(820px, 100%)', height: 'min(850px, 92dvh)', position: 'relative', borderRadius: 20, background: '#f3f7f5', overflow: 'hidden', boxShadow: '0 24px 70px rgba(0,0,0,.3)' };
const closeStyle = { position: 'absolute', top: 12, right: 18, zIndex: 1, width: 40, height: 40, border: 0, borderRadius: '50%', background: '#193b37', color: '#fff', fontSize: 20, cursor: 'pointer' };
const frameStyle = { width: '100%', height: '100%', border: 0 };
