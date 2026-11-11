// Service worker da extensão.
// Lê o arquivo .md local para a página poder se atualizar quando ele é salvo.
// Só aceita ler a própria URL da aba que pediu, e só arquivos .md locais.

const MD_FILE = /^file:\/\/\/.*\.(md|markdown|mdown)$/i;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.type !== "mdv-read") return;

  const strip = (u) => (u || "").split("#")[0];
  const url = strip(msg.url);
  if (!MD_FILE.test(url) || strip(sender.url) !== url) {
    sendResponse({ ok: false, error: "url não permitida" });
    return;
  }

  fetch(url, { cache: "no-store" })
    .then((r) => r.arrayBuffer())
    .then((buf) => sendResponse({ ok: true, text: new TextDecoder("utf-8").decode(buf) }))
    .catch((e) => sendResponse({ ok: false, error: String(e) }));
  return true; // resposta assíncrona
});
