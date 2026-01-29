# Legal Workbench Desktop (Tauri)

Aplicativo desktop do Legal Workbench usando Tauri v2.

## Build

```bash
cd legal-workbench/frontend

# Instalar dependencias
bun install

# Build para producao
export TAURI_SIGNING_PRIVATE_KEY="$(cat ~/.tauri/lex-vector.key)"
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="lw"
bun run tauri build
```

### Artefatos gerados

| Formato | Localizacao | Uso |
|---------|-------------|-----|
| `.deb` | `target/release/bundle/deb/` | Instalacao Ubuntu/Debian |
| `.rpm` | `target/release/bundle/rpm/` | Instalacao Fedora/RHEL |
| `.AppImage` | `target/release/bundle/appimage/` | Auto-update Linux |

## Auto-Update

O sistema de auto-update do Tauri requer:

1. **Chaves de assinatura** em `~/.tauri/lex-vector.key`
2. **AppImage** (unico formato suportado para auto-update no Linux)
3. **latest.json** publicado no GitHub Releases

### Endpoint de update

```
https://github.com/PedroGiudice/lex-vector/releases/latest/download/latest.json
```

### Formato do latest.json

```json
{
  "version": "0.1.3",
  "notes": "Release notes aqui",
  "pub_date": "2026-01-27T20:00:00Z",
  "platforms": {
    "linux-x86_64": {
      "url": "https://github.com/.../Legal.Workbench_0.1.3_amd64.AppImage",
      "signature": "BASE64_SIGNATURE_AQUI"
    }
  }
}
```

## TODOs Pendentes

### Auto-Update (Prioridade Alta)

- [ ] **Configurar GitHub Actions para build de releases**
  - O Oracle Linux (servidor de build atual) nao gera AppImage corretamente
  - AppImage e OBRIGATORIO para auto-update no Linux
  - Usar runner Ubuntu em GitHub Actions

- [ ] **Workflow de release automatizado**
  - Trigger em tags `v*-tauri`
  - Build multi-plataforma (Linux AppImage, Windows MSI, macOS DMG)
  - Upload automatico de artefatos
  - Geracao automatica do `latest.json` com assinaturas

- [ ] **Armazenar chave privada no GitHub Secrets**
  - `TAURI_SIGNING_PRIVATE_KEY`
  - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

### Melhorias Futuras

- [ ] Build para Windows (MSI)
- [ ] Build para macOS (DMG)
- [ ] Notificacao visual de update melhorada
- [ ] Changelog inline no dialog de update

## Chaves de Assinatura

As chaves estao em `~/.tauri/`:
- `lex-vector.key` - Chave privada (NUNCA commitar)
- `lex-vector.key.pub` - Chave publica (configurada em `tauri.conf.json`)

Senha da chave: `lw`

Para regenerar chaves:
```bash
bun tauri signer generate -p "nova-senha" -w ~/.tauri/lex-vector.key --force
```

**IMPORTANTE**: Ao regenerar chaves, atualizar `pubkey` em `tauri.conf.json`.

## Workflow: VM Build -> Instalacao Local

O build e feito na VM Oracle (lw-pro) e transferido via Tailscale para a maquina local.

### IPs Tailscale

| Maquina | IP | Papel |
|---------|-----|-------|
| VM Oracle (lw-pro) | 100.114.203.28 | Build server |
| Notebook Linux | 100.102.249.9 | Desktop local |

### 1. Build na VM (executado pelo Claude)

```bash
cd legal-workbench/frontend
bun run tauri build --bundles deb
```

Artefato gerado: `src-tauri/target/release/bundle/deb/Legal Workbench_X.Y.Z_amd64.deb`

### 2. Transferir para maquina local

**No notebook Linux:**
```bash
# Copiar .deb da VM
scp opc@100.114.203.28:/home/opc/lex-vector/legal-workbench/frontend/src-tauri/target/release/bundle/deb/*.deb ~/Downloads/

# Instalar
sudo dpkg -i ~/Downloads/Legal\ Workbench_*.deb
```

### 3. Executar

```bash
# Via launcher do sistema ou:
legal-workbench
```

---

## Instalacao Manual

```bash
# Ubuntu/Debian
sudo dpkg -i Legal\ Workbench_X.Y.Z_amd64.deb

# Fedora/RHEL
sudo rpm -i Legal\ Workbench-X.Y.Z-1.x86_64.rpm

# AppImage (nao requer instalacao)
chmod +x Legal\ Workbench_X.Y.Z_amd64.AppImage
./Legal\ Workbench_X.Y.Z_amd64.AppImage
```
