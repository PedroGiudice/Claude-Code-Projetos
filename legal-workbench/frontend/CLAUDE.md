# CLAUDE.md - Legal Workbench Frontend

Este modulo e o frontend React do Legal Workbench.

---

## Regras Especificas

### Stack
- React 18 + TypeScript
- Vite como bundler
- TanStack Router
- Zustand para estado
- MUI v7 para componentes

### Comandos Locais
```bash
cd legal-workbench/frontend
bun install
bun run dev      # Dev server
bun run build    # Build producao
bun run lint     # ESLint
```

### Antes de Modificar
1. Verificar se build passa: `bun run build`
2. Verificar lint: `bun run lint`
3. Testar no browser

### NUNCA (Especifico do Frontend)
- Usar `npm` ou `yarn` (apenas `bun`)
- Importar de `ccui-assistant/` (removido)
- Criar arquivos `.jsx` (usar `.tsx`)
- Hardcodar URLs de API (usar env vars)
- Modificar arquivos em `ferramentas/` durante tarefas de frontend

### Padrao de Componentes
```typescript
// Preferir: functional components com hooks
const Component: React.FC<Props> = ({ prop }) => {
  // hooks primeiro
  // handlers depois
  // return por ultimo
};
```

### Estrutura de Pastas
```
frontend/
├── src/
│   ├── components/    # Componentes reutilizaveis
│   ├── pages/         # Paginas/rotas
│   ├── services/      # APIs e servicos
│   ├── hooks/         # Custom hooks
│   ├── stores/        # Zustand stores
│   └── types/         # TypeScript types
├── public/
└── index.html
```

---

## Verificacao Obrigatoria

Antes de considerar qualquer tarefa de frontend concluida:

### 1. Build e Lint
```bash
cd legal-workbench/frontend
bun run build   # Deve passar sem erros
bun run lint    # Zero warnings idealmente
```

### 2. Testes Unitarios
```bash
bun run test              # Vitest - todos os testes
bun run test ComponentX   # Teste especifico
```

### 3. Verificacao Visual (quando UI mudou)
Usar Chrome MCP ou Playwright para verificar:
- Componente renderiza corretamente
- Estados de loading/error funcionam
- Responsividade (se aplicavel)

### 4. Checklist Pre-Commit
- [ ] Build passa
- [ ] Lint passa
- [ ] Testes passam (se existirem para o componente)
- [ ] Verificacao visual feita (para mudancas de UI)

> **Regra**: NAO commitar sem verificar. Erros descobertos no CI sao evitaveis.

---

*Herdado de: legal-workbench/CLAUDE.md*
