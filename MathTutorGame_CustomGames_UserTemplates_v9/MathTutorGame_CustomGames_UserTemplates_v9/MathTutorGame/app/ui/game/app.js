// MathTutor Game (Arabic) - single page
// Flow: Grade -> Diagnostic -> Results -> Plan (all days) -> Day

const state = {
  view: "grade",
  grade: null,
  diag: { session_id: null, questions: [], answers: {}, index: 0 },
  mastery: {},
  weak_skills: [],
  plan: null,
  progress: { stars: 0, coins: 0, doneDays: {} },
};

const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];

function setView(name){
  state.view = name;
  $$(".view").forEach(v => v.classList.add("hidden"));
  $(`.view[data-view='${name}']`).classList.remove("hidden");
}

function saveLocal(){
  localStorage.setItem("mathtutor_game_state", JSON.stringify({
    grade: state.grade,
    mastery: state.mastery,
    weak_skills: state.weak_skills,
    plan: state.plan,
    progress: state.progress,
  }));
}

function loadLocal(){
  const raw = localStorage.getItem("mathtutor_game_state");
  if(!raw) return;
  try{
    const s = JSON.parse(raw);
    state.grade = s.grade ?? null;
    state.mastery = s.mastery ?? {};
    state.weak_skills = s.weak_skills ?? [];
    state.plan = s.plan ?? null;
    state.progress = s.progress ?? state.progress;
    if(state.plan){
      renderPlan();
      setView("plan");
    }
  }catch(e){
    console.warn(e);
  }
}

function resetLocal(){
  localStorage.removeItem("mathtutor_game_state");
  location.reload();
}

function addReward({stars=0, coins=0}){
  state.progress.stars = (state.progress.stars||0) + stars;
  state.progress.coins = (state.progress.coins||0) + coins;
  $("#stars").textContent = state.progress.stars;
  $("#coins").textContent = state.progress.coins;
  saveLocal();
}

// --- Confetti ---
const confetti = $("#confetti");
const cctx = confetti.getContext("2d");
let confettiBits = [];
function resizeCanvas(){
  confetti.width = window.innerWidth;
  confetti.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function popConfetti(n=30){
  for(let i=0;i<n;i++){
    confettiBits.push({
      x: Math.random()*confetti.width,
      y: -10,
      vx: (Math.random()-0.5)*3,
      vy: 2 + Math.random()*4,
      r: 2 + Math.random()*4,
      a: 1,
      rot: Math.random()*Math.PI,
    });
  }
}
function tickConfetti(){
  cctx.clearRect(0,0,confetti.width, confetti.height);
  confettiBits = confettiBits.filter(b => b.y < confetti.height+20 && b.a>0.02);
  for(const b of confettiBits){
    b.x += b.vx;
    b.y += b.vy;
    b.vy *= 1.01;
    b.a *= 0.99;
    b.rot += 0.05;
    cctx.globalAlpha = b.a;
    cctx.beginPath();
    cctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
    cctx.fill();
  }
  cctx.globalAlpha = 1;
  requestAnimationFrame(tickConfetti);
}
tickConfetti();

// --- API ---
async function apiGet(url){
  const r = await fetch(url);
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}
async function apiPost(url, body){
  const r = await fetch(url, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(body)
  });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

// --- Diagnostic ---
async function startDiagnostic(grade){
  state.grade = grade;
  const data = await apiGet(`/api/diagnostic?grade=${grade}`);
  state.diag.session_id = data.session_id;
  state.diag.questions = data.questions;
  state.diag.answers = {};
  state.diag.index = 0;
  renderDiagnosticQuestion();
  setView("diagnostic");
}

function canGoNext(){
  const q = state.diag.questions[state.diag.index];
  const a = state.diag.answers[q.id];
  if(q.type === "drag_drop_match"){
    return a && Object.keys(a).length === (q.left_items?.length||0);
  }
  if(q.type === "drag_drop_sort"){
    return Array.isArray(a) && a.length === (q.items?.length||0);
  }
  return a !== undefined && a !== null && String(a).trim() !== "";
}

function renderDiagnosticQuestion(){
  const idx = state.diag.index;
  const q = state.diag.questions[idx];
  $("#diagProgress").textContent = `${idx+1}/${state.diag.questions.length}`;
  const host = $("#diagContainer");
  host.innerHTML = "";

  const p = document.createElement("p");
  p.className = "question";
  p.textContent = q.prompt;
  host.appendChild(p);

  if(q.type === "multiple_choice"){
    const grid = document.createElement("div");
    grid.className = "choices";
    q.choices.forEach((c)=>{
      const b = document.createElement("button");
      b.className = "choice";
      b.textContent = c;
      if(state.diag.answers[q.id] === c) b.style.outline = "2px solid rgba(45,212,191,.8)";
      b.onclick = ()=>{ state.diag.answers[q.id] = c; renderDiagnosticQuestion(); };
      grid.appendChild(b);
    });
    host.appendChild(grid);
  } else if(q.type === "input_number" || q.type === "fill_blank"){
    const row = document.createElement("div");
    row.className = "input-row";
    const input = document.createElement("input");
    input.className = "text";
    input.placeholder = "إجابتك";
    input.value = state.diag.answers[q.id] ?? "";
    input.oninput = ()=> state.diag.answers[q.id] = input.value;
    row.appendChild(input);
    host.appendChild(row);
  } else if(q.type === "drag_drop_match"){
    host.appendChild(renderMatchGame(q, true));
  } else if(q.type === "drag_drop_sort"){
    host.appendChild(renderSortGame(q, true));
  } else {
    const warn = document.createElement("div");
    warn.className = "badge";
    warn.textContent = `نوع سؤال غير مدعوم: ${q.type}`;
    host.appendChild(warn);
  }
}

async function submitDiagnostic(){
  const answers = Object.entries(state.diag.answers).map(([question_id, answer]) => ({question_id, answer}));
  const data = await apiPost("/api/diagnostic/submit", {
    session_id: state.diag.session_id,
    answers,
  });
  state.mastery = data.mastery || {};
  state.weak_skills = (data.weak_skills||[]).slice(0, 10);
  state.plan = data.plan;
  renderResults();
  saveLocal();
  setView("results");
  popConfetti(40);
  addReward({stars:3, coins:6});
}

function renderResults(){
  const box = $("#weakSkills");
  box.innerHTML = "";
  if(!state.weak_skills.length){
    box.innerHTML = `<div class='badge'>🎉 ممتاز! بنعمل مراجعة خفيفة.</div>`;
    return;
  }
  const ul = document.createElement("ul");
  ul.style.margin = "0";
  ul.style.padding = "0 18px";
  state.weak_skills.forEach(s => {
    const li = document.createElement("li");
    li.textContent = `${s} (mastery=${(state.mastery[s] ?? 0.5)})`;
    ul.appendChild(li);
  });
  box.appendChild(ul);
}

// --- Plan ---
function renderPlan(){
  const grid = $("#planDays");
  grid.innerHTML = "";
  const days = state.plan?.days || [];
  days.forEach(d => {
    const card = document.createElement("button");
    const done = !!state.progress.doneDays?.[d.day_index];
    card.className = "day-card" + (done?" done":"");
    card.onclick = () => openDay(d.day_index);
    const focus = (d.focus_skills||[]).slice(0,2).join(" + ") || "مراجعة";
    card.innerHTML = `<div class="t">Day ${d.day_index}</div><div class="s">${focus}</div><div class="s">${done?"✅ مكتمل":"⏱️ 15 دقيقة"}</div>`;
    grid.appendChild(card);
  });
}

function ytToEmbed(url){
  try{
    const u = new URL(url);
    if(u.hostname.includes("youtu.be")){
      return `https://www.youtube.com/embed/${u.pathname.replace("/","")}`;
    }
    if(u.searchParams.get("v")){
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    }
  }catch{}
  return url;
}

function openDay(dayIndex){
  const day = state.plan.days.find(d => d.day_index === dayIndex);
  if(!day) return;
  $("#dayTitle").textContent = `Day ${day.day_index}`;
  $("#dayMeta").textContent = `${day.total_minutes} دقيقة • ${(day.focus_skills||[]).slice(0,2).join(" + ")}`;
  const wrap = $("#dayActivities");
  wrap.innerHTML = "";
  day.activities.forEach((a, idx) => {
    const card = document.createElement("div");
    card.className = "activity";
    const title = document.createElement("h3");
    title.textContent = `${idx+1}. ${a.title || a.type}`;
    card.appendChild(title);

    if(a.type === "hint"){
      const p = document.createElement("p");
      p.className = "muted";
      p.textContent = a.text;
      card.appendChild(p);
    }

    if(a.type === "video"){
      const iframe = document.createElement("iframe");
      iframe.className = "yt";
      iframe.src = ytToEmbed(a.youtube_url);
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      card.appendChild(iframe);
      const b = document.createElement("div");
      b.className = "badge";
      b.textContent = "🎬 شاهدي الفيديو ثم اكملي";
      card.appendChild(b);
    }

    if(a.type === "game"){
      const q = a.question;
      if(q.type === "drag_drop_match"){
        card.appendChild(renderMatchGame(q, false));
      } else if(q.type === "drag_drop_sort"){
        card.appendChild(renderSortGame(q, false));
      } else {
        card.appendChild(renderMiniQ(q));
      }
    }

    if(a.type === "mini_quiz"){
      a.questions.forEach(q => card.appendChild(renderMiniQ(q)));
    }

    wrap.appendChild(card);
  });
  setView("day");
}

// --- Mini question component ---
function renderMiniQ(q){
  const box = document.createElement("div");
  box.style.marginTop = "10px";
  const p = document.createElement("p");
  p.textContent = q.prompt;
  box.appendChild(p);

  const fb = document.createElement("div");
  fb.className = "feedback";
  box.appendChild(fb);

  const reward = () => addReward({stars:1, coins:2});

  const show = (ok, explanation) => {
    fb.style.display = "block";
    fb.classList.remove("ok","bad");
    fb.classList.add(ok?"ok":"bad");
    fb.innerHTML = (ok?"✅ صح! ":"❌ حاول مرة ثانية. ") + (explanation||"");
    if(ok){ popConfetti(25); reward(); }
  };

  if(q.type === "multiple_choice"){
    const grid = document.createElement("div");
    grid.className = "choices";
    q.choices.forEach((c, i) => {
      const b = document.createElement("button");
      b.className = "choice";
      b.textContent = c;
      b.onclick = () => {
        const ok = (q.answer_index === i) || (String(q.answer) === String(c));
        show(ok, q.explanation);
      };
      grid.appendChild(b);
    });
    box.appendChild(grid);
  } else {
    const row = document.createElement("div");
    row.className = "input-row";
    const input = document.createElement("input");
    input.className = "text";
    input.placeholder = "إجابتك";
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = "تحقق";
    btn.onclick = () => {
      const ans = String(input.value).trim();
      const ok = ans === String(q.answer).trim();
      show(ok, q.explanation);
    };
    row.appendChild(input);
    row.appendChild(btn);
    box.appendChild(row);
  }
  return box;
}

// --- Drag & Drop match ---
function renderMatchGame(q, isDiagnostic){
  const saved = state.diag.answers[q.id] || {};
  const wrap = document.createElement("div");
  wrap.className = "dd";

  const left = document.createElement("div");
  left.className = "col";

  const right = document.createElement("div");
  right.className = "col";

  const tokenBox = document.createElement("div");
  tokenBox.className = "tokens";
  q.right_items.forEach(txt => {
    const t = document.createElement("div");
    t.className = "token";
    t.textContent = txt;
    t.draggable = true;
    t.dataset.value = txt;
    t.addEventListener("dragstart", (e)=>{
      e.dataTransfer.setData("text/plain", txt);
    });
    tokenBox.appendChild(t);
  });
  right.appendChild(tokenBox);

  q.left_items.forEach(li => {
    const row = document.createElement("div");
    row.className = "drop-row";
    row.innerHTML = `<div class="label">${li}</div>`;
    const dz = document.createElement("div");
    dz.className = "dropzone";
    dz.dataset.left = li;
    dz.textContent = saved?.[li] || "اسحب هنا";
    dz.addEventListener("dragover", (e)=>{ e.preventDefault(); dz.classList.add("over"); });
    dz.addEventListener("dragleave", ()=> dz.classList.remove("over"));
    dz.addEventListener("drop", (e)=>{
      e.preventDefault();
      dz.classList.remove("over");
      const val = e.dataTransfer.getData("text/plain");
      dz.textContent = val;
      if(isDiagnostic){
        const cur = state.diag.answers[q.id] || {};
        cur[li] = val;
        state.diag.answers[q.id] = cur;
      }
    });
    row.appendChild(dz);
    left.appendChild(row);
  });

  wrap.appendChild(left);
  wrap.appendChild(right);

  if(!isDiagnostic){
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = "تحقق";
    const fb = document.createElement("div");
    fb.className = "feedback";
    wrap.appendChild(btn);
    wrap.appendChild(fb);
    btn.onclick = () => {
      const cur = {};
      $$(".dropzone", left).forEach(dz => cur[dz.dataset.left] = dz.textContent);
      const ok = JSON.stringify(cur) === JSON.stringify(q.answer);
      fb.style.display = "block";
      fb.classList.remove("ok","bad");
      fb.classList.add(ok?"ok":"bad");
      fb.innerHTML = (ok?"✅ ممتاز! ":"❌ جرّبي مرة ثانية. ") + (q.explanation||"");
      if(ok){ addReward({stars:2, coins:4}); popConfetti(35); }
    };
  }

  return wrap;
}

// --- Drag & Drop sort ---
function renderSortGame(q, isDiagnostic){
  const wrap = document.createElement("div");
  wrap.className = "dd";

  const col = document.createElement("div");
  col.className = "col";

  const list = document.createElement("div");
  list.className = "sortlist";

  const saved = state.diag.answers[q.id];
  const items = Array.isArray(saved) ? saved.slice() : q.items.slice().sort(()=>Math.random()-0.5);

  items.forEach(txt => {
    const it = document.createElement("div");
    it.className = "sortitem";
    it.textContent = txt;
    it.draggable = true;
    it.addEventListener("dragstart", (e)=>{
      it.classList.add("dragging");
      e.dataTransfer.setData("text/plain", txt);
    });
    it.addEventListener("dragend", ()=> it.classList.remove("dragging"));
    list.appendChild(it);
  });

  list.addEventListener("dragover", (e)=>{
    e.preventDefault();
    const dragging = list.querySelector(".dragging");
    if(!dragging) return;
    const after = getDragAfterElement(list, e.clientY);
    if(after == null) list.appendChild(dragging);
    else list.insertBefore(dragging, after);
  });

  col.appendChild(list);
  wrap.appendChild(col);

  const storeIfDiag = () => {
    if(!isDiagnostic) return;
    const cur = $$(".sortitem", list).map(x => x.textContent);
    state.diag.answers[q.id] = cur;
  };
  list.addEventListener("drop", storeIfDiag);
  list.addEventListener("dragend", storeIfDiag);

  if(!isDiagnostic){
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = "تحقق";
    const fb = document.createElement("div");
    fb.className = "feedback";
    wrap.appendChild(btn);
    wrap.appendChild(fb);
    btn.onclick = () => {
      const cur = $$(".sortitem", list).map(x => x.textContent);
      const ok = JSON.stringify(cur) === JSON.stringify(q.answer);
      fb.style.display = "block";
      fb.classList.remove("ok","bad");
      fb.classList.add(ok?"ok":"bad");
      fb.innerHTML = (ok?"✅ ترتيب صحيح! ":"❌ جرّبي ترتيب تاني. ") + (q.explanation||"");
      if(ok){ addReward({stars:2, coins:4}); popConfetti(35); }
    };
  }
  return wrap;
}

function getDragAfterElement(container, y){
  const els = [...container.querySelectorAll('.sortitem:not(.dragging)')];
  return els.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if(offset < 0 && offset > closest.offset){
      return { offset, element: child };
    }
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// --- Wire up ---
function init(){
  loadLocal();
  $("#stars").textContent = state.progress.stars || 0;
  $("#coins").textContent = state.progress.coins || 0;
  $("#reset").onclick = resetLocal;

  $$(".grade").forEach(b => b.onclick = () => startDiagnostic(Number(b.dataset.grade)));

  $("#diagPrev").onclick = () => {
    state.diag.index = Math.max(0, state.diag.index-1);
    renderDiagnosticQuestion();
  };
  $("#diagNext").onclick = async () => {
    if(!canGoNext()) return;
    if(state.diag.index < state.diag.questions.length-1){
      state.diag.index += 1;
      renderDiagnosticQuestion();
    } else {
      await submitDiagnostic();
    }
  };

  $("#startPlan").onclick = () => {
    renderPlan();
    setView("plan");
  };
  $("#backToResults").onclick = () => setView("results");
  $("#backToPlan").onclick = () => { renderPlan(); setView("plan"); };

  $("#finishDay").onclick = () => {
    const title = $("#dayTitle").textContent;
    const num = Number(title.replace("Day ",""));
    state.progress.doneDays = state.progress.doneDays || {};
    state.progress.doneDays[num] = true;
    addReward({stars:3, coins:6});
    popConfetti(60);
    saveLocal();
    renderPlan();
    setView("plan");
  };
}

init();
