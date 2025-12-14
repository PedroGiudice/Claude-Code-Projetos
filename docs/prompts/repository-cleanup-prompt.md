# REPOSITORY CLEANUP & REORGANIZATION

## CRITICAL PRINCIPLE
**Docker = Canonical State.** The `legal-workbench/docker/services/` directory defines what's "real". Everything else must align with or support this truth.

## CURRENT CHAOS

### Docker Services (CANONICAL):
```
docker/services/
├── doc-assembler/      ← Production
├── stj-api/            ← Production
├── streamlit-hub/      ← Production
├── text-extractor/     ← Production
└── trello-mcp/         ← Production
```

### Ferramentas (SCATTERED DEVELOPMENT):
```
ferramentas/
├── legal-doc-assembler/   ← Duplicate? Sync issue?
├── legal-text-extractor/  ← Duplicate? Sync issue?
├── stj-dados-abertos/     ← Is this stj-api source?
├── trello-mcp/            ← Duplicate?
├── prompt-library/        ← Not in Docker - orphan?
└── _archived/             ← Review contents
```

### POCs (EXPERIMENTAL - scattered at root level):
```
legal-workbench/
├── poc-fasthtml-stj/
├── poc-react-stj/
└── poc-reflex-stj/
```

---

## PHASE 1: ROOT DIRECTORY CLEANUP

### Allowed in Repository Root (6 files):
- `README.md`, `CLAUDE.md`, `ARCHITECTURE.md`
- `requirements.txt`, `LICENSE`, `.gitignore`

### Move Everything Else:
Launch parallel agents to classify and move loose files:

| File Pattern | Destination | Action |
|-------------|-------------|--------|
| `*.html` (visualizations) | `docs/visualizations/` | Move |
| `*.ps1` (Windows scripts) | `scripts/windows/` | Move |
| `diagnostico-*.txt` | DELETE or `_archived/diagnostics/` | Cleanup |
| `*:Zone.Identifier` | DELETE | Windows metadata |
| `gemini_context.txt` (16MB) | DELETE | Generated dump |
| `repomix-output.xml` (32MB) | DELETE | Generated dump |
| `GEMINI.md`, `DISASTER_HISTORY.md` | `docs/` | Move |
| `WSL2-INSTALL-GUIDE.md` | `docs/setup/` | Move |
| `CC-GottaKnow.md` | `.claude/` or `docs/` | Move |
| `progress.json` | `_archived/` | Archive |

---

## PHASE 2: LEGAL-WORKBENCH CONSOLIDATION (CRITICAL)

### Goal: Align ferramentas/ with docker/services/

**For each tool, answer:**
1. Is there a Docker service for this? → Sync or consolidate
2. Is the Docker service the "source of truth"? → ferramentas/ may be deprecated
3. Is ferramentas/ the development source? → Docker should copy from it

### Mapping Analysis Required:

| Ferramentas | Docker Service | Action Required |
|-------------|----------------|-----------------|
| `legal-text-extractor/` | `text-extractor/` | Determine source of truth |
| `legal-doc-assembler/` | `doc-assembler/` | Determine source of truth |
| `stj-dados-abertos/` | `stj-api/` | Same tool? Different names? |
| `trello-mcp/` | `trello-mcp/` | Exact duplicate? |
| `prompt-library/` | (none) | Orphan - archive or integrate |

### Decision Framework:
```
IF docker/services/X copies from ferramentas/Y:
   → Keep ferramentas/Y as source, document relationship

IF docker/services/X is standalone:
   → Archive or delete ferramentas/ duplicate

IF ferramentas/Z has no Docker service:
   → Either create Docker service OR archive
```

---

## PHASE 3: POC ORGANIZATION

### Current State (messy):
POCs at same level as production code in `legal-workbench/`

### Target State:
```
legal-workbench/
├── docker/           ← Production (canonical)
├── ferramentas/      ← Development sources (if needed)
├── modules/          ← Streamlit UI modules
├── poc/              ← ALL experimental work
│   ├── fasthtml-stj/
│   ├── react-stj/
│   └── reflex-stj/
├── app.py            ← Main Streamlit app
└── config.yaml
```

### Action:
```bash
mkdir -p legal-workbench/poc
mv legal-workbench/poc-fasthtml-stj legal-workbench/poc/fasthtml-stj
mv legal-workbench/poc-react-stj legal-workbench/poc/react-stj
mv legal-workbench/poc-reflex-stj legal-workbench/poc/reflex-stj
```

---

## PHASE 4: LEGAL-WORKBENCH ROOT CLEANUP

### Current Loose Files:
- `Gerenciamento de Prompts e Skills.txt` → `docs/` or DELETE
- `KNOWN_ISSUES.md` → Keep or move to `docs/`
- `ROADMAP.md` → Keep or move to `docs/`

### Allowed in legal-workbench Root:
- `app.py`, `config.yaml`, `requirements.txt`, `run.sh`
- `README.md`, `CLAUDE.md`
- Directories only: `docker/`, `modules/`, `poc/`, `docs/`

---

## EXECUTION GUIDELINES

### Use Parallel Agents Purposefully:
- **File classification** → Multiple agents scanning different patterns
- **Tool analysis** → One agent per ferramentas/ tool
- **Documentation audit** → Agents for different doc categories

### Preserve Git History:
```bash
git mv old_path new_path  # Not mv
```

### Verification Checklist:
- [ ] Repository root has ≤6 files
- [ ] legal-workbench/ root is clean
- [ ] ferramentas/ aligned with docker/services/
- [ ] POCs consolidated under poc/
- [ ] No Zone.Identifier files remain
- [ ] No generated dumps (>1MB files) in tracked directories

---

## OUTPUT REQUIRED

After cleanup, provide:
1. **Summary table**: What was moved/deleted/archived
2. **Ferramentas decision matrix**: Which tools kept, why
3. **Remaining issues**: Anything requiring human decision
