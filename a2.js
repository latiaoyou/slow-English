        return shell("音标", `<p class="muted">先看口型，再听例词。下面专门练中文里容易糊在一起的几对。</p><div class="seg">${DATA.groups.map((group) => `<button class="${S.soundGroup === group.id ? "on" : ""}" data-act="sound-group" data-group="${group.id}">${group.label}</button>`).join("")}</div><div class="letters">${DATA.phonemes.filter((item) => item.group === S.soundGroup).map((item) => `<button class="phon" data-act="open-phoneme" data-id="${item.id}"><b>${esc(item.symbol)}</b><span class="muted">${esc(item.title)}</span></button>`).join("")}</div>${primary("open-pairs", "听一对，选出是哪一个")}`, "口型、例词、耳朵");
      }
      function viewPairs() {
        const drill = S.pairs;
        if (!drill || drill.phase === "idle") return `<p class="word">听一个词，选出是哪一个。</p><p class="muted">专门练长短音、咬舌、r 和 l。</p>${primary("pair-start", "开始辨音")}`;
        if (drill.phase === "done") return `<p class="word">${drill.hits}<span class="muted"> / 8</span></p><p class="muted">听不清就回音标页看口型，然后慢一点重听。</p>${primary("pair-start", "再练一组")}`;
        const pair = DATA.pairs[drill.step % DATA.pairs.length];
        return `${meter(drill.step + (drill.phase === "show" ? 1 : 0), 8)}<div class="top"><p class="display" style="font-size:1.7rem">你听到的是？</p><button class="pill" data-act="pair-replay">慢一点再听</button></div><div style="display:grid;gap:.6rem;margin-top:1rem">${["a", "b"].map((key) => {
          const item = pair[key];
          const show = drill.phase === "show";
          const right = key === drill.side;
          const style = !show ? "" : right ? "border-color:var(--good);background:var(--good-soft)" : key === drill.picked ? "border-color:var(--bad);background:var(--bad-soft)" : "";
          return `<button class="pair" style="padding:1rem;${style}" data-act="pair-pick" data-side="${key}" ${show ? "disabled" : ""}><b class="display" style="font-size:1.8rem">${esc(item.en)}</b><span class="muted">${esc(item.zh)} · /${esc(item.ipa)}/</span></button>`;
        }).join("")}</div>${drill.phase === "show" ? `<p>${esc(pair.tip)}</p>${primary("pair-next", drill.step >= 7 ? "看结果" : "下一对")}` : ""}`;
      }

      const TITLES = { spell: ["拼写", "只听，不看词"], sentence: ["短句", "补上空出来的词"], cloze: ["填空", "把缺的字母补上"], zh2en: ["中译英", "看意思，写英文"] };
      function viewDrill() {
        const drill = S.drill;
        const [title, kicker] = TITLES[drill.mode];
        if (!drill.items.length) return shell(title, `<p class="word sm">这个词库是空的。</p><p class="muted">到设置里打开至少一个词库。</p>`, kicker);
        if (drill.done) return shell("这一组", `<p class="muted">写对了</p><p class="word">${drill.hits}<span class="muted"> / ${drill.items.length}</span></p><p class="muted">写错的词十分钟后会再出现。写对的，明天或更晚才见面。</p><div style="margin-top:1rem">${primary("drill-again", "再来一组")}<button class="quiet" data-act="nav" data-name="home">先回到首页</button></div>`);
        const item = drill.items[drill.index];
        const reveal = drill.phase !== "ask";
        const prompt = drill.mode === "spell" ? `<p class="word sm">听，然后写。</p><p class="muted">${drill.showZh || reveal ? esc(item.hint) : "需要的话再看中文"}</p>` : `<p class="${wordSize(item.prompt)}">${esc(item.prompt)}</p><p class="muted">${esc(item.hint)}</p>`;
        const listen = `<button class="pill" data-act="speak-item">${drill.mode === "sentence" ? "听整句" : "朗读单词"}</button>`;
        let entry = "";
        if (drill.mode === "sentence") {
          entry = `<div style="display:grid;gap:.5rem;margin-top:.8rem">${item.choices.map((choice, index) => `<button class="choice" style="padding:.85rem 1rem;font-weight:700" data-act="choice" data-i="${index}" ${reveal ? "disabled" : ""}>${esc(choice)}</button>`).join("")}</div>`;
        } else {
          entry = `<form data-act="check" style="margin-top:.8rem"><label class="sr" for="answer">答案</label><input id="answer" type="text" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="done" placeholder="${drill.mode === "cloze" ? "补全这个词" : "在这里输入英文"}" value="${esc(drill.value)}" ${reveal ? "disabled" : ""} /></form>`;
          if (drill.tiles && !reveal) {
            entry += `<div class="tiles">${letterTiles(item.answer).map((letter, index) => `<button class="tile" data-act="tile" data-i="${index}">${esc(letter)}</button>`).join("")}<button class="tile" style="width:auto;padding:0 .8rem;font-family:var(--sans);font-size:.95rem" data-act="backspace">删一字</button></div>`;
          }
          if (!reveal) {
            entry += `<div class="actions">${drill.mode === "spell" && !drill.showZh ? `<button class="pill" data-act="show-zh">看中文</button>` : ""}${!drill.tiles ? `<button class="pill" data-act="show-tiles">字母积木</button>` : ""}</div><div style="margin-top:.8rem">${primary("check", "检查")}</div>`;
          }
        }
        const feedback = reveal ? `<div class="feedback ${drill.phase}"><p><b>${drill.phase === "ok" ? "对了" : "先记住这个"}</b></p><p class="${wordSize(item.en)}">${esc(item.en)}</p><p class="ipa">${esc(item.ipa)}</p><p>${esc(item.zh)}</p><p>${esc(item.example)}</p><p class="muted">${esc(item.exampleZh)}</p><p class="hook">${esc(item.mnemonic)}</p><div class="actions"><button class="pill" data-act="speak-word" data-id="${item.wordId}">再听单词</button><button class="pill" data-act="spell-aloud" data-id="${item.wordId}">拆开读</button></div><div style="margin-top:.7rem">${primary("drill-next", drill.index + 1 >= drill.items.length ? "看这一组" : "下一题")}</div></div>` : "";
        return shell(title, `${meter(drill.index + (reveal ? 1 : 0), drill.items.length)}<p class="muted">${drill.index + 1} / ${drill.items.length}</p><div class="top">${prompt}<div>${drill.mode === "zh2en" && !reveal ? "" : listen}</div></div>${entry}${feedback}`, kicker);
      }

      function viewMemory() {
        const memory = S.memory;
        const word = memory.list[memory.index];
        if (!word) {
          const upcoming = poolOf(memory.pack).map((item) => P.cards[item.id]).filter(Boolean).sort((a, b) => a.due - b.due)[0];
          const hours = upcoming ? Math.max(1, Math.round((upcoming.due - Date.now()) / 3600000)) : null;
          return shell("记住", `<p class="word sm">这批词先歇着。</p><p class="muted">${hours ? `下一张大约 ${hours} 小时后再出现。` : "打开更多词库，就会有新词。"}忘得快的会早点回来，记得住的会隔得更久。</p><button class="quiet" data-act="nav" data-name="home">回首页</button>`, memory.way === "zhen" ? "看中文，想英文" : "看英文，想意思");
        }
        const frontZh = memory.way === "zhen";
        const card = P.cards[word.id];
        const face = memory.open ? `<p class="${wordSize(frontZh ? word.en : word.zh)}">${esc(frontZh ? word.en : word.zh)}</p><p class="ipa">${esc(word.ipa)}</p><p>${esc(word.example)}</p><p class="muted">${esc(word.exampleZh)}</p><p class="hook">${esc(word.mnemonic)}</p>` : `<p class="${wordSize(frontZh ? word.zh : word.en)}">${esc(frontZh ? word.zh : word.en)}</p>${frontZh ? "" : `<p class="ipa">${esc(word.ipa)}</p>`}<div style="margin-top:1rem">${primary("memory-open", "翻开")}</div>`;
        return shell("记住", `${meter(memory.index, memory.list.length)}<div class="top"><p class="muted">${memory.index + 1} / ${memory.list.length}${card ? ` · 见过 ${card.reps} 次` : " · 新词"}</p><button class="pill" data-act="memory-flip">换一面</button></div><article class="card" style="margin-top:.8rem">${face}<div class="actions"><button class="pill" data-act="speak-word" data-id="${word.id}">朗读</button><button class="pill" data-act="spell-aloud" data-id="${word.id}">拆开读</button><button class="pill" data-act="listen">跟读</button></div>${memory.heard ? `<p class="muted">听到：${esc(memory.heard)}${saidWord(memory.heard, word.en) ? " · 像是读对了" : ""}</p>` : ""}${memory.listening ? `<p class="muted">在听…请说这个英文词</p>` : ""}</article>${memory.open ? `<div class="grades"><button class="grade" data-act="memory-grade" data-grade="again">忘了</button><button class="grade" data-act="memory-grade" data-grade="hard">模糊</button><button class="grade" data-act="memory-grade" data-grade="good">记得</button></div>` : ""}`, frontZh ? "看中文，想英文" : "看英文，想意思");
      }

      function viewScenes() {
        if (!S.id) {
          return shell("场景", `<p class="muted">同一件小事里连续填几个词，比单背单词记得住。</p>${DATA.scenes.map((scene) => `<button class="row" data-act="open-scene" data-id="${scene.id}"><span class="grow"><b>${esc(scene.title)}</b><span class="muted">${esc(scene.intro)}</span></span></button>`).join("")}`);
        }
        const scene = DATA.scenes.find((item) => item.id === S.id);
        const line = scene.lines[S.scene];
        if (!line) return shell(scene.title, `<p class="word sm">这段接上了。</p><p class="muted">${esc(scene.intro)}</p><button class="quiet" data-act="clear-id">看别的场景</button>`);
        const reveal = S.scenePhase !== "ask";
        return shell(scene.title, `${meter(S.scene + (reveal ? 1 : 0), scene.lines.length)}<p class="muted">${esc(scene.intro)}</p><p class="${wordSize(line.prompt)}">${esc(line.prompt)}</p><p class="muted">${esc(line.zh)}</p><form data-act="scene-check"><label class="sr" for="answer">答案</label><input id="answer" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="填入英文" value="" ${reveal ? "disabled" : ""} /></form>${reveal ? "" : `<div style="margin-top:.8rem">${primary("scene-check", "检查")}</div>`}${reveal ? `<div class="feedback ${S.scenePhase}"><p><b>${S.scenePhase === "ok" ? "对了" : "先记住这个"}</b></p><p class="${wordSize(line.answer)}">${esc(line.answer)}</p><p class="hook">${esc(BY.get(line.wordId)?.mnemonic || "")}</p><div class="actions"><button class="pill" data-act="speak-text" data-text="${esc(line.answer)}">朗读</button></div><div style="margin-top:.7rem">${primary("scene-next", S.scene + 1 >= scene.lines.length ? "完成" : "下一句")}</div></div>` : ""}`, "短句填空");
      }

      function dictRows() {
        const q = S.query.trim().toLowerCase();
        const list = WORDS.filter((word) => !q || `${word.en} ${word.zh} ${word.ipa} ${word.pos}`.toLowerCase().includes(q)).slice(0, 80);
        if (!list.length) return `<p class="muted">没有找到。换一个中文或英文试试。</p>`;
        return list.map((word) => `<button class="row" data-act="open-word" data-id="${word.id}"><span class="grow"><b>${esc(word.en)}</b><span class="muted">${esc(word.zh)} · ${esc(word.ipa)}</span></span></button>`).join("");
      }
      function viewDict() {
        return shell("单词本", `<form><label class="sr" for="q">搜索</label><input id="q" type="search" placeholder="搜英文、中文或音标" value="${esc(S.query)}" enterkeyhint="search" /></form><div id="dict-list">${dictRows()}</div>`);
      }
      function viewWord() {
        const word = BY.get(S.id);
        if (!word) return shell("单词", `<p>这个词不在词库里。</p>`);
        return shell(word.en, `<p class="ipa">${esc(word.ipa)} · ${esc(word.pos)}</p><p style="font-size:1.4rem">${esc(word.zh)}</p><p class="display" style="font-size:1.6rem">${esc(word.example)}</p><p class="muted">${esc(word.exampleZh)}</p><p class="hook">${esc(word.mnemonic)}</p><div class="actions"><button class="pill" data-act="speak" data-id="${word.id}" data-kind="both">朗读单词和句子</button><button class="pill" data-act="spell-aloud" data-id="${word.id}">拆开读</button></div><div style="display:grid;gap:.5rem;margin-top:1rem"><button class="choice" style="padding:.8rem 1rem" data-act="spell" data-pack="${word.pack}" data-id="${word.id}">听写这个词</button><button class="choice" style="padding:.8rem 1rem" data-act="cloze" data-pack="${word.pack}" data-id="${word.id}">填这个词</button><button class="choice" style="padding:.8rem 1rem" data-act="zh2en" data-pack="${word.pack}" data-id="${word.id}">看中文写它</button></div>`);
      }
      function viewSettings() {
        const voice = bestVoice();
        const rates = [["natural", "自然", "接近平时说话"], ["clear", "清楚", "稍慢，仍然像人"], ["slow", "慢速", "一个音一个音"]];
