const TOLERANCE = 0.09;

const timerEl = document.getElementById("timer");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resetBtn = document.getElementById("resetBtn");
const resultEl = document.getElementById("result");
const resultTimeEl = document.getElementById("resultTime");
const eventListEl = document.getElementById("eventList");
const hintEl = document.getElementById("hint");
const eventCountEl = document.getElementById("eventCount");

let startTime = 0;
let elapsed = 0;
let animationId = null;
let running = false;

const categories = [...new Set(EVENTS.map((e) => e.category))];
eventCountEl.textContent = `${EVENTS.length} 件のエピソード（${categories.length} カテゴリ）・誤差 ±${TOLERANCE} 秒`;

function formatTime(seconds) {
  if (seconds >= 3600) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${hrs}:${String(mins).padStart(2, "0")}:${secs.padStart(5, "0")}`;
  }
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${mins}:${secs.padStart(5, "0")}`;
  }
  return seconds.toFixed(2);
}

function updateDisplay() {
  const now = performance.now();
  const current = elapsed + (now - startTime) / 1000;
  timerEl.textContent = formatTime(current);
  animationId = requestAnimationFrame(updateDisplay);
}

function findMatch(seconds) {
  let best = null;
  let minDiff = Infinity;

  for (const event of EVENTS) {
    const diff = Math.abs(seconds - event.time);
    if (diff > TOLERANCE) continue;
    if (diff < minDiff - 0.0001) {
      minDiff = diff;
      best = { event, diff };
    }
  }

  return best;
}

function findNearest(seconds) {
  let nearest = EVENTS[0];
  let minDiff = Math.abs(seconds - nearest.time);

  for (const event of EVENTS) {
    const diff = Math.abs(seconds - event.time);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = event;
    }
  }

  return { event: nearest, diff: minDiff };
}

function renderEventCard({ event, diff }) {
  const card = document.createElement("article");
  card.className = "event-card event-card-primary";

  const category = document.createElement("span");
  category.className = "event-category";
  category.textContent = event.category;

  const title = document.createElement("h2");
  title.className = "event-title";
  title.textContent = event.title;

  const desc = document.createElement("p");
  desc.className = "event-description";
  desc.textContent = event.description;

  const diffEl = document.createElement("p");
  diffEl.className = "event-diff";
  if (diff < 0.005) {
    diffEl.textContent = `記録 ${formatTime(event.time)} 秒 — ぴったり一致！`;
  } else {
    diffEl.textContent = `記録 ${formatTime(event.time)} 秒 — 差 ${diff.toFixed(2)} 秒（許容 ±${TOLERANCE} 秒）`;
  }

  card.append(category, title, desc, diffEl);
  return card;
}

function renderNoMatch(seconds, nearest) {
  const card = document.createElement("article");
  card.className = "event-card event-card-miss";

  const title = document.createElement("h2");
  title.className = "event-title";
  title.textContent = "一致するエピソードなし";

  const desc = document.createElement("p");
  desc.className = "event-description";
  desc.textContent = `${formatTime(seconds)} 秒は、登録された ${EVENTS.length} 件のいずれとも ±${TOLERANCE} 秒以内に一致しませんでした。`;

  const diffEl = document.createElement("p");
  diffEl.className = "event-diff";
  diffEl.textContent = `最も近いのは ${formatTime(nearest.event.time)} 秒「${nearest.event.title}」（差 ${nearest.diff.toFixed(2)} 秒）`;

  card.append(title, desc, diffEl);
  return card;
}

function showResult(seconds) {
  const match = findMatch(seconds);
  const nearest = findNearest(seconds);

  resultTimeEl.textContent = `${formatTime(seconds)} 秒`;

  if (match) {
    eventListEl.replaceChildren(renderEventCard(match));
    if (match.diff < 0.005) {
      hintEl.textContent = "完璧！記録の秒数にぴったり一致。";
    } else if (match.diff <= 0.03) {
      hintEl.textContent = "驚異的！ほぼぴったり。";
    } else {
      hintEl.textContent = `±${TOLERANCE} 秒以内でヒット。もう一度狙ってみて。`;
    }
  } else {
    eventListEl.replaceChildren(renderNoMatch(seconds, nearest));
    hintEl.textContent = `±${TOLERANCE} 秒以内を狙おう。ヒント: ${formatTime(nearest.event.time)} 秒`;
  }

  resultEl.hidden = false;
}

function start() {
  if (running) return;
  running = true;
  startTime = performance.now();
  timerEl.classList.add("running");
  startBtn.disabled = true;
  stopBtn.disabled = false;
  resultEl.hidden = true;
  updateDisplay();
}

function stop() {
  if (!running) return;
  running = false;
  cancelAnimationFrame(animationId);
  const now = performance.now();
  elapsed += (now - startTime) / 1000;
  timerEl.textContent = formatTime(elapsed);
  timerEl.classList.remove("running");
  startBtn.disabled = false;
  stopBtn.disabled = true;
  showResult(elapsed);
}

function reset() {
  running = false;
  cancelAnimationFrame(animationId);
  elapsed = 0;
  timerEl.textContent = "00.00";
  timerEl.classList.remove("running");
  startBtn.disabled = false;
  stopBtn.disabled = true;
  resultEl.hidden = true;
}

startBtn.addEventListener("click", start);
stopBtn.addEventListener("click", stop);
resetBtn.addEventListener("click", reset);

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    if (running) stop();
    else start();
  }
  if (e.code === "KeyR") reset();
});
