// script.js - Listening Practice (Section 1)
// Matches HTML inputs with ids q1..q10 and elements already in your page.

// ---------- Config: acceptable answers ----------
const acceptableAnswers = {
  q11: ["restaurant"],
  q12: ["homeless assistance"],
  q13: ["ten years" , "10 years"],
  q14: ["cuts"],
  q15: ["citizens"],
  q16: ["C"],
  q17: ["B"],
  q18: ["A"],
  q19: ["B"],
  q20: ["C"]
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
  let attempts = +localStorage.getItem("listening2_cheat") || 0;
  attempts++;
  localStorage.setItem("listening2_cheat", attempts);
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
  if (localStorage.getItem("listening2_submitted")) {
    handleAlreadySubmitted();
    return;
  }

  let correctCount = 0;
  const total = Object.keys(acceptableAnswers).length;

  for (let i = 11; i <= 20; i++) {
    const qid = "q" + i;

    const textInput = document.getElementById(qid);
    const radios = document.querySelectorAll(`input[name="${qid}"]`);

    let userRaw = "";

    // --- Get user answer correctly ---
    if (radios.length > 0) {
      const checked = document.querySelector(`input[name="${qid}"]:checked`);
      if (checked) userRaw = checked.value;
    } else if (textInput) {
      userRaw = textInput.value || "";
    }

    const user = normalize(userRaw);

    // Save
    localStorage.setItem("listening2_" + qid, userRaw);

    // Check correctness
    const acceptedList = acceptableAnswers[qid].map(normalize);
    const isCorrect = acceptedList.includes(user);

    // --- Feedback ---
    if (radios.length > 0) {
      // attach feedback to wrapper div
      createFeedback(radios[0].parentElement, userRaw ? isCorrect : false, userRaw ? null : "No answer");
      radios.forEach(r => r.disabled = true);
    } else if (textInput) {
      createFeedback(textInput, userRaw ? isCorrect : false, userRaw ? null : "No answer");
      textInput.disabled = true;
    }

    if (isCorrect) correctCount++;
  }


  const incorrect = total - correctCount;
  const resultText = `✅ Correct: ${correctCount} / ${total} — ❌ Wrong: ${incorrect}`;
  document.getElementById("resultBox").innerHTML = resultText;

  localStorage.setItem("listening2_result", resultText);
  localStorage.setItem("listening_submitted", "true");

  // show PDF button
  const downloadBtn = document.getElementById("downloadPdfBtn");
  if (downloadBtn) downloadBtn.style.display = "inline-block";
}

// ---------- Load saved answers on start ----------
window.addEventListener("load", () => {
  for (let i = 11; i <= 20; i++) {
    const qid = "q" + i;
    const inputEl = document.getElementById(qid);
    if (!inputEl) continue;

    const saved = localStorage.getItem("listening2_" + qid);
    if (saved !== null && saved !== undefined) {

      const radios = document.querySelectorAll(`input[name="${qid}"]`);

      if (radios.length > 0) {
        // Restore radio check
        radios.forEach(r => {
          if (r.value === saved) r.checked = true;
        });
      } else {
        // Restore text input
        inputEl.value = saved;
      }

      // If already submitted → show feedback immediately
      if (localStorage.getItem("listening2_submitted") === "true") {
        const norm = normalize(saved);
        const acceptedList = acceptableAnswers[qid].map(normalize);
        const isCorrect = acceptedList.includes(norm);

        if (radios.length > 0) {
          // attach feedback to the container of the radio group
          createFeedback(radios[0].parentElement, isCorrect);
          radios.forEach(r => r.disabled = true);
        } else {
          createFeedback(inputEl, isCorrect);
          inputEl.disabled = true;
        }
      }
    }
  }

  const savedResult = localStorage.getItem("listening2_result");
  if (savedResult) document.getElementById("resultBox").innerHTML = savedResult;

  if (localStorage.getItem("listening2_submitted") === "true") {
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
  for (let i = 11; i <= 20; i++) {
    const qid = "q" + i;
    const user = localStorage.getItem("listening2_" + qid) || "(no answer)";
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
  const result = localStorage.getItem("listening2_result") || "";
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
    .filter(k => k.startsWith("listening2_"))
    .forEach(k => localStorage.removeItem(k));

  // Also remove the cheat counter
  localStorage.removeItem("listening2_cheat");
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
      }, 300);
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
