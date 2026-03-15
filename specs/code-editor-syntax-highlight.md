# Spec: Code Editor com Syntax Highlight

**Status:** Aprovado — pronto para implementação  
**Data:** 2026-03-14  
**Feature:** Editor de código com syntax highlight automático e seleção de linguagem manual

---

## Contexto

A homepage do DevRoast (`src/app/page.tsx`) possui atualmente um `<textarea>` bruto que permite ao usuário colar código. O objetivo desta feature é transformar esse textarea em um editor com syntax highlight real: ao colar código, as cores são aplicadas automaticamente com detecção de linguagem, e o usuário pode sobrescrever a linguagem manualmente.

---

## Referência Estudada: ray.so

O [ray-so (Raycast)](https://github.com/raycast/ray-so) é a principal referência. O editor deles usa exatamente o padrão **textarea + overlay de highlight**, sem nenhum framework de editor pesado (sem Monaco, sem CodeMirror). A arquitetura é:

```
<div>
  <textarea />                  ← transparente, recebe input real
  <HighlightedCode />           ← posicionado por baixo/sobre, HTML do Shiki
</div>
```

O usuário digita/cola no `textarea` invisível; o `HighlightedCode` renderiza os tokens coloridos atrás. O CSS sincroniza fontes e tamanhos para o texto não "escorregar".

**O que eles usam:**
- `shiki` → renderização dos tokens coloridos (HTML final)
- `highlight.js` → **somente** para detecção automática de linguagem (`hljs.highlightAuto`)
- Dois átomos separados: `detectedLanguageAtom` (hljs) e `userInputtedLanguageAtom` (seleção manual)
- Grammars do Shiki são carregados de forma lazy por linguagem
- Shiki roda em modo WASM no browser — sem Node.js necessário

---

## Análise das Opções

### Opções descartadas

| Biblioteca | Motivo do descarte |
|---|---|
| **Monaco Editor** | Bundle de 2–4 MB, complexidade de configuração para Next.js, overkill para um widget de paste |
| **CodeMirror 6 (raw)** | Arquitetura imperativa (DOM direto), ~6 pacotes para setup básico, sem auto-detecção |
| **Prism.js** | Essencialmente abandonado, sem manutenção ativa |
| **`@uiw/react-codemirror`** | 150–200 KB, sem auto-detecção, mais complexo do que o necessário |

### Opções consideradas

#### A. `react-simple-code-editor` + `highlight.js` + Shiki

A abordagem do ray.so, mas usando `react-simple-code-editor` (3 KB) como shell de textarea.

**Prós:**
- Menor bundle (~3 KB de shell)
- Você traz seu próprio highlighter — controle total sobre o HTML de saída
- Simples de estilizar com os tokens `@theme` do projeto

**Contras:**
- `react-simple-code-editor` está praticamente dormindo (última atualização: julho 2024, 37 issues abertas)
- Usa `-webkit-text-fill-color: transparent` — hack CSS com edge cases em alguns browsers
- Não tem undo nativo compatível com o undo do browser
- Não funciona bem com text weight/style diferente no highlight (limitação de layout)

#### B. Textarea manual + overlay Shiki (padrão ray.so puro) ✅ **Recomendado**

Construir o componente do zero, exatamente como o ray.so faz: um `<textarea>` nativo sobreposto por um `<pre>` com o HTML do Shiki.

**Prós:**
- Zero dependência extra — Shiki já está instalado
- Controle total sobre o DOM, CSS e comportamento
- Compatível com React 19 e Next.js 16 nativamente
- CSS de theme tokens funciona direto — sem conflitos com temas de terceiros
- Mesma arquitetura do ray.so, que é o benchmark de qualidade da feature

**Contras:**
- Requer implementação manual do CSS de sobreposição (sincronizar scroll, padding, fonte)
- Requer `highlight.js` como dependência nova (para auto-detecção)

#### C. `@uiw/react-codemirror`

Para um editor com experiência mais "IDE" (cursor visível, seleção de linha, etc.).

**Prós:**
- Experiência de editor completa
- Bem mantido

**Contras:**
- 150–200 KB de bundle
- Sem auto-detecção de linguagem
- Theming distante dos tokens CSS do projeto
- Requer `dynamic(() => import(...), { ssr: false })`

---

## Decisão de Arquitetura

> **Abordagem escolhida: Opção B — Textarea + Overlay Shiki (padrão ray.so)**

**Justificativa:** O projeto já tem Shiki instalado. A abordagem não adiciona dependências de UI pesadas e mantém controle total sobre a estilização com os tokens `@theme` do projeto. A única dependência nova seria `highlight.js` exclusivamente para auto-detecção (ou uma alternativa leve discutida abaixo). A arquitetura é comprovada pelo ray.so para exatamente esse caso de uso.

**Para auto-detecção de linguagem:** `highlight.js` (`hljs.highlightAuto`) — 189 linguagens, probabilístico, amplamente testado. ✅ Decisão confirmada.

---

## Especificação Técnica

### Componente: `CodeEditor`

**Local:** `src/components/ui/code-editor.tsx`

Seguindo AGENTS.md Rule 12 (compound components), o componente será dividido em partes nomeadas:

```
CodeEditorRoot          — container principal com estado
CodeEditorHeader        — barra de topo com dots + seletor de linguagem
CodeEditorBody          — área de edição (gutter + textarea + overlay)
```

Ou, dependendo da preferência, pode ser um único componente com sub-elementos internos e uma `CodeEditorLanguageSelect` exposta separadamente.

### Estado interno

```ts
// Dentro de CodeEditorRoot (use client)
const [code, setCode] = useState(initialCode)
const [detectedLanguage, setDetectedLanguage] = useState<string>("plaintext")
const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null)
// selectedLanguage null = usar detectedLanguage
// selectedLanguage string = override manual do usuário

const activeLanguage = selectedLanguage ?? detectedLanguage
```

### Fluxo de detecção

```
onChange(e) → setCode(e.target.value)
           → debounce(300ms) → detectLanguage(code)
                             → setDetectedLanguage(result)
```

A detecção roda com debounce para não bloquear a UI em pastes grandes.

### Overlay de syntax highlight

O Shiki será chamado como função no client via WASM:

```ts
import { createHighlighterCore } from "shiki/core"
import { createOnigurumaEngine } from "shiki/engine/oniguruma"

// Inicializado uma vez globalmente (fora do componente)
const highlighterPromise = createHighlighterCore({
  themes: [import("shiki/themes/vesper.mjs")], // tema já usado no projeto
  langs: [],                                    // carregados lazy
  engine: createOnigurumaEngine(import("shiki/wasm")),
})
```

No componente, o render do overlay:

```tsx
// O textarea e o pre precisam de CSS idêntico para alinhar o texto
<div className="relative">
  <pre
    aria-hidden="true"
    className="absolute inset-0 pointer-events-none font-mono text-xs p-4 leading-relaxed"
    dangerouslySetInnerHTML={{ __html: highlightedHtml }}
  />
  <textarea
    value={code}
    onChange={handleChange}
    className="relative z-10 bg-transparent font-mono text-xs text-transparent caret-text-primary p-4 leading-relaxed resize-none outline-none"
    style={{ caretColor: "var(--color-text-primary)" }}
    spellCheck={false}
  />
</div>
```

**CSS crítico para sincronização:** `font-family`, `font-size`, `line-height`, `padding`, `white-space: pre` e `word-wrap: break-word` devem ser idênticos no `<textarea>` e no `<pre>`.

### Seletor de Linguagem

Um `<select>` ou Combobox no header do editor, populado com as linguagens suportadas.

**Linguagens a suportar inicialmente (pode expandir):**

```ts
export const SUPPORTED_LANGUAGES = [
  { label: "Auto-detect",   value: null },
  { label: "TypeScript",    value: "typescript" },
  { label: "JavaScript",    value: "javascript" },
  { label: "TSX",           value: "tsx" },
  { label: "JSX",           value: "jsx" },
  { label: "Python",        value: "python" },
  { label: "Go",            value: "go" },
  { label: "Rust",          value: "rust" },
  { label: "Java",          value: "java" },
  { label: "C",             value: "c" },
  { label: "C++",           value: "cpp" },
  { label: "C#",            value: "csharp" },
  { label: "PHP",           value: "php" },
  { label: "Ruby",          value: "ruby" },
  { label: "Swift",         value: "swift" },
  { label: "Kotlin",        value: "kotlin" },
  { label: "Bash",          value: "bash" },
  { label: "SQL",           value: "sql" },
  { label: "JSON",          value: "json" },
  { label: "YAML",          value: "yaml" },
  { label: "HTML",          value: "html" },
  { label: "CSS",           value: "css" },
  { label: "Markdown",      value: "markdown" },
  { label: "Plain text",    value: "plaintext" },
] as const
```

### Gutter de números de linha

Os números de linha devem ser **dinâmicos**, derivados do conteúdo atual:

```ts
const lineCount = code.split("\n").length
const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1)
```

O gutter precisa de scroll sincronizado com o textarea (via `onScroll` no textarea → `scrollTop` no gutter).

### Tema Shiki

Usar o tema `vesper` — já é o tema em uso em `code-block.tsx`. ✅ Decisão confirmada.

---

## Estrutura de Arquivos

```
src/
  components/
    ui/
      code-editor.tsx          ← novo componente principal ("use client")
  lib/
    highlighter.ts             ← singleton do Shiki highlighter (WASM, lazy langs)
    language-detect.ts         ← wrapper para auto-detecção (hljs ou alternativa)
    languages.ts               ← SUPPORTED_LANGUAGES map com imports lazy do Shiki
```

---

## Dependências a Instalar

| Pacote | Versão sugerida | Motivo |
|---|---|---|
| `highlight.js` | `^11.x` | Auto-detecção de linguagem (`hljs.highlightAuto`) |

Shiki já está instalado — nenhuma outra dependência de UI necessária.

---

## Considerações de Performance

1. **Debounce na detecção:** `hljs.highlightAuto` itera por muitas gramáticas — deve rodar com debounce de 250–300ms para não bloquear o input.
2. **Lazy loading de grammars Shiki:** Carregar apenas as linguagens que forem selecionadas/detectadas. As 4 mais comuns (JS, TS, Python, Bash) podem ser pré-carregadas.
3. **Highlight assíncrono:** O `codeToHtml` do Shiki é `async`. O estado do HTML renderizado deve ser gerenciado com `useEffect` + `useState` para não bloquear o render do textarea.
4. **Evitar flash de conteúdo:** Enquanto o highlight carrega, mostrar o código em `text-text-secondary` sem tokens — não em branco.

---

## Comportamento Esperado

| Situação | Comportamento |
|---|---|
| Usuário cola código pela primeira vez | `hljs.highlightAuto` detecta a linguagem, aplica highlight via Shiki |
| Usuário continua digitando | Highlight atualiza com debounce de 300ms |
| Usuário seleciona linguagem manualmente | Override imediato — detecção automática fica desabilitada |
| Usuário seleciona "Auto-detect" | Volta a usar `hljs` para detectar |
| Linguagem detectada/selecionada não tem grammar carregada | Grammar é carregada de forma lazy, spinner ou fallback de texto plano enquanto carrega |
| Código muito longo (>500 linhas) | Highlight sempre aplicado — sem threshold ✅ |

---

## Decisões Confirmadas

| # | Pergunta | Decisão |
|---|---|---|
| 1 | Auto-detecção | `highlight.js` (`hljs.highlightAuto`) |
| 2 | Tema Shiki | `vesper` (já em uso no projeto) |
| 3 | Seletor de linguagem | `<select>` nativo |
| 4 | Limite de linhas | Highlight sempre aplicado, sem threshold |
| 5 | Gutter | Números de linha dinâmicos + scroll sincronizado com textarea |

---

## Perguntas Abertas

~~Todas respondidas.~~

---

## TODOs de Implementação

- [x] Instalar `highlight.js` e adicionar ao `package.json`
- [x] Criar `src/lib/languages.ts` com o mapa de linguagens suportadas e os imports lazy do Shiki
- [x] Criar `src/lib/highlighter.ts` com o singleton do Shiki (WASM, `createHighlighterCore`, tema `vesper`)
- [x] Criar `src/lib/language-detect.ts` com o wrapper de auto-detecção via `hljs.highlightAuto` (com debounce)
- [x] Criar `src/components/ui/code-editor.tsx` — componente `"use client"` com:
  - [x] Estado: `code`, `detectedLanguage`, `selectedLanguage` (null = auto)
  - [x] Textarea com `color: transparent` e `caretColor` via token
  - [x] `<pre>` overlay com HTML do Shiki via `dangerouslySetInnerHTML`
  - [x] Gutter com números de linha dinâmicos + scroll sincronizado via `useRef` + `onScroll`
  - [x] Header com dots de window chrome (vermelho/âmbar/verde)
  - [x] `<select>` nativo de linguagem no header (opção "Auto-detect" + lista `SUPPORTED_LANGUAGES`)
- [x] Substituir o bloco de editor inline de `page.tsx` pelo novo `<CodeEditorRoot />`
- [x] Garantir que `npm run check && npm run build` passam sem erros

---

## Referências

- [ray-so source](https://github.com/raycast/ray-so) — `app/(navigation)/(code)/`
- [Shiki docs](https://shiki.style/guide/install)
- [highlight.js `highlightAuto`](https://highlightjs.readthedocs.io/en/latest/api.html#highlightauto)
- `src/components/ui/code-block.tsx` — uso atual do Shiki no projeto
- `src/components/ui/AGENTS.md` — regras de authoring de componentes
