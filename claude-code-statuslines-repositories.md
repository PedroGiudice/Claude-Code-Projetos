# Repositórios de Statuslines para Claude Code CLI

## Resumo Executivo

Esta é uma compilação dos principais repositórios com templates e modelos de statuslines para Claude Code CLI, organizados por tecnologia, nível de customização e design visual.

---

## 1. ccstatusline (JavaScript/TypeScript - React/Ink)
**Autor:** @sirmalloc  
**GitHub:** https://github.com/sirmalloc/ccstatusline  
**Stars:** 698+ | **Licença:** MIT

### Características Principais
- ⚡ **TUI Interativo:** Interface de configuração completa usando React/Ink
- 🎨 **Powerline Mode:** Separadores em arrow, caps customizáveis
- 🌈 **Suporte Avançado de Cores:** Basic (16), 256-color, truecolor (hex)
- 📐 **Multi-linha:** Até 3 linhas independentes de status
- 🔗 **Widget Merging:** Mesclar widgets com/sem padding
- 🔤 **Separadores Customizáveis:** Suporte a fontes Powerline
- 🚀 **Auto Font Install:** Instalação automática de fontes Powerline
- 📊 **Métricas em Tempo Real:** Model, git, tokens, session duration, block timer

### Instalação
```bash
# Com npm
npx ccstatusline@latest

# Com Bun (mais rápido)
bunx ccstatusline@latest

# Instalação global
npm install -g ccstatusline
```

### Configuração no Claude Code
```json
{
  "statusLine": {
    "type": "command",
    "command": "npx -y ccstatusline",
    "padding": 0
  }
}
```

### Widgets Disponíveis
- Model Name
- Context Percentage (dinâmico: 1M para Sonnet 4.5, 200k outros)
- Context Percentage (usable) - considera auto-compact em 80%
- Git Branch com status (clean/dirty)
- Token Usage (total, input, output, cache)
- Session Duration
- Block Timer (5-hour window tracking)
- Custom Text
- Custom Command (shell commands)
- Separator (visual dividers)

### Integração com ccusage
Pode integrar ccusage para tracking de custos em tempo real:
```bash
npx -y ccusage@latest statusline
```

### Exemplo de Uso
- Temas built-in prontos para copiar e customizar
- TUI permite preview em tempo real
- Suporte a flex separators para ajuste automático de largura

---

## 2. claude-powerline (TypeScript/Node)
**Autor:** @Owloops  
**GitHub:** https://github.com/Owloops/claude-powerline  
**Licença:** MIT

### Características Principais
- 🎨 **5 Temas Built-in:** dark, light, nord, tokyo-night, rose-pine
- ⚡ **3 Estilos de Separadores:** minimal, powerline, capsule
- 💰 **Cost Tracking:** Custo de sessão em tempo real
- 📊 **Métricas de Performance:** Average e last response times
- 🌿 **Git Integration:** Branch, commits ahead/behind, working tree status
- 🎯 **Custom Theme Support:** Configuração completa de cores em JSON

### Instalação
```bash
npm install -g @owloops/claude-powerline
```

### Configuração no Claude Code
```json
{
  "statusLine": {
    "type": "command",
    "command": "npx -y @owloops/claude-powerline && echo \" $(date +%H:%M)\"",
    "padding": 0
  }
}
```

### Opções CLI
```bash
# Usando temas
claude-powerline --theme=nord --style=powerline
claude-powerline --theme=dark --style=capsule

# Config personalizado
claude-powerline --config=/path/to/config.json
```

### Variáveis de Ambiente
```bash
export CLAUDE_POWERLINE_THEME=dark
export CLAUDE_POWERLINE_STYLE=powerline
export CLAUDE_POWERLINE_CONFIG=/path/to/config.json
export CLAUDE_POWERLINE_DEBUG=1
```

### Exemplo de Custom Theme
```json
{
  "theme": "custom",
  "display": {
    "colorCompatibility": "auto"
  },
  "colors": {
    "custom": {
      "directory": {
        "bg": "#ff6600",
        "fg": "#ffffff"
      },
      "git": {
        "bg": "#0066cc",
        "fg": "#ffffff"
      },
      "session": {
        "bg": "#cc0099",
        "fg": "#ffffff"
      }
    }
  }
}
```

### Baixar Config Exemplo
```bash
curl -o ~/.claude/claude-powerline.json \
  https://raw.githubusercontent.com/Owloops/claude-powerline/main/.claude-powerline.json
```

### Git Widgets Customizáveis
```json
"git": {
  "enabled": true,
  "showSha": true,
  "showWorkingTree": false,
  "showOperation": false,
  "showTag": false,
  "showTimeSinceCommit": false,
  "showStashCount": false,
  "showUpstream": false,
  "showRepoName": false
}
```

---

## 3. claudia-statusline (Rust)
**Autor:** @hagan (Hagan Franks)  
**GitHub:** https://github.com/hagan/claudia-statusline  
**Licença:** MIT

### Características Principais
- ⚡ **Alta Performance:** Escrito em Rust, extremamente rápido
- 🎨 **11 Temas Embarcados:** dark, light, monokai, solarized, high-contrast, gruvbox, nord, dracula, one-dark, tokyo-night, catppuccin
- 💾 **Persistência Local:** SQLite (~/.local/share/claudia-statusline/stats.db)
- 🔄 **Hook-Based Detection:** Detecção de compactação ~600x mais rápida
- 📊 **Progress Bars:** Visualização de contexto e custos
- ☁️ **Cloud Sync Opcional:** Turso sync (experimental)
- 🪟 **Multiplataforma:** Linux, macOS, Windows

### Instalação Rápida
```bash
curl -fsSL https://raw.githubusercontent.com/hagan/claudia-statusline/main/scripts/quick-install.sh | bash
```

### Build Manual
```bash
git clone https://github.com/hagan/claudia-statusline
cd claudia-statusline
./scripts/install-statusline.sh

# Ou manualmente
cargo build --release

# Com Turso sync
cargo build --release --features turso-sync
```

### Configuração de Hooks (Opcional para Performance)
```json
{
  "hooks": {
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "statusline hook precompact"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "statusline hook stop"
          }
        ]
      }
    ]
  }
}
```

### Comandos Úteis
```bash
# Status de context learning
statusline context-learning --status

# Ver observações detalhadas
statusline context-learning --details

# Reset de dados aprendidos
statusline context-learning --reset

# Rebuild do histórico
statusline context-learning --rebuild
```

### Estados de Compactação
- **In Progress:** Compacting... ⠋ (hook-based, <1ms detection)
- **Completed:** 35% [===>------] ✓

---

## 4. CCometixLine (Rust)
**Autor:** @Haleclipse  
**GitHub:** https://github.com/Haleclipse/CCometixLine  
**Licença:** MIT

### Características Principais
- ⚡ **Rust Performance:** Alta performance e baixo consumo
- 🖥️ **TUI Interativo:** Configuração via terminal UI
- 🌿 **Git Integration:** Branch, status, tracking info
- 📊 **Context Window:** Tracking de uso com limite dinâmico
- 🔧 **Utility Tools:** tweakcc para customização de temas e verbs

### Instalação
```bash
# Via npm
npm install -g @cometix/ccline

# Manual Linux
mkdir -p ~/.claude/ccline
wget https://github.com/Haleclipse/CCometixLine/releases/latest/download/ccline-linux-x64.tar.gz
tar -xzf ccline-linux-x64.tar.gz
cp ccline ~/.claude/ccline/
chmod +x ~/.claude/ccline/ccline
```

### Configuração
```json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/ccline/ccline",
    "padding": 0
  }
}
```

### Comandos de Configuração
```bash
# Inicializar config
ccline --init

# Verificar config
ccline --check

# Imprimir config atual
ccline --print

# TUI de configuração
ccline --config
```

---

## 5. claude-code-statusline (Bash/Shell)
**Autor:** @rz1989s  
**GitHub:** https://github.com/rz1989s/claude-code-statusline  
**Licença:** MIT

### Características Principais
- 🎨 **3 Temas Elegantes:** Classic, Garden (pastels), Catppuccin Mocha
- 💰 **Cost Tracking Integrado:** Integração completa com ccusage
- 🔌 **MCP Server Monitoring:** Status de servidores MCP em tempo real
- 📐 **4-Line Layout:** Layout multi-linha para máxima informação
- ⚡ **Sistema de Cache Inteligente:** Cache por tipo de operação
- 🌐 **Overrides via ENV:** ENV_CONFIG_* sobrescreve todas configurações

### Sistema de Cache
```
/tmp/.claude_statusline_cache/
├── cmd_exists_git_12345.cache          # Session-wide
├── cmd_exists_claude_12345.cache       # Session-wide
├── git_is_repo_path_hash_12345.cache   # 30s cache
├── git_branch_repo_hash_12345.cache    # 10s cache
├── git_status_repo_hash_12345.cache    # 5s cache
├── external_claude_version_12345.cache # 6h cache
├── external_claude_mcp_list_12345.cache # 2m cache
├── system_os_shared.cache              # Permanent
└── system_arch_shared.cache            # Permanent
```

### Instalação
```bash
# Instalação recomendada (com revisão)
curl -fsSL https://raw.githubusercontent.com/rz1989s/claude-code-statusline/main/install.sh -o install.sh
less install.sh  # Revisar antes de executar
bash install.sh

# Instalação direta
curl -fsSL https://raw.githubusercontent.com/rz1989s/claude-code-statusline/main/install.sh | bash
```

### Instalação Manual
```bash
# 1. Criar estrutura
mkdir -p ~/.claude/statusline/{lib,examples}

# 2. Baixar arquivos core
curl -fsSL https://raw.githubusercontent.com/rz1989s/claude-code-statusline/main/statusline.sh \
  -o ~/.claude/statusline/statusline.sh

curl -fsSL https://raw.githubusercontent.com/rz1989s/claude-code-statusline/main/examples/Config.toml \
  -o ~/.claude/statusline/Config.toml

# 3. Baixar módulos
curl -fsSL https://raw.githubusercontent.com/rz1989s/claude-code-statusline/main/install.sh | \
  bash -s -- --modules-only

# 4. Tornar executável
chmod +x ~/.claude/statusline/statusline.sh
```

### Configuração Unificada
Localização: `~/.claude/statusline/Config.toml`

```toml
# Rich CLI Interface
# Theme System com cores customizáveis
# Live Reload com --watch-config
# 100% Backwards Compatible
```

---

## 6. claude-statusline (Python)
**Autor:** @ersinkoc  
**GitHub:** https://github.com/ersinkoc/claude-statusline  

### Características Principais
- 🎨 **100+ Temas Powerline:** Maior coleção de temas profissionais
- 🌈 **RGB Colors:** True color output com esquemas suaves
- 🔧 **Interactive Theme Browser:** Navegação com preview ao vivo
- 🎯 **Custom Theme Builder:** Criar e salvar designs próprios
- 📊 **Analytics Avançado:** Sistema completo de tracking e relatórios
- 🔄 **Background Daemon:** Monitoramento contínuo

### Instalação
```bash
pip install claude-statusline
```

### Comandos Core
```bash
# Status atual
claude-statusline status

# Browser de temas interativo
claude-statusline theme

# Daemon
claude-statusline daemon --start

# Rebuild database
claude-statusline rebuild
```

### Comandos de Analytics
```bash
claude-statusline analytics      # Analytics avançado
claude-statusline trends         # Tendências de uso
claude-statusline health         # Monitoramento de saúde
claude-statusline budget         # Gestão de budget
claude-statusline sessions       # Análise de sessões
claude-statusline model-sessions # Estatísticas por modelo
claude-statusline costs          # Análise de custos
claude-statusline daily          # Relatórios diários
claude-statusline heatmap        # Heatmaps de atividade
claude-statusline summary        # Estatísticas resumidas
```

### Utilities
```bash
claude-statusline update-prices  # Atualizar preços de modelos
claude-statusline verify         # Verificar cálculos de custo
claude-statusline rotate         # Configurar rotação de temas
```

---

## 7. cc-statusline (Node/Shell Hybrid)
**Autor:** @chongdashu  
**GitHub:** https://github.com/chongdashu/cc-statusline  
**Licença:** MIT

### Características Principais
- 🚀 **Setup Rápido:** Um comando, três perguntas
- 📦 **Zero Dependencies:** Script shell autossuficiente
- 🔒 **File-Based Locking:** Previne spawning concorrente de processos
- 🎨 **Force Colors:** Otimizado para Claude Code (respeita NO_COLOR)
- 🌍 **Environment Respect:** Honra convenções de terminal

### Instalação
```bash
npm install -g @chong/cc-statusline
cc-statusline init
```

### Estrutura
```
.claude/
├── statusline.sh        # Script gerado
└── settings.json        # Auto-atualizado
```

### Opções CLI
```bash
# Localização customizada
cc-statusline init --output ./my-statusline.sh

# Skip auto-instalação
cc-statusline init --no-install

# Instalação global
npm install -g @chong/cc-statusline
```

### Teste Antes de Usar
```bash
echo '{}' | .claude/statusline.sh
```

### Teste de Locking
```bash
# Spawn 10 processos concorrentes
for i in {1..10}; do 
  echo '{}' | ./test/test-statusline-with-lock.sh & 
done
```

---

## Comparação Rápida

| Projeto | Linguagem | Temas | TUI | Performance | Complexidade |
|---------|-----------|-------|-----|-------------|--------------|
| ccstatusline | TypeScript/React | Múltiplos + Custom | ✅ Excelente | ⚡ Boa | 🔧 Média |
| claude-powerline | TypeScript | 5 + Custom | ❌ CLI | ⚡ Boa | 🔧 Baixa |
| claudia-statusline | Rust | 11 Built-in | ❌ CLI | 🚀 Excelente | 🔧 Média |
| CCometixLine | Rust | Customizável | ✅ Bom | 🚀 Excelente | 🔧 Média |
| claude-code-statusline | Bash | 3 Elegantes | ❌ Config File | ⚡ Boa | 🔧 Baixa |
| claude-statusline | Python | 100+ | ✅ Excelente | ⚡ Média | 🔧 Alta |
| cc-statusline | Node/Shell | Básico | ❌ Wizard | ⚡ Boa | 🔧 Muito Baixa |

---

## Recomendações por Caso de Uso

### Para Máxima Customização Visual
1. **ccstatusline** - TUI interativo, powerline mode, widget merging
2. **claude-statusline** (Python) - 100+ temas, theme builder

### Para Performance Extrema
1. **claudia-statusline** - Rust com SQLite persistence, hook-based
2. **CCometixLine** - Rust com TUI, git integration

### Para Setup Rápido e Simples
1. **cc-statusline** - Wizard de 3 perguntas, zero config
2. **claude-powerline** - 5 temas prontos, CLI simples

### Para Analytics e Tracking
1. **claude-statusline** (Python) - Sistema completo de analytics
2. **claudia-statusline** - Persistent stats tracking

### Para Estilo Vim Powerline
1. **claude-powerline** - Vim-style com múltiplos estilos de separadores
2. **ccstatusline** - Powerline mode com customização avançada

---

## Recursos Adicionais

### Awesome Claude Code
**GitHub:** https://github.com/hesreallyhim/awesome-claude-code  
Lista curada de comandos, arquivos e workflows para Claude Code, incluindo seção dedicada a statuslines.

### Claude Hub - CCometixLine
**URL:** https://www.claude-hub.com/resource/github-cli-Haleclipse-CCometixLine/  
Documentação e guias para CCometixLine.

### ClaudeLog - ccstatusline
**URL:** https://claudelog.com/claude-code-mcps/ccstatusline/  
Tutoriais e best practices para ccstatusline.

---

## Ferramentas Complementares

### ccusage
**GitHub:** https://github.com/ryoppippi/ccusage  
Tracking e display de métricas de uso do Claude Code. Pode ser integrado diretamente em statuslines via custom commands.

### ccstat (Rust)
**GitHub:** https://github.com/hydai/ccstat  
Reimplementação em Rust do ccusage, com:
- Live billing block monitor
- Parallel processing
- String interning e arena allocation
- Docker support

---

## Dicas de Implementação

### 1. Fontes Powerline
Para melhor visualização de statuslines com powerline:

```bash
# Instalar fontes Powerline
git clone https://github.com/powerline/fonts.git --depth=1
cd fonts
./install.sh
cd ..
rm -rf fonts
```

Fontes recomendadas:
- Source Code Pro for Powerline
- Fira Code
- Meslo LG for Powerline

### 2. Cores no Terminal
Verificar suporte a cores:

```bash
# 256 cores
tput colors

# True color test
printf "\x1b[38;2;255;100;0mTRUECOLOR\x1b[0m\n"
```

### 3. Performance
Para statuslines que chamam comandos externos:
- Use caching agressivo para operações lentas (git status, network calls)
- Configure timeouts apropriados (5s recomendado)
- Evite operações bloqueantes

### 4. Debugging
Variáveis de ambiente úteis:

```bash
# Debug geral
export DEBUG=1
export CLAUDE_POWERLINE_DEBUG=1
export RUST_LOG=debug

# Sem cores (útil para debug)
export NO_COLOR=1
```

---

## Conclusão

A escolha da statusline ideal depende de suas prioridades:

- **Beleza e Customização:** ccstatusline ou claude-statusline (Python)
- **Performance:** claudia-statusline ou CCometixLine (Rust)
- **Simplicidade:** cc-statusline ou claude-powerline
- **Analytics:** claude-statusline (Python)

Todos os projetos são open-source e ativamente mantidos, com comunidades ativas no GitHub. A maioria suporta integração com ccusage para tracking de custos em tempo real.

**Próximos Passos:**
1. Escolher 2-3 opções baseado em suas necessidades
2. Testar cada uma em ambiente de desenvolvimento
3. Customizar cores/temas conforme preferência
4. Integrar com ccusage para tracking de custos (se necessário)
5. Configurar caching e timeouts para performance ótima
