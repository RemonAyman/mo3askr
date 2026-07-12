// =============================================
// FIREBASE CONFIG & INIT
// =============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, addDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDEFMCQ5RGM9Dt_Gm-SH6aVrC9YaYwzMA0",
  authDomain: "mo3askr.firebaseapp.com",
  projectId: "mo3askr",
  storageBucket: "mo3askr.firebasestorage.app",
  messagingSenderId: "1076982109270",
  appId: "1:1076982109270:web:28c67a2ebd2ecee0bbd7f7",
  measurementId: "G-NL9JN1CF3R"
};

const fbApp = initializeApp(firebaseConfig);
const db    = getFirestore(fbApp);

// =============================================
// ROUTES DATA
// =============================================
const STATION_ICONS = {
  "كلمة": "📖",
  "لعبة": "🎯",
  "لعب (سمر)": "🔥",
  "لعب": "🎮",
  "تاسك صيحات": "📢",
  "تاسك ريادي": "⚽",
  "تاسك": "🏕️",
  "سمر (٣ ألعاب)": "🔥",
  "سمر": "🔥",
  "شفرات": "🔐",
  "شفرة": "🔐",
  "Spin": "🎰",
  "spin": "🎰",
  "بريك": "☕",
  "لعبة جماعية مشتركة": "👥",
  "لعبة جماعية": "👥",
  "جماعية": "👥"
};

function icon(name) {
  if (!name) return "⭐";
  for (const [k, v] of Object.entries(STATION_ICONS)) {
    if (name.includes(k)) return v;
  }
  return "⭐";
}

const ROUTES = {
  1: {
    name: "طليعة ١",
    password: "1",
    days: {
      1: ["Spin", "تاسك صيحات", "تاسك ريادي", "سمر", "لعبة جماعية"],
      2: ["كلمة", "لعب (سمر)", "لعب (سمر)", "شفرات", "كلمة", "سمر", "بريك", "تاسك", "Spin", "سمر", "كلمة"],
      3: ["سمر", "Spin", "كلمة", "لعب (سمر)", "بريك", "كلمة", "تاسك", "سمر", "كلمة", "Spin"]
    }
  },
  2: {
    name: "طليعة ٢",
    password: "2",
    days: {
      1: ["تاسك صيحات", "Spin", "تاسك ريادي", "سمر (٣ ألعاب)", "لعبة جماعية"],
      2: ["لعبة", "شفرة", "كلمة", "لعبة", "Spin", "كلمة", "لعبة", "بريك", "كلمة", "تاسك", "لعبة"],
      3: ["لعبة", "كلمة", "تاسك", "بريك", "Spin", "لعبة", "كلمة", "Spin", "لعبة", "كلمة"]
    }
  },
  3: {
    name: "طليعة ٣",
    password: "3",
    days: {
      1: ["Spin", "تاسك صيحات", "سمر", "تاسك ريادي", "لعبة جماعية مشتركة"],
      2: ["سمر", "سمر", "شفرات", "كلمة", "بريك", "سمر", "كلمة", "Spin", "تاسك", "كلمة", "سمر"],
      3: ["Spin", "سمر", "كلمة", "سمر", "تاسك", "سمر", "بريك", "كلمة", "Spin", "كلمة"]
    }
  },
  4: {
    name: "طليعة ٤",
    password: "4",
    days: {
      1: ["تاسك صيحات", "Spin", "سمر", "تاسك ريادي", "لعبة جماعية"],
      2: ["شفرة", "كلمة", "لعبة", "لعبة", "Spin", "كلمة", "لعبة", "كلمة", "بريك", "لعبة", "تاسك"],
      3: ["كلمة", "لعبة", "بريك", "Spin", "كلمة", "تاسك", "كلمة", "لعبة", "لعبة", "Spin"]
    }
  }
};

const DAY_NAMES = { 1: "اليوم الأول", 2: "اليوم الثاني", 3: "اليوم الثالث" };
const ArabicNums = ["", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩", "١٠", "١١", "١٢"];

// =============================================
// APP STATE
// =============================================
let currentTroupe = null;
let currentDay    = null;
let pendingGateIdx = null;      // station index waiting for 1234
let completedStations = {};     // { "1-1-0": true, ... }

// =============================================
// SCREEN ROUTER
// =============================================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + id);
  if (el) { el.classList.add('active'); el.scrollTop = 0; window.scrollTo(0,0); }
}
window.showTroupes = function() { showScreen('troupes'); };
window.showDays    = function() { showScreen('days'); };

// =============================================
// LANDING – TYPEWRITER VERSE
// =============================================
const VERSE = "في المستقبل يتأصل يعقوب";
let vIdx = 0;
function typeVerse() {
  const el = document.getElementById('verse-text');
  if (!el) return;
  if (vIdx <= VERSE.length) {
    el.textContent = VERSE.slice(0, vIdx);
    vIdx++;
    setTimeout(typeVerse, 70);
  }
}

// =============================================
// PARTICLES
// =============================================
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = canvas.width  = window.innerWidth;
  let H = canvas.height = window.innerHeight;
  window.addEventListener('resize', () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; });

  const stars = Array.from({ length: 90 }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    r: Math.random() * 1.6 + 0.3,
    a: Math.random(),
    speed: Math.random() * 0.004 + 0.001
  }));

  function draw() {
    ctx.clearRect(0, 0, W, H);
    stars.forEach(s => {
      s.a += s.speed;
      const alpha = (Math.sin(s.a) + 1) / 2 * 0.7 + 0.1;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212,168,67,${alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// =============================================
// TROUPE UNLOCK
// =============================================
window.tryUnlock = function(num) {
  const pw = document.getElementById('pw-' + num)?.value?.trim();
  const err = document.getElementById('err-' + num);
  if (pw === ROUTES[num].password) {
    err.textContent = '';
    document.getElementById('card-' + num)?.classList.add('unlocked');
    currentTroupe = num;
    document.getElementById('days-troupe-title').textContent = ROUTES[num].name;
    showScreen('days');
    // load progress from Firestore
    loadProgress(num);
  } else {
    err.textContent = 'باسورد غلط! حاول تاني 🔒';
    document.getElementById('pw-' + num).value = '';
  }
};

// Allow Enter key on password inputs
document.querySelectorAll('.troupe-pw-input').forEach(inp => {
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const num = parseInt(inp.id.replace('pw-', ''));
      window.tryUnlock(num);
    }
  });
});

// =============================================
// FIRESTORE – LOAD PROGRESS
// =============================================
async function loadProgress(troupeNum) {
  completedStations = {};
  try {
    for (const dayNum of [1, 2, 3]) {
      const ref = doc(db, 'troupes', `troupe_${troupeNum}`, 'progress', `day_${dayNum}`);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        Object.keys(data).forEach(k => {
          if (data[k] === true) completedStations[`${troupeNum}-${dayNum}-${k}`] = true;
        });
      }
    }
  } catch (e) { console.warn('Firestore load error', e); }
  updateDayCards();
}

function updateDayCards() {
  if (!currentTroupe) return;
  [1, 2, 3].forEach(dayNum => {
    const stations = ROUTES[currentTroupe].days[dayNum];
    const done = stations.filter((_, i) => completedStations[`${currentTroupe}-${dayNum}-${i}`]).length;
    const btn = document.getElementById('day-btn-' + dayNum);
    if (!btn) return;
    let prog = btn.querySelector('.day-progress');
    if (!prog) { prog = document.createElement('span'); prog.className = 'day-progress'; btn.appendChild(prog); }
    prog.textContent = `${done}/${stations.length} محطة`;
    if (done === stations.length) btn.classList.add('completed');
    else btn.classList.remove('completed');
  });
}

// =============================================
// FIRESTORE – MARK STATION DONE
// =============================================
async function markDone(troupeNum, dayNum, stationIdx) {
  const key = `${troupeNum}-${dayNum}-${stationIdx}`;
  completedStations[key] = true;
  const stationName = ROUTES[troupeNum].days[dayNum][stationIdx];
  try {
    const ref = doc(db, 'troupes', `troupe_${troupeNum}`, 'progress', `day_${dayNum}`);
    const snap = await getDoc(ref);
    const existing = snap.exists() ? snap.data() : {};
    existing[String(stationIdx)] = true;
    await setDoc(ref, existing);
    // Log event
    await addDoc(collection(db, 'logs'), {
      troupe: troupeNum,
      day: dayNum,
      station: stationIdx,
      stationName,
      action: 'completed',
      timestamp: serverTimestamp()
    });
  } catch (e) { console.warn('Firestore write error', e); }
}

// =============================================
// FIRESTORE – RESET TROUPE
// =============================================
async function resetTroupeData(troupeNum) {
  const keys = Object.keys(completedStations).filter(k => k.startsWith(`${troupeNum}-`));
  keys.forEach(k => delete completedStations[k]);
  try {
    for (const dayNum of [1, 2, 3]) {
      const ref = doc(db, 'troupes', `troupe_${troupeNum}`, 'progress', `day_${dayNum}`);
      await deleteDoc(ref);
    }
    await addDoc(collection(db, 'logs'), {
      troupe: troupeNum,
      action: 'reset',
      timestamp: serverTimestamp()
    });
  } catch (e) { console.warn('Firestore reset error', e); }
}

// =============================================
// DAY SELECTION
// =============================================
window.selectDay = function(dayNum) {
  currentDay = dayNum;
  const t = ROUTES[currentTroupe];
  document.getElementById('stations-title').textContent = `${t.name} — ${DAY_NAMES[dayNum]}`;
  renderStations(currentTroupe, dayNum);
  showScreen('stations');
};

// =============================================
// RENDER STATIONS TIMELINE
// =============================================
function renderStations(troupeNum, dayNum) {
  const wrap = document.getElementById('timeline-wrap');
  wrap.innerHTML = '';
  const stations = ROUTES[troupeNum].days[dayNum];

  stations.forEach((name, i) => {
    const isDone   = !!completedStations[`${troupeNum}-${dayNum}-${i}`];
    const prevDone = i === 0 || !!completedStations[`${troupeNum}-${dayNum}-${i - 1}`];
    const isActive = !isDone && prevDone;
    const isLocked = !isDone && !prevDone;

    const item = document.createElement('div');
    item.className = 'station-item' + (isDone ? ' done' : '') + (isActive ? ' active-station' : '') + (isLocked ? ' locked' : '');
    item.id = `station-item-${i}`;

    const statusBadge = isDone
      ? '<span class="station-status-badge badge-done">✓ تمت</span>'
      : isActive
        ? '<span class="station-status-badge badge-scratch">✏️ خربش</span>'
        : '<span class="station-status-badge badge-locked">🔒 مقفول</span>';

    item.innerHTML = `
      <div class="station-dot">
        ${icon(name)}
        <span class="station-dot-num">${ArabicNums[i + 1] || (i + 1)}</span>
      </div>
      <div class="station-card" id="sc-${i}">
        <div class="station-name-bar">
          <span class="station-name">${icon(name)} ${name}</span>
          ${statusBadge}
        </div>
        <div id="sc-body-${i}">
          ${isDone ? `<div class="station-done-content">✅ تمت المحطة بنجاح!</div>` : ''}
          ${isActive ? buildScratchArea(i, name) : ''}
        </div>
      </div>
    `;
    wrap.appendChild(item);

    if (isActive) {
      setTimeout(() => initScratch(i, name, troupeNum, dayNum), 100);
    }
  });
}

// =============================================
// BUILD SCRATCH AREA HTML
// =============================================
function buildScratchArea(idx, name) {
  return `
    <div class="scratch-area">
      <div class="scratch-reveal" id="sr-${idx}">
        <div class="scratch-content" id="sc-content-${idx}">
          <strong>${icon(name)} ${name}</strong><br/>
          <span style="font-size:0.85rem;opacity:0.7">هنا هتعرف اللي عليك تعمله</span>
        </div>
        <canvas class="scratch-canvas-layer" id="canvas-${idx}"></canvas>
      </div>
      <p class="scratch-hint">🖊️ خربش على الكارت عشان تشوف المحطة</p>
      <button class="btn-confirm-scratch" id="confirm-btn-${idx}" style="display:none" onclick="openGate(${idx})">
        ✓ تأكيد الخربشة — افتح التالية
      </button>
    </div>
  `;
}

// =============================================
// SCRATCH CANVAS LOGIC
// =============================================
function initScratch(idx, name, troupeNum, dayNum) {
  const canvas  = document.getElementById(`canvas-${idx}`);
  const revealEl = document.getElementById(`sr-${idx}`);
  if (!canvas || !revealEl) return;

  const W = revealEl.offsetWidth || 300;
  const H = revealEl.offsetHeight || 90;
  canvas.width  = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d');
  // Draw scratch overlay
  const grd = ctx.createLinearGradient(0, 0, W, H);
  grd.addColorStop(0, '#3D2007');
  grd.addColorStop(0.5, '#5C3D11');
  grd.addColorStop(1, '#2C1810');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  // Text on overlay
  ctx.fillStyle = 'rgba(212,168,67,0.9)';
  ctx.font = 'bold 28px Tajawal, Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✏️ خربش هنا!', W / 2, H / 2);

  ctx.globalCompositeOperation = 'destination-out';

  let painting = false;
  let totalPixels = W * H;
  let scratched = 0;

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return [touch.clientX - rect.left, touch.clientY - rect.top];
  }

  function scratch(e) {
    if (!painting) return;
    e.preventDefault();
    const [x, y] = getPos(e);
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fill();
    checkProgress();
  }

  function checkProgress() {
    const imageData = ctx.getImageData(0, 0, W, H);
    let cleared = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] < 128) cleared++;
    }
    const pct = cleared / (totalPixels);
    if (pct > 0.45) {
      canvas.style.display = 'none';
      const btn = document.getElementById(`confirm-btn-${idx}`);
      if (btn) btn.style.display = 'block';
    }
  }

  canvas.addEventListener('mousedown', e => { painting = true; scratch(e); });
  canvas.addEventListener('mousemove', scratch);
  canvas.addEventListener('mouseup',   () => { painting = false; });
  canvas.addEventListener('mouseleave',() => { painting = false; });
  canvas.addEventListener('touchstart', e => { painting = true; scratch(e); }, { passive: false });
  canvas.addEventListener('touchmove',  scratch, { passive: false });
  canvas.addEventListener('touchend',   () => { painting = false; });
}

// =============================================
// GATE (1234 PASSWORD)
// =============================================
window.openGate = function(idx) {
  pendingGateIdx = idx;
  document.getElementById('gate-input').value = '';
  document.getElementById('gate-error').textContent = '';
  document.getElementById('modal-gate').style.display = 'flex';
  setTimeout(() => document.getElementById('gate-input').focus(), 100);
};

window.checkGate = function() {
  const val = document.getElementById('gate-input').value.trim();
  if (val === '1234') {
    closeModal('modal-gate');
    completeStation(pendingGateIdx);
    pendingGateIdx = null;
  } else {
    document.getElementById('gate-error').textContent = 'باسورد غلط! الباسورد هو 1234 🔐';
    document.getElementById('gate-input').value = '';
  }
};

document.getElementById('gate-input')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') window.checkGate();
});

// =============================================
// COMPLETE A STATION
// =============================================
async function completeStation(idx) {
  // Mark done in memory + Firestore
  await markDone(currentTroupe, currentDay, idx);

  // Update this station UI → done
  const item = document.getElementById(`station-item-${idx}`);
  const body = document.getElementById(`sc-body-${idx}`);
  const nameBar = item?.querySelector('.station-status-badge');

  if (item)    { item.classList.remove('active-station'); item.classList.add('done'); }
  if (nameBar) nameBar.outerHTML = '<span class="station-status-badge badge-done">✓ تمت</span>';
  if (body)    body.innerHTML = '<div class="station-done-content">✅ تمت المحطة بنجاح!</div>';

  // Unlock next station
  const stations = ROUTES[currentTroupe].days[currentDay];
  const nextIdx = idx + 1;
  if (nextIdx < stations.length) {
    const nextItem = document.getElementById(`station-item-${nextIdx}`);
    const nextBody = document.getElementById(`sc-body-${nextIdx}`);
    const nextBadge = nextItem?.querySelector('.station-status-badge');
    if (nextItem)  { nextItem.classList.remove('locked'); nextItem.classList.add('active-station'); }
    if (nextBadge) nextBadge.outerHTML = '<span class="station-status-badge badge-scratch">✏️ خربش</span>';
    if (nextBody)  {
      nextBody.innerHTML = buildScratchArea(nextIdx, stations[nextIdx]);
      setTimeout(() => initScratch(nextIdx, stations[nextIdx], currentTroupe, currentDay), 100);
    }
    // Scroll to next
    setTimeout(() => nextItem?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400);
  } else {
    showToast('🎉 أنهيت اليوم كله! مبروك طليعة ' + ROUTES[currentTroupe].name.split(' ')[1]);
  }

  updateDayCards();
}

// =============================================
// RESET
// =============================================
window.promptReset = function() {
  document.getElementById('reset-input').value = '';
  document.getElementById('reset-error').textContent = '';
  document.getElementById('modal-reset').style.display = 'flex';
  setTimeout(() => document.getElementById('reset-input').focus(), 100);
};

window.checkReset = async function() {
  const val = document.getElementById('reset-input').value.trim();
  if (val === '1111') {
    closeModal('modal-reset');
    await resetTroupeData(currentTroupe);
    renderStations(currentTroupe, currentDay);
    updateDayCards();
    showToast('✅ تم إعادة التحميل بنجاح');
  } else {
    document.getElementById('reset-error').textContent = 'باسورد غلط! 🔒';
    document.getElementById('reset-input').value = '';
  }
};

document.getElementById('reset-input')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') window.checkReset();
});

// =============================================
// MODAL CLOSE
// =============================================
window.closeModal = function(id) {
  document.getElementById(id).style.display = 'none';
};
// Close on overlay click
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.style.display = 'none'; });
});

// =============================================
// TOAST
// =============================================
let toastTimer = null;
function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (isError ? ' error-toast' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = 'toast'; }, 3500);
}

// =============================================
// INIT
// =============================================
window.addEventListener('DOMContentLoaded', () => {
  initParticles();
  showScreen('landing');
  setTimeout(typeVerse, 800);
});
