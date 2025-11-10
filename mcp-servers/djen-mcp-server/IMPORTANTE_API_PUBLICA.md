# ⚠️ IMPORTANTE: API DJEN É PÚBLICA!

## 🔓 Sem Necessidade de Credenciais

A API DJEN (Diário de Justiça Eletrônico Nacional) é **completamente pública e não requer autenticação**.

### O que isso significa:

✅ **Não precisa de usuário e senha**
✅ **Não precisa de API Key**
✅ **Não precisa de token de acesso**
✅ **Qualquer um pode consultar as publicações**

### Endpoints Disponíveis

Todos os endpoints são públicos e acessíveis via GET:

1. **GET /api/v1/comunicacao/tribunal**
   - Lista todos os tribunais brasileiros disponíveis
   - Retorna: siglas, nomes, datas de último envio

2. **GET /api/v1/comunicacao**
   - Busca comunicações (publicações) com filtros
   - Parâmetros:
     - `tribunal` - Sigla (TJSP, STJ, TRT2, etc)
     - `dataInicio` - YYYY-MM-DD
     - `dataFim` - YYYY-MM-DD
     - `numeroProcesso` - Número sem máscara (só dígitos)
     - `limit` - Máximo 10000 por requisição

3. **GET /api/v1/comunicacao/{hash}/certidao**
   - Obtém certidão de uma comunicação específica
   - Usa o hash retornado na busca de comunicações

4. **GET /api/v1/caderno/{sigla}/{data}/{meio}**
   - Obtém metadados do caderno de publicações
   - Retorna: total de comunicações, número de páginas, **URL para download do PDF**
   - Meio: "E" (Eletrônico) ou "D" (Digital)

### Configuração Necessária

Apenas uma variável de ambiente:

```env
DJEN_API_URL=https://comunicaapi.pje.jus.br
```

### Exemplo de Uso Direto (curl)

```bash
# Listar tribunais
curl "https://comunicaapi.pje.jus.br/api/v1/comunicacao/tribunal"

# Buscar comunicações do TJSP de hoje
curl "https://comunicaapi.pje.jus.br/api/v1/comunicacao?tribunal=TJSP&dataInicio=2024-10-24&dataFim=2024-10-24&limit=100"

# Metadados do caderno
curl "https://comunicaapi.pje.jus.br/api/v1/caderno/TJSP/2024-10-24/D"
```

### Diferença do Código Original

O código original foi escrito presumindo autenticação, mas a API DJEN real é pública. As mudanças foram:

**REMOVIDO:**
- Sistema de autenticação JWT
- Variáveis DJEN_USERNAME e DJEN_PASSWORD
- Interceptores de token
- Refresh de token

**MANTIDO:**
- Rate limiting (respeito à API)
- Fila de requisições
- Todos os recursos de busca e download

### Objetivo do Projeto

O servidor MCP serve para:
1. **Baixar publicações** em massa de forma organizada
2. **Armazenar localmente** em banco SQLite
3. **Indexar com embeddings** para busca semântica (RAG)
4. **Extrair jurisprudência** e históricos processuais
5. **Análise jurimetríca** com IA

**NÃO fazemos:** Alteração, edição ou remoção de publicações (apenas leitura)

### URL da Documentação Oficial

https://comunicaapi.pje.jus.br/swagger/index.html

### Contato CNJ

- Email: sistemasnacionais@cnj.jus.br
- Telefone: (61) 2326-5353
