# ClaudeCodeUI Integration into Legal-Workbench

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Substituir o wrapper Streamlit customizado pelo siteboon/claudecodeui, integrando-o como módulo do Legal-Workbench com suporte a acesso mobile remoto.

**Architecture:** O claudecodeui roda como serviço separado (porta 3001) gerenciado pelo PM2. O Legal-Workbench (Streamlit, porta 8501) adiciona link na sidebar que abre o claudecodeui em nova aba. Para mobile, usamos Tailscale ou Cloudflare Tunnel para acesso seguro de qualquer lugar.

**Tech Stack:** Node.js (claudecodeui), Python/Streamlit (Legal-Workbench), PM2 (process manager), Tailscale/Cloudflare Tunnel (acesso remoto)

---

## Pre-requisitos

- Node.js v18+ instalado
- PM2 instalado globalmente (`npm install -g pm2`)
- Claude CLI configurado (`claude --version` funciona)
- Tailscale ou conta Cloudflare (para mobile)

---

## Task 1: Instalar e Testar ClaudeCodeUI

**Files:**
- Create: `~/.config/claude-code-ui/.env` (configuração)
- Verify: Node.js e npm funcionando

**Step 1: Verificar Node.js**

```bash
node --version
# Expected: v18.x.x ou superior
```

**Step 2: Instalar claudecodeui globalmente**

```bash
npm install -g @siteboon/claude-code-ui
```

Expected output: Instalação sem erros, binário `claude-code-ui` disponível

**Step 3: Teste inicial (foreground)**

```bash
claude-code-ui
```

Expected:
```
Server running at http://localhost:3001
```

**Step 4: Verificar funcionamento no browser**

Abra http://localhost:3001 no browser
Expected: Interface do claudecodeui carrega, mostra lista de projetos Claude

**Step 5: Encerrar teste**

```bash
# Ctrl+C para parar o processo
```

**Edge-cases:**
- Se `node: command not found` → Instalar Node.js via nvm
- Se porta 3001 em uso → Verificar com `lsof -i :3001` e matar processo
- Se "No Claude projects found" → Executar `claude` em algum diretório primeiro

---

## Task 2: Configurar PM2 para Persistência

**Files:**
- Create: `~/pm2-ecosystem.config.js` (configuração PM2)

**Step 1: Verificar/instalar PM2**

```bash
which pm2 || npm install -g pm2
pm2 --version
```

Expected: PM2 versão 5.x.x

**Step 2: Criar arquivo de configuração PM2**

```bash
cat > ~/pm2-ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'claude-code-ui',
      script: 'claude-code-ui',
      cwd: process.env.HOME,
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 1000,
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '~/.pm2/logs/claude-code-ui-error.log',
      out_file: '~/.pm2/logs/claude-code-ui-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
};
EOF
```

**Step 3: Iniciar com PM2**

```bash
pm2 start ~/pm2-ecosystem.config.js
```

Expected:
```
[PM2] Starting /home/user/pm2-ecosystem.config.js
[PM2] Done.
┌─────┬─────────────────┬─────────┬─────────┬──────────┐
│ id  │ name            │ mode    │ status  │ cpu      │
├─────┼─────────────────┼─────────┼─────────┼──────────┤
│ 0   │ claude-code-ui  │ fork    │ online  │ 0%       │
└─────┴─────────────────┴─────────┴─────────┴──────────┘
```

**Step 4: Verificar status**

```bash
pm2 status
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001
```

Expected: Status "online", HTTP 200

**Step 5: Configurar auto-start no boot**

```bash
pm2 startup
# Execute o comando que ele retornar (sudo env PATH=...)
pm2 save
```

Expected: "Successfully saved"

**Step 6: Commit configuração**

```bash
cd /home/cmr-auto/claude-work/repos/Claude-Code-Projetos
git add docs/plans/2025-12-07-claudecodeui-integration.md
git commit -m "docs: add claudecodeui integration plan"
```

**Edge-cases:**
- Se PM2 não persiste após reboot → Verificar `pm2 startup` foi executado com sudo
- Se erro de permissão em logs → `mkdir -p ~/.pm2/logs && chmod 755 ~/.pm2/logs`
- Se processo crasha em loop → Verificar logs: `pm2 logs claude-code-ui --lines 50`

---

## Task 3: Integrar Link na Sidebar do Legal-Workbench

**Files:**
- Modify: `/home/cmr-auto/claude-work/repos/Claude-Code-Projetos/legal-workbench/app.py:162-181`

**Step 1: Ler arquivo atual para contexto**

```bash
cat /home/cmr-auto/claude-work/repos/Claude-Code-Projetos/legal-workbench/app.py
```

**Step 2: Adicionar seção TOOLS na sidebar com link para claudecodeui**

Localizar a função `main()` e modificar a sidebar (após "MODULES"):

```python
# Adicionar após linha 178 (após o loop dos módulos)

        st.markdown("#### TOOLS")

        # ClaudeCodeUI - abre em nova aba
        st.markdown(
            """
            <a href="http://localhost:3001" target="_blank" style="
                display: block;
                padding: 0.5rem 1rem;
                margin: 0.25rem 0;
                background-color: #0f172a;
                border: 1px solid #1e293b;
                border-radius: 4px;
                color: #94a3b8;
                text-decoration: none;
                font-size: 0.875rem;
                transition: all 0.2s;
            " onmouseover="this.style.backgroundColor='#1e293b'; this.style.borderColor='#475569'; this.style.color='#f1f5f9';"
               onmouseout="this.style.backgroundColor='#0f172a'; this.style.borderColor='#1e293b'; this.style.color='#94a3b8';">
                Claude Code UI
            </a>
            """,
            unsafe_allow_html=True
        )
```

**Step 3: Testar integração**

```bash
cd /home/cmr-auto/claude-work/repos/Claude-Code-Projetos/legal-workbench
source ../.venv/bin/activate
streamlit run app.py --server.port 8501
```

Expected: Legal-Workbench abre, sidebar mostra "TOOLS" com link "Claude Code UI"

**Step 4: Clicar no link**

Expected: Nova aba abre com http://localhost:3001 mostrando claudecodeui

**Step 5: Commit**

```bash
git add legal-workbench/app.py
git commit -m "feat(legal-workbench): add claudecodeui link to sidebar"
```

**Edge-cases:**
- Se link não abre em nova aba → Verificar `target="_blank"` presente
- Se estilo não aplica → Verificar `unsafe_allow_html=True`
- Se claudecodeui não carrega → Verificar PM2 rodando: `pm2 status`

---

## Task 4: Configurar Acesso Mobile Remoto (Tailscale)

**Files:**
- Modify: `~/.bashrc` (aliases)
- Create: Documentação de acesso

**Opção A: Tailscale (Recomendado - VPN mesh, zero-config)**

**Step 1: Instalar Tailscale**

```bash
curl -fsSL https://tailscale.com/install.sh | sh
```

**Step 2: Autenticar**

```bash
sudo tailscale up
# Seguir link para autenticar no browser
```

**Step 3: Obter IP Tailscale**

```bash
tailscale ip -4
# Output: 100.x.x.x
```

**Step 4: Testar acesso do celular**

1. Instalar Tailscale no celular (iOS/Android)
2. Autenticar com mesma conta
3. Acessar `http://100.x.x.x:3001` no browser do celular

Expected: claudecodeui carrega no celular

**Step 5: Adicionar à home screen (PWA)**

No browser do celular:
- Safari (iOS): Share → Add to Home Screen
- Chrome (Android): Menu → Add to Home Screen

Expected: Ícone na home, app abre em fullscreen como PWA

---

**Opção B: Cloudflare Tunnel (Alternativa - acesso público com auth)**

**Step 1: Instalar cloudflared**

```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb
```

**Step 2: Autenticar**

```bash
cloudflared tunnel login
```

**Step 3: Criar tunnel**

```bash
cloudflared tunnel create claude-ui
cloudflared tunnel route dns claude-ui claude-ui.seudominio.com
```

**Step 4: Configurar tunnel**

```bash
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: claude-ui
credentials-file: /home/cmr-auto/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: claude-ui.seudominio.com
    service: http://localhost:3001
  - service: http_status:404
EOF
```

**Step 5: Rodar tunnel via PM2**

```bash
pm2 start cloudflared --name "cloudflare-tunnel" -- tunnel run
pm2 save
```

**Edge-cases:**
- Tailscale não conecta → Verificar firewall: `sudo ufw allow 41641/udp`
- Cloudflare tunnel falha → Verificar DNS propagou: `dig claude-ui.seudominio.com`
- PWA não instala → Deve ser HTTPS (Tailscale ok, Cloudflare ok, localhost ok para dev)

---

## Task 5: Criar Aliases e Documentação

**Files:**
- Modify: `~/.bashrc`
- Create: `/home/cmr-auto/claude-work/repos/Claude-Code-Projetos/legal-workbench/README.md`

**Step 1: Adicionar aliases ao bashrc**

```bash
cat >> ~/.bashrc << 'EOF'

# === Legal Workbench ===
alias lw="cd /home/cmr-auto/claude-work/repos/Claude-Code-Projetos/legal-workbench && source ../.venv/bin/activate && streamlit run app.py --server.port 8501"
alias ccui-status="pm2 status claude-code-ui"
alias ccui-logs="pm2 logs claude-code-ui --lines 50"
alias ccui-restart="pm2 restart claude-code-ui"
EOF
source ~/.bashrc
```

**Step 2: Criar README do Legal-Workbench**

```bash
cat > /home/cmr-auto/claude-work/repos/Claude-Code-Projetos/legal-workbench/README.md << 'EOF'
# Legal Workbench

Dashboard integrado para ferramentas jurídicas.

## Quick Start

```bash
# Iniciar Legal-Workbench (Streamlit)
lw

# Verificar ClaudeCodeUI (PM2)
ccui-status
```

## Acesso

| Serviço | Local | Mobile (Tailscale) |
|---------|-------|-------------------|
| Legal-Workbench | http://localhost:8501 | http://100.x.x.x:8501 |
| ClaudeCodeUI | http://localhost:3001 | http://100.x.x.x:3001 |

## Módulos

- **Dashboard** - Status do sistema
- **Jurisprudence Search** - Busca de jurisprudência
- **Document Assembler** - Montagem de documentos
- **Case Analytics** - Análise de casos (disabled)

## Tools

- **Claude Code UI** - Interface web para Claude CLI (via sidebar)

## Mobile

1. Instale Tailscale no celular
2. Autentique com mesma conta
3. Acesse `http://100.x.x.x:3001`
4. Adicione à home screen (PWA)
EOF
```

**Step 3: Commit final**

```bash
cd /home/cmr-auto/claude-work/repos/Claude-Code-Projetos
git add legal-workbench/README.md
git add -A
git commit -m "feat: complete claudecodeui integration with mobile support"
```

---

## Task 6: Arquivar Wrapper Streamlit Antigo

**Files:**
- Move: `legal-workbench/ferramentas/claude-ui/` → `legal-workbench/ferramentas/_archived/claude-ui-streamlit/`

**Step 1: Criar diretório de arquivos**

```bash
mkdir -p /home/cmr-auto/claude-work/repos/Claude-Code-Projetos/legal-workbench/ferramentas/_archived
```

**Step 2: Mover wrapper antigo**

```bash
mv /home/cmr-auto/claude-work/repos/Claude-Code-Projetos/legal-workbench/ferramentas/claude-ui \
   /home/cmr-auto/claude-work/repos/Claude-Code-Projetos/legal-workbench/ferramentas/_archived/claude-ui-streamlit
```

**Step 3: Adicionar nota no diretório arquivado**

```bash
cat > /home/cmr-auto/claude-work/repos/Claude-Code-Projetos/legal-workbench/ferramentas/_archived/claude-ui-streamlit/ARCHIVED.md << 'EOF'
# ARCHIVED

Este wrapper Streamlit foi substituído pelo siteboon/claudecodeui em 2025-12-07.

**Motivo:** Solução open-source madura com 4.700 stars, 23 contributors, mais features (file explorer, git, terminal, PWA).

**Referência:** `docs/plans/2025-12-07-claudecodeui-integration.md`
EOF
```

**Step 4: Remover alias antigo do bashrc**

```bash
sed -i '/alias ccui=/d' ~/.bashrc
source ~/.bashrc
```

**Step 5: Commit arquivamento**

```bash
git add -A
git commit -m "chore: archive old streamlit wrapper, replaced by claudecodeui"
```

---

## Checklist Final

- [ ] `pm2 status` mostra claude-code-ui "online"
- [ ] http://localhost:3001 carrega claudecodeui
- [ ] http://localhost:8501 carrega Legal-Workbench
- [ ] Sidebar do Legal-Workbench tem link "Claude Code UI"
- [ ] Link abre claudecodeui em nova aba
- [ ] Tailscale instalado e conectado
- [ ] Celular acessa via IP Tailscale
- [ ] PWA instalado no celular
- [ ] Aliases `lw`, `ccui-status`, `ccui-logs`, `ccui-restart` funcionam
- [ ] Wrapper antigo arquivado em `_archived/`

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| PM2 não inicia após reboot | `pm2 startup` e executar comando sudo retornado |
| claudecodeui não responde | `pm2 restart claude-code-ui && pm2 logs` |
| Tailscale não conecta | `sudo tailscale up --reset` |
| PWA não instala | Deve ser HTTPS ou localhost |
| "No Claude projects found" | Executar `claude` em algum projeto primeiro |
| Porta em uso | `lsof -i :3001` e `kill -9 <PID>` |
