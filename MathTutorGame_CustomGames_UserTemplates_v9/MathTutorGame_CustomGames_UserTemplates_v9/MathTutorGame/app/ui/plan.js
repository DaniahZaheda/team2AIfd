const API = ""; // same origin

const LOADING_MUSIC_VIDEO_ID = "n_dXZowcczA"; // YouTube audio during plan generation
// store the generated plan locally so the child can come back and continue
const PLAN_KEY = "mt_plan_v1";

// ---------------------------
// Rewards + fun helpers
// ---------------------------
const REWARD_KEY = "mt_rewards_v1";

function loadRewards() {
  try {
    const r = JSON.parse(localStorage.getItem(REWARD_KEY) || "{}") || {};
    return {
      stars: Number(r.stars || 0),
      coins: Number(r.coins || 0),
      badges: Array.isArray(r.badges) ? r.badges : [],
    };
  } catch {
    return { stars: 0, coins: 0, badges: [] };
  }
}

function saveRewards(r) {
  localStorage.setItem(REWARD_KEY, JSON.stringify(r));
  updateHud();
}

function updateHud() {
  const r = loadRewards();
  const s = document.getElementById("hudStars");
  const c = document.getElementById("hudCoins");
  const b = document.getElementById("hudBadges");
  if (s) s.textContent = `⭐ ${r.stars}`;
  if (c) c.textContent = `🪙 ${r.coins}`;
  if (b) b.textContent = `🏅 ${r.badges.length}`;
}

function toast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.style.display = "block";
  clearTimeout(toast.__t);
  toast.__t = setTimeout(() => (t.style.display = "none"), 2200);
}


function playSfx(name = "success") {
  const map = {
    success: "sfxSuccess",
    error: "sfxError",
    pop: "sfxPop",
    rocket: "sfxRocket",
    train: "sfxTrain",
  };
  const id = map[name] || map.success;
  const a = document.getElementById(id);
  if (!a) return;
  try {
    a.pause();
    a.currentTime = 0;
    a.play();
  } catch {}
}

// Arabic voice using Web Speech API (no extra libs)
// IMPORTANT: If the browser doesn't have an Arabic voice, we DO NOT speak (avoid English).
let __voicesCached = null;
function _loadVoicesOnce() {
  try {
    if (!("speechSynthesis" in window)) return;
    const v = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
    if (v && v.length) __voicesCached = v;
    if (window.speechSynthesis && typeof window.speechSynthesis.onvoiceschanged !== "undefined") {
      window.speechSynthesis.onvoiceschanged = () => {
        try {
          const vv = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
          if (vv && vv.length) __voicesCached = vv;
        } catch {}
      };
    }
  } catch {}
}

function speakText(text) {
  try {
    if (!("speechSynthesis" in window)) return;
    _loadVoicesOnce();
    const voices = (__voicesCached || (window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : []) || []);
    const arVoice = (voices || []).find(v => String(v.lang || "").toLowerCase().startsWith("ar"))
      || (voices || []).find(v => String(v.name || "").toLowerCase().includes("arab"));
    if (!arVoice) return; // لا نريد صوت إنجليزي
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text));
    u.voice = arVoice;
    u.lang = arVoice.lang || "ar-SA";
    u.rate = 1.02;
    u.pitch = 1.05;
    u.volume = 1.0;
    window.speechSynthesis.speak(u);
  } catch {}
}


function boomVideo() {
  // Big celebration for finishing a video (more confetti + stars)
  if (window.GameAnimations && typeof window.GameAnimations.createConfetti === "function") {
    window.GameAnimations.createConfetti(260);
  }
  if (window.GameAnimations && typeof window.GameAnimations.createStarConfetti === "function") {
    window.GameAnimations.createStarConfetti(140);
  }
}

function boomCelebrate() {
  // Lighter celebration for finishing a game/skill
  if (window.GameAnimations && typeof window.GameAnimations.createConfetti === "function") {
    window.GameAnimations.createConfetti(90);
  }
  if (window.GameAnimations && typeof window.GameAnimations.createStarConfetti === "function") {
    window.GameAnimations.createStarConfetti(40);
  }
}

function boomTiny() {
  // Tiny burst for each correct answer
  if (window.GameAnimations && typeof window.GameAnimations.createConfetti === "function") {
    window.GameAnimations.createConfetti(40);
  }
}


function ytToEmbed(url) {
  if (!url) return null;
  try {
    // support youtu.be/<id> or youtube.com/watch?v=<id>
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${u.pathname.replace("/", "")}`;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      // already embed?
      if (u.pathname.startsWith("/embed/")) return url;
    }
    return url;
  } catch {
    return url;
  }
}

// --- YouTube Iframe API (to detect video end and celebrate) ---
let __ytApiLoading = false;
let __ytReady = false;
const __ytQueue = [];

function _getYouTubeId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.replace("/", "");
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/watch")) return u.searchParams.get("v");
      if (u.pathname.startsWith("/embed/")) return u.pathname.split("/embed/")[1].split("?")[0];
    }
  } catch {}
  return null;
}

function ensureYouTubeApi() {
  if (__ytReady || __ytApiLoading) return;
  __ytApiLoading = true;
  const s = document.createElement("script");
  s.src = "https://www.youtube.com/iframe_api";
  s.async = true;
  s.onload = () => {};
  document.head.appendChild(s);
  window.onYouTubeIframeAPIReady = () => {
    __ytReady = true;
    __ytApiLoading = false;
    while (__ytQueue.length) {
      try { (__ytQueue.shift())(); } catch {}
    }
  };
}

function mountYouTubePlayer(mountId, videoId, onEnded) {
  if (!videoId) return;
  const run = () => {
    try {
      if (!window.YT || !window.YT.Player) return;
      new window.YT.Player(mountId, {
        height: "320",
        width: "100%",
        videoId,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onStateChange: (e) => {
            // 0 = ended
            if (e && e.data === 0 && typeof onEnded === "function") onEnded();
          }
        }
      });
    } catch {}
  };
  if (__ytReady) return run();
  ensureYouTubeApi();
  __ytQueue.push(run);
}

function el(tag, attrs={}, children=[]) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v]) => {
    if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (c == null) return;
    if (typeof c === "string") e.appendChild(document.createTextNode(c));
    else e.appendChild(c);
  });
  return e;
}

function getMissingFromStorage() {
  try {
    const ms = JSON.parse(localStorage.getItem("missing_skills") || "[]");
    return Array.isArray(ms) ? ms : [];
  } catch { return []; }
}

function setPills(list) {
  const box = document.getElementById("skillsPills");
  box.innerHTML = "";
  list.forEach(s => box.appendChild(el("span", {class:"pill"}, s)));
}

function parseInputSkills() {
  const raw = document.getElementById("skillsInput").value.trim();
  if (!raw) return [];
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

async function postJSON(url, body) {
  const res = await fetch(url, {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body)});
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

async function getGamePack(skill_id, n=5, mode="auto") {
  const res = await fetch(`${API}/game_pack?skill_id=${encodeURIComponent(skill_id)}&n=${n}&mode=${encodeURIComponent(mode)}`, {method:"POST"});
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

async function checkAnswer(question, student_answer) {
  const res = await fetch(`${API}/api/check_answer`, {method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({question_id: question.id, question, student_answer})
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

function renderQuestion(q, skill_id, onSolved) {
  // Question shell (more game-like)
  const wrap = el("div", {class:"q"});
  wrap.appendChild(el("div", {class:"muted"}, q.prompt || q.question || "سؤال"));
  const status = el("div", {class:"muted", style:"margin-top:8px"});
  wrap.appendChild(status);

  const shell = el("div", {class:"gameShell"});
  wrap.appendChild(shell);

  let attempts = 0;
  async function setStatus(ok, msgExtra = "") {
    status.textContent = ok ? `✅ ممتاز! ${msgExtra}` : `❌ جربي مرة ثانية! ${msgExtra}`;
  }

  function rewardCorrect() {
    const r = loadRewards();
    r.stars += 1;
    r.coins += 5;
    saveRewards(r);
    playSfx("success");
  }

  // big celebration is handled after finishing the whole game pack

  async function handleCheck(student_answer) {
    const resp = await checkAnswer(q, student_answer);
    attempts += 1;

    // Visual feedback container
    wrap.classList.remove("shake");
    wrap.classList.remove("correctFlash");

    if (resp.correct) {
      rewardCorrect();
      setStatus(true, "🎉 صح!");
      boomTiny(); // small confetti for every correct answer
      playSfx("success");
      wrap.classList.add("correctFlash");
      setTimeout(()=>wrap.classList.remove("correctFlash"), 400);
      if (typeof onSolved === "function") onSolved();
      return { correct: true };
    }

    // Wrong answer feedback (show reason + correct answer after 2 tries)
    playSfx("error");
    wrap.classList.add("shake");
    setTimeout(()=>wrap.classList.remove("shake"), 320);

    const ex = (resp.explanation || q.explanation) ? `💡 ${resp.explanation || q.explanation}` : "";
    const corr = resp.correct_answer != null ? `✅ الصحيح: ${Array.isArray(resp.correct_answer) ? resp.correct_answer.join("، ") : (typeof resp.correct_answer === "object" ? JSON.stringify(resp.correct_answer) : resp.correct_answer)}` : "";

    if (attempts < 2) {
      setStatus(false, ex || "حاولي مرة ثانية…");
    } else {
      setStatus(false, [ex, corr].filter(Boolean).join(" — ") || "🔁 راجعي الفيديو وحاولي مرة أخرى لاحقًا");
    }
    return { correct: false };
  }

  // --- GAME #1: MCQ (two fun variants: Train Cargo OR Balloon Target) ---
  if (q.type === "mcq_number" || q.type === "multiple_choice") {
    const choicesArr = (q.choices || q.options || []).map(String);

    const mode = (CURRENT_DAY_MODE || "balloons");
    const useBalloons = (mode === "balloons");
    if (useBalloons) {
      const header = el("div", {class:"gameTitle"}, [
        el("div", {}, "🎈 لعبة بالونات الطيران: اضغطي على البالون الصحيح"),
        el("div", {class:"badgeMini"}, "Tap")
      ]);

      const field = el("div", {class:"balloonField"});
      const hint = el("div", {class:"muted mini", style:"margin-top:8px"}, "اختاري البالون الذي يحمل الإجابة الصحيحة قبل ما يطير!");

      // Place balloons with different x positions + delays
      const xs = [12, 30, 52, 74];
      const shuffledChoices = choicesArr.slice().sort(() => Math.random() - 0.5);
      shuffledChoices.forEach((ch, idx) => {
        const b = el("div", {class:"balloon"}, ch);
        b.style.left = xs[idx % xs.length] + "%";
        b.style.animationDuration = (6.0 + Math.random() * 2.2).toFixed(2) + "s";
        b.style.animationDelay = (Math.random() * 0.6).toFixed(2) + "s";
        b.onclick = async () => {
          // prevent multiple taps on same balloon
          if (b.dataset.locked === "1") return;
          b.dataset.locked = "1";
          const r = await handleCheck(String(ch));
          if (r.correct) {
            playSfx("pop");
            boomCelebrate();
            b.classList.add("popOut");
            // lock all balloons
            Array.from(field.querySelectorAll('.balloon')).forEach(x => (x.style.pointerEvents = "none"));
          } else {
            playSfx("error");
            b.classList.add("shake");
            setTimeout(() => b.classList.remove("shake"), 260);
            b.dataset.locked = "0";
          }
        };
        field.appendChild(b);
      });

      shell.appendChild(header);
      shell.appendChild(field);
      shell.appendChild(hint);
      return wrap;
    }

    const header = el("div", {class:"gameTitle"}, [
      el("div", {}, "🚂 لعبة القطار: اسحبي الصندوق الصحيح إلى العربة"),
      el("div", {class:"badgeMini"}, "Drag & Drop")
    ]);

    const track = el("div", {class:"trainTrack"});
    const drop = el("div", {class:"wagon", html:"ضعِ الإجابة هنا"});
    const train = el("div", {class:"train"}, [
      el("div", {class:"engine"}, [el("div", {class:"smoke"})]),
      drop,
    ]);
    track.appendChild(train);

    const drags = el("div", {class:"draggables"});

    function setDropText(txt) {
      drop.innerHTML = `<span class='mini'>${txt}</span>`;
      drop.classList.add("pop");
      setTimeout(() => drop.classList.remove("pop"), 220);
    }

    drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("over"); });
    drop.addEventListener("dragleave", () => drop.classList.remove("over"));
    drop.addEventListener("drop", async (e) => {
      e.preventDefault();
      drop.classList.remove("over");
      const val = e.dataTransfer.getData("text/plain");
      setDropText(`اختيارك: <b>${val}</b>`);
      playSfx('train');
      const r = await handleCheck(String(val));
      if (r.correct) {
        train.classList.add('run');
        setTimeout(()=>train.classList.remove('run'), 1250);
        drop.style.pointerEvents = "none";
        drags.querySelectorAll(".dragItem").forEach(x => x.setAttribute("draggable", "false"));
      }
    });

    choicesArr.forEach((ch) => {
      const it = el("div", {class:"dragItem", draggable:"true"}, `📦 ${ch}`);
      it.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", ch);
      });
      drags.appendChild(it);
    });

    shell.appendChild(header);
    shell.appendChild(track);
    shell.appendChild(drags);
    return wrap;
  }

  // --- GAME #2: Rocket Launch (fill blank / input) ---
  if (q.type === "fill_blank" || q.type === "input_number") {
    const header = el("div", {class:"gameTitle"}, [
      el("div", {}, "🚀 لعبة الصاروخ: اكتب الإجابة ليطير الصاروخ"),
      el("div", {class:"badgeMini"}, "Input")
    ]);
    const pad = el("div", {class:"rocketPad"});
    const rocket = el("div", {class:"rocket"});
    pad.appendChild(rocket);

    const inp = el("input", {style:"width:100%;margin-top:10px;padding:10px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#fff;", placeholder:"اكتب الإجابة"});
    const btn = el("button", {class:"btn btn-primary", style:"margin-top:10px", onclick: async () => {
      rocket.classList.add("flame");
      playSfx('rocket');
      const r = await handleCheck(inp.value);
      if (r.correct) {
        rocket.classList.add("launch");
        btn.disabled = true;
        inp.disabled = true;
      } else {
        rocket.classList.remove("flame");
      }
    }}, "إطلاق!");

    shell.appendChild(header);
    shell.appendChild(pad);
    shell.appendChild(inp);
    shell.appendChild(btn);
    return wrap;
  }

  // --- GAME #3: Connect-the-dots (tap to connect) ---
  if (q.type === "drag_drop_match") {
    const left = (q.left || q.left_items || []).map(String);
    const right = (q.right || q.right_items || []).map(String);

    const header = el("div", {class:"gameTitle"}, [
      el("div", {}, "🔗 لعبة التوصيل: اضغطي على عنصر من اليسار ثم اختاري جوابه من اليمين"),
      el("div", {class:"badgeMini"}, "Connect")
    ]);

    const board = el("div", {class:"connectBoard"});
    const colL = el("div", {class:"connectCol"});
    const colR = el("div", {class:"connectCol"});

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "connectLines");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    board.appendChild(svg);

    board.appendChild(colL);
    board.appendChild(colR);

    const state = {}; // left -> right
    let activeLeft = null;

    function pt(elm){
      const b = elm.getBoundingClientRect();
      const p = board.getBoundingClientRect();
      return {x: b.left - p.left + b.width/2, y: b.top - p.top + b.height/2};
    }

    function redraw(){
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      Object.keys(state).forEach((l) => {
        const r = state[l];
        const a = colL.querySelector(`[data-side="L"][data-val="${cssEscape(l)}"]`);
        const b = colR.querySelector(`[data-side="R"][data-val="${cssEscape(r)}"]`);
        if (!a || !b) return;
        const pa = pt(a), pb = pt(b);
        const line = document.createElementNS("http://www.w3.org/2000/svg","path");
        const midX = (pa.x + pb.x)/2;
        const d = `M ${pa.x} ${pa.y} C ${midX} ${pa.y}, ${midX} ${pb.y}, ${pb.x} ${pb.y}`;
        line.setAttribute("d", d);
        line.setAttribute("fill","none");
        line.setAttribute("stroke","rgba(255,255,255,0.85)");
        line.setAttribute("stroke-width","4");
        line.setAttribute("stroke-linecap","round");
        svg.appendChild(line);
      });
    }

    function cssEscape(s){
      return String(s).replace(/\\/g,"\\\\").replace(/"/g,'\\"');
    }

    left.forEach((l) => {
      const chip = el("button", {class:"connectItem", type:"button"}, l);
      chip.dataset.side = "L";
      chip.dataset.val = l;
      chip.onclick = () => {
        playSfx("pop");
        // toggle
        if (activeLeft === l) {
          activeLeft = null;
          chip.classList.remove("active");
          colL.querySelectorAll(".connectItem").forEach(x=>x.classList.remove("active"));
          return;
        }
        activeLeft = l;
        colL.querySelectorAll(".connectItem").forEach(x=>x.classList.remove("active"));
        chip.classList.add("active");
      };
      colL.appendChild(chip);
    });

    right.forEach((r) => {
      const chip = el("button", {class:"connectItem", type:"button"}, r);
      chip.dataset.side = "R";
      chip.dataset.val = r;
      chip.onclick = () => {
        if (!activeLeft) { toast("👈 اختاري عنصرًا من اليسار أولًا"); playSfx("error"); return; }
        // prevent using same right twice
        if (Object.values(state).includes(r)) { toast("⚠️ هذا الجواب مستخدم"); playSfx("error"); return; }
        state[activeLeft] = r;
        // mark matched
        const lbtn = colL.querySelector(`[data-val="${cssEscape(activeLeft)}"]`);
        if (lbtn) { lbtn.classList.remove("active"); lbtn.classList.add("matched"); lbtn.disabled = true; }
        chip.classList.add("matched"); chip.disabled = true;
        activeLeft = null;
        redraw();
        playSfx("success");
        boomTiny();
      };
      colR.appendChild(chip);
    });

    window.addEventListener("resize", () => setTimeout(redraw, 80));

    const btn = el("button", {class:"btn btn-primary", style:"margin-top:10px", onclick: async () => {
      // need all left matched
      if (Object.keys(state).length !== left.length) {
        toast("كمّلي التوصيل كله أولًا ✅");
        playSfx("error");
        return;
      }
      const r = await handleCheck(state);
      if (r.correct) {
        btn.disabled = true;
        board.classList.add("win");
      } else {
        // allow retry: reset
        toast("❌ في توصيل غلط… جرّبي مرة ثانية!");
        playSfx("error");
      }
    }}, "تحقق ✅");

    shell.appendChild(header);
    shell.appendChild(board);
    shell.appendChild(btn);
    // initial draw
    setTimeout(redraw, 60);
    return wrap;
  }

  // --- GAME #4: Sorting Race (drag items into slots) ---
  if (q.type === "drag_drop_order" || q.type === "drag_drop_sort") {
    const items = (q.items || q.values || q.answer || []).map(String);
    const correct = Array.isArray(q.answer) ? q.answer.map(String) : items.slice().sort();

    const header = el("div", {class:"gameTitle"}, [
      el("div", {}, "🏁 سباق الترتيب: رتّبي بسرعة قبل ما يطلع القطار!"),
      el("div", {class:"badgeMini"}, "Sort Race")
    ]);

    // Tiny countdown for extra excitement (non-strict, just motivational)
    let seconds = 25;
    const timerRow = el("div", {style:"display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:6px"}, [
      el("div", {class:"muted mini"}, "⏱️ الوقت:"),
      el("div", {class:"pill", id:`t_${Math.random().toString(16).slice(2)}`}, `${seconds} ثانية`),
    ]);
    const bar = el("div", {class:"progressBar", style:"margin-top:8px"}, [el("div", {style:"width:100%"})]);
    const barInner = bar.querySelector("div");
    const timerPill = timerRow.querySelector(".pill");
    const tick = setInterval(() => {
      seconds -= 1;
      if (timerPill) timerPill.textContent = `${Math.max(0, seconds)} ثانية`;
      if (barInner) barInner.style.width = `${Math.max(0, (seconds/25)*100)}%`;
      if (seconds <= 0) {
        clearInterval(tick);
        toast("⏳ خلّينا نجرّب من جديد… ركّزي على الترتيب 👀");
        playSfx("error");
      }
    }, 1000);

    // Pool of draggable cards
    const pool = el("div", {class:"draggables"});
    const shuffled = items.slice().sort(() => Math.random() - 0.5);
    shuffled.forEach((ch) => {
      const it = el("div", {class:"dragItem", draggable:"true"}, ch);
      it.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", ch);
        setTimeout(() => it.classList.add("dragging"), 0);
      });
      it.addEventListener("dragend", () => it.classList.remove("dragging"));
      pool.appendChild(it);
    });

    // Track slots
    const track = el("div", {class:"slotTrack"});
    const slots = [];
    for (let i = 0; i < correct.length; i++) {
      const slot = el("div", {class:"slot", html:`<div class="slotNum">${i+1}</div><div class="slotVal muted mini">اسحبي هنا</div>`});
      slot.dataset.idx = String(i);
      slot.addEventListener("dragover", (e) => { e.preventDefault(); slot.classList.add("over"); });
      slot.addEventListener("dragleave", () => slot.classList.remove("over"));
      slot.addEventListener("drop", (e) => {
        e.preventDefault();
        slot.classList.remove("over");
        const val = e.dataTransfer.getData("text/plain");
        slot.dataset.value = val;
        slot.classList.add("filled","pop");
        slot.querySelector(".slotVal").textContent = val;

        // hide from pool (keep it simple)
        const it = Array.from(pool.querySelectorAll(".dragItem")).find(x => x.textContent.trim() === val);
        if (it) it.style.display = "none";

        // tiny feedback when a slot is filled
        toast("✨ ممتاز! كمّلي الترتيب…");
      });
      slots.push(slot);
      track.appendChild(slot);
    }

    const btn = el("button", {class:"btn btn-primary", style:"margin-top:10px", onclick: async () => {
      const arr = slots.map(s => (s.dataset.value || "").trim()).filter(Boolean);
      if (arr.length !== slots.length) {
        toast("⚠️ كمّلي كل الخانات أولاً");
        playSfx("error");
        return;
      }
      const r = await handleCheck(arr);
      if (r.correct) {
        try { clearInterval(tick); } catch {}
        btn.disabled = true;
        track.classList.add("win");
        boomCelebrate();
      } else {
        track.classList.add("shake");
        setTimeout(()=>track.classList.remove("shake"), 320);
      }
    }}, "تحقق ✅");

    shell.appendChild(header);
    shell.appendChild(timerRow);
    shell.appendChild(bar);
    shell.appendChild(el("div", {class:"muted mini"}, "رتّبي العناصر من الأصغر للأكبر (أو حسب المطلوب في السؤال)."));
    shell.appendChild(pool);
    shell.appendChild(track);
    shell.appendChild(btn);
    return wrap;
  }


  wrap.appendChild(el("div", {class:"muted", style:"margin-top:8px"}, "نوع سؤال غير مدعوم في الواجهة الحالية."));
  return wrap;
}



// ---------------------------
// NEW Mega Games (Balloon / Train / Rocket) using provided designs
// One game shows a set of questions inside the same fun scene.
// ---------------------------
let __mtTemplateStylesInjected = false;
function ensureTemplateStyles(){
  if (__mtTemplateStylesInjected) return;
  __mtTemplateStylesInjected = true;
  const style = document.createElement('style');
  style.id = 'mt-template-games-css';
  style.textContent = `
  /* ===== Balloon Smart Challenge (scoped) ===== */
  .mtBalloonWrap{position:relative;overflow:hidden;border-radius:18px;border:1px solid rgba(255,255,255,.12);
    background:linear-gradient(to bottom, #87CEEB 0%, #E0F7FA 100%);height:420px}
  .mtBalloonWrap *{font-family:'Cairo',system-ui,-apple-system,Segoe UI,Arial}
  .mtBalloonScore{position:absolute;top:12px;left:12px;right:12px;display:flex;justify-content:space-between;align-items:center;z-index:10}
  .mtBalloonScore .sb{font-size:1.2rem;color:#fff;background:#ff9f43;padding:10px 18px;border-radius:999px;
    border:3px solid #fff;box-shadow:0 8px 20px rgba(0,0,0,0.12)}
  .mtBalloonCloud{position:absolute;top:74px;left:50%;transform:translateX(-50%);
    width:320px;height:110px;background:#fff;border-radius:100px;display:flex;justify-content:center;align-items:center;
    box-shadow:0 10px 30px rgba(0,0,0,0.10);animation:mtFloat 4s infinite;z-index:6}
  .mtBalloonCloud:after{width:150px;height:150px;top:-65px;left:32px;content:'';position:absolute;background:#fff;border-radius:50%}
  .mtBalloonCloud:before{width:120px;height:120px;top:-35px;right:34px;content:'';position:absolute;background:#fff;border-radius:50%}
  .mtBalloonQuestion{font-size:2.1rem;color:#2c3e50;z-index:7;position:relative;text-align:center;padding:0 18px;line-height:1.15}
  .mtBalloonZone{position:absolute;inset:0;top:0;}
  .mtBalloonWrapper{position:absolute;bottom:-220px;display:flex;flex-direction:column;align-items:center;
    animation:mtDrift linear infinite;transition:all .5s;cursor:pointer;user-select:none}
  .mtBalloon{width:96px;height:128px;border-radius:50% 50% 50% 50% / 40% 40% 60% 60%;
    display:flex;justify-content:center;align-items:center;font-size:1.6rem;color:#fff;font-weight:900;
    box-shadow: inset -10px -10px 15px rgba(0,0,0,0.18);padding:8px;text-align:center}
  .mtString{width:2px;height:70px;background:rgba(0,0,0,0.2);transform-origin:top;animation:mtSway 3s infinite}
  @keyframes mtSway{0%,100%{transform:rotate(0deg)}50%{transform:rotate(3deg)}}
  @keyframes mtDrift{from{bottom:-220px}to{bottom:120%}}
  @keyframes mtFloat{0%,100%{transform:translate(-50%,0)}50%{transform:translate(-50%,-12px)}}
  @keyframes mtShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-10px)}75%{transform:translateX(10px)}}
  .mtWrong{animation:mtShake .2s 3 !important;filter:grayscale(.4);opacity:.7}
  .mtPop{animation:mtPop .28s forwards !important;}
  @keyframes mtPop{0%{transform:scale(1)}100%{transform:scale(2);opacity:0}}

  /* ===== Train Drag&Drop (scoped) ===== */
  .mtTrainWrap{position:relative;overflow:hidden;border-radius:18px;border:1px solid rgba(255,255,255,.12);
    background:linear-gradient(to bottom,#a1c4fd 0%, #c2e9fb 100%);height:420px}
  .mtTrainWrap *{font-family:'Cairo',system-ui,-apple-system,Segoe UI,Arial}
  .mtTrainTop{position:absolute;top:12px;left:12px;right:12px;display:flex;justify-content:space-between;align-items:center;z-index:10}
  .mtTrainTop .score{font-size:1rem;background:#eb4d4b;padding:8px 14px;border-radius:14px;border:1px solid rgba(0, 0, 0, 0.08)}
  .mtStation{position:absolute;top:74px;left:50%;transform:translateX(-50%);
    background:#eb4d4b;padding:10px 30px;border-radius:20px;border:5px solid #ff9f43;
    font-size:1.8rem;box-shadow:0 10px 20px rgba(0,0,0,0.10);z-index:10;max-width:92%;text-align:center}
  .mtOptions{position:absolute;top:335px;left:50%;transform:translateX(-50%);display:flex;gap:14px;z-index:12;flex-wrap:wrap;justify-content:center;width:92%}
  .mtCloudAns{width:96px;height:62px;background:#fff;border-radius:999px;display:flex;justify-content:center;align-items:center;
    font-size:1.4rem;color:#2d3436;cursor:grab;box-shadow:0 5px 15px rgba(0,0,0,0.10);
    border:3px dashed #74b9ff;user-select:none;padding:0 10px;text-align:center}
  .mtCloudAns:active{cursor:grabbing;transform:scale(1.06)}
  .mtRail{position:absolute;bottom:110px;left:0;right:0;height:15px;background:#4b4b4b;border-bottom:8px solid #2d3436}
  .mtTrain{position:absolute;bottom:130px;right:50%;transform:translateX(50%);
    display:flex;align-items:flex-end;}
  .mtDrop{width:140px;height:90px;background:rgba(255,255,255,0.25);border:4px dashed #fff;border-radius:10px;
    display:flex;justify-content:center;align-items:center;font-size:1.8rem;color:#fff;transition:background .2s ease}
  .mtEngine{width:140px;height:105px;background:#eb4d4b;border-radius:10px 50px 10px 10px;border:4px solid #fff;position:relative;margin-left:10px}
  .mtWheel{position:absolute;bottom:-18px;width:34px;height:34px;background:#2d3436;border-radius:50%;border:3px solid #fff}
  .mtTrainMove{animation:mtMoveAway 3.6s forwards}
  @keyframes mtMoveAway{to{right:120%}}

  /* ===== Rocket Fix (scoped) ===== */
  .mtRocketWrap{position:relative;overflow:hidden;border-radius:18px;border:1px solid rgba(255,255,255,.12);
    background:radial-gradient(circle, #1b2735 0%, #090a0f 100%);height:420px;color:#fff}
  .mtRocketWrap *{font-family:'Cairo',system-ui,-apple-system,Segoe UI,Arial}
  .mtHud{position:absolute;top:12px;left:12px;right:12px;font-size:1.05rem;background:rgba(255,255,255,0.10);
    padding:10px 16px;border-radius:12px;border:1px solid rgba(52,152,219,.6);z-index:20;text-align:center}
  .mtRocketCenter{position:absolute;top:96px;left:50%;transform:translateX(-50%);z-index:10}
  .mtRocketBody{width:130px;height:190px;background:#ecf0f1;border-radius:50% 50% 10px 10px;border:5px solid #bdc3c7;
    display:flex;flex-direction:column;align-items:center;justify-content:center;}
  .mtWindow{width:52px;height:52px;background:#3498db;border-radius:50%;border:4px solid #2980b9;margin-bottom:12px}
  .mtDropZone{width:90px;height:64px;border:3px dashed #e74c3c;border-radius:10px;display:flex;justify-content:center;align-items:center;
    font-size:1.15rem;background:rgba(231, 76, 60, 0.12);transition:background .2s ease}
  .mtDropZone.ok{border-style:solid;border-color:#2ecc71;background:#2ecc71;color:#fff}
  .mtParts{position:absolute;bottom:24px;left:0;right:0;display:flex;gap:14px;justify-content:center;z-index:20;flex-wrap:wrap}
  .mtPart{width:86px;height:86px;background:#95a5a6;border-radius:12px;display:flex;justify-content:center;align-items:center;
    font-size:1.6rem;font-weight:900;cursor:grab;border-bottom:6px solid #7f8c8d;box-shadow:0 5px 15px rgba(0,0,0,0.55);
    user-select:none;padding:0 10px;text-align:center}
  .mtPart:active{cursor:grabbing;transform:scale(1.06)}
  .mtLaunch{animation:mtFlyUp 1.8s forwards}
  @keyframes mtFlyUp{0%{transform:translateY(0) scale(1)}20%{transform:translateY(10px) rotate(2deg)}100%{transform:translateY(-120vh) scale(.55)}}
  .mtFire{display:none;text-align:center;font-size:2.5rem;margin-top:-10px}

  /* Shared small feedback */
  .mtHintBar{position:absolute;bottom:110px;left:12px;right:12px;z-index:30;display:flex;justify-content:center}
  .mtHint{background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.18);padding:8px 12px;border-radius:14px;max-width:92%;font-size:.95rem;line-height:1.35}
  `;
  document.head.appendChild(style);
}

async function checkWithRetries(q, answer, attemptsState){
  const k = String(q.id || '');
  attemptsState[k] = (attemptsState[k] || 0) + 1;
  const resp = await checkAnswer(q, answer);
  return {resp, tries: attemptsState[k]};
}

function renderMegaGame(questions, mode, skill_id, onAllSolved, onProgress){
  ensureTemplateStyles();
  const m = (mode || 'balloons');
  const colors = ['#FF5E5E', '#FFBB33', '#2ECC71', '#9B59B6', '#3498DB'];

  let score = 0;
  let idx = 0;
  const total = (questions || []).length;
  const attemptsState = {};

  const root = el('div', {class:'megaExam'});
  const header = el('div', {class:'megaHeader'}, [
    el('div', {class:'megaTitle'}, m === 'train' ? '🚂 قطار الأرقام' : (m === 'rocket' ? '🚀 إصلاح الصاروخ' : '🎈 تحدي البلالين')),
    el('div', {class:'megaCounter'}, `سؤال ${Math.min(1,total)} / ${total}`),
  ]);
  const localBar = el('div', {class:'progressBar', style:'margin-top:10px'}, el('div', {}));
  const stage = el('div', {class:'megaStage'});

  root.appendChild(header);
  root.appendChild(localBar);
  root.appendChild(stage);

  function setProgress(){
    try{
      header.querySelector('.megaCounter').textContent = `سؤال ${Math.min(idx+1,total)} / ${total}`;
      const pct = total ? Math.round((idx / total) * 100) : 0;
      localBar.firstChild.style.width = `${pct}%`;
      if (typeof onProgress === 'function') onProgress(idx, total);
    }catch{}
  }

  async function finish(){
    localBar.firstChild.style.width = '100%';
    toast('🏆 ممتاز! خلصتِ اللعبة!');
    boomCelebrate();
    playSfx('success');
    if (typeof onAllSolved === 'function') onAllSolved();
  }

  function normalizeChoices(q){
    const ch = (q.choices || q.options || []).map(x => String(x));
    // If no choices, make a small set from numeric answer if present (rare)
    if (ch.length) return ch;
    if (q.answer != null){
      const a = String(q.answer);
      return [a];
    }
    return [];
  }

  function renderBalloonQuestion(q){
    const wrap = el('div', {class:'mtBalloonWrap'});
    const top = el('div', {class:'mtBalloonScore'}, [
      el('div', {class:'sb'}, `النقاط: ` + el('span', {id:'mtScore'}, String(score)).textContent),
      el('div', {class:'sb'}, `⭐ ${loadRewards().stars}  🪙 ${loadRewards().coins}`)
    ]);
    // build score span properly
    top.firstChild.innerHTML = `النقاط: <span id="mtScore">${score}</span>`;
    wrap.appendChild(top);

    const cloud = el('div', {class:'mtBalloonCloud'}, el('div', {class:'mtBalloonQuestion', id:'mtQ'}, q.prompt || q.question || '؟'));
    wrap.appendChild(cloud);

    const hintBar = el('div', {class:'mtHintBar'}, el('div', {class:'mtHint', id:'mtHint'}, 'اختاري البالون الصحيح 👇'));
    wrap.appendChild(hintBar);

    const zone = el('div', {class:'mtBalloonZone', id:'mtZone'});
    wrap.appendChild(zone);

    const choices = normalizeChoices(q);
    // shuffle
    const shuffled = choices.slice().sort(() => Math.random() - 0.5);
    const lefts = [15, 35, 55, 75];

    shuffled.slice(0,4).forEach((ans, i) => {
      const wrapper = el('div', {class:'mtBalloonWrapper'});
      wrapper.style.left = (lefts[i] || (15 + i*20)) + '%';
      wrapper.style.animationDuration = (14 + Math.random()*6).toFixed(1) + 's';

      const b = el('div', {class:'mtBalloon'}, ans);
      b.style.backgroundColor = colors[i % colors.length];
      wrapper.appendChild(b);
      wrapper.appendChild(el('div', {class:'mtString'}));

      wrapper.addEventListener('click', async (e) => {
        e.stopPropagation();
        // check
        try{
          const {resp, tries} = await checkWithRetries(q, ans, attemptsState);
          if (resp.correct){
            playSfx('pop');
            boomTiny();
            b.classList.add('mtPop');
            score += 10;
            document.getElementById('mtScore').textContent = String(score);
            // small reward
            const r = loadRewards(); r.stars += 1; r.coins += 5; saveRewards(r);

            setTimeout(()=>nextQuestion(), 520);
          } else {
            playSfx('error');
            b.classList.add('mtWrong');
            b.textContent = 'X';
            score = Math.max(0, score - 5);
            document.getElementById('mtScore').textContent = String(score);

            // show hint / explanation
            const ex = resp.explanation ? `💡 ${resp.explanation}` : 'جربي خيار ثاني…';
            const corr = (tries >= 2 && resp.correct_answer != null) ? `✅ الصحيح: ${resp.correct_answer}` : '';
            hintBar.querySelector('#mtHint').textContent = [ex, corr].filter(Boolean).join(' — ');
          }
        }catch(err){
          playSfx('error');
          hintBar.querySelector('#mtHint').textContent = 'حدث خطأ… أعيدي المحاولة';
        }
      });

      zone.appendChild(wrapper);
    });

    return wrap;
  }

  function renderTrainQuestion(q){
  const wrap = el('div', {class:'mtTrainWrap'});

  const top = el('div', {class:'mtTrainTop'}, [
    el('div', {class:'score'}, `⭐ ${loadRewards().stars}  🪙 ${loadRewards().coins}`)
    
  ]);
  wrap.appendChild(top);

  // ✅ خلي عناصر التحديث محلية (بدون document.getElementById)
  const scoreEl = top.querySelector('#mtScore');

  const station = el('div', {class:'mtStation'}, q.prompt || q.question || '؟');
  wrap.appendChild(station);

  const optionsBox = el('div', {class:'mtOptions'});
  wrap.appendChild(optionsBox);

  wrap.appendChild(el('div', {class:'mtRail'}));

  const dropZone = el('div', {class:'mtDrop'}, '؟');

  const train = el('div', {class:'mtTrain'}, [
    dropZone,
    el('div', {class:'mtEngine'}, [
      el('div', {style:'position:absolute;top:-20px;right:20px;font-size:1.4rem;'}, '💨'),
      el('div', {class:'mtWheel', style:'right:10px;'}),
      el('div', {class:'mtWheel', style:'left:10px;'}),
    ])
  ]);
  wrap.appendChild(train);

  const hintBar = el('div', {class:'mtHintBar'}, el('div', {class:'mtHint'}, ''));
  wrap.appendChild(hintBar);

  const hintEl = hintBar.querySelector('.mtHint');

  // Helpers
  function allowDrop(ev){ ev.preventDefault(); }
  function drag(ev){
    ev.dataTransfer.setData('text/plain', ev.currentTarget.dataset.val);
    ev.dataTransfer.effectAllowed = 'move';
    ev.currentTarget.style.opacity = '0.5';
  }
  function dragEnd(ev){
    ev.currentTarget.style.opacity = '1';
  }

  // Drop zone events
  dropZone.addEventListener('dragover', (ev) => {
    allowDrop(ev);
    dropZone.style.background = 'rgba(46, 204, 113, 0.25)';
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.style.background = 'rgba(255,255,255,0.25)';
  });

  let locked = false; // ✅ يمنع تكرار drop أثناء التحقق/الأنيميشن

  dropZone.addEventListener('drop', async (ev) => {
    ev.preventDefault();
    if (locked) return;
    locked = true;

    dropZone.style.background = 'rgba(255,255,255,0.25)';
    const data = (ev.dataTransfer.getData('text/plain') || '').trim();

    try{
      const {resp, tries} = await checkWithRetries(q, data, attemptsState);

      if (resp.correct){
        dropZone.textContent = data;
        dropZone.style.background = '#2ecc71';

        playSfx('train');
        boomTiny();

        score += 10;
        if (scoreEl) scoreEl.textContent = String(score);

        const r = loadRewards();
        r.stars += 1; r.coins += 5;
        saveRewards(r);

        // ✅ شغّل حركة القطار ثم انتقل للسؤال التالي
        train.classList.add('mtTrainMove');

        setTimeout(() => {
          train.classList.remove('mtTrainMove');
          // رجّع الحالة الطبيعية
          dropZone.textContent = '؟';
          dropZone.style.background = 'rgba(255,255,255,0.25)';
          locked = false;
          nextQuestion();
        }, 3600);

      } else {
        playSfx('error');

        dropZone.style.background = '#e74c3c';
        setTimeout(() => dropZone.style.background = 'rgba(255,255,255,0.25)', 600);

        score = Math.max(0, score - 5);
        if (scoreEl) scoreEl.textContent = String(score);

        const ex = resp.explanation ? `💡 ${resp.explanation}` : 'جربي مرة ثانية…';
        const corr = (tries >= 2 && resp.correct_answer != null) ? `✅ الصحيح: ${resp.correct_answer}` : '';
        if (hintEl) hintEl.textContent = [ex, corr].filter(Boolean).join(' — ');

        locked = false;
      }
    } catch (err){
      playSfx('error');
      if (hintEl) hintEl.textContent = 'حدث خطأ… أعيدي المحاولة';
      locked = false;
    }
  });

  // options (draggable clouds)
  const choices = normalizeChoices(q).slice().sort(()=>Math.random()-0.5).slice(0,4);
  choices.forEach(val => {
    const cloud = el('div', {class:'mtCloudAns'}, val);
    cloud.draggable = true;
    cloud.dataset.val = String(val);
    cloud.addEventListener('dragstart', drag);
    cloud.addEventListener('dragend', dragEnd);
    optionsBox.appendChild(cloud);
  });

  return wrap;
}


  function renderRocketQuestion(q){
    const wrap = el('div', {class:'mtRocketWrap'});
    const hud = el('div', {class:'mtHud', id:'mtHud'}, `المهمة: ${q.prompt || q.question || '؟'}`);
    wrap.appendChild(hud);

    const center = el('div', {class:'mtRocketCenter', id:'mtRocket'});
    const fire = el('div', {class:'mtFire', id:'mtFire'}, '🔥');
    const body = el('div', {class:'mtRocketBody'}, [
      el('div', {class:'mtWindow'}),
      el('div', {class:'mtDropZone', id:'mtDrop'}, 'اسحبي هنا')
    ]);
    center.appendChild(body);
    center.appendChild(fire);
    wrap.appendChild(center);

    const parts = el('div', {class:'mtParts', id:'mtParts'});
    wrap.appendChild(parts);

    const hintBar = el('div', {class:'mtHintBar'}, el('div', {class:'mtHint', id:'mtHint'}, 'اسحبي القطعة الصحيحة إلى مكانها 🚀'));
    wrap.appendChild(hintBar);

    const drop = body.querySelector('#mtDrop');

    function allowDrop(ev){ ev.preventDefault(); drop.style.background='rgba(46,204,113,0.22)'; }
    function leave(){ drop.style.background='rgba(231,76,60,0.12)'; }
    function drag(ev){ ev.dataTransfer.setData('text/plain', ev.target.dataset.val || ev.target.innerText); }

    drop.addEventListener('dragover', allowDrop);
    drop.addEventListener('dragleave', leave);
    drop.addEventListener('drop', async (ev)=>{
      ev.preventDefault();
      leave();
      const data = ev.dataTransfer.getData('text/plain');
      try{
        const {resp, tries} = await checkWithRetries(q, data, attemptsState);
        if (resp.correct){
          drop.textContent = data;
          drop.classList.add('ok');
          fire.style.display = 'block';
          playSfx('rocket');
          boomTiny();
          score += 10;
          // reward
          const r = loadRewards(); r.stars += 1; r.coins += 5; saveRewards(r);

          center.classList.add('mtLaunch');
          setTimeout(()=>{
            center.classList.remove('mtLaunch');
            fire.style.display = 'none';
            drop.textContent = 'اسحبي هنا';
            drop.classList.remove('ok');
            nextQuestion();
          }, 1900);
        } else {
          playSfx('error');
          drop.style.background = '#e74c3c';
          setTimeout(()=>leave(), 520);
          const ex = resp.explanation ? `💡 ${resp.explanation}` : 'حاولي مرة ثانية…';
          const corr = (tries >= 2 && resp.correct_answer != null) ? `✅ الصحيح: ${resp.correct_answer}` : '';
          hintBar.querySelector('#mtHint').textContent = [ex, corr].filter(Boolean).join(' — ');
        }
      }catch{
        playSfx('error');
        hintBar.querySelector('#mtHint').textContent = 'حدث خطأ… أعيدي المحاولة';
      }
    });

    const choices = normalizeChoices(q).slice().sort(()=>Math.random()-0.5).slice(0,4);
    choices.forEach(val => {
      const part = el('div', {class:'mtPart'}, val);
      part.draggable = true;
      part.dataset.val = val;
      part.addEventListener('dragstart', drag);
      parts.appendChild(part);
    });

    // stars background (light)
    for(let i=0;i<70;i++){
      const s=document.createElement('div');
      s.style.position='absolute';
      s.style.width=s.style.height=(Math.random()*2+1)+'px';
      s.style.borderRadius='50%';
      s.style.background='white';
      s.style.opacity='0.5';
      s.style.top=(Math.random()*100)+'%';
      s.style.left=(Math.random()*100)+'%';
      s.style.animation = `twinkle ${2+Math.random()*2}s infinite`;
      s.style.zIndex='1';
      wrap.appendChild(s);
    }
    // add twinkle keyframes once via inline style on wrap
    const kf = document.createElement('style');
    kf.textContent='@keyframes twinkle{0%,100%{opacity:.25}50%{opacity:1}}';
    wrap.appendChild(kf);

    return wrap;
  }

  function nextQuestion(){
    idx += 1;
    setProgress();
    if (idx >= total){
      finish();
      return;
    }
    draw();
  }

  function draw(){
    stage.innerHTML='';
    setProgress();
    if (!total) {
      stage.appendChild(el('div',{class:'muted'},'لا توجد أسئلة.'));
      return;
    }
    const q = questions[idx];
    const node = (m === 'train') ? renderTrainQuestion(q)
      : (m === 'rocket') ? renderRocketQuestion(q)
      : renderBalloonQuestion(q);
    stage.appendChild(node);
  }

  // start
  setProgress();
  draw();
  return root;
}

// ---------------------------
// Mega game: one "exam" game that contains multiple questions
// (as requested: لكل امتحان لعبة واحدة تعرض مجموعة أسئلة)
// ---------------------------
function renderMegaExam(questions, skill_id, onAllSolved, onProgress) {
  const total = (questions || []).length;
  let idx = 0;

  const root = el("div", {class: "megaExam"});
  const header = el("div", {class:"megaHeader"}, [
    el("div", {class:"megaTitle"}, "🎮 الامتحان اللعبـي"),
    el("div", {class:"megaMeta muted mini"}, "أجيبي صح عشان ننتقل للسؤال التالي ✨"),
    el("div", {class:"megaCounter"}, `سؤال ${Math.min(1,total)} / ${total}`),
  ]);
  const stage = el("div", {class:"megaStage"});

  const localBar = el("div", {class:"progressBar", style:"margin-top:10px"}, el("div", {}));
  root.appendChild(header);
  root.appendChild(localBar);
  root.appendChild(stage);

  function setCounter() {
    try {
      header.querySelector('.megaCounter').textContent = `سؤال ${Math.min(idx+1,total)} / ${total}`;
      const pct = total ? Math.round((idx / total) * 100) : 0;
      localBar.firstChild.style.width = `${pct}%`;
    } catch {}
  }

  function showQuestion(i) {
    stage.innerHTML = "";
    setCounter();
    if (!total) return;
    const q = questions[i];
    // Smooth transition
    stage.classList.remove('fadeIn');
    void stage.offsetWidth;
    stage.classList.add('fadeIn');

    const node = renderQuestion(q, skill_id, () => {
      // move to next question
      idx += 1;
      if (typeof onProgress === "function") onProgress(idx, total);
      setCounter();
      if (idx < total) {
        toast(`⭐ ممتاز! بقي ${total - idx} سؤال`);
        setTimeout(() => showQuestion(idx), 420);
      } else {
        // finish
        localBar.firstChild.style.width = "100%";
        toast("🏆 خلصتِ الامتحان! مفرقعات! 🎉");
        boomCelebrate();
        playSfx("success");
        if (typeof onAllSolved === "function") onAllSolved();
      }
    });
    stage.appendChild(node);
  }

  showQuestion(0);
  return root;
}

function renderSkillCard(skill) {
  const card = el("div", {class:"card"});
  card.appendChild(el("h3", {style:"margin:0 0 6px 0"}, `${skill.title}`));
 

  // Track watching video as part of learning
  const videoKey = `mt_video_watched_${skill.skill_id}`;
  let watched = localStorage.getItem(videoKey) === "1";

  // Videos (required before games)
  if (Array.isArray(skill.video_urls) && skill.video_urls.length) {
    const vwrap = el("div", {style:"margin-top:12px"});
    vwrap.appendChild(el("div", {class:"muted"}, "فيديو الشرح:"));
    const gateRow = el("div", {style:"display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:8px"});
    const watchBtn = el("button", {class:"btn btn-ghost", onclick: () => {
      watched = true;
      localStorage.setItem(videoKey, "1");
      toast("✅ ممتاز! خلّصتِ الفيديو! 🎉 الآن نبدأ اللعب ✨");
      playSfx("success");
      boomVideo();
      enableGames();
    }}, watched ? "تم مشاهدة الفيديو ✅" : "شاهدت الفيديو ✅");
    gateRow.appendChild(watchBtn);
    gateRow.appendChild(el("div", {class:"muted mini"}, "(بعد الفيديو… نبدأ لعبة التطبيق)"));
    vwrap.appendChild(gateRow);
    skill.video_urls.forEach((url, idx) => {
      const vid = _getYouTubeId(url);
      const mountId = `yt_${String(skill.skill_id).replace(/[^a-zA-Z0-9_]/g, "_")}_${idx}`;
      const box = el("div", {style:"margin-top:10px"});
      const mount = el("div", {id: mountId});
      box.appendChild(mount);
      vwrap.appendChild(box);

      // Fallback iframe if the YouTube API is blocked/slow
      setTimeout(() => {
        if (!mount.firstChild) {
          const embed = ytToEmbed(url) + (ytToEmbed(url).includes("?") ? "&" : "?") + "enablejsapi=1&rel=0";
          mount.appendChild(el("iframe", {src: embed, allow:"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share", allowfullscreen:"true"}));
        }
      }, 1200);

      // Auto-mark watched when video ends (if YouTube API works). Manual button still exists.
      mountYouTubePlayer(mountId, vid, () => {
        if (!watched) {
          watched = true;
          localStorage.setItem(videoKey, "1");
          toast("🎉 انتهى الفيديو! ممتاز جدًا… جاهزين للعبة!");
          playSfx("success");
          boomVideo();
          enableGames();
          // update button text if present
          try { watchBtn.textContent = "تم مشاهدة الفيديو ✅"; } catch {}
        }
      });
    });
    card.appendChild(vwrap);
  } else {
    card.appendChild(el("div", {class:"muted", style:"margin-top:12px"}, "لا يوجد فيديو مضاف لهذه المهارة بعد."));
  }

  // Explanation
  if (skill.explain && skill.explain.summary) {
    card.appendChild(el("div", {class:"q", style:"margin-top:12px"}, [
      el("div", {class:"muted"}, "شرح سريع من الكتاب:"),
      el("div", {style:"margin-top:8px;white-space:pre-wrap"}, skill.explain.summary)
    ]));
  }

  // Questions area (games)
  const qArea = el("div", {style:"margin-top:12px"});
  const prog = el("div", {class:"progressBar", style:"margin-top:12px"}, el("div", {}));
  card.appendChild(prog);
  const btn = el("button", {class:"btn btn-primary", onclick: async () => {
    btn.disabled = true; btn.textContent = "جاري تحميل الأسئلة...";
    try {
      const packMode = "mcq";
      const pack = await getGamePack(skill.skill_id, 5, packMode);
      const questions = (pack.questions || []).slice(0);

      // track completion: fireworks only after watching video + finishing the game
      let solved = 0;
      const total = questions.length;

      function setProg() {
        const pct = total ? Math.round((solved / total) * 100) : 0;
        prog.firstChild.style.width = `${pct}%`;
      }

      function completePack() {
        if (total === 0) return;
        if (solved < total) return;

        // award a badge once per skill
        const badgeId = `badge_${skill.skill_id}`;
        const r = loadRewards();
        if (!r.badges.includes(badgeId)) {
          r.badges.push(badgeId);
          r.stars += 5;
          r.coins += 25;
          saveRewards(r);
        }

        toast("🎉 مفرقعات! خلصتِ اللعبة بنجاح!");
        boomCelebrate();
        playSfx("success");
      }

      qArea.innerHTML = "";
      if (!questions.length) {
        qArea.appendChild(el("div", {class:"muted"}, "لا توجد أسئلة لهذه المهارة بعد."));
      } else {
        // One mega game (exam) that cycles through all questions
        const mega = renderMegaGame(questions, CURRENT_DAY_MODE, skill.skill_id,
          () => { solved = total; setProg(); completePack(); },
          (done, all) => { solved = done; setProg(); }
        );
        qArea.appendChild(mega);
        // Progress now reflects mega game's completion
        solved = 0; setProg();
      }

      setProg();
      btn.textContent = "إعادة تحميل أسئلة";
    } catch (e) {
      qArea.innerHTML = `<div class="muted">حدث خطأ: ${String(e)}</div>`;
      btn.textContent = "حاول مرة أخرى";
    } finally {
      btn.disabled = false;
    }
  }}, "ابدأ لعبة التطبيق 🎮");

  function enableGames() {
    btn.disabled = !watched;
    if (!watched) {
      btn.classList.add("lock");
      btn.textContent = "شاهدي الفيديو أولاً 🔒";
    } else {
      btn.classList.remove("lock");
      btn.textContent = "ابدأ لعبة التطبيق 🎮";
    }
  }

  enableGames();
  card.appendChild(btn);
  card.appendChild(qArea);

  return card;
}

// ---------------------------
// Plan views: overview (day cards) + day view
// ---------------------------
let CURRENT_DAY_MODE = "balloons";
function getModeForDay(dayIndex){
  const modes = ["balloons","train","rocket"];
  const i = Math.max(0, Number(dayIndex||0)) % modes.length;
  return modes[i];
}
let CURRENT_PLAN = null;

function showView(which) {
  const pv = document.getElementById("planView");
  const dv = document.getElementById("dayView");
  if (which === "day") {
    pv.style.display = "none";
    dv.style.display = "block";
  } else {
    dv.style.display = "none";
    pv.style.display = "block";
  }
}

function savePlan(plan) {
  try { localStorage.setItem(PLAN_KEY, JSON.stringify(plan)); } catch {}
}

function loadPlan() {
  try {
    const p = JSON.parse(localStorage.getItem(PLAN_KEY) || "null");
    return p && p.days ? p : null;
  } catch { return null; }
}

function dayCompletion(day) {
  const r = loadRewards();
  const skills = (day.skills || []).map(s => s.skill_id);
  const done = skills.filter(id => r.badges.includes(`badge_${id}`)).length;
  return { done, total: skills.length || 0 };
}

function renderOverview(plan) {
  const out = document.getElementById("planOut");
  out.innerHTML = "";
  const totalDays = plan.total_days || (plan.days ? plan.days.length : 0);
  out.appendChild(el("div", {class:"muted"}, `الخطة جاهزة ✅ — اختاري أي يوم وابدئي اللعب! (عدد الأيام: ${totalDays})`));

  const grid = el("div", {class:"dayGrid"});

  (plan.days || []).forEach(day => {
    const card = el("div", {class:"dayCard"});
    card.appendChild(el("div", {class:"sparkle"}));
    card.appendChild(el("div", {class:"title"}, `اليوم ${day.day_index}`));
    const meta = el("div", {class:"meta"}, [
      el("div", {class:"chip"}, `⏱ ${day.total_minutes || 15} دقيقة`),
    ]);
    const comp = dayCompletion(day);
    meta.appendChild(el("div", {class:"chip"}, `✅ ${comp.done}/${comp.total}`));
    card.appendChild(meta);

    const skillsBox = el("div", {class:"skills"});
    (day.skills || []).slice(0, 4).forEach(sk => {
      skillsBox.appendChild(el("span", {class:"pill"}, sk.title || sk.skill_id));
    });
    if ((day.skills || []).length > 4) {
      skillsBox.appendChild(el("span", {class:"pill"}, `+${(day.skills || []).length - 4} مهارة`));
    }
    card.appendChild(skillsBox);

    const pb = el("div", {class:"progressBar"}, el("div", {}));
    const pct = comp.total ? Math.round((comp.done / comp.total) * 100) : 0;
    pb.firstChild.style.width = `${pct}%`;
    card.appendChild(el("div", {style:"margin-top:10px"}, pb));

    const cta = el("div", {class:"cta"});
    const btn = el("button", {class:"btn btn-primary"}, "ابدأ اليوم ▶");
    btn.onclick = (e) => { e.stopPropagation(); openDay(day.day_index); };
    cta.appendChild(btn);
    cta.appendChild(el("div", {class:"muted mini"}, "يمكنك الرجوع في أي وقت"));
    card.appendChild(cta);

    card.onclick = () => openDay(day.day_index);
    grid.appendChild(card);
  });

  out.appendChild(grid);
  showView("plan");
}

function renderDay(day) {
  const out = document.getElementById("dayOut");
  out.innerHTML = "";
  // Rotate the game style by day so the child experiences 3 different game modes.
  CURRENT_DAY_MODE = getModeForDay(day.day_index);
  const meta = document.getElementById("dayMeta");
  const icon = (CURRENT_DAY_MODE === 'train') ? '🚂' : (CURRENT_DAY_MODE === 'rocket' ? '🚀' : '🎈');
  meta.textContent = `اليوم ${day.day_index} — ${day.total_minutes || 15} دقيقة  ${icon}`;

  (day.skills || []).forEach(sk => out.appendChild(renderSkillCard(sk)));
  showView("day");
}

function openDay(dayIndex) {
  if (!CURRENT_PLAN) return;
  const day = (CURRENT_PLAN.days || []).find(d => String(d.day_index) === String(dayIndex));
  if (!day) return;
  renderDay(day);
}

function renderPlan(plan) {
  CURRENT_PLAN = plan;
  savePlan(plan);
  // After generating a plan, we don't want the "missing skills" input to remain visible.
  // Also avoid carrying this list to another student.
  hideMissingSkillsControls(true);
  renderOverview(plan);
}

function hideMissingSkillsControls(clearStored=false){
  const card = document.getElementById('missingSkillsCard');
  if (card) card.style.display = 'none';
  try {
    document.getElementById('skillsInput').value = '';
    const pills = document.getElementById('skillsPills');
    if (pills) pills.innerHTML = '';
  } catch {}
  if (clearStored) {
    try { localStorage.removeItem('missing_skills'); } catch {}
  }
}

// Chat widget
function chatAppend(text, who="bot") {
  const box = document.getElementById("chatMsgs");
  const m = el("div", {class:`msg ${who==="me" ? "me":"bot"}`}, text);
  box.appendChild(m);
  box.scrollTop = box.scrollHeight;
}

async function sendChat() {
  const input = document.getElementById("chatInput");
  const msg = input.value.trim();
  if (!msg) return;
  input.value = "";
  chatAppend(msg, "me");

  // optional: attach last viewed skill id
  const skillId = (window.__lastSkillId || null);

  try {
    const resp = await postJSON(`${API}/chat`, {message: msg, skill_id: skillId, k: 4});
    chatAppend(resp.response || resp.answer || "...");
  } catch (e) {
    chatAppend("صار خطأ بالشات: " + String(e));
  }
}

function setupChat() {
  const fab = document.getElementById("chatFab");
  const panel = document.getElementById("chatPanel");
  const close = document.getElementById("chatClose");
  const send = document.getElementById("chatSend");
  const input = document.getElementById("chatInput");

  fab.onclick = () => { panel.style.display = (panel.style.display === "flex") ? "none" : "flex"; };
  close.onclick = () => { panel.style.display = "none"; };
  send.onclick = sendChat;
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") sendChat(); });

  chatAppend("أنا مساعدك. اسألني عن أي شيء في المنهاج 👋");
}


function showLoading(on) {
  const ov = document.getElementById("loadingOverlay");
  if (!ov) return;
  ov.style.display = on ? "flex" : "none";
}

const LOADING_TIPS = [
  "نصيحة: شاهدي الفيديو أولاً ثم العبِ اللعبة ✅",
  "كل إجابة صحيحة = نجوم أكثر ⭐",
  "إذا غلطتِ… عادي! جرّبي مرة ثانية 💪",
  "جاهزين للقطار والبالونات والصاروخ؟ 🚂🎈🚀"
];


let __loadingMusicIframe = null;
function startLoadingMusic() {
  // Play the requested YouTube video's sound while generating the plan.
  // Autoplay is allowed because this runs after a user click.
  try {
    const ov = document.getElementById("loadingOverlay");
    if (!ov) return;
    // create hidden iframe once
    if (!__loadingMusicIframe) {
      const wrap = document.createElement("div");
      wrap.id = "loadingMusicWrap";
      wrap.style.cssText = "position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;";
      const src = `https://www.youtube.com/embed/${LOADING_MUSIC_VIDEO_ID}?autoplay=1&loop=1&playlist=${LOADING_MUSIC_VIDEO_ID}&controls=0&rel=0`;
      const ifr = document.createElement("iframe");
      ifr.setAttribute("allow", "autoplay; encrypted-media");
      ifr.src = src;
      ifr.width = "1";
      ifr.height = "1";
      wrap.appendChild(ifr);
      ov.appendChild(wrap);
      __loadingMusicIframe = ifr;
    } else {
      // restart
      const src = `https://www.youtube.com/embed/${LOADING_MUSIC_VIDEO_ID}?autoplay=1&loop=1&playlist=${LOADING_MUSIC_VIDEO_ID}&controls=0&rel=0`;
      __loadingMusicIframe.src = src;
    }
  } catch {}
}
function stopLoadingMusic() {
  try {
    if (__loadingMusicIframe) {
      __loadingMusicIframe.src = "about:blank";
    }
  } catch {}
}

function startLoadingShow() {
  let i = 0;
  const tipEl = document.getElementById("loadTip");
  const b = document.getElementById("loadBoySay");
  const g = document.getElementById("loadGirlSay");

  const lines = [
    {who:"boy", text:"أنا أُسيد! الرياضيات بتخلّينا أذكياء ونحل مشاكل بسرعة 😄"},
    {who:"girl", text:"وأنا لُمى! خلّينا نتعلّم ونلعب… وبعدها مفرقعات! 🎉"},
    {who:"boy", text:"رح نعمل خطة 15 دقيقة يوميًا… سهلة وممتعة!"},
    {who:"girl", text:"خليكي جاهزة! إذا جاوبتي صح رح تسمعي أصوات حلوة وتشوفي مفرقعات ✨"}
  ];

  const say = () => {
    const L = lines[i % lines.length];
    if (L.who === "boy" && b) b.textContent = L.text;
    if (L.who === "girl" && g) g.textContent = L.text;
    if (tipEl) tipEl.textContent = LOADING_TIPS[i % LOADING_TIPS.length];
    i++;
  };

  say();
  clearInterval(startLoadingShow.__t);
  startLoadingShow.__t = setInterval(say, 2600);
}

function stopLoadingShow() {
  clearInterval(startLoadingShow.__t);
}

async function generatePlan() {
  const fromStorage = getMissingFromStorage();
  const fromInput = parseInputSkills();
  const missing = fromInput.length ? fromInput : fromStorage;

  setPills(missing);

  if (!missing.length) {
    alert("ما في مهارات ناقصة. اعملي تشخيص أو اكتبي skill_id.");
    return;
  }

  const body = {missing_skills: missing, minutes_per_day: 15, include_prereqs: true, fast_mode: true, rag_k: 4};
  const btn = document.getElementById("genBtn");
  btn.disabled = true; btn.textContent = "جاري توليد الخطة...";
  showLoading(true);
  startLoadingShow();
  startLoadingMusic();
  try {
    const plan = await postJSON(`${API}/plan`, body);
    renderPlan(plan);
  } catch (e) {
    document.getElementById("planOut").innerHTML = `<div class="card"><div class="muted">خطأ: ${String(e)}</div></div>`;
  } finally {
    stopLoadingShow();
    stopLoadingMusic();
    showLoading(false);
    btn.disabled = false; btn.textContent = "توليد الخطة";
  }
}

(function init(){
  // Keep the same nice animation style as before
  if (window.GameAnimations) window.GameAnimations.init();
  updateHud();
  const missing = getMissingFromStorage();
  document.getElementById("skillsInput").value = missing.join(", ");
  setPills(missing);
  document.getElementById("genBtn").onclick = generatePlan;
  const back = document.getElementById("backToPlan");
  if (back) back.onclick = () => {
    if (CURRENT_PLAN) renderOverview(CURRENT_PLAN);
    else showView("plan");
  };

  // If there is a saved plan, show it immediately (child can continue)
  const saved = loadPlan();
  if (saved) {
    CURRENT_PLAN = saved;
    // When a plan already exists, hide the "missing skills" controls to keep the UI clean.
    hideMissingSkillsControls(false);
    renderOverview(saved);
  }
  setupChat();
})();
