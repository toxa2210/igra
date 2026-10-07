// Космический Кликер — игровая логика

const state = {
  stars: 0,
  totalEarned: 0,
  totalClicks: 0,
  clickPower: 1,
  upgrades: {}
};

const UPGRADES = [
  { id: 'cursor',   emoji: '👆', name: 'Сильный палец',   desc: '+1 к силе клика',        baseCost: 15,    costMult: 1.6, type: 'click', power: 1 },
  { id: 'glove',    emoji: '🧤', name: 'Космоперчатка',   desc: '+5 к силе клика',        baseCost: 150,   costMult: 1.7, type: 'click', power: 5 },
  { id: 'satellite',emoji: '🛰', name: 'Спутник',          desc: '+1 ⭐ / сек',            baseCost: 60,    costMult: 1.5, type: 'auto',  power: 1 },
  { id: 'rocket',   emoji: '🚀', name: 'Ракета-добытчик', desc: '+5 ⭐ / сек',            baseCost: 400,   costMult: 1.55,type: 'auto',  power: 5 },
  { id: 'station',  emoji: '🛸', name: 'Орбитальная станция', desc: '+25 ⭐ / сек',       baseCost: 2500,  costMult: 1.6, type: 'auto',  power: 25 },
  { id: 'miner',    emoji: '👽', name: 'Инопланетный шахтёр', desc: '+100 ⭐ / сек',      baseCost: 12000, costMult: 1.65,type: 'auto',  power: 100 },
  { id: 'dyson',    emoji: '☀️', name: 'Сфера Дайсона',   desc: '+1000 ⭐ / сек',         baseCost: 100000,costMult: 1.7, type: 'auto',  power: 1000 }
];

const ACHIEVEMENTS = [
  { id: 'click1',   emoji: '🌱', name: 'Первый клик',      check: s => s.totalClicks >= 1 },
  { id: 'click100', emoji: '💪', name: '100 кликов',       check: s => s.totalClicks >= 100 },
  { id: 'click1k',  emoji: '🔥', name: '1000 кликов',      check: s => s.totalClicks >= 1000 },
  { id: 'stars100', emoji: '⭐', name: '100 звёзд',        check: s => s.totalEarned >= 100 },
  { id: 'stars10k', emoji: '🌟', name: '10 000 звёзд',     check: s => s.totalEarned >= 10000 },
  { id: 'stars1m',  emoji: '💫', name: 'Миллион звёзд',    check: s => s.totalEarned >= 1000000 },
  { id: 'shop1',    emoji: '🛒', name: 'Первая покупка',   check: s => Object.values(s.upgrades).some(n => n > 0) },
  { id: 'tycoon',   emoji: '👑', name: 'Космический магнат', check: s => perSecond() >= 500 }
];

// ---------- helpers ----------
const $ = id => document.getElementById(id);

function fmt(n) {
  n = Math.floor(n);
  if (n >= 1e9) return (n / 1e9).toFixed(2) + ' млрд';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + ' млн';
  if (n >= 1e5) return (n / 1e3).toFixed(1) + ' тыс.';
  return n.toLocaleString('ru-RU');
}

function owned(id) { return state.upgrades[id] || 0; }
function cost(u) { return Math.floor(u.baseCost * Math.pow(u.costMult, owned(u.id))); }

function perSecond() {
  return UPGRADES.filter(u => u.type === 'auto')
    .reduce((sum, u) => sum + u.power * owned(u.id), 0);
}

function calcClickPower() {
  state.clickPower = 1 + UPGRADES.filter(u => u.type === 'click')
    .reduce((sum, u) => sum + u.power * owned(u.id), 0);
}

// ---------- UI ----------
function render() {
  $('score').textContent = fmt(state.stars);
  $('perSecond').textContent = fmt(perSecond());
  $('perClick').textContent = fmt(state.clickPower);
  $('totalClicks').textContent = fmt(state.totalClicks);
  $('totalEarned').textContent = fmt(state.totalEarned);

  UPGRADES.forEach(u => {
    const btn = document.querySelector(`.upgrade[data-id="${u.id}"]`);
    btn.disabled = state.stars < cost(u);
    btn.querySelector('.cost').textContent = fmt(cost(u)) + ' ⭐';
    btn.querySelector('.owned').textContent = 'x' + owned(u.id);
  });

  ACHIEVEMENTS.forEach(a => {
    const el = document.querySelector(`.achievement[data-id="${a.id}"]`);
    const unlocked = a.check(state);
    if (unlocked && el.classList.contains('locked')) {
      el.classList.replace('locked', 'unlocked');
      toast(`🏆 Достижение: ${a.name}`);
    }
    if (unlocked) el.classList.add('unlocked');
  });
}

function buildShop() {
  const wrap = $('upgrades');
  UPGRADES.forEach(u => {
    const btn = document.createElement('button');
    btn.className = 'upgrade';
    btn.dataset.id = u.id;
    btn.innerHTML = `
      <span class="emoji">${u.emoji}</span>
      <span class="info">
        <div class="name">${u.name}</div>
        <div class="desc">${u.desc}</div>
        <span class="owned">x0</span>
      </span>
      <span class="cost"></span>`;
    btn.addEventListener('click', () => buy(u));
    wrap.appendChild(btn);
  });

  const ach = $('achievements');
  ACHIEVEMENTS.forEach(a => {
    const el = document.createElement('div');
    el.className = 'achievement locked';
    el.dataset.id = a.id;
    el.innerHTML = `<span>${a.emoji}</span><span>${a.name}</span>`;
    ach.appendChild(el);
  });
}

function buy(u) {
  const c = cost(u);
  if (state.stars < c) return;
  state.stars -= c;
  state.upgrades[u.id] = owned(u.id) + 1;
  calcClickPower();
  render();
}

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2500);
}

// ---------- click ----------
$('planet').addEventListener('click', e => {
  state.stars += state.clickPower;
  state.totalEarned += state.clickPower;
  state.totalClicks++;

  const f = document.createElement('div');
  f.className = 'float-text';
  f.textContent = '+' + fmt(state.clickPower) + ' ⭐';
  const wrap = $('planet-wrap').getBoundingClientRect();
  f.style.left = (e.clientX - wrap.left - 10 + (Math.random() * 40 - 20)) + 'px';
  f.style.top = (e.clientY - wrap.top - 10) + 'px';
  $('floating-layer').appendChild(f);
  setTimeout(() => f.remove(), 1000);

  render();
});

// ---------- game loop ----------
setInterval(() => {
  const gain = perSecond() / 10;
  if (gain > 0) {
    state.stars += gain;
    state.totalEarned += gain;
    render();
  }
}, 100);

// ---------- save / load ----------
function save(silent) {
  localStorage.setItem('cosmo-clicker-save', JSON.stringify(state));
  if (!silent) toast('💾 Игра сохранена!');
}

function load() {
  try {
    const data = JSON.parse(localStorage.getItem('cosmo-clicker-save'));
    if (data) Object.assign(state, data);
  } catch (e) { /* corrupted save — start fresh */ }
}

$('saveBtn').addEventListener('click', () => save(false));
$('resetBtn').addEventListener('click', () => {
  if (confirm('Точно сбросить весь прогресс?')) {
    localStorage.removeItem('cosmo-clicker-save');
    location.reload();
  }
});

setInterval(() => save(true), 30000);

// ---------- init ----------
buildShop();
load();
calcClickPower();
render();
