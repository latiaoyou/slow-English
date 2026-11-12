        event.preventDefault();
        const act = event.target.dataset.act;
        if (act === "check" || event.target.querySelector("#answer") && S.name === "drill") checkDrill(answerValue());
        if (act === "lesson-check") checkLesson();
        if (act === "scene-check") checkScene();
      });
      app.addEventListener("input", (event) => {
        if (event.target.id === "answer") {
          S.draft = event.target.value;
          if (S.drill && S.name === "drill") S.drill.value = event.target.value;
        }
        if (event.target.id === "q") {
          S.query = event.target.value;
          const list = document.getElementById("dict-list");
          if (list) list.innerHTML = dictRows();
        }
      });
      function checkDrill(text) {
        const drill = S.drill;
        const item = drill.items[drill.index];
        if (!item || drill.phase !== "ask" || !String(text).trim()) return;
        const ok = answersMatch(text, item.answer);
        drill.phase = ok ? "ok" : "bad";
        drill.value = text;
        if (ok) drill.hits += 1;
        gradeWord(item.wordId, ok ? "good" : "again");
        speak(ok ? [item.en, item.example] : item.en);
        paint();
      }
      function checkLesson() {
        const step = LESSON[S.lesson];
        if (!step || step.kind === "meet" || S.lessonPhase !== "ask") return;
        const value = answerValue();
        if (!value.trim()) return;
        const expect = step.kind === "spell" ? BY.get(step.id).en : step.answer;
        S.lessonPhase = answersMatch(value, expect) ? "ok" : "bad";
        if (S.lessonPhase === "ok") gradeWord(step.id, "good");
        speak(BY.get(step.id).en);
        paint();
      }
      function checkScene() {
        const scene = DATA.scenes.find((item) => item.id === S.id);
        const line = scene?.lines[S.scene];
        if (!line || S.scenePhase !== "ask") return;
        const value = answerValue();
        if (!value.trim()) return;
        S.scenePhase = answersMatch(value, line.answer) ? "ok" : "bad";
        if (S.scenePhase === "ok") gradeWord(line.wordId, "good");
        speak(line.answer);
        paint();
      }

      if (window.speechSynthesis) {
        speechSynthesis.addEventListener("voiceschanged", () => {
          if (S.name === "settings") paint();
        });
      }
      loadPack().catch(() => { app.textContent = "词库没打开。请用网页地址，不要直接点开文件。"; });
    