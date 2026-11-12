
      let DATA = null;
      let WORDS = [];
      let BY = new Map();
      async function loadPack() {
        const words = [];
        for (let i = 0; i < 6; i += 1) {
          const response = await fetch("w" + i + ".json");
          if (!response.ok) throw new Error("w" + i);
          words.push(...(await response.json()));
        }
        const meta = await fetch("meta.json");
        if (!meta.ok) throw new Error("meta");
        DATA = await meta.json();
        DATA.words = words;
        WORDS = words;
        BY = new Map(words.map((word) => [word.id, word]));
        paint();
      }
      const RATE = { slow: 0.8, natural: 0.94, clear: 0.86 };
      const STORE = "niannian-html-v1";
      const app = document.getElementById("app");

      const S = {
        name: "home",
        pack: "on",
        mode: "spell",
        way: "enzh",
        id: "",
        query: "",
        letterTab: "learn",
        soundGroup: "vowel",
        lesson: 0,
        lessonPhase: "ask",
        drill: null,
        memory: null,
        scene: 0,
        scenePhase: "ask",
        draft: "",
        pairs: null,
      };

      function load() {
        try {
          const saved = JSON.parse(localStorage.getItem(STORE) || "null");
          if (saved && saved.cards) return saved;
        } catch { /* empty store */ }
        return {
          cards: {},
          streak: 0,
          lastDay: "",
          todayCount: 0,
          todayKey: "",
          packs: ["starter"],
          rate: "natural",
          assist: false,
          lessonDone: false,
        };
      }
      let P = load();
      function save() {
        localStorage.setItem(STORE, JSON.stringify(P));
      }
      function localDay(ts = Date.now()) {
        const date = new Date(ts);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      }
      function esc(value) {
        return String(value)
          .replace(/&/g, "\u0026amp;")
          .replace(/</g, "\u0026lt;")
          .replace(/>/g, "\u0026gt;")
          .replace(/"/g, "\u0026quot;");
      }
      function hash(text) {
        let value = 2166136261;
        for (const char of text) {
          value ^= char.charCodeAt(0);
          value = Math.imul(value, 16777619);
        }
        return value >>> 0;
      }
      function seeded(list, seed) {
        const copy = [...list];
        let state = seed || 1;
        for (let index = copy.length - 1; index > 0; index -= 1) {
          state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
          const swap = state % (index + 1);
          const current = copy[index];
          copy[index] = copy[swap];
          copy[swap] = current;
        }
        return copy;
      }
      function compact(value) {
        return value.trim().toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9']/g, "");
      }
      function answersMatch(input, answer) {
        return compact(input) === compact(answer);
      }
      function saidWord(heard, answer) {
        const target = compact(answer);
        return heard
          .toLowerCase()
          .replace(/[^a-z0-9' ]/g, " ")
          .split(/\s+/)
          .filter(Boolean)
          .map(compact)
          .some((token) => token === target);
      }
      function review(prev, grade, now) {
        const card = prev || { ease: 2.5, interval: 0, due: now, reps: 0, lapses: 0, correct: 0, attempts: 0 };
        const attempts = card.attempts + 1;
        const DAY = 86400000;
        if (grade === "again") {
          return { ease: Math.max(1.3, card.ease - 0.2), interval: 0, due: now + 600000, reps: 0, lapses: card.lapses + 1, correct: card.correct, attempts };
        }
        if (grade === "hard") {
          const interval = card.reps === 0 ? 0.4 : Math.max(0.8, card.interval * 1.2);
          return { ease: Math.max(1.3, card.ease - 0.05), interval, due: now + interval * DAY, reps: card.reps + 1, lapses: card.lapses, correct: card.correct + 1, attempts };
        }
        let interval = 1;
        if (card.reps === 1) interval = 3;
        else if (card.reps > 1) interval = Math.max(card.interval * card.ease, card.interval + 1);
        return { ease: Math.min(3, card.ease + 0.04), interval, due: now + interval * DAY, reps: card.reps + 1, lapses: card.lapses, correct: card.correct + 1, attempts };
      }
      function gradeWord(id, grade) {
        const now = Date.now();
        const day = localDay(now);
        let streak = P.streak;
        let lastDay = P.lastDay;
        let todayCount = P.todayKey === day ? P.todayCount : 0;
        if (lastDay !== day) {
          streak = lastDay === localDay(now - 86400000) ? streak + 1 : 1;
          lastDay = day;
        }
        P = { ...P, cards: { ...P.cards, [id]: review(P.cards[id], grade, now) }, streak, lastDay, todayCount: todayCount + 1, todayKey: day };
        save();
      }
      function known(card) {
        return !!card && card.reps >= 2 && card.interval >= 1;
      }
      function matchesPack(word, pack) {
        return word.pack === pack || word.tags.includes(pack);
      }
      function poolOf(pack) {
        const packs = pack === "on" ? P.packs : [pack];
        return WORDS.filter((word) => packs.some((item) => matchesPack(word, item)));
      }
      function countPack(pack) {
        return WORDS.filter((word) => matchesPack(word, pack)).length;
      }
      function wordSize(text) {
        return String(text).length > 12 ? "word sm" : "word";
      }

      const NOISY = /albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|hysterical|junior|pipe organ|trinoids|whisper|zarvox|superstar|wobble|good news|rocko|grandma|grandpa|eddy|flo|reed|sandy|shelley|organ/i;
      function bestVoice() {
        if (!window.speechSynthesis) return null;
        const english = speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith("en"));
        return english.sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] || null;
      }
      function scoreVoice(voice) {
        const name = voice.name.toLowerCase();
        let score = 0;
        if (/samantha|karen|moira|ava|allison|serena|jenny|aria|sonia|libby|natasha|daniel|kathy|victoria/.test(name)) score += 60;
        if (/natural|premium|enhanced|neural/.test(name)) score += 45;
        if (voice.lang === "en-US") score += 12;
        else if (voice.lang.toLowerCase().startsWith("en")) score += 6;
        if (/compact|espeak|android/.test(name)) score -= 25;
        if (NOISY.test(name)) score -= 80;
        if (voice.localService) score += 4;
        return score;
      }
      let token = 0;
      let resumeTimer;
      function stopSpeaking() {
        token += 1;
        clearInterval(resumeTimer);
        speechSynthesis?.cancel();
      }
      function speak(parts, rate = RATE[P.rate]) {
        if (!window.speechSynthesis) return;
        const list = (Array.isArray(parts) ? parts : [parts]).map((part) => String(part).trim()).filter(Boolean);
        if (!list.length) return;
        const mine = ++token;
        speechSynthesis.cancel();
        const voice = bestVoice();
        let index = 0;
        const pump = () => {
          if (mine !== token || index >= list.length) return;
          const utterance = new SpeechSynthesisUtterance(list[index]);
          index += 1;
          utterance.lang = voice?.lang || "en-US";
          utterance.rate = rate;
          utterance.pitch = 1;
          if (voice) utterance.voice = voice;
          utterance.onend = () => setTimeout(pump, 160);
          speechSynthesis.speak(utterance);
        };
        setTimeout(pump, 40);
        clearInterval(resumeTimer);
        resumeTimer = setInterval(() => {
          if (mine !== token || !speechSynthesis.speaking) return;
          speechSynthesis.resume();
        }, 4000);
      }
      function spellAloud(word) {
        const letters = word.replace(/[^a-z]/gi, "").split("");
        speak([word, ...letters, word], RATE.slow);
      }
      function listenOnce(onText, onDone) {
        const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Ctor) return null;
        const rec = new Ctor();
        rec.lang = "en-US";
        rec.interimResults = false;
        rec.maxAlternatives = 4;
        rec.onresult = (event) => {
          const first = event.results[0];
          const alts = [];
          if (first) for (let i = 0; i < first.length; i += 1) alts.push(first[i]?.transcript || "");
          onText(alts.filter(Boolean).join(" | "));
        };
        rec.onerror = () => onDone();
        rec.onend = () => onDone();
        try { rec.start(); } catch { onDone(); return null; }
        return () => { try { rec.abort(); } catch { /* stopped */ } };
      }
      let stopListen = null;

      function maskWord(en) {
        const chars = [...en];
        const slots = chars.map((char, index) => ({ char, index })).filter((slot) => /[a-z]/i.test(slot.char) && slot.index !== 0).map((slot) => slot.index);
        const hide = Math.max(1, Math.round(chars.filter((char) => /[a-z]/i.test(char)).length * 0.5));
        const hidden = new Set(seeded(slots, hash(en)).slice(0, Math.min(hide, slots.length)));
        return chars.map((char, index) => (char === " " || char === "-" ? char : hidden.has(index) ? "_" : char)).join(" ");
      }
      function blankExample(example, en) {
        return example.replace(new RegExp(`\\b${en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"), "____");
      }
      function choicesFor(answer, pool, seed) {
        const ranked = pool.map((word) => word.en).filter((en) => en.toLowerCase() !== answer.toLowerCase()).sort((a, b) => Math.abs(a.length - answer.length) - Math.abs(b.length - answer.length) || a.localeCompare(b));
        return seeded([answer, ...seeded(ranked.slice(0, 14), seed).slice(0, 3)], seed + 3);
      }
      function toItem(mode, word, pool) {
        const base = { wordId: word.id, answer: word.en, ipa: word.ipa, mnemonic: word.mnemonic, zh: word.zh, en: word.en, example: word.example, exampleZh: word.exampleZh, speak: mode === "sentence" ? word.example : word.en };
        if (mode === "spell") return { ...base, prompt: word.pos, hint: word.zh };
        if (mode === "sentence") return { ...base, prompt: blankExample(word.example, word.en), hint: word.exampleZh, choices: choicesFor(word.en, pool, hash(word.id)) };
        if (mode === "cloze") return { ...base, prompt: maskWord(word.en), hint: word.zh };
        return { ...base, prompt: word.zh, hint: word.pos };
      }
      function buildDrill(mode, pool, only) {
        if (only) return [toItem(mode, only, pool.length ? pool : [only])];
        const now = Date.now();
        const ranked = [...pool].sort((a, b) => rank(b, now) - rank(a, now)).slice(0, Math.min(8, pool.length));
        return seeded(ranked, hash(String(now))).map((word) => toItem(mode, word, pool));
      }
      function rank(word, now) {
        const card = P.cards[word.id];
        let score = 24;
        if (!card) score = word.pack === "starter" || word.tags.includes("starter") ? 74 : 52;
        else if (card.due <= now) score = 96 - Math.min(card.reps, 4) * 4;
        else score = 6;
        if (word.en.length <= 6 && (!card || card.reps < 2)) score += 10;
        score += hash(`${word.id}:${Math.floor(now / 60000)}`) % 19;
        return score;
      }
      function letterTiles(answer) {
        return seeded(answer.match(/[a-z]/gi)?.map((char) => char.toLowerCase()) || [], hash(answer));
      }

      const LESSON = [
        { kind: "meet", id: "hi" },
        { kind: "spell", id: "hi" },
        { kind: "meet", id: "morning" },
        { kind: "spell", id: "morning" },
        { kind: "meet", id: "good" },
        { kind: "spell", id: "good" },
        { kind: "meet", id: "my" },
        { kind: "spell", id: "my" },
