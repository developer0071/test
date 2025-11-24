// script.js - Listening Practice (Section 1)
// Matches HTML inputs with ids q1..q10 and elements already in your page.

// ---------- Config: acceptable answers ----------
const acceptableAnswers = {
  q31: ["excitement"],
  q32: ["benefits"],
  q33: ["territory"],
  q34: ["civilization"],
  q35: ["ignore"],
  q36: ["base"],
  q37: ["mapped"],
  q38: ["legal"],
  q39: ["health"],
  q40: ["doubt"]
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
  let attempts = +localStorage.getItem("listening4_cheat") || 0;
  attempts++;
  localStorage.setItem("listening4_cheat", attempts);
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
  if (localStorage.getItem("listening4_submitted")) {
    handleAlreadySubmitted();
    return;
  }

  let correctCount = 0;
  const total = Object.keys(acceptableAnswers).length;

  for (let i = 31; i <= 40; i++) {
    const qid = "q" + i;
    const inputEl = document.getElementById(qid);
    if (!inputEl) continue;

    const userRaw = inputEl.value || "";
    const user = normalize(userRaw);
    localStorage.setItem("listening4_" + qid, userRaw);

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

  localStorage.setItem("listening4_result", resultText);
  localStorage.setItem("listening4_submitted", "true");

  // show PDF button
  const downloadBtn = document.getElementById("downloadPdfBtn");
  if (downloadBtn) downloadBtn.style.display = "inline-block";
}
// ---------- Load saved answers on start ----------
window.addEventListener("load", () => {
  for (let i = 31; i <= 40; i++) {
    const qid = "q" + i;
    const inputEl = document.getElementById(qid);
    if (!inputEl) continue;
    const saved = localStorage.getItem("listening4_" + qid);
    if (saved !== null && saved !== undefined) {
      inputEl.value = saved;
      // If already submitted, show feedback immediately
      if (localStorage.getItem("listening4_submitted") === "true") {
        const norm = normalize(saved);
        const acceptedList = acceptableAnswers[qid].map(normalize);
        const isCorrect = acceptedList.includes(norm);
        createFeedback(inputEl, isCorrect);
        inputEl.disabled = true;
      }
    }
  }

  const savedResult = localStorage.getItem("listening4_result");
  if (savedResult) document.getElementById("resultBox").innerHTML = savedResult;

  if (localStorage.getItem("listening4_submitted") === "true") {
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
  for (let i = 31; i <= 40; i++) {
    const qid = "q" + i;
    const user = localStorage.getItem("listening4_" + qid) || "(no answer)";
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
  const result = localStorage.getItem("listening4_result") || "";
  doc.setFontSize(12);
  doc.text("Result:", 40, y);
  y += 16;
  doc.text(result, 40, y);

  doc.save("Listening_Section1_Answers.pdf");
}
//---------- Reset stats (protected by a password) ----------
function resetStats() {
  const password = prompt("Enter reset password:");
  if (password !== "listen123") {
    alert("❌ Incorrect password. Stats not cleared.");
    return;
  }

  Object.keys(localStorage)
    .filter(k => k.startsWith("listening4_"))
    .forEach(k => localStorage.removeItem(k));

  // Also remove the cheat counter
  localStorage.removeItem("listening4_cheat");
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
const audio = document.getElementById("audio");
window.playClipTimer = null;
function playClip(startSec, endSec) {
  if (!audio) return;
  try {
    // clear previous timer
    if (window.playClipTimer) {
      clearInterval(window.playClipTimer);
      window.playClipTimer = null;
    }

    // clamp start
    if (typeof startSec === "number" && !isNaN(startSec)) {
      // ⏩ This sets where the audio should START
      // Change startSec when calling playClip()
      audio.currentTime = Math.max(0, startSec);
    }

    audio.play().catch(err => {
      console.warn("Audio play prevented:", err);
      alert("Click play on the audio controls to allow playback (browser autoplay policy).");
    });

    // poll to stop at endSec (allow a tiny leeway)
    if (typeof endSec === "number" && !isNaN(endSec) && endSec > 0) {
      window.playClipTimer = setInterval(() => {
        if (audio.currentTime >= (endSec - 0.15)) {
          audio.pause();
          clearInterval(window.playClipTimer);
          window.playClipTimer = null;
        }
      }, 1150);
    }
  } catch (err) {
    console.error("playClip error", err);
  }
}
// ---------- Expose checkAnswers & downloadPDF & resetStats to global (HTML buttons rely on these) ----------
window.checkAnswers = checkAnswers;
window.downloadPDF = downloadPDF;
window.resetStats = resetStats;
window.playClip = playClip;
