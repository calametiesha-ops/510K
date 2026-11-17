const RANKS = ['3','4','5','6','7','8','9','10','J','Q','K','A','2'];
const VALUE = new Map(RANKS.map((rank, index) => [rank, index]));

export function analyze(cards) {
  if (!Array.isArray(cards) || cards.length === 0) return null;
  const ranks = cards.map(card => card.rank);
  const same = ranks.every(rank => rank === ranks[0]);
  if (cards.length === 1) return { type: 'single', strength: VALUE.get(ranks[0]) };
  if (cards.length === 2 && same) return { type: 'pair', strength: VALUE.get(ranks[0]) };
  if (cards.length === 3 && same) return { type: 'triple', strength: VALUE.get(ranks[0]) };
  if (cards.length === 4 && same) return { type: 'four-bomb', strength: 30 + VALUE.get(ranks[0]) };
  const key = [...new Set(ranks)].sort((a, b) => VALUE.get(a) - VALUE.get(b)).join(',');
  if (cards.length === 3 && key === '5,10,K') {
    const flush = cards.every(card => card.suit === cards[0].suit);
    return { type: flush ? 'flush-510k' : '510k', strength: flush ? 20 : 10 };
  }
  return null;
}

export function canBeat(candidate, target) {
  if (!candidate) return false;
  if (!target) return true;
  const candidateBomb = candidate.type.includes('bomb') || candidate.type === '510k' || candidate.type === 'flush-510k';
  const targetBomb = target.type.includes('bomb') || target.type === '510k' || target.type === 'flush-510k';
  if (candidateBomb && !targetBomb) return true;
  if (!candidateBomb && targetBomb) return false;
  if (candidateBomb || targetBomb) return candidate.strength > target.strength;
  return candidate.type === target.type && candidate.strength > target.strength;
}

function combinations(cards, size) {
  const result = [];
  function walk(start, picked) {
    if (picked.length === size) { result.push(picked.slice()); return; }
    for (let i = start; i < cards.length; i += 1) walk(i + 1, picked.concat(cards[i]));
  }
  walk(0, []);
  return result;
}

export function legalPlays(hand, target = null) {
  const result = [];
  for (let size = 1; size <= 4; size += 1) {
    for (const cards of combinations(hand, size)) {
      const pattern = analyze(cards);
      if (pattern && canBeat(pattern, target)) result.push({ cards, pattern });
    }
  }
  return result;
}

export function chooseComputerPlay(hand, target = null, mustIncludeId = null) {
  const plays = legalPlays(hand, target).filter(play => !mustIncludeId || play.cards.some(card => card.id === mustIncludeId));
  if (!plays.length) return null;
  plays.sort((a, b) => a.pattern.strength - b.pattern.strength || a.cards.length - b.cards.length);
  return plays[0];
}

export function roundScore(finishRank, capturedPoints) {
  return [0, -25, -25, -50][finishRank - 1] + capturedPoints;
}

export { RANKS, VALUE };

