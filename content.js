(() => {
  // Só age quando o navegador está mostrando o arquivo como texto puro.
  // Isso evita "renderizar por cima" de páginas HTML cuja URL termina em .md
  // (ex.: github.com/.../README.md já é uma página pronta).
  const type = (document.contentType || "").toLowerCase();
  if (!type.startsWith("text/plain") && !type.includes("markdown")) return;

  const pre = document.querySelector("body > pre");
  const initial = pre ? pre.textContent : document.body.innerText;
  if (initial == null) return;

  const fileName = decodeURIComponent(location.pathname.split("/").pop() || "documento.md");
  const isLocal = location.protocol === "file:";

  marked.setOptions({ gfm: true, breaks: false });

  // ---------- Monta a página ----------
  const css = (p) => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = chrome.runtime.getURL(p);
    return l;
  };
  const hljsLight = css("lib/hljs-light.css");
  const hljsDark = css("lib/hljs-dark.css");
  document.head.append(css("viewer.css"), hljsLight, hljsDark);

  const meta = document.createElement("meta");
  meta.name = "viewport";
  meta.content = "width=device-width, initial-scale=1";
  document.head.append(meta);

  document.body.innerHTML = `
    <header class="mdv-bar">
      <button class="mdv-btn" id="mdv-toc-btn" title="Sumário">☰</button>
      <span class="mdv-title"></span>
      <span class="mdv-live" id="mdv-live" hidden title="A página atualiza sozinha quando você salva o arquivo">● ao vivo</span>
      <span class="mdv-spacer"></span>
      <button class="mdv-btn" id="mdv-raw-btn" title="Ver texto original">Código</button>
      <button class="mdv-btn" id="mdv-pdf-btn" title="Exportar para PDF">PDF</button>
      <button class="mdv-btn" id="mdv-theme-btn" title="Alternar tema"><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="vertical-align:-2px"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 1.5v11a5.5 5.5 0 0 1 0-11z"/></svg></button>
    </header>
    <div class="mdv-layout">
      <nav class="mdv-toc" id="mdv-toc"></nav>
      <main class="mdv-main">
        <article class="mdv-content" id="mdv-content"></article>
        <pre class="mdv-raw" id="mdv-raw" hidden></pre>
      </main>
    </div>`;
  document.body.classList.add("mdv");
  document.querySelector(".mdv-title").textContent = fileName;

  const content = document.getElementById("mdv-content");
  const raw = document.getElementById("mdv-raw");
  const toc = document.getElementById("mdv-toc");

  // ---------- Tema ----------
  let theme = "auto";
  const isDark = () => document.documentElement.dataset.theme === "dark";
  const applyTheme = (t) => {
    const dark =
      t === "dark" || (t === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    // "media" é mais confiável que "disabled" para ligar/desligar <link>.
    // No escuro, as cores escuras valem só na tela; ao imprimir usa as claras.
    hljsLight.media = dark ? "print" : "all";
    hljsDark.media = dark ? "screen" : "not all";
  };

  // ---------- Renderização ----------
  let source = "";

  function slugger() {
    const seen = new Map();
    return (t) => {
      const s =
        t
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^\w\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-") || "secao";
      const n = seen.get(s) || 0;
      seen.set(s, n + 1);
      return n ? `${s}-${n}` : s;
    };
  }

  function render(text) {
    source = text;
    content.innerHTML = DOMPurify.sanitize(marked.parse(text), { ADD_ATTR: ["target"] });
    raw.textContent = text;

    const firstH1 = content.querySelector("h1");
    document.title = firstH1 ? `${firstH1.textContent} — ${fileName}` : fileName;

    // Âncoras nos títulos + sumário
    const slugify = slugger();
    toc.replaceChildren();
    const headings = content.querySelectorAll("h1, h2, h3, h4");
    headings.forEach((h) => {
      if (!h.id) h.id = slugify(h.textContent);
      const a = document.createElement("a");
      a.href = `#${h.id}`;
      a.textContent = h.textContent;
      a.className = `mdv-toc-${h.tagName.toLowerCase()}`;
      toc.append(a);
    });
    document.body.classList.toggle("mdv-no-toc", headings.length < 2);

    // Blocos ```mermaid viram diagramas; os demais ganham cores
    content.querySelectorAll("pre > code").forEach((el) => {
      if (el.classList.contains("language-mermaid")) {
        const box = document.createElement("div");
        box.className = "mdv-mermaid";
        box.dataset.src = el.textContent;
        el.parentElement.replaceWith(box);
      } else {
        try { hljs.highlightElement(el); } catch (_) {}
      }
    });

    // Checkboxes de lista de tarefas ficam só de leitura
    content.querySelectorAll('input[type="checkbox"]').forEach((c) => (c.disabled = true));

    // Links externos abrem em nova aba
    content.querySelectorAll("a[href]").forEach((a) => {
      if (/^https?:/i.test(a.getAttribute("href"))) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
    });

    return renderMermaid();
  }

  // ---------- Mermaid ----------
  // Cada diagrama é desenhado duas vezes (claro e escuro). O CSS mostra o do
  // tema atual e a impressão usa sempre o claro, então trocar de tema ou dar
  // Ctrl+P não exige redesenhar nada.
  let mermaidSeq = 0;
  async function renderMermaid() {
    const boxes = content.querySelectorAll(".mdv-mermaid");
    if (!boxes.length || typeof mermaid === "undefined") return;
    for (const box of boxes) {
      try {
        const parts = [];
        for (const variant of ["light", "dark"]) {
          mermaid.initialize({
            startOnLoad: false,
            securityLevel: "strict",
            theme: variant === "dark" ? "dark" : "default",
            fontFamily: 'system-ui, -apple-system, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
          });
          const id = `mdv-mermaid-${++mermaidSeq}`;
          try {
            const { svg } = await mermaid.render(id, box.dataset.src);
            parts.push(`<div class="mdv-mm-${variant}">${svg}</div>`);
          } finally {
            // o mermaid às vezes deixa um elemento temporário solto no body
            document.getElementById(`d${id}`)?.remove();
          }
        }
        box.innerHTML = parts.join("");
        box.classList.remove("mdv-mermaid-error");
      } catch (e) {
        box.classList.add("mdv-mermaid-error");
        box.textContent = `Erro no diagrama Mermaid:\n${(e && e.message) || e}`;
      }
    }
  }

  // ---------- Inicialização ----------
  applyTheme(theme);
  render(fixEncoding(initial)).then(() => {
    if (location.hash) {
      const t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (t) t.scrollIntoView();
    }
  });

  chrome.storage.local.get("theme", (r) => {
    theme = r.theme || "auto";
    applyTheme(theme);
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => applyTheme(theme));

  // ---------- Botões ----------
  document.getElementById("mdv-theme-btn").onclick = () => {
    theme = isDark() ? "light" : "dark";
    applyTheme(theme);
    chrome.storage.local.set({ theme });
  };

  document.getElementById("mdv-toc-btn").onclick = () =>
    document.body.classList.toggle("mdv-toc-hidden");

  const rawBtn = document.getElementById("mdv-raw-btn");
  rawBtn.onclick = () => {
    const showRaw = raw.hidden;
    raw.hidden = !showRaw;
    content.hidden = showRaw;
    rawBtn.textContent = showRaw ? "Visualizar" : "Código";
  };

  // ---------- PDF ----------
  // Usa a impressão do Chrome ("Salvar como PDF"). O CSS de impressão já força
  // as cores claras; aqui só garantimos a visão formatada e um bom nome de arquivo.
  document.getElementById("mdv-pdf-btn").onclick = () => {
    const wasRaw = !raw.hidden;
    if (wasRaw) rawBtn.click();
    const prevTitle = document.title;
    document.title = fileName.replace(/\.(md|markdown|mdown)$/i, "");
    window.print();
    document.title = prevTitle;
    if (wasRaw) rawBtn.click();
  };

  // ---------- Recarregar ao salvar (arquivos locais) ----------
  // O script da página não pode ler file:// sozinho; quem lê é o background.
  if (isLocal) {
    const live = document.getElementById("mdv-live");
    let busy = false;
    const check = () => {
      if (busy || document.hidden) return;
      busy = true;
      chrome.runtime.sendMessage({ type: "mdv-read", url: location.href }, (res) => {
        busy = false;
        if (chrome.runtime.lastError || !res || !res.ok) return;
        live.hidden = false;
        if (res.text !== source) {
          const y = window.scrollY;
          render(res.text).then(() => window.scrollTo(0, y));
        }
      });
    };
    setInterval(check, 1000);
    check();
  }

  // Muitos servidores mandam .md sem charset e o Chrome lê como windows-1252,
  // gerando "vocÃª" em vez de "você". Essa decodificação é reversível:
  // voltamos aos bytes originais e decodificamos como UTF-8.
  function fixEncoding(text) {
    const cs = (document.characterSet || "").toLowerCase();
    if (cs === "utf-8" || !/[\u0080-\u00ff\u0152-\u2122]/.test(text)) return text;
    const cp1252 = {
      0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
      0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
      0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
      0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
      0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c,
      0x017e: 0x9e, 0x0178: 0x9f,
    };
    const bytes = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      const b = c < 0x100 ? c : cp1252[c];
      if (b === undefined) return text; // não era cp1252: mantém como está
      bytes[i] = b;
    }
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch (_) {
      return text; // não era UTF-8 de verdade: mantém como está
    }
  }
})();
