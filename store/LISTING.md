# Textos para o Chrome Web Store

Copie e cole cada bloco no campo correspondente do painel do desenvolvedor.

---

## Aba "Store listing" (Detalhes do item)

**Nome:** Viewer MD

**Resumo** (máx. 132 caracteres):

> Abra arquivos Markdown (.md) formatados direto no Chrome: tema escuro, sumário, diagramas Mermaid, PDF e atualização ao vivo.

**Descrição:**

```
Viewer MD transforma arquivos Markdown (.md) em páginas bonitas e legíveis, direto no Chrome — sem instalar programas nem enviar seus arquivos para lugar nenhum.

Basta abrir ou arrastar um arquivo .md para o navegador.

RECURSOS
• Formatação completa (GitHub Flavored Markdown): títulos, tabelas, listas de tarefas, citações, links e imagens
• Destaque de sintaxe nos blocos de código
• Diagramas Mermaid (fluxogramas, sequência, gantt e mais)
• Sumário lateral automático com navegação pelos títulos
• Tema claro e escuro (segue o sistema ou escolha manualmente)
• Atualização ao vivo: a página se atualiza sozinha quando você salva o arquivo
• Exportar para PDF com um clique
• Botão para ver o texto original
• Funciona com arquivos locais e com links .md da web

PRIVACIDADE
Tudo acontece no seu computador. A extensão não coleta, não envia e não armazena seus dados — a única coisa salva é a sua preferência de tema.

IMPORTANTE PARA ARQUIVOS LOCAIS
Para abrir arquivos do seu computador, ative a opção "Permitir acesso a URLs de arquivo":
chrome://extensions → Viewer MD → Detalhes → Permitir acesso a URLs de arquivo
```

**Categoria:** Ferramentas para desenvolvedores (Developer Tools)
**Idioma:** Português (Brasil)

**Imagens** (pasta `store/`):
- Ícone da loja (128×128): `icons/icon128.png`
- Capturas de tela (1280×800): `screenshot-1-claro.png`, `screenshot-2-escuro.png`, `screenshot-3-codigo-diagrama.png`
- Bloco promocional pequeno (440×280): `promo-440x280.png`

---

## Aba "Privacy practices" (Práticas de privacidade)

**Finalidade única (Single purpose):**

> Exibir arquivos Markdown (.md) formatados no navegador.

**Justificativa da permissão `storage`:**

> Salvar localmente a preferência de tema (claro/escuro) escolhida pelo usuário.

**Justificativa da permissão de host `file:///*`:**

> Reler o arquivo Markdown local que o usuário está visualizando, para atualizar a página automaticamente quando ele é salvo. A extensão só lê o próprio arquivo .md aberto na aba.

**Justificativa do content script em páginas http/https:**

> Renderizar arquivos .md abertos da web. O script só atua quando a página é texto puro (arquivo Markdown bruto); páginas HTML comuns não são alteradas.

**Código remoto:** Não, não uso código remoto. (Todas as bibliotecas estão dentro do pacote.)

**Uso de dados:** não marque nenhuma categoria. Marque as três declarações de conformidade:
- Não vendo nem transfiro dados de usuários a terceiros…
- Não uso nem transfiro dados para fins não relacionados à finalidade única…
- Não uso nem transfiro dados para determinar crédito…

**URL da política de privacidade:**
`https://github.com/allannoliveira/viewerMD/blob/main/PRIVACY.md`
