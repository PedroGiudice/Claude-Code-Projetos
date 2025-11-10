---
description: Calcula prazos processuais em dias úteis (CPC)
---

# Calculadora de Prazos Processuais

Calcule prazos processuais em dias úteis considerando feriados nacionais e regras do CPC.

**Args:** {{ARGS}}

## Formatos Suportados

### Formato 1: Data + Prazo em Dias
```
/prazo 15/01/2025 15
```
Calcula 15 dias úteis a partir de 15/01/2025.

### Formato 2: Data + Tipo de Prazo
```
/prazo 15/01/2025 contestacao
/prazo 15/01/2025 apelacao
/prazo 15/01/2025 embargos
```

**Prazos pré-definidos:**
- `contestacao`: 15 dias úteis
- `apelacao`: 15 dias úteis
- `agravo`: 15 dias úteis
- `embargos`: 5 dias úteis (embargos de declaração)
- `contrarrazoes`: 15 dias úteis
- `manifestacao`: 5 dias úteis
- `recurso-inominado`: 10 dias úteis (JECs)

### Formato 3: Extrair de Publicação DJEN
```
/prazo arquivo:E:/djen-data/processo-1234567-11.2024.json contestacao
```
Extrai automaticamente a data de publicação mais recente do JSON e calcula o prazo.

### Formato 4: Múltiplos Prazos
```
/prazo 15/01/2025 múltiplos
```
Calcula todos os prazos comuns a partir da data informada.

## Passos de Execução

### 1. Parser de Argumentos

```typescript
import { calcularPrazo, calcularMultiplosPrazos, PRAZOS_COMUNS, extrairDataPublicacao } from './src/utils/prazo-calculator.js';
import fs from 'fs/promises';

const args = process.argv.slice(2);

let dataBase: Date;
let prazo: number | string;
let modo: 'simples' | 'multiplos' | 'arquivo' = 'simples';

// Detectar formato
if (args[0].startsWith('arquivo:')) {
  // Formato 3: arquivo JSON
  modo = 'arquivo';
  const caminhoArquivo = args[0].replace('arquivo:', '');
  const tipoPrazo = args[1];

  // Ler JSON
  const jsonContent = await fs.readFile(caminhoArquivo, 'utf-8');
  const data = JSON.parse(jsonContent);

  // Extrair publicação mais recente
  const publicacoes = data.publicacoes || data.comunicacoes || [];
  if (publicacoes.length === 0) {
    throw new Error('Nenhuma publicação encontrada no arquivo JSON');
  }

  // Ordenar por data (mais recente primeiro)
  publicacoes.sort((a, b) => new Date(b.dataPublicacao).getTime() - new Date(a.dataPublicacao).getTime());

  dataBase = new Date(publicacoes[0].dataPublicacao);
  prazo = tipoPrazo;

  console.log(`📄 Arquivo: ${caminhoArquivo}`);
  console.log(`📅 Última publicação: ${dataBase.toLocaleDateString('pt-BR')}`);
  console.log(`📋 Tipo: ${publicacoes[0].tipo || 'N/A'}`);
  console.log('');

} else if (args[1] === 'multiplos') {
  // Formato 4: múltiplos prazos
  modo = 'multiplos';
  dataBase = parseDataBR(args[0]);

} else {
  // Formato 1 ou 2: data + prazo
  dataBase = parseDataBR(args[0]);
  prazo = args[1];
}

function parseDataBR(data: string): Date {
  const [dia, mes, ano] = data.split('/').map(Number);
  return new Date(ano, mes - 1, dia);
}
```

### 2. Calcular Prazo

**Modo Simples:**
```typescript
// Determinar dias do prazo
let dias: number;

if (typeof prazo === 'string' && prazo in PRAZOS_COMUNS) {
  dias = PRAZOS_COMUNS[prazo as keyof typeof PRAZOS_COMUNS];
} else {
  dias = parseInt(prazo as string);
}

// Calcular
const resultado = calcularPrazo({
  dataInicial: dataBase,
  dias,
  aplicarRegraQuintaFeira: true, // CPC Art. 224, §1º
});

// Exibir resultado
console.log('═══════════════════════════════════════════════════════');
console.log('📊 CÁLCULO DE PRAZO PROCESSUAL');
console.log('═══════════════════════════════════════════════════════');
console.log('');

for (const linha of resultado.explicacao) {
  console.log(`   ${linha}`);
}

console.log('');
console.log('📈 ESTATÍSTICAS:');
console.log(`   • Dias corridos: ${resultado.diasCorridos}`);
console.log(`   • Fins de semana: ${resultado.finsDeSemana}`);
console.log(`   • Feriados: ${resultado.feriados.length}`);
console.log('');

if (resultado.alertas.length > 0) {
  console.log('⚠️  ALERTAS:');
  for (const alerta of resultado.alertas) {
    console.log(`   ${alerta}`);
  }
  console.log('');
}

console.log('═══════════════════════════════════════════════════════');
console.log(`🗓️  VENCIMENTO: ${resultado.dataFinal.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}`);
console.log('═══════════════════════════════════════════════════════');
```

**Modo Múltiplos:**
```typescript
const prazosParaCalcular = [
  { nome: 'Contestação', dias: PRAZOS_COMUNS.contestacao },
  { nome: 'Apelação', dias: PRAZOS_COMUNS.apelacao },
  { nome: 'Agravo de Instrumento', dias: PRAZOS_COMUNS.agravo_instrumento },
  { nome: 'Embargos de Declaração', dias: PRAZOS_COMUNS.embargos_declaracao },
  { nome: 'Contrarrazões', dias: PRAZOS_COMUNS.contrarrazoes },
];

const resultados = calcularMultiplosPrazos(dataBase, prazosParaCalcular, {
  aplicarRegraQuintaFeira: true,
});

console.log('═══════════════════════════════════════════════════════');
console.log('📊 PRAZOS PROCESSUAIS A PARTIR DE', dataBase.toLocaleDateString('pt-BR'));
console.log('═══════════════════════════════════════════════════════');
console.log('');

for (const resultado of resultados) {
  console.log(`📌 ${resultado.nome} (${resultado.diasUteis} dias úteis)`);
  console.log(`   Vencimento: ${resultado.dataFinal.toLocaleDateString('pt-BR', { weekday: 'long' })}`);
  console.log('');
}

console.log('═══════════════════════════════════════════════════════');
```

### 3. Executar Script

```bash
cd E:\projetos\djen-mcp-server
npx tsx calcular-prazo.ts {{ARGS}}
```

## Regras Aplicadas

### CPC Art. 224, §1º - Quinta-feira ou Véspera de Feriado

> "Intimação feita na quinta-feira ou em dia útil imediatamente anterior a feriado: prazo tem início no primeiro dia útil seguinte ao fim do feriado."

**Exemplo:**
```
Publicação: quinta-feira, 15/01/2025
Início da contagem: segunda-feira, 19/01/2025
Prazo de 15 dias úteis: vence em 10/02/2025
```

### Feriados Nacionais Considerados

**Fixos:**
- 01/01 - Confraternização Universal
- 21/04 - Tiradentes
- 01/05 - Dia do Trabalhador
- 07/09 - Independência do Brasil
- 12/10 - Nossa Senhora Aparecida
- 02/11 - Finados
- 15/11 - Proclamação da República
- 20/11 - Dia da Consciência Negra (nacional desde 2024)
- 25/12 - Natal

**Móveis (baseados na Páscoa):**
- Carnaval (47 dias antes da Páscoa)
- Sexta-feira Santa (2 dias antes da Páscoa)
- Corpus Christi (60 dias após a Páscoa)

### Feriados Locais

Para adicionar feriados municipais/estaduais, use parâmetro `--feriados`:

```bash
npx tsx calcular-prazo.ts 15/01/2025 15 --feriados 25/01/2025,09/07/2025
```

## Integração com RAG/DJEN

O comando pode extrair automaticamente datas de publicações DJEN:

```typescript
// Exemplo: usar última intimação como data base
const jsonPath = 'E:/djen-data/processo-1234567-11.2024.json';
const jsonContent = await fs.readFile(jsonPath, 'utf-8');
const data = JSON.parse(jsonContent);

// Filtrar apenas intimações
const intimacoes = data.publicacoes.filter(p => p.tipo === 'Intimação');

// Pegar mais recente
const ultimaIntimacao = intimacoes.sort((a, b) =>
  new Date(b.dataPublicacao).getTime() - new Date(a.dataPublicacao).getTime()
)[0];

const dataBase = new Date(ultimaIntimacao.dataPublicacao);
const prazoContestacao = calcularPrazo({ dataInicial: dataBase, dias: 15 });
```

## Exemplos de Uso

### Exemplo 1: Prazo de Contestação
```
/prazo 15/01/2025 contestacao

Saída:
📊 CÁLCULO DE PRAZO PROCESSUAL
   Data de publicação: 15/01/2025
   Início da contagem: 16/01/2025
   Prazo: 15 dias úteis
   Vencimento: 06/02/2025 (Quinta-feira)

📈 ESTATÍSTICAS:
   • Dias corridos: 22
   • Fins de semana: 3
   • Feriados: 0

🗓️ VENCIMENTO: QUINTA-FEIRA, 6 DE FEVEREIRO DE 2025
```

### Exemplo 2: Prazo Custom
```
/prazo 10/02/2025 10

Saída:
   Data de publicação: 10/02/2025
   Início da contagem: 11/02/2025
   Prazo: 10 dias úteis
   Feriados no período: 28/02/2025 (Carnaval)
   Vencimento: 26/02/2025 (Quarta-feira)
```

### Exemplo 3: Múltiplos Prazos
```
/prazo 15/01/2025 multiplos

Saída:
📊 PRAZOS PROCESSUAIS A PARTIR DE 15/01/2025

📌 Contestação (15 dias úteis)
   Vencimento: quinta-feira, 06/02/2025

📌 Apelação (15 dias úteis)
   Vencimento: quinta-feira, 06/02/2025

📌 Embargos de Declaração (5 dias úteis)
   Vencimento: terça-feira, 21/01/2025
```

### Exemplo 4: Extrair de JSON
```
/prazo arquivo:E:/djen-data/processo-1234567-11.2024.json apelacao

Saída:
📄 Arquivo: E:/djen-data/processo-1234567-11.2024.json
📅 Última publicação: 08/07/2025
📋 Tipo: Acórdão

   Data de publicação: 08/07/2025
   Início da contagem: 09/07/2025
   Prazo: 15 dias úteis
   Vencimento: 30/07/2025 (Quarta-feira)

🗓️  VENCIMENTO: QUARTA-FEIRA, 30 DE JULHO DE 2025
```

## Notas Importantes

- **Sempre em dias úteis**: Sábados, domingos e feriados não contam
- **Regra da quinta-feira**: Aplicada por padrão (CPC Art. 224, §1º)
- **Prorrogação automática**: Se vencimento cair em dia não útil, prorroga para próximo dia útil
- **Feriados nacionais**: Banco atualizado automaticamente
- **Feriados locais**: Podem ser adicionados via parâmetro `--feriados`

## Limitações

- Não considera suspensão de prazos por decisão judicial
- Não considera prazos em dobro (litisconsortes, etc.) - deve ser calculado manualmente dobrando o resultado
- Feriados estaduais/municipais devem ser informados manualmente
