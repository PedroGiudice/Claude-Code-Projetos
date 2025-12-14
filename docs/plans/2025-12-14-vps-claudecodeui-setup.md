# VPS Setup para ClaudeCodeUI - Acesso Mobile de Qualquer Lugar

**Objetivo:** Rodar claudecodeui numa VPS para acessar Claude Code do celular, de qualquer lugar, sem depender de PC ligado.

**Arquitetura Final:**
```
┌────────────────────────────────────────────────────────────┐
│                    VPS (Hetzner/DigitalOcean)              │
│                                                            │
│  ┌─────────────────┐    ┌──────────────────┐              │
│  │  claudecodeui   │ ─→ │   Claude CLI     │ ─→ API       │
│  │  (porta 3001)   │    │   (subprocess)   │    Anthropic │
│  └─────────────────┘    └──────────────────┘              │
│           ↑                                                │
│      Tailscale (VPN)                                       │
└────────────────────────────────────────────────────────────┘
                    ↑
            ┌───────┴───────┐
            │  📱 Celular   │
            │  (Tailscale)  │
            └───────────────┘
```

---

## Escolha de VPS

| Provider | Plano | vCPU | RAM | Storage | Preço/mês | Região |
|----------|-------|------|-----|---------|-----------|--------|
| **Hetzner** | CX22 | 2 | 4GB | 40GB | €4.51 (~R$28) | Alemanha |
| **DigitalOcean** | Basic | 1 | 1GB | 25GB | $6 (~R$36) | NYC/AMS |
| **Vultr** | Cloud | 1 | 1GB | 25GB | $5 (~R$30) | Miami |
| **Oracle Cloud** | Free Tier | 2 | 1GB | 50GB | $0 (grátis) | São Paulo |

**Recomendação:** Hetzner CX22 - melhor custo-benefício, 4GB RAM permite múltiplas sessões Claude.

**Oracle Free Tier** é opção se quiser $0, mas:
- Limite de 1GB RAM (apertado)
- Pode ser desativado sem aviso
- Setup mais complexo

---

## Pré-requisitos

1. **Conta no provider** (Hetzner, DO, etc.)
2. **Chave SSH** gerada localmente
3. **Conta Anthropic** com Claude CLI autenticado
4. **Conta Tailscale** (gratuita)

---

## Task 1: Criar VPS

### Hetzner (Recomendado)

1. Criar conta em https://console.hetzner.cloud
2. Criar projeto "claude-code"
3. Adicionar chave SSH (Settings → SSH Keys)
4. Criar servidor:
   - Location: Nuremberg (mais barato)
   - Image: Ubuntu 24.04
   - Type: CX22 (2 vCPU, 4GB RAM)
   - SSH Key: sua chave
   - Name: claude-code-vps

**Tempo:** ~2 minutos
**Custo:** €4.51/mês (cobrado por hora se deletar antes)

---

## Task 2: Setup Inicial da VPS

### Conectar via SSH

```bash
ssh root@<IP_DA_VPS>
```

### Script de Setup (rodar na VPS)

```bash
#!/bin/bash
set -e

# === 1. Update sistema ===
apt update && apt upgrade -y

# === 2. Criar usuário não-root ===
useradd -m -s /bin/bash claude
echo "claude ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers
mkdir -p /home/claude/.ssh
cp ~/.ssh/authorized_keys /home/claude/.ssh/
chown -R claude:claude /home/claude/.ssh

# === 3. Instalar Node.js 20 LTS ===
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# === 4. Instalar PM2 ===
npm install -g pm2

# === 5. Instalar claudecodeui ===
npm install -g @siteboon/claude-code-ui

# === 6. Instalar Tailscale ===
curl -fsSL https://tailscale.com/install.sh | sh

# === 7. Instalar Claude CLI ===
npm install -g @anthropic-ai/claude-code

# === 8. Configurar firewall básico ===
apt install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 41641/udp  # Tailscale
ufw --force enable

echo "✅ Setup básico completo!"
echo "Próximo: rodar 'tailscale up' e autenticar"
```

Salvar como `/root/setup.sh` e executar:
```bash
chmod +x /root/setup.sh && ./root/setup.sh
```

---

## Task 3: Configurar Tailscale

### Na VPS

```bash
sudo tailscale up
```

Isso vai mostrar um link. Abra no browser para autenticar.

Após autenticar:
```bash
tailscale ip -4
# Anote o IP: 100.x.x.x
```

### No Celular

1. Instalar Tailscale (App Store / Play Store)
2. Fazer login com mesma conta
3. Pronto - seu celular e a VPS estão na mesma rede privada

---

## Task 4: Autenticar Claude CLI

### Na VPS (como usuário claude)

```bash
su - claude
claude
# Seguir instruções para autenticar via browser
# Isso salva o token em ~/.config/claude/
```

---

## Task 5: Configurar claudecodeui com PM2

### Criar diretório de trabalho

```bash
su - claude
mkdir -p ~/projects
cd ~/projects
git clone https://github.com/PedroGiudice/Claude-Code-Projetos.git  # ou seus repos
```

### Configurar PM2

```bash
cat > ~/pm2-ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'claude-code-ui',
      script: 'claude-code-ui',
      cwd: '/home/claude',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 1000,
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};
EOF

pm2 start ~/pm2-ecosystem.config.js
pm2 startup systemd -u claude --hp /home/claude
pm2 save
```

### Verificar

```bash
pm2 status
curl -s localhost:3001 | head -5
```

---

## Task 6: Acessar do Celular

### Primeiro acesso

1. Abrir browser no celular
2. Acessar: `http://100.x.x.x:3001` (IP Tailscale da VPS)
3. Interface do claudecodeui deve carregar

### Adicionar como PWA (atalho na home)

**iOS (Safari):**
1. Abrir a URL no Safari
2. Tap no ícone de compartilhar
3. "Add to Home Screen"

**Android (Chrome):**
1. Abrir a URL no Chrome
2. Menu (3 pontos) → "Add to Home screen"

---

## Task 7: Segurança Adicional (Opcional)

### Desabilitar acesso SSH por senha

```bash
# /etc/ssh/sshd_config
PasswordAuthentication no
PermitRootLogin prohibit-password
```

```bash
sudo systemctl restart sshd
```

### Fail2ban para proteção

```bash
apt install -y fail2ban
systemctl enable fail2ban
```

### Acesso HTTPS via Cloudflare Tunnel (se quiser domínio)

```bash
# Instalar cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared

# Autenticar e criar tunnel
cloudflared tunnel login
cloudflared tunnel create claude-ui
cloudflared tunnel route dns claude-ui claude.seudominio.com

# Configurar
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: claude-ui
credentials-file: /home/claude/.cloudflared/<ID>.json
ingress:
  - hostname: claude.seudominio.com
    service: http://localhost:3001
  - service: http_status:404
EOF

# Rodar via PM2
pm2 start cloudflared --name "cf-tunnel" -- tunnel run
pm2 save
```

---

## Checklist Final

- [ ] VPS criada e acessível via SSH
- [ ] Node.js 20+ instalado
- [ ] Tailscale rodando na VPS
- [ ] Tailscale instalado no celular
- [ ] Claude CLI autenticado na VPS
- [ ] claudecodeui rodando via PM2
- [ ] Acessível via `http://100.x.x.x:3001` do celular
- [ ] PWA instalado na home do celular

---

## Custos Estimados

| Item | Custo Mensal |
|------|--------------|
| VPS Hetzner CX22 | €4.51 (~R$28) |
| Tailscale | $0 (free tier) |
| Claude API | Conforme uso |
| **Total fixo** | **~R$28/mês** |

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| Não conecta via Tailscale | `sudo tailscale up --reset` |
| claudecodeui não inicia | `pm2 logs claude-code-ui` |
| Claude CLI não autenticado | `claude --version` e re-autenticar |
| "No projects found" | Criar projeto: `cd ~/projects && claude` |
| Lentidão | Verificar RAM: `htop` |
| SSH desconecta | Usar `tmux` ou `screen` |

---

## Comandos Úteis

```bash
# Status geral
pm2 status
tailscale status

# Logs
pm2 logs claude-code-ui --lines 100

# Reiniciar serviço
pm2 restart claude-code-ui

# Verificar recursos
htop
df -h

# IP Tailscale
tailscale ip -4
```

---

## Próximos Passos

1. **Criar VPS no Hetzner** (ou provider preferido)
2. **Rodar script de setup**
3. **Autenticar Tailscale e Claude CLI**
4. **Testar do celular**
5. **(Opcional)** Clonar seus repos para a VPS

Quer que eu detalhe alguma parte específica ou está pronto para começar?
