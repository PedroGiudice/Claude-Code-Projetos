# FRAMEWORK-AGNOSTIC MODULE ARCHITECTURE

**Version:** 2.0
**Date:** 2025-12-14
**Status:** Architecture Design

---

## CORE PRINCIPLE

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FASTHTML HUB (IMMUTABLE)                         │
│                                                                     │
│   • Server-side rendered                                            │
│   • Zero build step                                                 │
│   • Sub-100ms page loads                                            │
│   • Python-native simplicity                                        │
│   • HTMX for interactivity                                          │
│                                                                     │
│   Responsibilities:                                                 │
│   - Authentication & session                                        │
│   - Navigation & routing                                            │
│   - Theme injection                                                 │
│   - Module orchestration                                            │
│   - Layout (sidebar + workspace)                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Loads modules via
                              │ iframe / embed / API proxy
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    MODULES (ANY FRAMEWORK)                          │
│                                                                     │
│   Client A: React SPA          ──→ iframe src="/m/stj-react/"       │
│   Client B: FastHTML (native)  ──→ HTMX hx-get="/m/stj/"            │
│   Client C: Vue 3              ──→ iframe src="/m/stj-vue/"         │
│   Client D: Reflex             ──→ iframe src="/m/stj-reflex/"      │
│   Client E: Static HTML        ──→ HTMX hx-get="/m/stj-static/"     │
│                                                                     │
│   ALL modules receive:                                              │
│   - Theme contract (CSS variables)                                  │
│   - API endpoints (same backend)                                    │
│   - User context (auth token)                                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## WHY FASTHTML FOR THE HUB

| Requirement | FastHTML Advantage |
|-------------|-------------------|
| **Fast loads** | SSR = no JS bundle to download/parse |
| **Versatility** | Python functions return HTML directly |
| **Simplicity** | No webpack, no npm, no build step |
| **HTMX native** | First-class hypermedia support |
| **Theme injection** | CSS variables injected server-side |
| **Auth handling** | Session management in Python |

**The Hub is NOT a POC. It's production infrastructure.**

---

## MODULE LOADING STRATEGIES

### Strategy 1: Native FastHTML Modules (Recommended Default)

```python
# Hub loads FastHTML module directly via HTMX
Button(
    "STJ Dados",
    hx_get="/m/stj/",
    hx_target="#workspace",
    hx_swap="innerHTML"
)

# Module returns HTML fragment (not full page)
@rt("/m/stj/")
def stj_module():
    return Div(
        module_header("🔭", "STJ Dados Abertos"),
        search_form(),
        results_container(),
    )
```

**Best for:** Internal tools, simple UIs, maximum performance

### Strategy 2: Iframe Embed (For React/Vue/Svelte/etc)

```python
# Hub loads external framework via iframe
@rt("/m/stj-react/")
def stj_react_embed():
    return Div(
        Iframe(
            src="http://localhost:3001/stj",  # React app
            cls="module-iframe",
            style="width:100%; height:calc(100vh - 60px); border:none;",
        ),
        Script("""
            // Pass theme to iframe
            const iframe = document.querySelector('.module-iframe');
            iframe.onload = () => {
                iframe.contentWindow.postMessage({
                    type: 'THEME_UPDATE',
                    theme: getCurrentTheme()
                }, '*');
            };
        """),
    )
```

**Best for:** Client-specific UI requirements, complex SPAs

### Strategy 3: API Proxy (Module consumes backend only)

```python
# Hub serves static shell, module fetches data directly
@rt("/m/stj-custom/")
def stj_custom():
    return Div(
        H1("STJ Custom Module"),
        Div(id="custom-root"),
        Script(src="/static/modules/stj-custom/bundle.js"),
    )
```

**Best for:** Third-party integrations, client-developed modules

---

## THEME CONTRACT

### Definition (JSON Schema)

```json
{
  "$schema": "theme-contract-v1",
  "base": {
    "bg_primary": "#0a0f1a",
    "bg_secondary": "#0f172a",
    "text_primary": "#e2e8f0",
    "text_secondary": "#94a3b8",
    "border": "#1e293b",
    "success": "#22c55e",
    "danger": "#dc2626",
    "warning": "#eab308"
  },
  "modules": {
    "stj": {
      "accent": "#8b5cf6",
      "accent_secondary": "#7c3aed",
      "accent_glow": "rgba(139, 92, 246, 0.15)",
      "icon": "🔭",
      "name": "STJ Dados Abertos"
    },
    "text_extractor": {
      "accent": "#d97706",
      "accent_secondary": "#b45309",
      "accent_glow": "rgba(217, 119, 6, 0.15)",
      "icon": "⚙️",
      "name": "Text Extractor"
    }
  }
}
```

### CSS Variables (Generated from contract)

```css
:root {
  /* Base (always present) */
  --bg-primary: #0a0f1a;
  --bg-secondary: #0f172a;
  --text-primary: #e2e8f0;
  --success: #22c55e;
  --danger: #dc2626;

  /* Module-specific (switched on navigation) */
  --accent: #8b5cf6;
  --accent-secondary: #7c3aed;
  --accent-glow: rgba(139, 92, 246, 0.15);
}
```

### Framework Adapters

**For React/Vue/etc (iframe):**
```javascript
// Listen for theme from parent Hub
window.addEventListener('message', (event) => {
  if (event.data.type === 'THEME_UPDATE') {
    const theme = event.data.theme;
    document.documentElement.style.setProperty('--accent', theme.accent);
    // ... apply other variables
  }
});
```

**For FastHTML (native):**
```python
# Already injected via CSS in page head
# Just use: cls="text-accent" or style="color: var(--accent)"
```

**For Tailwind projects:**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        accent: 'var(--accent)',
        'accent-secondary': 'var(--accent-secondary)',
      }
    }
  }
}
```

---

## DIRECTORY STRUCTURE

```
legal-workbench/
├── hub/                          ← FastHTML Hub (PRODUCTION)
│   ├── main.py                   # Entry point
│   ├── core/
│   │   ├── loader.py             # Module registry
│   │   ├── themes.py             # Theme system
│   │   └── auth.py               # Session management
│   ├── layouts/
│   │   ├── shell.py              # Main layout
│   │   └── sidebar.py            # Navigation
│   ├── static/
│   │   ├── theme-contract.json   # The contract
│   │   └── theme-bridge.js       # iframe communication
│   └── requirements.txt
│
├── modules/                      ← Production modules
│   ├── stj/                      # FastHTML native
│   │   ├── __init__.py
│   │   ├── routes.py
│   │   └── components.py
│   ├── text-extractor/           # FastHTML native
│   └── doc-assembler/            # FastHTML native
│
├── modules-external/             ← Client-specific frameworks
│   ├── stj-react/                # React version (if client wants)
│   ├── stj-vue/                  # Vue version (if client wants)
│   └── README.md                 # "How to add framework module"
│
├── api/                          ← Backend services (framework-agnostic)
│   ├── stj-service/
│   ├── text-extractor-service/
│   └── doc-assembler-service/
│
├── themes/                       ← Theme definitions
│   ├── contract.json             # Universal schema
│   ├── modules.json              # Module assignments
│   └── generator.py              # CSS generation
│
└── docker/                       ← Deployment
    ├── docker-compose.yml
    └── services/
```

---

## MODULE REGISTRATION

### For FastHTML Modules (Native)

```python
# modules/stj/__init__.py

from .routes import app

meta = {
    "id": "stj",
    "name": "STJ Dados Abertos",
    "icon": "🔭",
    "type": "fasthtml",              # Native integration
    "theme_id": "stj",
    "mount_path": "/m/stj",
}
```

### For External Framework Modules

```python
# modules-external/stj-react/module.json
{
    "id": "stj-react",
    "name": "STJ Dados Abertos (React)",
    "icon": "🔭",
    "type": "iframe",                 # Iframe integration
    "theme_id": "stj",
    "source": "http://localhost:3001",
    "mount_path": "/m/stj-react"
}
```

### Hub Module Loader

```python
# hub/core/loader.py

def load_module(module_meta: dict):
    if module_meta["type"] == "fasthtml":
        # Mount directly to app
        app.mount(module_meta["mount_path"], module_meta["app"])

    elif module_meta["type"] == "iframe":
        # Create iframe wrapper route
        @rt(f"{module_meta['mount_path']}/")
        def iframe_wrapper():
            return IframeEmbed(
                src=module_meta["source"],
                theme_id=module_meta["theme_id"]
            )
```

---

## CLIENT FLEXIBILITY MATRIX

| Client Request | Solution | Integration |
|----------------|----------|-------------|
| "We want simple, fast UI" | FastHTML module | Native HTMX |
| "Our team knows React" | React module | Iframe + theme bridge |
| "We need Vue ecosystem" | Vue module | Iframe + theme bridge |
| "We're Python-only shop" | Reflex module | Iframe + theme bridge |
| "Custom internal framework" | Any JS framework | Iframe + API contract |
| "Static HTML + vanilla JS" | Static module | HTMX + CSS vars |

---

## MIGRATION PATH FROM POCS

### POCs → Production

| POC | Status | Migration |
|-----|--------|-----------|
| `poc-fasthtml-stj/` | Most mature | → `modules/stj/` (native) |
| `poc-react-stj/` | Reference | → `modules-external/stj-react/` (optional) |
| `poc-reflex-stj/` | Reference | → Archive or client-specific |

### Action Plan

1. **Extract** FastHTML POC → Production `modules/stj/`
2. **Build** Hub using patterns from POC
3. **Archive** React/Reflex POCs (available if client requests)
4. **Document** "How to add framework module"

---

## BENEFITS SUMMARY

| Benefit | How Achieved |
|---------|--------------|
| **Fast loads** | FastHTML Hub = SSR, no JS bundle |
| **Any framework** | Iframe integration + theme bridge |
| **Theme consistency** | CSS variables contract |
| **Code simplicity** | Hub is pure Python |
| **Client flexibility** | "What framework do you want?" |
| **Maintainability** | Native modules in FastHTML, external are isolated |

---

## NON-NEGOTIABLES

1. **Hub is FastHTML** — No exceptions
2. **Theme contract is universal** — All modules respect CSS variables
3. **Backends are framework-agnostic** — API services don't care about frontend
4. **Native modules preferred** — External frameworks only when client requires

---

**Next Steps:**
1. Approve this architecture
2. Build the FastHTML Hub (based on existing execution plan)
3. Extract STJ module from POC to production
4. Document the iframe integration pattern
