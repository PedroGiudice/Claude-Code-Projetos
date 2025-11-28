# TCSS Reference - Textual CSS Completo

**Versao Textual: 6.6.0** (Novembro 2025)

---

## Sistema de Variaveis

### Sintaxe Correta

```tcss
/* CORRETO - Textual */
$my-color: #ff5500;
Button { color: $my-color; }

/* ERRADO - Web CSS (NAO SUPORTADO) */
--my-color: #ff5500;
Button { color: var(--my-color); }
```

### 11 Cores Base Obrigatorias

| Variavel | Proposito |
|----------|-----------|
| `$primary` | Branding, titulos, enfase forte |
| `$secondary` | Diferenciacao alternativa |
| `$accent` | Contraste, chamar atencao |
| `$foreground` | Cor padrao de texto |
| `$background` | Fundo de tela |
| `$surface` | Fundo de widgets |
| `$panel` | Diferenciar partes da UI |
| `$boost` | Cor com alpha para camadas |
| `$success` | Indicador de sucesso (verde) |
| `$warning` | Indicador de aviso (laranja) |
| `$error` | Indicador de erro (vermelho) |

### Variaveis Auto-Geradas

Cada cor base gera 6 tons automaticamente:
- `$primary-lighten-1`, `-lighten-2`, `-lighten-3`
- `$primary-darken-1`, `-darken-2`, `-darken-3`
- `$primary-muted` (70% opacidade)

### Variaveis de Texto

- `$text` - Auto-contraste preto/branco
- `$text-muted` - Importancia menor
- `$text-disabled` - Itens desabilitados
- `$text-primary`, `$text-secondary`, `$text-accent`

### Variaveis Especializadas

**Bordas:**
- `$border` (com foco)
- `$border-blurred` (sem foco)

**Cursor:**
- `$block-cursor-foreground`
- `$block-cursor-background`
- `$block-cursor-text-style`

**Input:**
- `$input-cursor-background`
- `$input-cursor-foreground`
- `$input-selection-background`

**Scrollbar:**
- `$scrollbar`, `$scrollbar-hover`, `$scrollbar-active`
- `$scrollbar-background`

**Links:**
- `$link-color`, `$link-color-hover`
- `$link-background`, `$link-background-hover`

**Footer:**
- `$footer-foreground`, `$footer-background`
- `$footer-key-foreground`

---

## Unidades Suportadas (7 tipos)

| Unidade | Descricao | Exemplo |
|---------|-----------|---------|
| (nenhuma) | Celulas/caracteres | `width: 20;` |
| `%` | Porcentagem do pai | `width: 50%;` |
| `fr` | Unidade fracional | `width: 1fr;` |
| `w` | % largura container | `width: 50w;` |
| `h` | % altura container | `height: 50h;` |
| `vw` | % largura viewport | `width: 50vw;` |
| `vh` | % altura viewport | `height: 50vh;` |
| `auto` | Dimensionamento automatico | `height: auto;` |

**NAO SUPORTADO:** `px`, `em`, `rem`

---

## Propriedades de Layout

### Layout e Posicionamento

```tcss
layout: horizontal | vertical | grid;
dock: top | right | bottom | left;
offset: <x> <y>;
align: <horizontal> <vertical>;
content-align: <horizontal> <vertical>;
text-align: left | center | right | justify;
```

### Dimensoes

```tcss
width: 20;           /* celulas */
width: 50%;          /* porcentagem */
width: 1fr;          /* fracional */
min-width: 10;
max-width: 100;
height: auto;
box-sizing: border-box | content-box;
```

### Espacamento

```tcss
padding: 1;              /* todos os lados */
padding: 1 2;            /* vertical horizontal */
padding: 1 2 3 4;        /* top right bottom left */
margin-top: 2;
```

### Grid

```tcss
grid-size: 4;                 /* 4 colunas */
grid-size: 4 6;               /* 4 colunas, 6 linhas */
grid-columns: 1fr 2fr 1fr;
grid-rows: 2fr 1fr 1fr;
grid-gutter: 1 2;             /* vertical horizontal */
column-span: 2;
row-span: 3;
```

---

## Propriedades de Aparencia

### Cores

```tcss
color: $primary;
color: #ff5500;
color: rgb(255, 0, 0);
color: hsl(0, 100%, 50%);
color: auto;                  /* auto-contraste */
background: red 20%;          /* com opacidade */
background-tint: $boost;
opacity: 50%;
text-opacity: 70%;
```

### Visibilidade

```tcss
visibility: visible | hidden;
display: block | none;
```

---

## Bordas (16 tipos)

```tcss
border: ascii | blank | dashed | double | heavy | hidden |
        hkey | inner | outer | panel | round | solid |
        tall | thick | vkey | wide;
```

**Uso comum:**
- `solid` - Borda padrao
- `heavy` / `thick` - Enfase
- `double` - Linha dupla
- `round` - Cantos arredondados (caracteres)
- `hidden` / `none` - Sem borda

```tcss
border: heavy $primary;
border-top: double green;
border-title-align: center;
border-title-color: $accent;
outline: solid red;
```

---

## Texto

```tcss
text-style: bold;
text-style: italic;
text-style: bold italic;         /* combinavel */
text-style: reverse strike underline;
text-wrap: wrap | nowrap;
text-overflow: clip | fold | ellipsis;
```

---

## Scrollbar

```tcss
overflow: auto | hidden | scroll;
overflow-x: hidden;
scrollbar-size: 1 1;
scrollbar-gutter: stable;
scrollbar-color: $panel;
scrollbar-background: $background-darken-1;
scrollbar-visibility: visible | hidden;  /* novo em 6.3.0 */
```

---

## Layers (substitui z-index)

```tcss
layers: base overlay popup;
layer: overlay;
```

---

## Pseudo-Classes Suportadas

```tcss
Button:hover { background: $primary; }
Button:focus { border: heavy $accent; }
Button:focus-within { background: $boost; }
Button:disabled { opacity: 50%; }
Button:enabled { color: $text; }

/* Tema */
MyWidget:dark { background: #333; }
MyWidget:light { background: #fff; }

/* Posicao (novo em 0.80.0+) */
ListItem:first-child { border-top: none; }
ListItem:last-child { border-bottom: none; }
```

---

## CSS Nesting (Suportado)

```tcss
#container {
    border: heavy $primary;

    .button {
        width: 1fr;

        &.active {
            background: $success;
        }

        &:hover {
            background: $primary-lighten-1;
        }
    }
}
```

---

## Formatos de Cor Aceitos

```tcss
color: red;                    /* nomes */
color: #f00;                   /* hex 3 digitos */
color: #ff0000;                /* hex 6 digitos */
color: rgb(255, 0, 0);         /* RGB */
color: rgba(255, 0, 0, 0.5);   /* RGBA - suporte limitado */
color: hsl(0, 100%, 50%);      /* HSL */
color: $primary;               /* variavel */
color: $primary 80%;           /* variavel + opacidade */
color: auto;                   /* auto-contraste */
```

---

## Breaking Changes entre Versoes

### 0.86.0 (Novembro 2024) - CRITICO

```python
# ANTES (removido)
self.dark = True

# DEPOIS
self.theme = "textual-dark"
```

### 2.0.0 (Inicio 2025)

- `OptionList.wrap` removido - usar CSS:
```tcss
OptionList {
    text-wrap: nowrap;
    text-overflow: ellipsis;
}
```

### 6.0.0 (Agosto 2025)

- `Static.renderable` -> `Static.content`
- `Label.renderable` -> `Label.content`

### 6.3.0

- Adicionado `scrollbar-visibility`

---

## Propriedades NAO SUPORTADAS

**NUNCA use - causam erro ou sao ignoradas:**

| Categoria | Propriedades |
|-----------|--------------|
| Animacoes | `animation`, `@keyframes`, `transition` |
| Transforms | `transform`, `rotate`, `scale`, `translate` |
| Bordas | `border-radius` |
| Sombras | `box-shadow`, `text-shadow` |
| Flexbox | `flex`, `flex-direction`, `justify-content` |
| Posicao web | `z-index`, `top`, `left`, `right`, `bottom` |
| Fontes | `font-family`, `font-size`, `font-weight`, `line-height` |
| Seletores | `:nth-child()`, `:first-of-type` |
| Media | `@media` |
| Funcoes | `calc()`, `min()`, `max()`, `clamp()` |
| Variaveis | `var(--name)` - use `$name` |
