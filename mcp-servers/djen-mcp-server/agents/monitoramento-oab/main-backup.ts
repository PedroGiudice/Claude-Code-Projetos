/**
 * Agente de Monitoramento de Publicações OAB 129021/SP
 *
 * Roda continuamente, buscando novas publicações e gerando relatórios Markdown
 * separados por cliente.
 */

import { DJENApiClient } from '../../djen-mcp-server/dist/api/client.js';
import { ConfigAPI } from '../../djen-mcp-server/dist/types/index.js';
import Database from 'better-sqlite3';
import fs from 'fs/promises';
import path from 'path';

// Configuração
const CONFIG = {
  oab: { numero: '129021', uf: 'SP' },
  tribunais: ['TRT3', 'TJMG', 'TJSP', 'TRT2', 'TJRJ', 'TJPR', 'TRF3', 'TRF4', 'TST', 'TJMA', 'TRF1', 'TRT8', 'TRT5', 'TRT15'],
  horariosBusca: ['09:00', '15:00'],
  intervaloVerificacao: 60000, // 1 minuto
  bancoPath: 'E:/djen-data/oab-monitoring.db',
  clientesConfigPath: 'E:/djen-data/clientes.json',
  outputDir: 'E:/djen-data',
};

interface Cliente {
  id: string;
  nome: string;
  variantes: string[];
}

interface ClientesConfig {
  clientes: Cliente[];
  processos_manuais: Record<string, string>; // numeroProcesso -> clienteId
  ultima_atualizacao: string;
}

interface Publicacao {
  hash: string;
  numeroProcesso: string;
  tribunal: string;
  classe: string;
  orgaoJulgador: string;
  dataDisponibilizacao: string;
  tipo: string;
  texto: string;
  link: string;
  dataColeta: string;
  clienteId?: string;
}

interface StatusAgente {
  rodando: boolean;
  ultimaBusca?: Date;
  proximaBusca?: Date;
  totalPublicacoes: number;
  publicacoesHoje: number;
  buscasRealizadas: number;
  clientesEncontrados: Map<string, number>;
}

class AgenteMonitoramentoOAB {
  private client: DJENApiClient;
  private db: Database.Database;
  private clientesConfig: ClientesConfig;
  private status: StatusAgente;
  private intervalId?: NodeJS.Timeout;

  constructor() {
    // Inicializar cliente DJEN
    const apiConfig: ConfigAPI = {
      url: 'https://comunicaapi.pje.jus.br',
      maxRequestsPerMinute: 20,
      maxConcurrentRequests: 5,
    };
    this.client = new DJENApiClient(apiConfig);

    // Inicializar banco
    this.db = new Database(CONFIG.bancoPath);
    this.inicializarBanco();

    // Carregar configuração de clientes
    this.clientesConfig = { clientes: [], processos_manuais: {}, ultima_atualizacao: new Date().toISOString() };

    // Status inicial
    this.status = {
      rodando: false,
      totalPublicacoes: 0,
      publicacoesHoje: 0,
      buscasRealizadas: 0,
      clientesEncontrados: new Map(),
    };
  }

  private inicializarBanco() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS publicacoes (
        hash TEXT PRIMARY KEY,
        numero_processo TEXT NOT NULL,
        tribunal TEXT NOT NULL,
        classe TEXT,
        orgao_julgador TEXT,
        data_disponibilizacao TEXT NOT NULL,
        tipo TEXT NOT NULL,
        texto TEXT,
        link TEXT,
        data_coleta TEXT NOT NULL,
        cliente_id TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_data_disp ON publicacoes(data_disponibilizacao);
      CREATE INDEX IF NOT EXISTS idx_processo ON publicacoes(numero_processo);
      CREATE INDEX IF NOT EXISTS idx_cliente ON publicacoes(cliente_id);

      CREATE TABLE IF NOT EXISTS historico_buscas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data_hora TEXT NOT NULL,
        tribunais_buscados TEXT,
        novas_publicacoes INTEGER,
        tempo_execucao_ms INTEGER
      );
    `);

    console.log('✅ Banco de dados inicializado');
  }

  private async carregarClientesConfig() {
    try {
      const conteudo = await fs.readFile(CONFIG.clientesConfigPath, 'utf-8');
      this.clientesConfig = JSON.parse(conteudo);
      console.log(`✅ Configuração de ${this.clientesConfig.clientes.length} clientes carregada`);
    } catch (error) {
      console.log('⚠️  Arquivo de clientes não encontrado, usando configuração padrão');
      this.clientesConfig = {
        clientes: [],
        processos_manuais: {},
        ultima_atualizacao: new Date().toISOString(),
      };
    }
  }

  private identificarCliente(publicacao: Publicacao): string | null {
    // 1. Verificar match manual por número de processo
    if (this.clientesConfig.processos_manuais[publicacao.numeroProcesso]) {
      return this.clientesConfig.processos_manuais[publicacao.numeroProcesso];
    }

    // 2. Buscar por nome no texto (case insensitive)
    const textoUpper = publicacao.texto.toUpperCase();

    for (const cliente of this.clientesConfig.clientes) {
      for (const variante of cliente.variantes) {
        if (textoUpper.includes(variante.toUpperCase())) {
          return cliente.id;
        }
      }
    }

    return null; // Desconhecido
  }

  async iniciar() {
    console.log('🚀 Iniciando Agente de Monitoramento OAB 129021/SP\n');

    await this.carregarClientesConfig();

    this.status.rodando = true;

    // Busca inicial
    await this.executarBusca();

    // Agendar próximas buscas
    this.agendarProximaBusca();

    // Loop de verificação
    this.intervalId = setInterval(() => {
      this.verificarSeDeveExecutarBusca();
      this.exibirStatus();
    }, CONFIG.intervaloVerificacao);

    console.log('\n✅ Agente rodando! Pressione Ctrl+C para parar.\n');
  }

  private agendarProximaBusca() {
    const agora = new Date();
    const horaAtual = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;

    const proximoHorario = CONFIG.horariosBusca.find(h => h > horaAtual);

    if (proximoHorario) {
      const [hora, minuto] = proximoHorario.split(':').map(Number);
      const proxima = new Date(agora);
      proxima.setHours(hora, minuto, 0, 0);
      this.status.proximaBusca = proxima;
    } else {
      const [hora, minuto] = CONFIG.horariosBusca[0].split(':').map(Number);
      const proxima = new Date(agora);
      proxima.setDate(proxima.getDate() + 1);
      proxima.setHours(hora, minuto, 0, 0);
      this.status.proximaBusca = proxima;
    }
  }

  private verificarSeDeveExecutarBusca() {
    if (!this.status.proximaBusca) return;

    const agora = new Date();
    if (agora >= this.status.proximaBusca) {
      this.executarBusca();
    }
  }

  private async executarBusca() {
    const inicio = Date.now();

    console.log(`\n🔍 Iniciando busca - ${new Date().toLocaleString('pt-BR')}\n`);

    const novasPublicacoes: Publicacao[] = [];

    // Buscar em cada tribunal prioritário
    for (const tribunal of CONFIG.tribunais) {
      try {
        console.log(`   Buscando ${tribunal}...`);

        const resultado = await this.client.buscarComunicacoes({
          numeroOab: CONFIG.oab.numero,
          siglaTribunal: tribunal,
          itensPorPagina: 10000,
        });

        console.log(`      ${resultado.count} total, ${resultado.items.length} retornados`);

        // Filtrar publicações de hoje
        const hoje = new Date().toISOString().split('T')[0];
        const publicacoesHoje = resultado.items.filter(item =>
          item.data_disponibilizacao.startsWith(hoje)
        );

        console.log(`      ${publicacoesHoje.length} de hoje`);

        // Processar e salvar
        for (const item of publicacoesHoje) {
          const pub: Publicacao = {
            hash: item.hash,
            numeroProcesso: item.numeroprocessocommascara,
            tribunal: item.siglaTribunal,
            classe: item.nomeClasse,
            orgaoJulgador: item.nomeOrgao,
            dataDisponibilizacao: item.data_disponibilizacao,
            tipo: item.tipoComunicacao,
            texto: item.texto,
            link: item.link,
            dataColeta: new Date().toISOString(),
          };

          // Identificar cliente
          pub.clienteId = this.identificarCliente(pub) || 'DESCONHECIDO';

          if (this.salvarPublicacao(pub)) {
            novasPublicacoes.push(pub);
          }
        }

        // Aguardar 4s entre requisições (rate limit)
        await new Promise(resolve => setTimeout(resolve, 4000));

      } catch (error: any) {
        console.log(`      ❌ Erro: ${error.message}`);
      }
    }

    const tempoExecucao = Date.now() - inicio;

    // Salvar histórico
    this.db.prepare(`
      INSERT INTO historico_buscas (data_hora, tribunais_buscados, novas_publicacoes, tempo_execucao_ms)
      VALUES (?, ?, ?, ?)
    `).run(
      new Date().toISOString(),
      CONFIG.tribunais.join(','),
      novasPublicacoes.length,
      tempoExecucao
    );

    // Atualizar status
    this.status.ultimaBusca = new Date();
    this.status.buscasRealizadas++;
    this.atualizarEstatisticas();
    this.agendarProximaBusca();

    console.log(`\n✅ Busca concluída em ${Math.round(tempoExecucao / 1000)}s`);
    console.log(`   Novas publicações: ${novasPublicacoes.length}\n`);

    // Gerar relatórios Markdown se houver novas publicações
    if (novasPublicacoes.length > 0) {
      await this.gerarRelatoriosMarkdown();
    }
  }

  private salvarPublicacao(pub: Publicacao): boolean {
    try {
      this.db.prepare(`
        INSERT OR IGNORE INTO publicacoes
        (hash, numero_processo, tribunal, classe, orgao_julgador, data_disponibilizacao, tipo, texto, link, data_coleta, cliente_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        pub.hash,
        pub.numeroProcesso,
        pub.tribunal,
        pub.classe,
        pub.orgaoJulgador,
        pub.dataDisponibilizacao,
        pub.tipo,
        pub.texto,
        pub.link,
        pub.dataColeta,
        pub.clienteId
      );

      return this.db.changes > 0;
    } catch (error) {
      return false;
    }
  }

  private atualizarEstatisticas() {
    // Total de publicações
    const total = this.db.prepare('SELECT COUNT(*) as count FROM publicacoes').get() as { count: number };
    this.status.totalPublicacoes = total.count;

    // Publicações de hoje
    const hoje = new Date().toISOString().split('T')[0];
    const hojeStat = this.db.prepare(
      'SELECT COUNT(*) as count FROM publicacoes WHERE data_disponibilizacao LIKE ?'
    ).get(`${hoje}%`) as { count: number };
    this.status.publicacoesHoje = hojeStat.count;

    // Clientes encontrados hoje
    const clientesRows = this.db.prepare(`
      SELECT cliente_id, COUNT(*) as count
      FROM publicacoes
      WHERE data_disponibilizacao LIKE ?
      GROUP BY cliente_id
    `).all(`${hoje}%`) as Array<{ cliente_id: string; count: number }>;

    this.status.clientesEncontrados.clear();
    for (const row of clientesRows) {
      this.status.clientesEncontrados.set(row.cliente_id, row.count);
    }
  }

  private async gerarRelatoriosMarkdown() {
    console.log('📄 Gerando relatórios Markdown...');

    const hoje = new Date().toISOString().split('T')[0];
    const hojeFormatado = new Date().toLocaleDateString('pt-BR');

    // Buscar publicações de hoje agrupadas por cliente
    const publicacoes = this.db.prepare(`
      SELECT * FROM publicacoes
      WHERE data_disponibilizacao LIKE ?
      ORDER BY cliente_id, tribunal, numero_processo
    `).all(`${hoje}%`) as Publicacao[];

    // Agrupar por cliente
    const porCliente = new Map<string, Publicacao[]>();

    for (const pub of publicacoes) {
      const clienteId = pub.clienteId || 'DESCONHECIDO';
      if (!porCliente.has(clienteId)) {
        porCliente.set(clienteId, []);
      }
      porCliente.get(clienteId)!.push(pub);
    }

    // Gerar arquivo para cada cliente
    for (const [clienteId, pubs] of porCliente.entries()) {
      await this.gerarRelatorioCliente(clienteId, pubs, hoje, hojeFormatado);
    }

    // Gerar relatório consolidado
    await this.gerarRelatorioConsolidado(porCliente, hoje, hojeFormatado);

    console.log(`   ✅ ${porCliente.size} relatórios gerados\n`);
  }

  private async gerarRelatorioCliente(clienteId: string, publicacoes: Publicacao[], data: string, dataFormatada: string) {
    const nomeCliente = this.clientesConfig.clientes.find(c => c.id === clienteId)?.nome || clienteId;

    let markdown = `# Publicações DJEN - ${nomeCliente}\n\n`;
    markdown += `**Data:** ${dataFormatada} (${data})\n`;
    markdown += `**OAB:** 129021/SP\n`;
    markdown += `**Total de publicações:** ${publicacoes.length}\n\n`;
    markdown += `---\n\n`;

    // Agrupar por processo
    const porProcesso = new Map<string, Publicacao[]>();
    for (const pub of publicacoes) {
      if (!porProcesso.has(pub.numeroProcesso)) {
        porProcesso.set(pub.numeroProcesso, []);
      }
      porProcesso.get(pub.numeroProcesso)!.push(pub);
    }

    // Gerar seção para cada processo
    for (const [numeroProcesso, pubs] of porProcesso.entries()) {
      const primeiraPub = pubs[0];

      markdown += `## ${numeroProcesso}\n\n`;
      markdown += `**Tribunal:** ${primeiraPub.tribunal}\n`;
      markdown += `**Classe:** ${primeiraPub.classe}\n`;
      markdown += `**Órgão:** ${primeiraPub.orgaoJulgador}\n\n`;

      // Listar publicações
      for (const pub of pubs) {
        const dataPub = new Date(pub.dataDisponibilizacao).toLocaleDateString('pt-BR');
        markdown += `### ${pub.tipo} - ${dataPub}\n\n`;
        markdown += `${pub.texto}\n\n`;
        markdown += `**Link:** ${pub.link}\n\n`;
        markdown += `---\n\n`;
      }
    }

    // Salvar arquivo
    const filename = `${data}_${clienteId}.md`;
    const filepath = path.join(CONFIG.outputDir, filename);
    await fs.writeFile(filepath, markdown, 'utf-8');
  }

  private async gerarRelatorioConsolidado(porCliente: Map<string, Publicacao[]>, data: string, dataFormatada: string) {
    let markdown = `# Publicações DJEN - CONSOLIDADO\n\n`;
    markdown += `**Data:** ${dataFormatada} (${data})\n`;
    markdown += `**OAB:** 129021/SP\n\n`;

    markdown += `## Resumo por Cliente\n\n`;
    markdown += `| Cliente | Publicações |\n`;
    markdown += `|---------|-------------|\n`;

    const totalGeral = Array.from(porCliente.values()).reduce((sum, pubs) => sum + pubs.length, 0);

    for (const [clienteId, pubs] of Array.from(porCliente.entries()).sort((a, b) => b[1].length - a[1].length)) {
      const nomeCliente = this.clientesConfig.clientes.find(c => c.id === clienteId)?.nome || clienteId;
      markdown += `| ${nomeCliente} | ${pubs.length} |\n`;
    }

    markdown += `| **TOTAL** | **${totalGeral}** |\n\n`;

    markdown += `## Detalhamento\n\n`;

    for (const [clienteId, pubs] of Array.from(porCliente.entries()).sort((a, b) => b[1].length - a[1].length)) {
      const nomeCliente = this.clientesConfig.clientes.find(c => c.id === clienteId)?.nome || clienteId;

      markdown += `### ${nomeCliente} (${pubs.length})\n\n`;

      // Agrupar por processo
      const porProcesso = new Map<string, number>();
      for (const pub of pubs) {
        porProcesso.set(pub.numeroProcesso, (porProcesso.get(pub.numeroProcesso) || 0) + 1);
      }

      for (const [processo, count] of Array.from(porProcesso.entries()).sort((a, b) => b[1] - a[1])) {
        markdown += `- \`${processo}\` (${count} publicação${count > 1 ? 'ões' : ''})\n`;
      }

      markdown += `\n`;
    }

    // Salvar arquivo
    const filename = `${data}_CONSOLIDADO.md`;
    const filepath = path.join(CONFIG.outputDir, filename);
    await fs.writeFile(filepath, markdown, 'utf-8');
  }

  private exibirStatus() {
    console.clear();

    console.log('═══════════════════════════════════════════════════');
    console.log('🔔 AGENTE DE MONITORAMENTO OAB 129021/SP');
    console.log('═══════════════════════════════════════════════════\n');

    console.log(`Status: ${this.status.rodando ? '✅ ATIVO' : '❌ PARADO'}\n`);

    if (this.status.ultimaBusca) {
      console.log(`Última busca: ${this.status.ultimaBusca.toLocaleString('pt-BR')}`);
    }

    if (this.status.proximaBusca) {
      const agora = new Date();
      const diff = this.status.proximaBusca.getTime() - agora.getTime();
      const horas = Math.floor(diff / 3600000);
      const minutos = Math.floor((diff % 3600000) / 60000);
      const segundos = Math.floor((diff % 60000) / 1000);

      console.log(`Próxima busca: ${this.status.proximaBusca.toLocaleString('pt-BR')}`);
      console.log(`Tempo restante: ${horas}h ${minutos}m ${segundos}s\n`);
    }

    console.log(`📊 Estatísticas:\n`);
    console.log(`   Total de publicações: ${this.status.totalPublicacoes}`);
    console.log(`   Publicações hoje: ${this.status.publicacoesHoje}`);
    console.log(`   Buscas realizadas: ${this.status.buscasRealizadas}\n`);

    if (this.status.clientesEncontrados.size > 0) {
      console.log(`📋 Clientes hoje:\n`);
      for (const [clienteId, count] of Array.from(this.status.clientesEncontrados.entries()).sort((a, b) => b[1] - a[1])) {
        const nomeCliente = this.clientesConfig.clientes.find(c => c.id === clienteId)?.nome || clienteId;
        console.log(`   ${nomeCliente}: ${count}`);
      }
      console.log();
    }

    console.log('═══════════════════════════════════════════════════\n');
    console.log('Pressione Ctrl+C para parar o agente');
  }

  async parar() {
    console.log('\n\n🛑 Parando agente...');

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.status.rodando = false;
    this.db.close();

    console.log('✅ Agente parado com sucesso\n');
    process.exit(0);
  }
}

// Iniciar agente
const agente = new AgenteMonitoramentoOAB();

// Handlers de sinal
process.on('SIGINT', () => agente.parar());
process.on('SIGTERM', () => agente.parar());

// Executar
agente.iniciar().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
