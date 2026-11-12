        return shell("设置", `<h2 style="margin-top:.4rem">朗读</h2><p class="muted">现在用的声音：${voice ? esc(voice.name) : window.speechSynthesis ? "系统英语" : "这台设备不能朗读"}。念念会躲开夸张的卡通嗓音。</p><div style="display:grid;gap:.45rem">${rates.map(([id, label, hint]) => `<button class="choice" style="padding:.75rem 1rem;${P.rate === id ? "border-color:var(--clay);background:var(--clay-soft)" : ""}" data-act="rate" data-rate="${id}"><b>${label}</b><span class="muted">${hint}</span></button>`).join("")}</div><p class="muted">iPhone 想更自然：设置 → 辅助功能 → 朗读内容 → 声音，下载 English 的高级或增强语音。Safari 会用那个声音。</p><h2>默认词库</h2><p class="muted">首页的听写、填空和记忆，用这里打开的库。</p><div style="display:grid;gap:.45rem">${DATA.packs.map((pack) => `<button class="choice" style="padding:.75rem 1rem" data-act="toggle-pack" data-pack="${pack.id}"><b>${pack.title}${P.packs.includes(pack.id) ? " · 开" : " · 关"}</b><span class="muted">${pack.blurb}</span></button>`).join("")}</div><h2>字母积木</h2><button class="choice" style="padding:.75rem 1rem" data-act="assist"><b>${P.assist ? "拼写时先给字母" : "拼写时先不给字母"}</b><span class="muted">开了之后，听写和填空会先摆出打乱的字母。</span></button><h2>进度</h2><button class="quiet" data-act="reset">清空这台手机上的记录</button><p class="foot muted">记录只在这个浏览器里，换手机或清缓存会没掉。这是一份可以放进 GitHub 仓库的单页，不需要服务器。</p>`, "声音和词库");
      }

      function render() {
        if (S.name === "home") return viewHome();
        if (S.name === "lesson") return viewLesson();
        if (S.name === "letters") return viewLetters();
        if (S.name === "sounds") return viewSounds();
        if (S.name === "drill") return viewDrill();
        if (S.name === "memory") return viewMemory();
        if (S.name === "scenes") return viewScenes();
        if (S.name === "dict") return viewDict();
        if (S.name === "word") return viewWord();
        if (S.name === "settings") return viewSettings();
        return viewHome();
      }
      function paint(focusId) {
        app.innerHTML = render();
        const input = focusId ? document.getElementById(focusId) : null;
        if (input) {
          input.focus();
          const end = input.value.length;
          input.setSelectionRange?.(end, end);
        }
      }
      function back() {
        if (S.name === "word") return go("dict");
        if (S.name === "letters" && S.id) return go("letters", { id: "" });
        if (S.name === "sounds" && (S.id || S.pairs)) {
          S.pairs = null;
          return go("sounds", { id: "" });
        }
        if (S.name === "scenes" && S.id) return go("scenes", { id: "", scene: 0, scenePhase: "ask" });
        return go("home");
      }
      function answerValue() {
        return document.getElementById("answer")?.value || S.drill?.value || "";
      }
      function dealQuiz() {
        const answer = DATA.letters[Math.floor(Math.random() * DATA.letters.length)];
        const rest = seeded(DATA.letters.filter((letter) => letter.upper !== answer.upper), hash(String(Date.now()))).slice(0, 3);
        S.quiz = { phase: "ask", answer: answer.upper, options: seeded([answer, ...rest], hash(answer.upper + Date.now())), picked: "", round: (S.quiz?.round || 0) + 1, correct: S.quiz?.phase === "done" ? 0 : S.quiz?.correct || 0, asked: S.quiz?.phase === "done" ? 0 : S.quiz?.asked || 0 };
        if (S.quiz.phase === "ask" && S.quiz.round === 1) { /* keep */ }
        speak(answer.upper, RATE[P.rate]);
        paint();
      }

      app.addEventListener("click", (event) => {
        const node = event.target.closest("[data-act]");
        if (!node) return;
        const act = node.dataset.act;
        if (act === "back") return back();
        if (act === "nav") return go(node.dataset.name);
        if (act === "spell" || act === "sentence" || act === "cloze" || act === "zh2en") return openDrill(act, node.dataset.pack || "on", node.dataset.id);
        if (act === "memory") return openMemory(node.dataset.pack || "on", node.dataset.way || "enzh");
        if (act === "speak") {
          const word = BY.get(node.dataset.id);
          if (!word) return;
          return speak(node.dataset.kind === "example" ? word.example : node.dataset.kind === "word" ? word.en : [word.en, word.example]);
        }
        if (act === "speak-word") return speak(BY.get(node.dataset.id).en);
        if (act === "speak-aloud" || act === "spell-aloud") return spellAloud(BY.get(node.dataset.id).en);
        if (act === "spell-text" || act === "speak-text") return act === "spell-text" ? spellAloud(node.dataset.text) : speak(node.dataset.text);
        if (act === "speak-letter") {
          const letter = DATA.letters.find((item) => item.upper === node.dataset.letter);
          return speak([`The letter ${letter.upper}`, letter.example]);
        }
        if (act === "open-letter") return go("letters", { id: node.dataset.letter, letterTab: "learn" });
        if (act === "clear-id") {
          S.pairs = null;
          return go(S.name, { id: "", scene: 0 });
        }
        if (act === "letter-tab") {
          S.letterTab = node.dataset.tab;
          S.id = "";
          if (node.dataset.tab === "quiz" && !S.quiz) S.quiz = { phase: "idle", round: 0, correct: 0, asked: 0 };
          return paint();
        }
        if (act === "quiz-start") {
          S.quiz = { phase: "ask", round: 0, correct: 0, asked: 0, picked: "" };
          return dealQuiz();
        }
        if (act === "quiz-replay") return speak(S.quiz.answer);
        if (act === "quiz-pick") {
          if (S.quiz.picked) return;
          S.quiz.picked = node.dataset.letter;
          S.quiz.asked += 1;
          if (S.quiz.picked === S.quiz.answer) S.quiz.correct += 1;
          return paint();
        }
        if (act === "quiz-next") return dealQuiz();
        if (act === "quiz-done") {
          S.quiz.phase = "done";
          return paint();
        }
        if (act === "sound-group") {
          S.soundGroup = node.dataset.group;
          return paint();
        }
        if (act === "open-phoneme") return go("sounds", { id: node.dataset.id, pairs: null });
        if (act === "speak-examples") {
          const phoneme = DATA.phonemes.find((item) => item.id === S.id);
          return speak(phoneme.examples.map((item) => item.en));
        }
        if (act === "open-pairs") {
          S.pairs = { phase: "idle", step: 0, hits: 0 };
          S.id = "pairs";
          return paint();
        }
        if (act === "pair-start") {
          const side = Math.random() < 0.5 ? "a" : "b";
          S.pairs = { phase: "ask", step: 0, hits: 0, side, picked: "" };
          speak(DATA.pairs[0][side].en);
          return paint();
        }
        if (act === "pair-replay") return speak(DATA.pairs[S.pairs.step % DATA.pairs.length][S.pairs.side].en, RATE.slow);
        if (act === "pair-pick") {
          if (S.pairs.phase !== "ask") return;
          S.pairs.picked = node.dataset.side;
          S.pairs.phase = "show";
          if (S.pairs.picked === S.pairs.side) S.pairs.hits += 1;
          speak(DATA.pairs[S.pairs.step % DATA.pairs.length][node.dataset.side].en);
          return paint();
        }
        if (act === "pair-next") {
          if (S.pairs.step >= 7) {
            S.pairs.phase = "done";
            return paint();
          }
          const step = S.pairs.step + 1;
          const side = Math.random() < 0.5 ? "a" : "b";
          S.pairs = { ...S.pairs, phase: "ask", step, side, picked: "" };
          speak(DATA.pairs[step % DATA.pairs.length][side].en);
          return paint();
        }
        if (act === "show-zh") {
          S.drill.showZh = true;
          return paint("answer");
        }
        if (act === "show-tiles") {
          S.drill.tiles = true;
          return paint("answer");
        }
        if (act === "tile") {
          const item = S.drill.items[S.drill.index];
          const letter = letterTiles(item.answer)[Number(node.dataset.i)];
          S.drill.value += letter;
          return paint("answer");
        }
        if (act === "backspace") {
          S.drill.value = S.drill.value.slice(0, -1);
          return paint("answer");
        }
        if (act === "choice") {
          const item = S.drill.items[S.drill.index];
          return checkDrill(item.choices[Number(node.dataset.i)]);
        }
        if (act === "check") return checkDrill(answerValue());
        if (act === "speak-item") {
          const item = S.drill.items[S.drill.index];
          return speak(S.drill.mode === "sentence" ? item.example : item.en);
        }
        if (act === "drill-next") {
          const drill = S.drill;
          if (drill.index + 1 >= drill.items.length) {
            drill.done = true;
            return paint();
          }
          drill.index += 1;
          drill.phase = "ask";
          drill.value = "";
          drill.showZh = false;
          drill.tiles = P.assist && drill.mode !== "sentence";
          paint();
          if (drill.mode === "spell") speak(drill.items[drill.index].en);
          return;
        }
        if (act === "drill-again") return openDrill(S.drill.mode, S.drill.pack, S.drill.id);
        if (act === "lesson-next") {
          if (S.lessonPhase === "ask" && LESSON[S.lesson]?.kind !== "meet") return;
          S.lesson += 1;
          S.lessonPhase = "ask";
          S.draft = "";
          return paint();
        }
        if (act === "lesson-check") return checkLesson();
        if (act === "after-lesson") {
          P.lessonDone = true;
          save();
          return openDrill("spell", "starter");
        }
        if (act === "memory-open") {
          S.memory.open = true;
          return paint();
        }
        if (act === "memory-flip") {
          S.memory.way = S.memory.way === "enzh" ? "zhen" : "enzh";
          S.memory.open = false;
          return paint();
        }
        if (act === "listen") {
          const word = S.memory.list[S.memory.index];
          S.memory.listening = true;
          S.memory.heard = "";
          paint();
          if (stopListen) stopListen();
          stopListen = listenOnce((text) => { S.memory.heard = text; }, () => { S.memory.listening = false; stopListen = null; paint(); });
          return;
        }
        if (act === "memory-grade") {
          const word = S.memory.list[S.memory.index];
          gradeWord(word.id, node.dataset.grade);
          S.memory.index += 1;
          S.memory.open = false;
          S.memory.heard = "";
          return paint();
        }
        if (act === "open-scene") return go("scenes", { id: node.dataset.id, scene: 0, scenePhase: "ask" });
        if (act === "scene-check") return checkScene();
        if (act === "scene-next") {
          S.scene += 1;
          S.scenePhase = "ask";
          return paint();
        }
        if (act === "open-word") return go("word", { id: node.dataset.id });
        if (act === "rate") {
          P.rate = node.dataset.rate;
          save();
          speak("Good morning. This is my book.", RATE[P.rate]);
          return paint();
        }
        if (act === "toggle-pack") {
          const pack = node.dataset.pack;
          const next = P.packs.includes(pack) ? P.packs.filter((item) => item !== pack) : [...P.packs, pack];
          P.packs = next.length ? next : ["starter"];
          save();
          return paint();
        }
        if (act === "assist") {
          P.assist = !P.assist;
          save();
          return paint();
        }
        if (act === "reset") {
          if (!confirm("清空这台手机上的学习记录？词库还在。")) return;
          const packs = P.packs;
          const rate = P.rate;
          P = load();
          P.cards = {};
          P.streak = 0;
          P.lastDay = "";
          P.todayCount = 0;
          P.todayKey = "";
          P.lessonDone = false;
          P.packs = packs;
          P.rate = rate;
          localStorage.removeItem(STORE);
          save();
          return paint();
        }
      });
      app.addEventListener("submit", (event) => {
