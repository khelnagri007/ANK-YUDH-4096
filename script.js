let bestTime = Number(localStorage.getItem("ank-yudh-best-time")) || null;
// ===== Setup / State =====
const N = 4;
let b = [];
let score = 0;
let best = Number(localStorage.getItem("4096-best")) || 0;
let playing = true;
let won = false;
let isPaused = false;

const board = document.getElementById("board");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const overlay = document.getElementById("overlay");
const title = document.getElementById("title");
const text = document.getElementById("text");
const again = document.getElementById("again");
const newBtn = document.getElementById("new");
const pauseBtn = document.getElementById("pauseBtn");
const timerEl = document.getElementById("timer");
const startScreen = document.getElementById("startScreen");
const startGameBtn = document.getElementById("startGame");

let selectedTime = 600; // default 10 minutes
let timeLeft = 600;
let timerInterval = null;

// ===== Time selection on start screen =====
document.querySelectorAll(".time-btn").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".time-btn").forEach(btn => btn.classList.remove("selected"));
    button.classList.add("selected");
    selectedTime = Number(button.dataset.time);
    timeLeft = selectedTime;
    updateTimer();
  });
});

// ===== Start game =====
startGameBtn.addEventListener("click", () => {
  startScreen.style.display = "none";
  start();
  beginTimer();
});

newBtn.addEventListener("click", () => {
  startScreen.style.display = "flex";
  clearInterval(timerInterval);
  hide();
});

// ===== Pause / Play =====
pauseBtn.addEventListener("click", togglePause);

function togglePause() {
  if (!b.length || !playing) return; // nothing to pause before start or after game ends

  isPaused = !isPaused;

  if (isPaused) {
    pauseBtn.textContent = "▶ Play";
    title.textContent = "Game Paused";
    text.textContent = "Press Resume to continue.";
    overlay.classList.remove("hidden");
    again.textContent = "Resume";
    again.onclick = togglePause;
  } else {
    pauseBtn.textContent = "⏸ Pause";
    hide();
  }
}

function beginTimer() {
  timeLeft = selectedTime;
  updateTimer();
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (isPaused || !playing) return;
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      playing = false;
      timeUp();
    }
  }, 1000);
}

function updateTimer() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timerEl.textContent =
    String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
}

function timeUp() {
  show("Time Up! ⏰", "Your time is over. Try again!");
}

// ===== Core game logic =====
function start() {
  isPaused = false;
  pauseBtn.textContent = "⏸ Pause";

  b = Array.from({ length: N }, () => Array(N).fill(0));
  score = 0;
  won = false;
  playing = true;
  add();
  add();
  render();
  hide();
}

function add() {
  let e = [];
  b.forEach((r, i) => r.forEach((v, j) => { if (!v) e.push([i, j]); }));
  if (e.length) {
    let [r, c] = e[Math.floor(Math.random() * e.length)];
    b[r][c] = Math.random() < 0.9 ? 2 : 4;
  }
}

function line(a) {
  let x = a.filter(Boolean), out = [], gain = 0;
  for (let i = 0; i < x.length; i++) {
    if (x[i] === x[i + 1]) {
      out.push(x[i] * 2);
      gain += x[i] * 2;
      i++;
    } else out.push(x[i]);
  }
  while (out.length < N) out.push(0);
  return [out, gain];
}

function eq(a, c) {
  return a.every((v, i) => v === c[i]);
}

function move(d) {
  if (isPaused) return;
  if (!b.length || !playing || !overlay.classList.contains("hidden")) return;
  let changed = false, gain = 0;

  if (d === "left") {
    for (let r = 0; r < N; r++) {
      let [x, g] = line(b[r]);
      changed |= !eq(b[r], x);
      b[r] = x;
      gain += g;
    }
  }
  if (d === "right") {
    for (let r = 0; r < N; r++) {
      let a = [...b[r]].reverse(), z = line(a), x = z[0].reverse();
      changed |= !eq(b[r], x);
      b[r] = x;
      gain += z[1];
    }
  }
  if (d === "up" || d === "down") {
    for (let c = 0; c < N; c++) {
      let a = b.map(r => r[c]);
      if (d === "down") a.reverse();
      let z = line(a), x = z[0];
      if (d === "down") x.reverse();
      let old = b.map(r => r[c]);
      changed |= !eq(old, x);
      for (let r = 0; r < N; r++) b[r][c] = x[r];
      gain += z[1];
    }
  }

  if (!changed) {
    if (!can()) gameover();
    return;
  }

  score += gain;
  add();
  if (score > best) {
    best = score;
    localStorage.setItem("4096-best", best);
  }
  render();

  if (!won && b.flat().includes(4096)) win();
  else if (!can()) gameover();
}

function can() {
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (!b[r][c]) return true;
      if (c < N - 1 && b[r][c] === b[r][c + 1]) return true;
      if (r < N - 1 && b[r][c] === b[r + 1][c]) return true;
    }
  }
  return false;
}

function render() {
  board.innerHTML = "";
  b.flat().forEach(v => {
    let el = document.createElement("div");
    el.className = "cell";
    if (v) {
      el.classList.add("tile", "pop");
      el.dataset.value = v;
      el.textContent = v;
    }
    board.appendChild(el);
  });
  scoreEl.textContent = score;
  bestEl.textContent = best;
}

function show(t, msg, win = false) {
  title.textContent = t;
  text.textContent = msg;
  overlay.classList.remove("hidden");
  again.textContent = win ? "Keep Playing" : "Try Again";
  again.onclick = win
    ? () => { playing = true; hide(); }
    : () => { start(); beginTimer(); };
}

function win() {
  clearInterval(timerInterval);
  
  const completionTime = selectedTime - timeLeft;

  if (bestTime === null || completionTime < bestTime) {
    bestTime = completionTime;
    localStorage.setItem("ank-yudh-best-time", bestTime);
  }

  won = true;
  playing = false;

  const bestText = formatTime(bestTime);

  show(
    "You Win! 🎉",
    `4096 completed in ${formatTime(completionTime)}!<br>
     🏆 Best Time: ${bestText}`,
    true
  );

  updateBestTime();
}
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return String(minutes).padStart(2, "0") + ":" +
         String(secs).padStart(2, "0");
}

function updateBestTime() {
  const bestTimeEl = document.getElementById("bestTime");

  if (bestTimeEl) {
    bestTimeEl.textContent =
      bestTime === null ? "--:--" : formatTime(bestTime);
  }
}

function gameover() {
  clearInterval(timerInterval);
  playing = false;
  show("Game Over!", "Better luck next time! Try again.");
}

function hide() {
  overlay.classList.add("hidden");
}

// ===== Input: keyboard =====
document.addEventListener("keydown", e => {
  const map = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" };
  if (map[e.key]) {
    e.preventDefault();
    move(map[e.key]);
  }
});

// ===== Input: swipe (mobile) =====
let sx = 0, sy = 0;
board.addEventListener("touchstart", e => {
  sx = e.touches[0].clientX;
  sy = e.touches[0].clientY;
}, { passive: true });

board.addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - sx;
  const dy = e.changedTouches[0].clientY - sy;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
  if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? "right" : "left");
  else move(dy > 0 ? "down" : "up");
}, { passive: true });

// ===== Init =====
bestEl.textContent = best;
document.getElementById("year").textContent = new Date().getFullYear();
updateBestTime();