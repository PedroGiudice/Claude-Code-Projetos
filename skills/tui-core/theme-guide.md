# Theme Guide - Sistema de Temas Textual

---

## Criando Temas Customizados

### Estrutura Basica

```python
from textual.theme import Theme

MY_THEME = Theme(
    name="my-theme",
    # 11 cores base obrigatorias
    primary="#8be9fd",
    secondary="#bd93f9",
    accent="#ff79c6",
    foreground="#f8f8f2",
    background="#0d0d0d",
    surface="#1a1a2e",
    panel="#282a36",        # CUIDADO: nao use azul (#16213e) - parece 2008
    success="#50fa7b",
    warning="#ffb86c",
    error="#ff5555",
    dark=True,              # True para temas escuros
)
```

### Variaveis Opcionais

```python
MY_THEME = Theme(
    name="my-theme",
    # ... cores base ...
    variables={
        # Cursor de bloco
        "block-cursor-background": "#ff79c6",
        "block-cursor-foreground": "#0d0d0d",
        "block-cursor-text-style": "bold",

        # Bordas
        "border": "#8be9fd",
        "border-blurred": "#44475a",

        # Footer
        "footer-background": "#1a1a2e",
        "footer-foreground": "#f8f8f2",
        "footer-key-foreground": "#50fa7b",

        # Scrollbar
        "scrollbar": "#44475a",
        "scrollbar-hover": "#6272a4",
        "scrollbar-active": "#8be9fd",
        "scrollbar-background": "#0d0d0d",

        # Input
        "input-cursor-background": "#f8f8f2",
        "input-cursor-foreground": "#0d0d0d",
        "input-selection-background": "#44475a 60%",

        # Links
        "link-color": "#8be9fd",
        "link-color-hover": "#ff79c6",

        # Botoes
        "button-foreground": "#f8f8f2",
        "button-focus-text-style": "bold reverse",
    },
)
```

---

## Registrando e Aplicando Temas

### Registro no App

```python
from textual.app import App
from .themes.my_theme import MY_THEME

class MyApp(App):
    def __init__(self) -> None:
        super().__init__()
        self.register_theme(MY_THEME)

    def on_mount(self) -> None:
        # IMPORTANTE: Aplicar tema em on_mount(), NAO em __init__()
        self.theme = "my-theme"
```

### Alternando Temas em Runtime

```python
def action_toggle_theme(self) -> None:
    if self.theme == "my-dark-theme":
        self.theme = "my-light-theme"
    else:
        self.theme = "my-dark-theme"
```

---

## Temas Built-in

O Textual inclui temas pre-definidos:
- `textual-dark` (padrao)
- `textual-light`
- `nord`
- `gruvbox`

Usuarios podem alternar via Command Palette (Ctrl+P).

---

## Exemplos de Paletas Populares

### Dracula

```python
DRACULA_THEME = Theme(
    name="dracula",
    primary="#8be9fd",      # Cyan
    secondary="#bd93f9",    # Purple
    accent="#ff79c6",       # Pink
    foreground="#f8f8f2",   # Foreground
    background="#282a36",   # Background
    surface="#44475a",      # Current Line
    panel="#44475a",        # Selection
    success="#50fa7b",      # Green
    warning="#ffb86c",      # Orange
    error="#ff5555",        # Red
    dark=True,
)
```

### Catppuccin Mocha

```python
CATPPUCCIN_MOCHA = Theme(
    name="catppuccin-mocha",
    primary="#89B4FA",      # Blue
    secondary="#CBA6F7",    # Mauve
    accent="#F5C2E7",       # Pink
    foreground="#CDD6F4",   # Text
    background="#1E1E2E",   # Base
    surface="#313244",      # Surface0
    panel="#45475A",        # Surface1
    success="#A6E3A1",      # Green
    warning="#F9E2AF",      # Yellow
    error="#F38BA8",        # Red
    dark=True,
)
```

### Nord

```python
NORD_THEME = Theme(
    name="nord-custom",
    primary="#88C0D0",      # Frost
    secondary="#81A1C1",    # Frost
    accent="#B48EAD",       # Aurora Purple
    foreground="#D8DEE9",   # Snow Storm
    background="#2E3440",   # Polar Night
    surface="#3B4252",      # Polar Night
    panel="#434C5E",        # Polar Night
    success="#A3BE8C",      # Aurora Green
    warning="#EBCB8B",      # Aurora Yellow
    error="#BF616A",        # Aurora Red
    dark=True,
)
```

---

## Estilos Dinamicos via Classes CSS

```python
# Adicionar classes
widget.add_class("highlighted", "active")

# Remover classes
widget.remove_class("highlighted")

# Alternar classes
widget.toggle_class("selected")
```

```tcss
/* CSS correspondente */
.highlighted { background: $warning; }
.active { border: heavy $success; }
.selected { background: $accent; color: $background; }
```

---

## Dicas Importantes

### 1. Panel vs Surface

- `$surface` - Fundo de widgets (mais claro)
- `$panel` - Secoes da UI (pode ser igual ou diferente)

**ERRO COMUM:** Usar azul (#16213e) para panel - parece interface de 2008.
Use tons de cinza/preto: #282a36, #1e1e2e, etc.

### 2. Tema em on_mount(), NAO em __init__()

```python
# ERRADO
def __init__(self):
    super().__init__()
    self.theme = "my-theme"  # Pode nao funcionar

# CORRETO
def on_mount(self) -> None:
    self.theme = "my-theme"
```

### 3. Testar com Varios Terminais

Cores podem aparecer diferentes em:
- Windows Terminal
- iTerm2
- Alacritty
- VS Code terminal

Use `textual colors` para preview.

### 4. Verificar Contraste

Use variaveis de texto ($text, $text-muted) para garantir legibilidade automatica.

---

## Preview de Cores

```bash
textual colors
```

Mostra todas as cores do tema atual no terminal.

---

## Organizacao de Arquivos

```
src/my_app/
└── themes/
    ├── __init__.py
    ├── dracula.py
    ├── catppuccin.py
    └── nord.py
```

```python
# themes/__init__.py
from .dracula import DRACULA_THEME
from .catppuccin import CATPPUCCIN_MOCHA
from .nord import NORD_THEME

__all__ = ["DRACULA_THEME", "CATPPUCCIN_MOCHA", "NORD_THEME"]
```
