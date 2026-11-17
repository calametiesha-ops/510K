import { analyze, chooseComputerPlay, RANKS } from './game-engine.js';

const SUITS = ['♠', '♥', '♦', '♣'];
const POINTS = { '5': 5, '10': 10, K: 10 };

function deck() {
  return RANKS.flatMap(rank => SUITS.map(suit => ({ id: `${rank}-${suit}`, rank, suit })));
}

function shuffle(cards) {
  const result = cards.slice();
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

export class SoloGame {
  constructor() {
    this.totalScores = [0, 0, 0, 0];
    this.startRound();
  }

  startRound() {
    const cards = shuffle(deck());
    this.hands = [0, 1, 2, 3].map(seat => cards.slice(seat * 13, seat * 13 + 13));
    this.finished = [];
    this.captured = [0, 0, 0, 0];
    this.lastPlay = null;
    this.turn = this.hands.findIndex(hand => hand.some(card => card.id === '3-♠'));
    this.requiredLeadCard = '3-♠';
  }

  play(seat, cardIds) {
    if (seat !== this.turn) throw new Error('还没轮到该玩家');
    const hand = this.hands[seat];
    const cards = cardIds.map(id => hand.find(card => card.id === id)).filter(Boolean);
    const mustInclude = !this.lastPlay && this.requiredLeadCard;
    const play = chooseComputerPlay(hand, this.lastPlay?.pattern ?? null, mustInclude);
    if (seat !== 0 && play) return this.apply(seat, play.cards);
    const pattern = analyze(cards);
    if (!pattern) throw new Error('不合法的牌型');
    if (mustInclude && !cards.some(card => card.id === mustInclude)) throw new Error('首手必须带黑桃三');
    if (this.lastPlay && !chooseComputerPlay(cards, this.lastPlay.pattern)) throw new Error('无法接牌');
    return this.apply(seat, cards);
  }

  apply(seat, cards) {
    this.hands[seat] = this.hands[seat].filter(card => !cards.some(item => item.id === card.id));
    this.lastPlay = { seat, cards, pattern: analyze(cards) };
    this.turn = (seat + 1) % 4;
    if (this.hands[seat].length === 0 && !this.finished.includes(seat)) this.finished.push(seat);
    return this.snapshot();
  }

  stepComputer() {
    if (this.turn === 0) return this.snapshot();
    const play = chooseComputerPlay(this.hands[this.turn], this.lastPlay?.pattern ?? null, !this.lastPlay ? this.requiredLeadCard : null);
    if (play) return this.apply(this.turn, play.cards);
    this.turn = (this.turn + 1) % 4;
    return this.snapshot();
  }

  snapshot() {
    return { hands: this.hands, turn: this.turn, lastPlay: this.lastPlay, finished: this.finished, totalScores: this.totalScores };
  }
}

