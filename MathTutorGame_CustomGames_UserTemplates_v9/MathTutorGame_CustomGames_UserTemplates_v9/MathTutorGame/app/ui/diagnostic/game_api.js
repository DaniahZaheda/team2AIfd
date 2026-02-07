const API_BASE = "";

let sessionId = null;
let skillsMap = {};

function updateProgress(p) {
  if (!p) return;
  const el = document.getElementById("progressText");
  if (!el) return;
  el.textContent = `سؤال ${p.current} من ${p.total} — المتبقي ${p.remaining}`;
}


function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

async function loadSkillsMap() {
  const res = await fetch(`${API_BASE}/skills_map`);
  skillsMap = await res.json();
}


async function startDiagnostic() {
  // New attempt: clear any previous student's saved plan/rewards so nothing leaks across kids.
  try {
    localStorage.removeItem('mt_plan_v1');
    localStorage.removeItem('mt_rewards_v1');
    localStorage.removeItem('missing_skills');
    localStorage.removeItem('strong_skills');
    localStorage.removeItem('not_assessed');
    // Also clear per-skill badges/video flags from old runs (safe + keeps UI consistent)
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('badge_') || k.startsWith('mt_video_watched_')) localStorage.removeItem(k);
    });
  } catch {}

  await loadSkillsMap();

  document.getElementById("startStatus").textContent = "جاري بدء التشخيص...";

  const targetGrade = Number(document.getElementById("targetGrade").value);

  const res = await fetch(`${API_BASE}/diag/start`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ target_grade: targetGrade })
  });

  const data = await res.json();
  sessionId = data.session_id;

  document.getElementById("questionText").textContent = data.question;
  updateProgress(data.progress);
  document.getElementById("answerInput").value = "";
  document.getElementById("startStatus").textContent = "";
  showScreen("game-screen");
}

async function submitAnswer() {
  const ans = document.getElementById("answerInput").value.trim();
  if (!ans) return;

  document.getElementById("gameStatus").textContent = "جاري التحقق...";

  const res = await fetch(`${API_BASE}/diag/answer`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ session_id: sessionId, student_answer: ans })
  });

  const data = await res.json();
  document.getElementById("gameStatus").textContent = "";

  if (data.done) {
    const render = (ulId, items) => {
      const ul = document.getElementById(ulId);
      if (!ul) return;
      ul.innerHTML = "";
      (items || []).forEach(s => {
        const li = document.createElement("li");
        li.textContent = skillsMap[s] || s;
        ul.appendChild(li);
      });
    };

    render("strongList", data.strong_skills || []);
    render("missingList", data.missing_skills || []);

    const notBox = document.getElementById("notAssessedBox");
    if (notBox) {
      const na = data.not_assessed || [];
      if (na.length) {
        notBox.style.display = "block";
        render("notAssessedList", na);
      } else {
        notBox.style.display = "none";
      }
    }
    localStorage.setItem("missing_skills", JSON.stringify(data.missing_skills || []));
    localStorage.setItem("strong_skills", JSON.stringify(data.strong_skills || []));
    localStorage.setItem("not_assessed", JSON.stringify(data.not_assessed || []));
    showScreen("results-screen");
  } else {
    document.getElementById("questionText").textContent = data.question;
    updateProgress(data.progress);
    document.getElementById("answerInput").value = "";
    document.getElementById("answerInput").focus();
  }
}

function restart() {
  sessionId = null;
  showScreen("start-screen");
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.GameAnimations) GameAnimations.init();

  document.getElementById("startBtn").addEventListener("click", startDiagnostic);
  document.getElementById("submitBtn").addEventListener("click", submitAnswer);
  document.getElementById("restartBtn").addEventListener("click", restart);

  document.getElementById("answerInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitAnswer();
  });
});
