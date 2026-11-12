        { kind: "fill", prompt: "Good ____.", zh: "早上好。", answer: "morning", id: "morning" },
        { kind: "fill", prompt: "____, my friend.", zh: "嗨，我的朋友。", answer: "Hi", id: "hi" },
        { kind: "fill", prompt: "This is ____ book.", zh: "这是我的书。", answer: "my", id: "my" },
        { kind: "fill", prompt: "Have a ____ day.", zh: "祝你有美好的一天。", answer: "good", id: "good" },
      ];

      function go(name, extra = {}) {
        stopSpeaking();
        if (stopListen) stopListen();
        stopListen = null;
        Object.assign(S, { name, lessonPhase: "ask", scenePhase: "ask", draft: "" }, extra);
        if (name !== "drill") S.drill = name === "drill" ? S.drill : null;
        paint();
      }
      function openDrill(mode, pack, id) {
        const only = id ? BY.get(id) : null;
        const items = buildDrill(mode, poolOf(pack), only);
        S.drill = { mode, pack, id: id || "", items, index: 0, phase: "ask", value: "", showZh: false, tiles: P.assist && mode !== "sentence", hits: 0, done: false };
        go("drill", { mode, pack, id: id || "" });
      }
      function openMemory(pack, way) {
        const pool = poolOf(pack);
        const now = Date.now();
        const due = pool.filter((word) => P.cards[word.id] && P.cards[word.id].due <= now).sort((a, b) => P.cards[a.id].due - P.cards[b.id].due);
        const fresh = pool.filter((word) => !P.cards[word.id]).sort((a, b) => a.en.length - b.en.length || a.en.localeCompare(b.en));
        S.memory = { pack, way, list: [...due, ...fresh.slice(0, 6)].slice(0, 12), index: 0, open: false, heard: "", listening: false };
        go("memory", { pack, way });
      }

      function shell(title, body, kicker) {
        return `<div class="page"><header class="top"><button class="icon" data-act="back" aria-label="返回">‹</button><div class="top-title">${kicker ? `<p class="kicker">${esc(kicker)}</p>` : ""}<h1>${esc(title)}</h1></div><span id="slot"></span></header>${body}</div>`;
      }
      function meter(value, max) {
        return `<div class="meter" aria-hidden="true"><i style="width:${Math.max(0, Math.min(100, (value / max) * 100))}%"></i></div>`;
      }
      function primary(act, label, extra = "") {
        return `<button class="primary" data-act="${act}" ${extra}>${label}</button>`;
      }

      function viewHome() {
        const day = localDay();
        const practiced = P.todayKey === day ? P.todayCount : 0;
        const knownCount = WORDS.filter((word) => known(P.cards[word.id])).length;
        const due = poolOf("on").filter((word) => P.cards[word.id] && P.cards[word.id].due <= Date.now()).length;
        const starter = WORDS.filter((word) => word.pack === "starter");
        const daily = starter[Math.floor(Date.now() / 86400000) % starter.length];
        const paths = [
          ["01", "四个老朋友", "先把 hi、morning、good、my 串起来", "lesson"],
          ["02", "字母怎么读", "点一下，听名字和例词", "letters"],
          ["03", "音标与口型", "听得清 sheep 和 ship", "sounds"],
          ["04", "听写拼写", "只听声音，把词写出来", "spell"],
          ["05", "短句填空", "一句很短的话，补上那个词", "sentence"],
          ["06", "单词填空", "看着残缺的字母，把词补全", "cloze"],
          ["07", "看中文写英文", "给出意思，打出对应的词", "zh2en"],
          ["08", "间隔记住", "会的晚一点再出现，忘的马上回来", "memory"],
          ["09", "场景串词", "把几个词放进同一件小事", "scenes"],
        ];
        return `<div class="page">
          <header class="top"><div><p class="kicker">慢慢学英语</p><h1 class="brand">念念</h1></div><button class="icon" data-act="nav" data-name="settings" aria-label="设置">⚙</button></header>
          <p class="muted">从你会的 hi、morning、good、my 旁边，一次只加一点点。</p>
          <div class="stats">
            <div class="stat"><span class="muted">连续</span><b>${P.streak > 0 ? `${P.streak} 天` : "0 天"}</b></div>
            <div class="stat"><span class="muted">熟悉</span><b>${knownCount}</b></div>
            <div class="stat"><span class="muted">今日</span><b>${practiced}</b></div>
          </div>
          <button class="hero" data-act="${P.lessonDone ? "memory" : "nav"}" data-name="lesson" data-pack="on" data-way="enzh">
            <p>${due > 0 ? `有 ${due} 个词该见面了` : "今天的词"}</p>
            <p class="display">${P.lessonDone ? (due > 0 ? "去复习会忘的" : esc(daily.en)) : "先上第一课"}</p>
            <p class="sub">${P.lessonDone ? (due > 0 ? "忘得快的词会很快再出现。记得住的，过几天才回来。" : `${esc(daily.zh)} · ${esc(daily.ipa)}`) : "四个你已经会读的词，听一遍，写一遍，放进一句话里。"}</p>
          </button>
          <h2>练习</h2>
          <ol class="list">${paths.map(([n, title, desc, key]) => `<li><button class="row" data-act="${key === "memory" || ["spell", "sentence", "cloze", "zh2en"].includes(key) ? key : "nav"}" data-name="${esc(key)}" data-mode="${esc(key)}" data-pack="on" data-way="enzh"><span class="num">${n}</span><span class="grow"><b>${title}</b><span class="muted">${desc}</span></span></button></li>`).join("")}</ol>
          <div class="top" style="margin-top:1.6rem"><h2 style="margin:0">词库</h2><button class="pill" data-act="nav" data-name="dict">查全部 ${WORDS.length}</button></div>
          <div class="grid2" style="margin-top:.7rem">${DATA.packs.map((pack) => `<button class="pack" data-act="spell" data-pack="${pack.id}"><span class="muted">${countPack(pack.id)} 词</span><b>${pack.title}</b><span class="muted">${pack.blurb}</span></button>`).join("")}</div>
          <p class="foot muted">进度记在这台手机的浏览器里。朗读用系统里最像真人的英语声音。放到 GitHub 上用 https 打开，Safari 才能稳定出声。</p>
        </div>`;
      }

      function viewLesson() {
        const step = LESSON[S.lesson];
        if (!step) {
          return shell("第一课", `<p class="word">四个词接上了。</p><p class="muted">hi、morning、good、my 可以单独读，也可以放进句子。接下来去词库里挑新的。</p><div class="actions" style="display:grid">${primary("after-lesson", "听写几个入门词")}<button class="quiet" data-act="nav" data-name="home">回首页</button></div>`, "四个老朋友");
        }
        const word = BY.get(step.id);
        const body = step.kind === "meet" ? `
          <div class="top"><h2 class="${wordSize(word.en)}" style="margin:0">${esc(word.en)}</h2><button class="pill" data-act="speak" data-id="${word.id}" data-kind="both">朗读</button></div>
          <p class="ipa">${esc(word.ipa)}</p><p style="font-size:1.45rem;margin:.2rem 0">${esc(word.zh)}</p>
          <p class="display" style="font-size:1.55rem">${esc(word.example)}</p><p class="muted">${esc(word.exampleZh)}</p>
          <p class="hook">${esc(word.mnemonic)}</p>
          <button class="pill" data-act="spell-aloud" data-id="${word.id}">拆开，一个字母一个字母读</button>
          <div style="margin-top:1rem">${primary("lesson-next", "我会读了，去写")}</div>` : `
          <p class="word">${step.kind === "spell" ? "听，然后写。" : esc(step.prompt)}</p>
          <p class="muted">${step.kind === "spell" ? esc(word.zh) : esc(step.zh)}</p>
          <div class="actions"><button class="pill" data-act="speak" data-id="${word.id}" data-kind="${step.kind === "fill" ? "example" : "word"}">${step.kind === "fill" ? "听整句" : "听这个词"}</button></div>
          <form data-act="lesson-check" style="margin-top:.8rem"><label class="sr" for="answer">答案</label>
          <input id="answer" type="text" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="done" placeholder="在这里输入英文" value="${esc(S.draft || "")}" />
          </form>
          ${S.lessonPhase === "ask" ? `<div style="margin-top:.8rem">${primary("lesson-check", "检查")}</div>` : `<div class="feedback ${S.lessonPhase}"><p><b>${S.lessonPhase === "ok" ? "对了" : "先记住这个"}</b></p><p class="${wordSize(word.en)}">${esc(word.en)}</p><p class="hook">${esc(word.mnemonic)}</p><div style="margin-top:.8rem">${primary("lesson-next", "继续")}</div></div>`}`;
        return shell("第一课", `${meter(S.lesson, LESSON.length)}<p class="muted">${S.lesson + 1} / ${LESSON.length}</p>${body}`, "四个老朋友");
      }

      function viewLetters() {
        if (S.letterTab === "quiz") return shell("字母", viewLetterQuiz(), "听字母名");
        if (S.id) {
          const letter = DATA.letters.find((item) => item.upper === S.id);
          return shell(letter.upper, `<p class="kicker">${esc(letter.nameZh)} · ${esc(letter.sound)}</p><p class="word">${esc(letter.upper)} ${esc(letter.lower)}</p><p>${esc(letter.tip)}</p><p class="display" style="font-size:2rem">${esc(letter.example)}</p><p class="muted">${esc(letter.exampleZh)}</p><div class="actions"><button class="pill" data-act="speak-letter" data-letter="${letter.upper}">听字母和例词</button><button class="pill" data-act="spell-text" data-text="${esc(letter.example)}">拆开例词</button></div><div style="margin-top:1rem"><button class="quiet" data-act="clear-id">返回字母表</button></div>`);
        }
        return shell("字母", `<div class="seg"><button class="on" data-act="letter-tab" data-tab="learn">认识</button><button data-act="letter-tab" data-tab="quiz">听写</button></div><div class="letters">${DATA.letters.map((letter) => `<button class="letter" data-act="open-letter" data-letter="${letter.upper}">${letter.upper}<span class="sr">${esc(letter.nameZh)}</span></button>`).join("")}</div><p class="foot muted">点一个字母。第一次出声要你亲手点，这是手机 Safari 的规矩。</p>`);
      }
      function viewLetterQuiz() {
        const quiz = S.quiz;
        if (!quiz || quiz.phase === "idle") {
          return `<div class="seg"><button data-act="letter-tab" data-tab="learn">认识</button><button class="on" data-act="letter-tab" data-tab="quiz">听写</button></div><p class="word">听字母名，点出来。</p><p class="muted">一共 8 题。点开始之后才会出声。</p>${primary("quiz-start", "开始听")}`;
        }
        if (quiz.phase === "done") {
          return `<p class="muted">听音结果</p><p class="word">${quiz.correct}<span class="muted"> / ${quiz.asked}</span></p>${primary("quiz-start", "再听一组")}`;
        }
        return `<div class="seg"><button data-act="letter-tab" data-tab="learn">认识</button><button class="on">听写</button></div>${meter(quiz.round - (quiz.picked ? 0 : 1), 8)}<div class="top"><div><p class="muted">第 ${quiz.round} / 8 题</p><p class="display" style="font-size:1.8rem;margin:.2rem 0">哪个字母？</p></div><button class="pill" data-act="quiz-replay">再听字母</button></div><div class="grid2" style="margin-top:1rem">${quiz.options.map((letter) => {
          const show = quiz.picked;
          const right = letter.upper === quiz.answer;
          const style = !show ? "" : right ? "border-color:var(--good);background:var(--good-soft)" : letter.upper === quiz.picked ? "border-color:var(--bad);background:var(--bad-soft)" : "";
          return `<button class="letter" style="${style}" data-act="quiz-pick" data-letter="${letter.upper}" ${show ? "disabled" : ""}>${letter.upper}</button>`;
        }).join("")}</div>${quiz.picked ? `<p>${esc(DATA.letters.find((item) => item.upper === quiz.answer).tip)}</p>${quiz.round >= 8 ? primary("quiz-done", "看结果") : primary("quiz-next", "下一题")}` : ""}`;
      }

      function viewSounds() {
        if (S.id === "pairs" || S.pairs) return shell("辨音", viewPairs(), "容易混的一对");
        if (S.id) {
          const phoneme = DATA.phonemes.find((item) => item.id === S.id);
          return shell(phoneme.symbol, `<p class="kicker">${esc(phoneme.title)}</p><p class="word ipa">${esc(phoneme.symbol)}</p><p><b>口型。</b> ${esc(phoneme.mouth)}</p><p class="muted">${esc(phoneme.tip)}</p>${phoneme.examples.map((item) => `<button class="row" data-act="speak-text" data-text="${esc(item.en)}"><span class="grow"><b>${esc(item.en)}</b><span class="muted">${esc(item.zh)}</span></span></button>`).join("")}<div style="margin-top:.8rem">${primary("speak-examples", "连着读例词")}</div><button class="quiet" data-act="clear-id">返回音标</button>`);
        }
