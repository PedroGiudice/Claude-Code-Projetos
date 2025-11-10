/**
 * Agente de Monitoramento de Publicações OAB 129021/SP
 *
 * Roda continuamente durante expediente, buscando novas publicações
 * a cada intervalo configurado e gerando relatórios Excel.
 */

import { DJENApiClient } from '../../../src/api/client.js';
import { ConfigAPI } from '../../../src/types/index.js';
import Database from 'better-sqlite3';
import ExcelJS from 'exceljs';
import fs from 'fs/promises';
import path from 'path';

// Configuração
const CONFIG = {
  oab: { numero: '129021', uf: 'SP' },
  tribunais: ['TRT3', 'TJMG', 'TJSP', 'TRT2', 'TJRJ', 'TJPR', 'TRF3', 'TRF4', 'TST', 'TJMA', 'TRF1', 'TRT8', 'TRT5', 'TRT15'],
  horariosBusca: ['09:00', '15:00'],
  intervaloVerificacao: 60000, // 1 minuto
  bancoPath: 'E:/djen-data/oab-monitoring.db',
  clientesConfigPath: 'E:/djen-data/clientes-config.json',
  excelOutputDir: 'E:/djen-data',
};

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
}

interface StatusAgente {
  rodando: boolean;
  ultimaBusca?: Date;
  proximaBusca?: Date;
  totalPublicacoes: number;
  publicacoesHoje: number;
  buscasRealizadas: number;
}

class AgenteMonitoramentoOAB {
  private client: DJENApiClient;
  private db: Database.Database;
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

    // Status inicial
    this.status = {
      rodando: false,
      totalPublicacoes: 0,
      publicacoesHoje: 0,
      buscasRealizadas: 0,
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

      CREATE TABLE IF NOT EXISTS processos_por_cliente (
        numero_processo TEXT NOT NULL,
        cliente_id TEXT NOT NULL,
        cliente_nome TEXT,
        PRIMARY KEY (numero_processo, cliente_id)
      );

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

  async iniciar() {
    console.log('🚀 Iniciando Agente de Monitoramento OAB 129021/SP\n');

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

    // Encontrar próximo horário
    const proximoHorario = CONFIG.horariosBusca.find(h => h > horaAtual);

    if (proximoHorario) {
      const [hora, minuto] = proximoHorario.split(':').map(Number);
      const proxima = new Date(agora);
      proxima.setHours(hora, minuto, 0, 0);
      this.status.proximaBusca = proxima;
    } else {
      // Próximo dia, primeiro horário
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

    // Gerar Excel se houver novas publicações
    if (novasPublicacoes.length > 0) {
      await this.gerarExcel();
    }
  }

  private salvarPublicacao(pub: Publicacao): boolean {
    try {
      this.db.prepare(`
        INSERT OR IGNORE INTO publicacoes
        (hash, numero_processo, tribunal, classe, orgao_julgador, data_disponibilizacao, tipo, texto, link, data_coleta)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        pub.dataColeta
      );

      return this.db.changes > 0; // Retorna true se foi inserido (novo)
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
  }

  private async gerarExcel() {
    console.log('📊 Gerando Excel...');

    const workbook = new ExcelJS.Workbook();
    const hoje = new Date().toISOString().split('T')[0];

    // Buscar publicações de hoje
    const publicacoes = this.db.prepare(`
      SELECT * FROM publicacoes
      WHERE data_disponibilizacao LIKE ?
      ORDER BY data_disponibilizacao DESC, tribunal, numero_processo
    `).all(`${hoje}%`) as any[];

    // Aba 1: Todas as publicações
    const wsTodas = workbook.addWorksheet('Todas Publicações');
    wsTodas.columns = [
      { header: 'Data', key: 'data', width: 12 },
      { header: 'Processo', key: 'processo', width: 25 },
      { header: 'Tribunal', key: 'tribunal', width: 10 },
      { header: 'Classe', key: 'classe', width: 20 },
      { header: 'Tipo', key: 'tipo', width: 15 },
      { header: 'Órgão', key: 'orgao', width: 30 },
      { header: 'Link', key: 'link', width: 50 },
    ];

    for (const pub of publicacoes) {
      wsTodas.addRow({
        data: pub.data_disponibilizacao.split('T')[0],
        processo: pub.numero_processo,
        tribunal: pub.tribunal,
        classe: pub.classe,
        tipo: pub.tipo,
        orgao: pub.orgao_julgador,
        link: pub.link,
      });
    }

    // Estilizar cabeçalho
    wsTodas.getRow(1).font = { bold: true };
    wsTodas.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };

    // Salvar
    const filename = `DJEN-OAB129021-${hoje}.xlsx`;
    const filepath = path.join(CONFIG.excelOutputDir, filename);
    await workbook.xlsx.writeFile(filepath);

    console.log(`   ✅ Excel salvo: ${filepath}\n`);
  }

  private exibirStatus() {
    // Limpar console
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
