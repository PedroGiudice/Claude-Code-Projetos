# Debugging Guide - Workflow de Debug Textual

---

## Ferramentas de Desenvolvimento

### textual-dev

Instalar com:
```bash
pip install 'textual[dev]'
```

---

## Workflow Basico de Debug

### Terminal 1: Console de Debug

```bash
textual console
```

Flags uteis:
- `-v` - Modo verbose
- `-x SYSTEM` - Excluir mensagens do sistema
- `-x EVENT` - Excluir eventos
- `-x DEBUG` - Excluir debug

### Terminal 2: App com Hot-Reload

```bash
textual run my_app.py --dev
```

O flag `--dev` habilita:
- **Live CSS editing** - Alteracoes em .tcss aplicam instantaneamente
- **Logging para console** - self.log() aparece no Terminal 1
- **Inspecao de DOM** - Visualizar arvore de widgets

---

## Logging no Codigo

```python
from textual import log

class MyWidget(Widget):
    def on_mount(self) -> None:
        # Logs simples
        log("Widget mounted")
        log.info(f"ID: {self.id}")
        log.warning("Something odd")
        log.error("Critical issue")

        # Log com contexto
        log("Debug info:", locals())
        log(children=self.children, theme=self.theme)

        # Arvore DOM com anotacoes CSS
        self.log(self.tree)
```

---

## Inspecao de Estilos

```python
def debug_styles(self, widget_id: str) -> None:
    widget = self.query_one(f"#{widget_id}")

    # Informacoes do widget
    self.log("=== Style Debug ===")
    self.log(f"CSS ID: {widget.css_identifier}")
    self.log(f"Classes: {widget.classes}")

    # Estilos computados
    self.log(f"Background: {widget.styles.background}")
    self.log(f"Color: {widget.styles.color}")
    self.log(f"Border: {widget.styles.border}")

    # Caminho CSS
    self.log(f"CSS Path: {widget.css_path_nodes}")
```

### Propriedades Uteis

| Propriedade | Descricao |
|-------------|-----------|
| `widget.css_identifier` | Seletor CSS do widget |
| `widget.css_path_nodes` | Caminho do App ate o widget |
| `widget.styles` | Estilos computados atuais |
| `widget.display` | Estado de display |
| `widget.visible` | Estado de visibilidade |

---

## Preview de Cores

```bash
textual colors
```

Mostra todas as cores do tema atual no terminal.

---

## Browser-Based Testing

```bash
textual serve my_app.py --port 7342
```

Abre a app no navegador - util para:
- Testar multiplas instancias
- Compartilhar com outros
- Debug remoto

---

## Problemas Comuns e Solucoes

| Problema | Causa | Solucao |
|----------|-------|---------|
| CSS nao atualiza | Nao usando --dev mode | `textual run --dev` |
| Tema nao aplica | Definido em __init__ | Definir em `on_mount()` |
| print() nao aparece | TUI captura stdout | Usar `textual console` + `--dev` ou `self.log()` |
| Variaveis nao funcionam | Usando var(--name) | Usar sintaxe `$name` |
| Borda nao aparece | Tipo invalido | Usar um dos 16 tipos validos |
| Cores erradas | Hardcoded para dark | Usar variaveis de tema |
| Scrollbar invisivel | Sem contraste | Definir `scrollbar-background` no tema |

---

## Checklist de Debug

### CSS Nao Aplicando

1. [ ] Executando com `--dev`?
2. [ ] Arquivo .tcss no CSS_PATH?
3. [ ] Widget tem DEFAULT_CSS conflitante?
4. [ ] Sintaxe de variavel correta ($name)?
5. [ ] Seletor CSS correto?

### Widget Nao Aparecendo

1. [ ] `display: block` (nao `none`)?
2. [ ] `visibility: visible`?
3. [ ] Tamanho definido (height/width)?
4. [ ] Compose() retorna o widget?
5. [ ] Parent container tem espaco?

### Tema Nao Funcionando

1. [ ] Tema registrado em __init__?
2. [ ] Tema aplicado em on_mount()?
3. [ ] Nome do tema correto?
4. [ ] 11 cores base definidas?

---

## Comandos de Debug Rapido

```python
# No Python console ou on_mount():

# Ver arvore de widgets
self.log(self.tree)

# Ver todos os widgets de um tipo
for btn in self.query(Button):
    self.log(btn.id, btn.styles.background)

# Ver CSS de um widget especifico
w = self.query_one("#my-widget")
self.log(w.styles)

# Listar todas as classes de um widget
self.log(self.query_one("#sidebar").classes)
```

---

## Timer e Resource Leaks

### Detectando Timer Leaks

Se a app fica lenta ou consome memoria:

```python
# Verificar se timers estao sendo parados
def on_unmount(self) -> None:
    if hasattr(self, 'timer') and self.timer:
        self.timer.stop()
        self.log("Timer stopped")
```

### Pattern Correto para Timers

```python
class MyWidget(Widget):
    def __init__(self) -> None:
        super().__init__()
        self.timer = None  # Nao criar timer aqui

    def on_mount(self) -> None:
        # Criar timer quando widget e montado
        self.timer = self.set_interval(1.0, self._update)

    def on_unmount(self) -> None:
        # SEMPRE parar timer quando widget e removido
        if self.timer:
            self.timer.stop()
```

---

## Quando Abrir Issue

Se apos seguir este guia o problema persistir:

1. Reproduzir em app minima
2. Verificar versao do Textual (`pip show textual`)
3. Checar issues existentes no GitHub
4. Criar issue com:
   - Versao do Textual
   - Codigo minimo que reproduz
   - Terminal usado
   - Output de erro
