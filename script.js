// script.js - Listening Practice (Section 1)
// Matches HTML inputs with ids q1..q10 and elements already in your page.

// ---------- Config: acceptable answers ----------
const acceptableAnswers = {
  q1: ["review"],
  q2: ["6", "six"],
  q3: ["break down"],
  q4: ["old shoes"],
  q5: ["extra batteries"],
  q6: ["food supply"],
  q7: ["meals", "meal"],
  q8: ["5", "five", "fix"],
  q9: ["2 weeks", "two weeks", "2weeks", "twoweeks"],
  q10: ["no refunds"]
};

// ---------- Utility: normalize user input ----------
function normalize(s) {
  return String(s || "").trim().toLowerCase();
}

// ---------- Feedback UI ----------
function createFeedback(el, correct, message) {
  // remove old
  const parent = el.parentElement || el;
  const old = parent.querySelector(".feedback");
  if (old) old.remove();

  const fb = document.createElement("span");
  fb.className = "feedback";
  fb.style.marginLeft = "10px";
  fb.style.fontWeight = "bold";
  if (correct) {
    fb.textContent = " ✅ Correct";
    fb.style.color = "green";
  } else {
    fb.textContent = message ? ` ❌ ${message}` : " ❌ Wrong";
    fb.style.color = "red";
  }
  parent.appendChild(fb);
}

// ---------- Prevent double submissions / cheat counter ----------
function handleAlreadySubmitted() {
  let attempts = +localStorage.getItem("listening_cheat") || 0;
  attempts++;
  localStorage.setItem("listening_cheat", attempts);
  let warn = document.getElementById("cheat-warning");
  if (!warn) {
    warn = document.createElement("div");
    warn.id = "cheat-warning";
    warn.style.color = "red";
    warn.style.fontWeight = "bold";
    warn.style.textAlign = "center";
    warn.style.marginTop = "12px";
    const resultBox = document.getElementById("resultBox");
    resultBox.after(warn);
  }
  warn.innerHTML = `🛑 Stop cheating! You've already submitted ${attempts} time(s)!`;
}

// ---------- Main checkAnswers ----------
function checkAnswers() {
  if (localStorage.getItem("listening_submitted")) {
    handleAlreadySubmitted();
    return;
  }

  let correctCount = 0;
  const total = Object.keys(acceptableAnswers).length;

  for (let i = 1; i <= 10; i++) {
    const qid = "q" + i;
    const inputEl = document.getElementById(qid);
    if (!inputEl) continue;

    const userRaw = inputEl.value || "";
    const user = normalize(userRaw);
    localStorage.setItem("listening_" + qid, userRaw);

    // accept any of the acceptable answers (normalized)
    const acceptedList = acceptableAnswers[qid].map(normalize);
    const isCorrect = acceptedList.includes(user);

    if (userRaw.trim().length === 0) {
      createFeedback(inputEl, false, "No answer");
    } else {
      createFeedback(inputEl, isCorrect);
    }

    if (isCorrect) correctCount++;

    // disable further editing for this input
    inputEl.disabled = true;
  }

  const incorrect = total - correctCount;
  const resultText = `✅ Correct: ${correctCount} / ${total} — ❌ Wrong: ${incorrect}`;
  document.getElementById("resultBox").innerHTML = resultText;

  localStorage.setItem("listening_result", resultText);
  localStorage.setItem("listening_submitted", "true");

  // show PDF button
  const downloadBtn = document.getElementById("downloadPdfBtn");
  if (downloadBtn) downloadBtn.style.display = "inline-block";
}

// ---------- Load saved answers on start ----------
window.addEventListener("load", () => {
  for (let i = 1; i <= 10; i++) {
    const qid = "q" + i;
    const inputEl = document.getElementById(qid);
    if (!inputEl) continue;
    const saved = localStorage.getItem("listening_" + qid);
    if (saved !== null && saved !== undefined) {
      inputEl.value = saved;
      // If already submitted, show feedback immediately
      if (localStorage.getItem("listening_submitted") === "true") {
        const norm = normalize(saved);
        const acceptedList = acceptableAnswers[qid].map(normalize);
        const isCorrect = acceptedList.includes(norm);
        createFeedback(inputEl, isCorrect);
        inputEl.disabled = true;
      }
    }
  }

  const savedResult = localStorage.getItem("listening_result");
  if (savedResult) document.getElementById("resultBox").innerHTML = savedResult;

  if (localStorage.getItem("listening_submitted") === "true") {
    const btn = document.getElementById("downloadPdfBtn");
    if (btn) btn.style.display = "inline-block";
  }
});

// ---------- PDF export (uses jsPDF included in your page) ----------
function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFontSize(14);

  let y = 40;
  doc.text("Listening Practice – Section 1 (Answers & Key)", 40, y);
  y += 26;

  doc.setFontSize(12);
  for (let i = 1; i <= 10; i++) {
    const qid = "q" + i;
    const user = localStorage.getItem("listening_" + qid) || "(no answer)";
    const key = acceptableAnswers[qid].join(" / ");
    const line = `${i}. Your: ${user} | Key: ${key}`;
    doc.text(line, 40, y);
    y += 16;
    if (y > 740) {
      doc.addPage();
      y = 40;
    }
  }

  y += 8;
  const result = localStorage.getItem("listening_result") || "";
  doc.setFontSize(12);
  doc.text("Result:", 40, y);
  y += 16;
  doc.text(result, 40, y);

  doc.save("Listening_Section1_Answers.pdf");
}

// ---------- Reset stats (protected by a password) ----------
function resetStats() {
  const password = prompt("Enter reset password:");
  if (password !== "listen123") {
    alert("❌ Incorrect password. Stats not cleared.");
    return;
  }

  Object.keys(localStorage)
    .filter(k => k.startsWith("listening_"))
    .forEach(k => localStorage.removeItem(k));

  // Also remove the cheat counter
  localStorage.removeItem("listening_cheat");
  alert("✅ Listening stats cleared!");
  location.reload();
}

// ---------- Keyboard shortcut: reveal the reset button ----------
document.addEventListener("keydown", e => {
  // Ctrl + L to reveal reset button (similar pattern to previous)
  if (e.ctrlKey && e.key.toLowerCase() === "l") {
    e.preventDefault();
    const btn = document.getElementById("resetStatsBtn");
    if (btn) {
      btn.style.display = "inline-block";
      btn.scrollIntoView({ behavior: "smooth" });
    }
  }
});

// ---------- Audio clip playback helper ----------
function playClip(startSec, endSec) {
  if (!audio) return;

  if (window.playClipTimer) {
    clearInterval(window.playClipTimer);
    window.playClipTimer = null;
  }

  audio.pause();

  const seek = () => {
    audio.currentTime = startSec;
    audio.play().catch(err => {
      console.warn("Playback blocked:", err);
    });
  };

  if (audio.readyState < 1) {
    audio.addEventListener("loadedmetadata", seek, { once: true });
    audio.load();
  } else {
    seek();
  }

  window.playClipTimer = setInterval(() => {
    if (audio.currentTime >= endSec - 0.15) {
      audio.pause();
      clearInterval(window.playClipTimer);
    }
  }, 100);
}

// ---------- Expose checkAnswers & downloadPDF & resetStats to global (HTML buttons rely on these) ----------
window.checkAnswers = checkAnswers;
window.downloadPDF = downloadPDF;
window.resetStats = resetStats;
window.playClip = playClip;

document.addEventListener("contextmenu", e => e.preventDefault());
document.addEventListener("keydown", e => {
  // F12
  if (e.key === "F12") {
    e.preventDefault();
  }

  // Ctrl + Shift + I   (DevTools)
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "i") {
    e.preventDefault();
  }

  // Ctrl + Shift + J   (Console)
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "j") {
    e.preventDefault();
  }

  // Ctrl + U  (View Source)
  if (e.ctrlKey && e.key.toLowerCase() === "u") {
    e.preventDefault();
  }

  // Ctrl + S  (Save Page)
  if (e.ctrlKey && e.key.toLowerCase() === "s") {
    e.preventDefault();
  }

  // Ctrl + C / Ctrl + X / Ctrl + V (copy/paste)
  if (e.ctrlKey && ["c", "x", "v"].includes(e.key.toLowerCase())) {
    e.preventDefault();
  }
});
document.addEventListener("selectstart", e => e.preventDefault());

(function() {
  const hackShield = document.createElement("div");
  hackShield.style.position = "fixed";
  hackShield.style.top = 0;
  hackShield.style.left = 0;
  hackShield.style.width = "100vw";
  hackShield.style.height = "100vh";
  hackShield.style.zIndex = 2147483647;
  hackShield.style.pointerEvents = "none";
  hackShield.style.opacity = 0;
  document.body.appendChild(hackShield);
})();
