# Viewer MD

Extensão do Chrome que renderiza arquivos Markdown (`.md`, `.markdown`) direto no navegador, sejam arquivos locais ou da web.

## Instalação (modo desenvolvedor)

1. Abra `chrome://extensions`
2. Ative **Modo do desenvolvedor** (canto superior direito)
3. Clique em **Carregar sem compactação** e selecione esta pasta (`viewerMD`)
4. **Importante:** em **Detalhes** da extensão, ative **Permitir acesso a URLs de arquivo**.
   Sem isso o Chrome não deixa a extensão ler arquivos locais (`file://`)
5. Arraste um `.md` para o Chrome (ou abra `exemplo.md`)

Depois de editar o código, clique no ícone ↻ da extensão em `chrome://extensions` e recarregue a aba.

## Recursos

- GitHub Flavored Markdown: tabelas, listas de tarefas, texto riscado, links automáticos
- Destaque de sintaxe nos blocos de código (highlight.js)
- Sumário lateral gerado a partir dos títulos, com âncoras
- Tema claro/escuro (segue o sistema; o botão alterna e a escolha fica salva)
- Botão **Código** para ver o texto original
- **Atualização ao vivo**: arquivos locais se atualizam sozinhos ao salvar, mantendo a posição de rolagem (indicador "● ao vivo")
- **Diagramas Mermaid**: blocos ` ```mermaid ` viram diagramas, com versão clara e escura; erros de sintaxe aparecem numa caixa vermelha
- **Exportar PDF**: botão **PDF** → "Salvar como PDF". Sai sempre em tema claro, sem barra nem sumário (o Ctrl+P também funciona)
- HTML sanitizado com DOMPurify (seguro para `.md` vindos da web)
- Corrige acentos quebrados quando o servidor não informa o charset

## Como funciona

| Arquivo         | Papel |
|-----------------|-------|
| `manifest.json` | "RG" da extensão: nome, permissões e em quais URLs o script roda |
| `content.js`    | Script injetado na página: pega o texto do `.md`, converte em HTML e monta a interface |
| `background.js` | Service worker: relê o arquivo local a cada segundo para a atualização ao vivo (a página não tem permissão de ler `file://` sozinha) |
| `viewer.css`    | Visual da página renderizada |
| `lib/`          | Bibliotecas locais: marked (parser), DOMPurify (segurança), highlight.js (cores no código), mermaid (diagramas) |

Quando você abre um `.md`, o Chrome mostra o texto puro dentro de um `<pre>`.
O `content.js` lê esse texto, converte em HTML e substitui a página.
O script só age se a página for texto puro, então páginas HTML cuja URL termina em `.md` (como as do GitHub) não são afetadas.

No Manifest V3 as bibliotecas precisam ficar dentro da extensão; o Chrome não deixa carregar código de CDN.
