// Exact labels preserve the four source classes; partial matches merge them.
export function congestionStage(value) {
  const label = String(value ?? '').trim().toLowerCase();
  const groups = [
    ['여유', 'quiet', 'relax', 'relaxed'],
    ['보통', 'normal', 'moderate'],
    ['약간 붐빔', '약간 혼잡', 'slightly crowded'],
    ['붐빔', '혼잡', 'crowded', 'crowd'],
  ];
  return groups.findIndex(values => values.includes(label));
}

export function currentCongestionLevel(spot, now = Date.now()) {
  const stamp = Date.parse(spot.updated_at);
  const age = now - stamp;
  if (!Number.isFinite(stamp) || age < 0 || age > 45 * 60 * 1000) return null;
  return spot.congestion_level;
}
