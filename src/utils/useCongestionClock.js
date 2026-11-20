import { useEffect, useState } from 'react';

// Expire evidence even if the user leaves the same screen open.
export default function useCongestionClock() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}
