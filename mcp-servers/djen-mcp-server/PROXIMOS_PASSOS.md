# Próximos Passos - Servidor MCP DJEN

## ✅ Estrutura Base Criada

O projeto está com toda a estrutura implementada:
- Cliente da API DJEN
- Banco de dados SQLite
- Sistema RAG com embeddings
- Servidor MCP com 10 ferramentas
- Configurações e documentação

## 🔧 Etapas para Colocar em Funcionamento

### 1. Obter Credenciais da API DJEN

**CRÍTICO:** Antes de tudo, você precisa:

1. Acessar o portal do CNJ: https://comunica.pje.jus.br/
2. Criar uma conta ou obter credenciais de acesso
3. Verificar a documentação real da API em:
   - https://comunicaapi.pje.jus.br/swagger/index.html
   - https://app.swaggerhub.com/apis-docs/cnj/pcp/1.0.0

**Importante:** A implementação atual assume endpoints padrão REST, mas podem estar diferentes na API real.

### 2. Validar e Ajustar Endpoints

Uma vez com acesso à API:

1. Verificar endpoints reais em `src/api/client.ts`:
   ```typescript
   // Atual (pode estar incorreto):
   POST /api/v1/auth/login
   POST /api/v1/publicacoes/buscar

   // Ajustar conforme documentação real
   ```

2. Validar schema de resposta das publicações:
   - Verificar campos retornados pela API
   - Ajustar tipos em `src/types/index.ts` se necessário

3. Confirmar sistema de autenticação:
   - JWT? Bearer token? Outro?
   - Tempo de expiração do token

### 3. Instalação e Build

```bash
cd djen-mcp-server
npm install
npm run build
```

### 4. Configurar Ambiente

1. Copiar `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```

2. Editar `.env` com credenciais reais:
   ```env
   DJEN_API_URL=https://comunicaapi.pje.jus.br
   DJEN_USERNAME=seu_usuario_real
   DJEN_PASSWORD=sua_senha_real
   DATABASE_PATH=E:/djen-data/djen.db  # HD externo
   ```

### 5. Configurar Claude Desktop

1. Localizar arquivo de configuração:
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. Adicionar servidor MCP (usar `claude-desktop-config.example.json` como base)

3. Reiniciar Claude Desktop

### 6. Testes Iniciais

Após configurar no Claude Desktop, testar via chat do Claude:

```
# Teste 1: Verificar conexão
Use a ferramenta 'estatisticas' para verificar o banco de dados

# Teste 2: Primeira busca (ajustar datas para período recente)
Busque publicações do TJSP entre 01/10/2024 e 31/10/2024

# Teste 3: Indexação
Indexe as publicações baixadas para habilitar busca semântica
```

## 🐛 Ajustes Esperados

### Altamente Provável que Precise Ajustar:

1. **Endpoints da API** (`src/api/client.ts`)
   - Rotas podem ter nomenclatura diferente
   - Parâmetros de requisição podem variar

2. **Schema de Publicações** (`src/types/index.ts`)
   - Campos podem ter nomes diferentes
   - Podem existir campos adicionais importantes

3. **Autenticação** (`src/api/client.ts`)
   - Método de login pode ser diferente
   - Headers necessários podem variar

### Exemplo de Ajuste Típico:

Se a API real for:
```
POST /auth/token
POST /publicacoes/consultar
```

Ajustar em `src/api/client.ts`:
```typescript
// Linha ~45
const response = await this.client.post('/auth/token', { // era '/api/v1/auth/login'
  username: this.config.username,
  password: this.config.password,
});

// Linha ~73
const response = await this.client.post('/publicacoes/consultar', filtros); // era '/api/v1/publicacoes/buscar'
```

## 📚 Checklist de Implementação

- [ ] Obter credenciais da API DJEN
- [ ] Acessar documentação Swagger real
- [ ] Validar endpoints no código
- [ ] Ajustar schemas TypeScript se necessário
- [ ] Configurar `.env` com credenciais reais
- [ ] Build do projeto (`npm run build`)
- [ ] Configurar Claude Desktop
- [ ] Testar busca simples
- [ ] Testar download em lote
- [ ] Indexar primeiras publicações
- [ ] Testar busca semântica

## 🎯 Casos de Uso para Testar

### Caso 1: Biblioteca Jurisprudencial Mensal
```
1. Download mensal: download_lote (primeiro dia do mês anterior)
2. Salvar no banco: salvarNoBanco: true
3. Indexar: indexar_publicacoes (limite: 500)
4. Verificar: estatisticas
```

### Caso 2: Acompanhamento de Processos Específicos
```
1. Adicionar monitoramento: adicionar_processo_monitorado
2. Buscar publicações: buscar_por_processo
3. Gerar histórico: historico_processo
```

### Caso 3: Pesquisa Jurisprudencial
```
1. Busca semântica: "indenização por danos morais relações de consumo"
2. Gerar contexto: gerar_contexto_rag
3. Claude analisa e fundamenta tese jurídica
```

## 🔗 Links Úteis

- **Checklist da outra conversa**: (você mencionou que tem um - cole aqui!)
- **Portal DJEN**: https://comunica.pje.jus.br/
- **API Swagger**: https://comunicaapi.pje.jus.br/swagger/index.html
- **Suporte CNJ**: sistemasnacionais@cnj.jus.br

## 💡 Dicas

1. **Comece pequeno**: Teste com 1 dia de publicações, não 1 mês
2. **Monitore logs**: Configure `LOG_LEVEL=debug` para ver detalhes
3. **Espaço em disco**: Primeiro download pode ser grande
4. **HD externo**: Configure `DATABASE_PATH` apontando para ele
5. **Paciência com embeddings**: Primeira indexação é lenta (baixa modelo)

## 🆘 Se der Erro

1. Verificar logs do Claude Desktop
2. Configurar `LOG_LEVEL=debug` no `.env`
3. Testar autenticação manualmente (Postman/Insomnia)
4. Verificar estrutura de resposta da API
5. Comparar com documentação Swagger oficial
