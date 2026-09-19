import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Bus,
  House,
  Wrench,
  TriangleAlert,
  Warehouse,
  ChartNoAxesColumn,
  Users,
  Settings,
  LogOut,
  Search,
  RefreshCw,
  Clock3,
  ClipboardList,
  X,
  Plus,
  Save,
  RotateCcw,
  ShieldAlert,
  CheckCircle2,
  Pencil,
  LockKeyhole,
  CircleAlert,
  ArrowRightFromLine,
} from 'lucide-react'
import './App.css'

const EMPRESAS = [
  'REUNIDAS',
  'PIRACICABANA',
  'PRATA',
  'ITAMARATY',
  'PENHA',
  'ANDORINHA',
  'PRINCESA',
  'SANTA MARIA',
] as const

const BASES_OPERACIONAIS = [
  { codigo: 'ATA', nome: 'Araçatuba' },
  { codigo: 'BRU', nome: 'Bauru' },
  { codigo: 'SPO', nome: 'São Paulo' },
] as const

const AUTH_SESSION_KEY = 'cor-auth-session-v1'
const AUTH_PASSWORD = '123@456'

type Pagina =
  | 'painel'
  | 'frota'
  | 'consulta'
  | 'operacao'
  | 'garagem'
  | 'manutencao'
  | 'limpeza'
  | 'ocorrencias'
  | 'relatorios'
  | 'usuarios'
  | 'configuracoes'

type TipoMovimentacao = 'CHEGOU' | 'SAIU'
type StatusRetencao = 'RETIDO' | 'LIBERADO'
type BaseOperacional = 'ATA' | 'BRU' | 'SPO'
type Local = 'ATA' | 'BRU' | 'SPO'
type FiltroLocalRetido = 'TODOS' | Local
type LiberacaoManutencao = 'EM_MANUTENCAO' | 'LIBERADO' | '-'
type LiberacaoLimpeza = 'LIMPAR' | 'LIMPO' | '-'
type CondicaoChegada = 'NADA_CONSTA' | 'COM_AVARIA' | ''
type OrigemAtendimento = 'CHEGADA' | 'RETENCAO'
type TipoAvisoOperacao =
  | 'SEM_CHEGADA'
  | 'DUPLICIDADE_CHEGADA'
  | 'DUPLICIDADE_SAIDA'
  | 'VEICULO_EM_OUTRA_BASE'

type Movimentacao = {
  id: string
  baseOperacional: BaseOperacional
  tipo: TipoMovimentacao
  prefixo: string
  empresa: string
  linhaEntrada: string
  dataEntrada: string
  horaEntrada: string
  motivo: string
  problemaManutencao: string
  liberacaoManutencao: LiberacaoManutencao
  liberacaoLimpeza?: LiberacaoLimpeza
  responsavelLimpeza?: string
  cifResponsavelLimpeza?: string
  dataLimpeza?: string
  horaLimpeza?: string
  linhaSaida: string
  dataSaida: string
  horaManobra: string
  horaSaida: string
  historicoSomente?: boolean
}

type Retencao = {
  id: string
  baseOperacional: BaseOperacional
  prefixo: string
  empresa: string
  linhaEntrada: string
  dataEntrada: string
  horaEntrada: string
  motivo: string
  previsaoSaida: string
  local: Local
  status: StatusRetencao
  dataLiberacao: string
}

type AtendimentoManutencao = {
  id: string
  origem: OrigemAtendimento
  referenciaId: string
  baseOperacional: BaseOperacional
  prefixo: string
  empresa: string
  problema: string
  servicoRealizado: string
  responsavel: string
  cifResponsavel?: string
  dataFinalizacao: string
  horaFinalizacao: string
}

type AlvoFinalizacao =
  | { origem: 'CHEGADA'; movimentacao: Movimentacao }
  | { origem: 'RETENCAO'; retencao: Retencao }

type FormFinalizacao = {
  servicoRealizado: string
  responsavel: string
  cifResponsavel: string
}

type FormNovaAvaria = {
  problema: string
}

type FormLimpeza = {
  responsavel: string
  cifResponsavel: string
}

type MovimentacaoSalva = Omit<
  Movimentacao,
  'baseOperacional' | 'liberacaoManutencao' | 'problemaManutencao'
> & {
  baseOperacional?: BaseOperacional
  liberacaoManutencao?: LiberacaoManutencao
  problemaManutencao?: string
}

type RetencaoSalva = Omit<Retencao, 'baseOperacional'> & {
  baseOperacional?: BaseOperacional
}

type FormMovimentacao = {
  tipo: TipoMovimentacao
  prefixo: string
  empresa: string
  linhaEntrada: string
  dataEntrada: string
  horaEntrada: string
  motivo: string
  condicaoChegada: CondicaoChegada
  linhaSaida: string
  dataSaida: string
  horaManobra: string
  horaSaida: string
}

type FormRetencao = {
  prefixo: string
  empresa: string
  linhaEntrada: string
  dataEntrada: string
  horaEntrada: string
  motivo: string
  previsaoSaida: string
  local: Local
}

type AvisoOperacao = {
  tipo: TipoAvisoOperacao
  nova: Movimentacao
  ultima: Movimentacao | null
  outraBase?: Movimentacao | null
}

const MOVIMENTACOES_KEY = 'cor-movimentacoes-v2'
const RETENCOES_KEY = 'cor-retencoes-v2'
const ATENDIMENTOS_KEY = 'cor-atendimentos-manutencao-v1'
const BASE_OPERACIONAL_KEY = 'cor-base-operacional-v1'
const CARGA_PLANILHAS_KEY = 'cor-carga-planilhas-202609-v1'
const BACKUP_CARGA_PLANILHAS_KEY = 'cor-backup-carga-planilhas-202609-v1'

const movimentacoesIniciais: Movimentacao[] = [
  {
    id: 'mov-1',
    baseOperacional: 'ATA',
    tipo: 'CHEGOU',
    prefixo: '166004',
    empresa: 'REUNIDAS',
    linhaEntrada: 'CPN x ATA 21:30',
    dataEntrada: '17/09/2026',
    horaEntrada: '06:00',
    motivo: 'Limpador do lado esquerdo espanou o pino para o aperto do mesmo',
    liberacaoManutencao: 'EM_MANUTENCAO',
    problemaManutencao: 'Limpador do lado esquerdo espanou o pino para o aperto do mesmo',
    linhaSaida: '-',
    dataSaida: '-',
    horaManobra: '-',
    horaSaida: '-',
  },
  {
    id: 'mov-2',
    baseOperacional: 'ATA',
    tipo: 'CHEGOU',
    prefixo: '6738',
    empresa: 'ITAMARATY',
    linhaEntrada: '-',
    dataEntrada: '17/09/2026',
    horaEntrada: '06:18',
    motivo: 'Nada consta',
    liberacaoManutencao: 'LIBERADO',
    problemaManutencao: '-',
    linhaSaida: '-',
    dataSaida: '-',
    horaManobra: '-',
    horaSaida: '-',
  },
  {
    id: 'mov-3',
    baseOperacional: 'ATA',
    tipo: 'CHEGOU',
    prefixo: '168103',
    empresa: 'REUNIDAS',
    linhaEntrada: 'STS x ATA',
    dataEntrada: '17/09/2026',
    horaEntrada: '06:37',
    motivo: 'Nada consta',
    liberacaoManutencao: 'LIBERADO',
    problemaManutencao: '-',
    linhaSaida: '-',
    dataSaida: '-',
    horaManobra: '-',
    horaSaida: '-',
  },
  {
    id: 'mov-4',
    baseOperacional: 'ATA',
    tipo: 'CHEGOU',
    prefixo: '140711',
    empresa: 'REUNIDAS',
    linhaEntrada: 'SPO x ATA',
    dataEntrada: '17/09/2026',
    horaEntrada: '07:02',
    motivo: 'Nada consta',
    liberacaoManutencao: 'LIBERADO',
    problemaManutencao: '-',
    linhaSaida: '-',
    dataSaida: '-',
    horaManobra: '-',
    horaSaida: '-',
  },
  {
    id: 'mov-5',
    baseOperacional: 'ATA',
    tipo: 'CHEGOU',
    prefixo: '6630',
    empresa: 'ITAMARATY',
    linhaEntrada: '-',
    dataEntrada: '17/09/2026',
    horaEntrada: '07:16',
    motivo: 'Nada consta',
    liberacaoManutencao: 'LIBERADO',
    problemaManutencao: '-',
    linhaSaida: '-',
    dataSaida: '-',
    horaManobra: '-',
    horaSaida: '-',
  },
  {
    id: 'mov-6',
    baseOperacional: 'ATA',
    tipo: 'CHEGOU',
    prefixo: '212605',
    empresa: 'REUNIDAS',
    linhaEntrada: 'SPO x ATA 21H31',
    dataEntrada: '17/09/2026',
    horaEntrada: '07:48',
    motivo: 'Nada consta',
    liberacaoManutencao: 'LIBERADO',
    problemaManutencao: '-',
    linhaSaida: '-',
    dataSaida: '-',
    horaManobra: '-',
    horaSaida: '-',
  },
  {
    id: 'mov-7',
    baseOperacional: 'ATA',
    tipo: 'SAIU',
    prefixo: '166003',
    empresa: 'REUNIDAS',
    linhaEntrada: '-',
    dataEntrada: '-',
    horaEntrada: '-',
    motivo: '-',
    liberacaoManutencao: '-',
    problemaManutencao: '-',
    linhaSaida: 'ATA x SJP 09H10',
    dataSaida: '17/09/2026',
    horaManobra: '-',
    horaSaida: '09:02',
  },
  {
    id: 'mov-8',
    baseOperacional: 'ATA',
    tipo: 'SAIU',
    prefixo: '462601',
    empresa: 'PIRACICABANA',
    linhaEntrada: '-',
    dataEntrada: '-',
    horaEntrada: '-',
    motivo: '-',
    liberacaoManutencao: '-',
    problemaManutencao: '-',
    linhaSaida: 'ATA x SPO 09H30',
    dataSaida: '17/09/2026',
    horaManobra: '-',
    horaSaida: '09:24',
  },
  {
    id: 'mov-9',
    baseOperacional: 'ATA',
    tipo: 'CHEGOU',
    prefixo: '164013',
    empresa: 'REUNIDAS',
    linhaEntrada: 'SJP x ATA 08:15',
    dataEntrada: '17/09/2026',
    horaEntrada: '11:40',
    motivo: 'Nada consta',
    liberacaoManutencao: 'LIBERADO',
    problemaManutencao: '-',
    linhaSaida: '-',
    dataSaida: '-',
    horaManobra: '-',
    horaSaida: '-',
  },
  {
    id: 'mov-10',
    baseOperacional: 'ATA',
    tipo: 'CHEGOU',
    prefixo: '212601',
    empresa: 'PIRACICABANA',
    linhaEntrada: 'RJ x ATA 20H00',
    dataEntrada: '17/09/2026',
    horaEntrada: '13:58',
    motivo: 'Nada consta',
    liberacaoManutencao: 'LIBERADO',
    problemaManutencao: '-',
    linhaSaida: '-',
    dataSaida: '-',
    horaManobra: '-',
    horaSaida: '-',
  },
  {
    id: 'mov-11',
    baseOperacional: 'ATA',
    tipo: 'CHEGOU',
    prefixo: '164005',
    empresa: 'REUNIDAS',
    linhaEntrada: 'SPO x ATA 07:30',
    dataEntrada: '17/09/2026',
    horaEntrada: '17:45',
    motivo: 'Nada consta',
    liberacaoManutencao: 'LIBERADO',
    problemaManutencao: '-',
    linhaSaida: '-',
    dataSaida: '-',
    horaManobra: '-',
    horaSaida: '-',
  },
]

const retencoesIniciais: Retencao[] = [
  {
    id: 'ret-1',
    baseOperacional: 'ATA',
    prefixo: '144903',
    empresa: 'REUNIDAS',
    linhaEntrada: '-',
    dataEntrada: '24/05/2026',
    horaEntrada: '-',
    motivo: 'MOTOR',
    previsaoSaida: '10/07/2026',
    local: 'SPO',
    status: 'RETIDO',
    dataLiberacao: '-',
  },
  {
    id: 'ret-2',
    baseOperacional: 'ATA',
    prefixo: '146203',
    empresa: 'REUNIDAS',
    linhaEntrada: '-',
    dataEntrada: '01/05/2026',
    horaEntrada: '-',
    motivo: 'MOTOR',
    previsaoSaida: '26/07/2026',
    local: 'BRU',
    status: 'RETIDO',
    dataLiberacao: '-',
  },
  {
    id: 'ret-3',
    baseOperacional: 'ATA',
    prefixo: '164613',
    empresa: 'REUNIDAS',
    linhaEntrada: '-',
    dataEntrada: '01/05/2026',
    horaEntrada: '-',
    motivo: 'MOTOR',
    previsaoSaida: '10/07/2026',
    local: 'BRU',
    status: 'RETIDO',
    dataLiberacao: '-',
  },
  {
    id: 'ret-4',
    baseOperacional: 'ATA',
    prefixo: '164816',
    empresa: 'REUNIDAS',
    linhaEntrada: '-',
    dataEntrada: '01/05/2026',
    horaEntrada: '-',
    motivo: 'RESTAURAÇÃO MUSEU',
    previsaoSaida: '-',
    local: 'ATA',
    status: 'RETIDO',
    dataLiberacao: '-',
  },
  {
    id: 'ret-5',
    baseOperacional: 'ATA',
    prefixo: '168107',
    empresa: 'REUNIDAS',
    linhaEntrada: '-',
    dataEntrada: '13/08/2026',
    horaEntrada: '-',
    motivo: 'EM ANÁLISE',
    previsaoSaida: '-',
    local: 'BRU',
    status: 'RETIDO',
    dataLiberacao: '-',
  },
  {
    id: 'ret-6',
    baseOperacional: 'ATA',
    prefixo: '148604',
    empresa: 'REUNIDAS',
    linhaEntrada: 'RJ x ATA',
    dataEntrada: '09/09/2026',
    horaEntrada: '13:02',
    motivo: 'ALTERNADOR',
    previsaoSaida: '-',
    local: 'ATA',
    status: 'LIBERADO',
    dataLiberacao: '17/09/2026',
  },
  {
    id: 'ret-7',
    baseOperacional: 'ATA',
    prefixo: '164006',
    empresa: 'REUNIDAS',
    linhaEntrada: 'RJ x ATA 20:15',
    dataEntrada: '09/09/2026',
    horaEntrada: '12:41',
    motivo: 'Barra curta de direção',
    previsaoSaida: '-',
    local: 'ATA',
    status: 'LIBERADO',
    dataLiberacao: '17/09/2026',
  },
  {
    id: 'ret-8',
    baseOperacional: 'ATA',
    prefixo: '164004',
    empresa: 'REUNIDAS',
    linhaEntrada: '-',
    dataEntrada: '08/09/2026',
    horaEntrada: '-',
    motivo: 'FUNILARIA',
    previsaoSaida: '-',
    local: 'ATA',
    status: 'RETIDO',
    dataLiberacao: '-',
  },
  {
    id: 'ret-9',
    baseOperacional: 'ATA',
    prefixo: '148607',
    empresa: 'REUNIDAS',
    linhaEntrada: '-',
    dataEntrada: '10/09/2026',
    horaEntrada: '-',
    motivo: 'CÁRTER',
    previsaoSaida: '-',
    local: 'ATA',
    status: 'LIBERADO',
    dataLiberacao: '17/09/2026',
  },
  {
    id: 'ret-10',
    baseOperacional: 'ATA',
    prefixo: '148601',
    empresa: 'REUNIDAS',
    linhaEntrada: '-',
    dataEntrada: '10/09/2026',
    horaEntrada: '-',
    motivo: 'ELÉTRICA',
    previsaoSaida: '-',
    local: 'ATA',
    status: 'RETIDO',
    dataLiberacao: '-',
  },
  {
    id: 'ret-11',
    baseOperacional: 'ATA',
    prefixo: '164618',
    empresa: 'REUNIDAS',
    linhaEntrada: '-',
    dataEntrada: '06/08/2026',
    horaEntrada: '-',
    motivo: 'CÂMBIO',
    previsaoSaida: '11/08/2026',
    local: 'ATA',
    status: 'RETIDO',
    dataLiberacao: '-',
  },
  {
    id: 'ret-12',
    baseOperacional: 'ATA',
    prefixo: '144905',
    empresa: 'REUNIDAS',
    linhaEntrada: '-',
    dataEntrada: '14/09/2026',
    horaEntrada: '-',
    motivo: 'SUSPENSÃO E VAZAMENTO DE ÁGUA',
    previsaoSaida: '-',
    local: 'ATA',
    status: 'RETIDO',
    dataLiberacao: '-',
  },
]

const movimentacoesHistoricasPlanilhas: Movimentacao[] = [
  {
      id: "planilha-hist-001",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "162201",
      empresa: "REUNIDAS",
      linhaEntrada: "SBC x ATA 20:45",
      dataEntrada: "08/09/2026",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-002",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "202206",
      empresa: "PRATA",
      linhaEntrada: "SPO x ATA 23:00",
      dataEntrada: "08/09/2026",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-003",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "148606",
      empresa: "REUNIDAS",
      linhaEntrada: "SPO x ATA 13:30",
      dataEntrada: "08/09/2026",
      horaEntrada: "23:18",
      motivo: "NADA CONSTA",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-004",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "146209",
      empresa: "REUNIDAS",
      linhaEntrada: "SPO x ATA 22H15",
      dataEntrada: "09/09/2026",
      horaEntrada: "06:30",
      motivo: "Tampa solta (vazando óleo), poltrona 1 não reclina e tacógrafo solto",
      problemaManutencao: "Tampa solta (vazando óleo), poltrona 1 não reclina e tacógrafo solto",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-005",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "160002",
      empresa: "REUNIDAS",
      linhaEntrada: "SPO x ATA 22H20",
      dataEntrada: "09/09/2026",
      horaEntrada: "06:40",
      motivo: "NADA CONSTA",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-006",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "162205",
      empresa: "REUNIDAS",
      linhaEntrada: "CPN x ATA 21H30",
      dataEntrada: "09/09/2026",
      horaEntrada: "06:44",
      motivo: "NADA CONSTA",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-007",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "164614",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "ATA x SPO 06:30",
      dataSaida: "10/09/2026",
      horaManobra: "-",
      horaSaida: "06:13",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-008",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "148601",
      empresa: "REUNIDAS",
      linhaEntrada: "SPO x ATA 22:15",
      dataEntrada: "10/09/2026",
      horaEntrada: "06:35",
      motivo: "Mau funcionamento do sistema de dosagem de ARLA",
      problemaManutencao: "Mau funcionamento do sistema de dosagem de ARLA",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-009",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "6734",
      empresa: "ITAMARATY",
      linhaEntrada: "urbano",
      dataEntrada: "10/09/2026",
      horaEntrada: "06:43",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-010",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "148608",
      empresa: "REUNIDAS",
      linhaEntrada: "STS x ATA 20:00",
      dataEntrada: "10/09/2026",
      horaEntrada: "06:48",
      motivo: "NADA CONSTA",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-011",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "7279",
      empresa: "ITAMARATY",
      linhaEntrada: "CIRCULAR",
      dataEntrada: "10/09/2026",
      horaEntrada: "07:10",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-012",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "192604",
      empresa: "PIRACICABANA",
      linhaEntrada: "SBC x ATA 20:45",
      dataEntrada: "10/09/2026",
      horaEntrada: "07:55",
      motivo: "SEM OCORRÊNCIA",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-013",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "164009",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "ATA x SJP 09:10",
      dataSaida: "10/09/2026",
      horaManobra: "-",
      horaSaida: "08:40",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-014",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "462603",
      empresa: "PIRACICABANA",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "ATA x SPO 09:30",
      dataSaida: "10/09/2026",
      horaManobra: "-",
      horaSaida: "09:18",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-015",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "65245",
      empresa: "PENHA",
      linhaEntrada: "-",
      dataEntrada: "10/09/2026",
      horaEntrada: "09:50",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-016",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "160001",
      empresa: "REUNIDAS",
      linhaEntrada: "SPO x ATA 21:30",
      dataEntrada: "10/09/2026",
      horaEntrada: "10:16",
      motivo: "Vazando água do compressor",
      problemaManutencao: "Vazando água do compressor",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-017",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "164012",
      empresa: "REUNIDAS",
      linhaEntrada: "SJP x ATA 08:15",
      dataEntrada: "10/09/2026",
      horaEntrada: "11:45",
      motivo: "Ar condicionado não funciona",
      problemaManutencao: "Ar condicionado não funciona",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-018",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "148605",
      empresa: "REUNIDAS",
      linhaEntrada: "RJ x ATA 20:30",
      dataEntrada: "10/09/2026",
      horaEntrada: "11:50",
      motivo: "SEM OCORRÊNCIAS",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-019",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "144902",
      empresa: "REUNIDAS",
      linhaEntrada: "SPO x ATA 10:30",
      dataEntrada: "10/09/2026",
      horaEntrada: "19:06",
      motivo: "Na troca de motorista, carro está com mensagem no painel \"ALTERNADOR NÃO CARREGANDO\"",
      problemaManutencao: "Na troca de motorista, carro está com mensagem no painel \"ALTERNADOR NÃO CARREGANDO\"",
      liberacaoManutencao: "EM_MANUTENCAO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-020",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "6734",
      empresa: "ITAMARATY",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "10/09/2026",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-021",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "7279",
      empresa: "ITAMARATY",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "10/09/2026",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-022",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "166004",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "11/09/2026",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-023",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "168110",
      empresa: "REUNIDAS",
      linhaEntrada: "SPO x ATA 13:30",
      dataEntrada: "11/09/2026",
      horaEntrada: "-",
      motivo: "Erro F10 ar condicionado",
      problemaManutencao: "Erro F10 ar condicionado",
      liberacaoManutencao: "EM_MANUTENCAO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-024",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "212605",
      empresa: "REUNIDAS",
      linhaEntrada: "SPO x ATA 22:15",
      dataEntrada: "11/09/2026",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-025",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "162208",
      empresa: "REUNIDAS",
      linhaEntrada: "TLG x ATA",
      dataEntrada: "11/09/2026",
      horaEntrada: "00:40",
      motivo: "Caixa da direção estralando quando esterça o veículo",
      problemaManutencao: "Caixa da direção estralando quando esterça o veículo",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-026",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "146204",
      empresa: "REUNIDAS",
      linhaEntrada: "STS x ATA 20:00",
      dataEntrada: "11/09/2026",
      horaEntrada: "06:12",
      motivo: "Poltrona 25 molhando",
      problemaManutencao: "Poltrona 25 molhando",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-027",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "192601",
      empresa: "PIRACICABANA",
      linhaEntrada: "CPN x ATA 21H30",
      dataEntrada: "11/09/2026",
      horaEntrada: "07:00",
      motivo: "Batida na lateral do veículo (ocorrência no grupo)",
      problemaManutencao: "Batida na lateral do veículo (ocorrência no grupo)",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-028",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "140712",
      empresa: "REUNIDAS",
      linhaEntrada: "SPO x ATA 22:20",
      dataEntrada: "11/09/2026",
      horaEntrada: "07:01",
      motivo: "SEM OCORRÊNCIAS",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-029",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "192602",
      empresa: "PIRACICABANA",
      linhaEntrada: "SBC x ATA 20H45",
      dataEntrada: "11/09/2026",
      horaEntrada: "07:55",
      motivo: "SEM OCORRÊNCIAS",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-030",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "164001",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "ATA x CPN 09H00",
      dataSaida: "11/09/2026",
      horaManobra: "-",
      horaSaida: "08:52",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-031",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "146205",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "ATA x SJP 09H10",
      dataSaida: "11/09/2026",
      horaManobra: "-",
      horaSaida: "08:56",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-032",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "144906",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "ATA x SPO 09H30",
      dataSaida: "11/09/2026",
      horaManobra: "-",
      horaSaida: "09:15",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-033",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "144904",
      empresa: "REUNIDAS",
      linhaEntrada: "SJP x ATA 08H15",
      dataEntrada: "11/09/2026",
      horaEntrada: "11:45",
      motivo: "Farol de milha inoperante / farol dianteiro lado direito queimado",
      problemaManutencao: "Farol de milha inoperante / farol dianteiro lado direito queimado",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-034",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "148603",
      empresa: "REUNIDAS",
      linhaEntrada: "RJ x ATA 20H30",
      dataEntrada: "11/09/2026",
      horaEntrada: "12:07",
      motivo: "SEM OCORRÊNCIA",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-035",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "164008",
      empresa: "REUNIDAS",
      linhaEntrada: "RJ x ATA 20H15",
      dataEntrada: "11/09/2026",
      horaEntrada: "13:32",
      motivo: "Limpador de para-brisa não funciona",
      problemaManutencao: "Limpador de para-brisa não funciona",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-036",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "164001",
      empresa: "REUNIDAS",
      linhaEntrada: "ESCOTEIRO",
      dataEntrada: "11/09/2026",
      horaEntrada: "15:00",
      motivo: "Janela superior direita quebrada devido a pedra (relatório já feito)",
      problemaManutencao: "Janela superior direita quebrada devido a pedra (relatório já feito)",
      liberacaoManutencao: "EM_MANUTENCAO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-037",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "144902",
      empresa: "REUNIDAS",
      linhaEntrada: "SPO x ATA 07:30",
      dataEntrada: "11/09/2026",
      horaEntrada: "18:15",
      motivo: "NADA CONSTA",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-038",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "166003",
      empresa: "REUNIDAS",
      linhaEntrada: "CPN x ATA 08:30",
      dataEntrada: "11/09/2026",
      horaEntrada: "18:30",
      motivo: "Farol esquerdo queimado",
      problemaManutencao: "Farol esquerdo queimado",
      liberacaoManutencao: "EM_MANUTENCAO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-039",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "1620",
      empresa: "PIRACICABANA",
      linhaEntrada: "-",
      dataEntrada: "12/09/2026",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-040",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "164012",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "12/09/2026",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-041",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "4093",
      empresa: "PIRACICABANA",
      linhaEntrada: "ARO",
      dataEntrada: "12/09/2026",
      horaEntrada: "01:00",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-042",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "462602",
      empresa: "PIRACICABANA",
      linhaEntrada: "SPO x ATA 17:00",
      dataEntrada: "12/09/2026",
      horaEntrada: "01:30",
      motivo: "NADA CONSTA",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-043",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "140712",
      empresa: "REUNIDAS",
      linhaEntrada: "SPO x ATA 22:20",
      dataEntrada: "12/09/2026",
      horaEntrada: "06:42",
      motivo: "SEM OCORRÊNCIA",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-044",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "212606",
      empresa: "PIRACICABANA",
      linhaEntrada: "SPO x ATA 22:15",
      dataEntrada: "12/09/2026",
      horaEntrada: "07:22",
      motivo: "Farol de milha e farol de neblina inoperantes",
      problemaManutencao: "Farol de milha e farol de neblina inoperantes",
      liberacaoManutencao: "EM_MANUTENCAO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-045",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "164013",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "ATA x SJP 09:10",
      dataSaida: "12/09/2026",
      horaManobra: "-",
      horaSaida: "09:10",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-046",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "192604",
      empresa: "PIRACICABANA",
      linhaEntrada: "SBC x ATA 20:45",
      dataEntrada: "12/09/2026",
      horaEntrada: "09:10",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-047",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "65245",
      empresa: "PENHA",
      linhaEntrada: "-",
      dataEntrada: "12/09/2026",
      horaEntrada: "09:25",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-048",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "164012",
      empresa: "REUNIDAS",
      linhaEntrada: "STS x ATA 20:00",
      dataEntrada: "12/09/2026",
      horaEntrada: "09:28",
      motivo: "Haste do maleiro do lado direito quebrada (última porta), completar óleo do motor.",
      problemaManutencao: "Haste do maleiro do lado direito quebrada (última porta), completar óleo do motor.",
      liberacaoManutencao: "EM_MANUTENCAO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-049",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "462422",
      empresa: "PIRACICABANA",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "ATA x SPO 09:30",
      dataSaida: "12/09/2026",
      horaManobra: "-",
      horaSaida: "10:00",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-050",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "144905",
      empresa: "REUNIDAS",
      linhaEntrada: "SJP x ATA 08:15",
      dataEntrada: "12/09/2026",
      horaEntrada: "11:40",
      motivo: "SEM H.O",
      problemaManutencao: "SEM H.O",
      liberacaoManutencao: "EM_MANUTENCAO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-051",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "148602",
      empresa: "REUNIDAS",
      linhaEntrada: "RJ x ATA 20:00",
      dataEntrada: "12/09/2026",
      horaEntrada: "12:28",
      motivo: "Tampa traseira não fecha (motor)",
      problemaManutencao: "Tampa traseira não fecha (motor)",
      liberacaoManutencao: "EM_MANUTENCAO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-052",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "148606",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "ATA x RJ 13:15",
      dataSaida: "12/09/2026",
      horaManobra: "-",
      horaSaida: "12:50",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-053",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "65245",
      empresa: "PENHA",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "-",
      dataSaida: "12/09/2026",
      horaManobra: "-",
      horaSaida: "17:44",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-054",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "164008",
      empresa: "REUNIDAS",
      linhaEntrada: "SPO x ATA 07:30",
      dataEntrada: "12/09/2026",
      horaEntrada: "18:30",
      motivo: "Verificar os freios e regular",
      problemaManutencao: "Verificar os freios e regular",
      liberacaoManutencao: "EM_MANUTENCAO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-055",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "164012",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "ATA x STS 20:00",
      dataSaida: "12/09/2026",
      horaManobra: "-",
      horaSaida: "19:43",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-056",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "148603",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "ATA x SPO 21:15",
      dataSaida: "12/09/2026",
      horaManobra: "-",
      horaSaida: "20:55",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-057",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "144905",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "ATA x SPO 21:35",
      dataSaida: "12/09/2026",
      horaManobra: "-",
      horaSaida: "21:15",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-058",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "1620",
      empresa: "PIRACICABANA",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "ATA x CPN 22:00",
      dataSaida: "12/09/2026",
      horaManobra: "-",
      horaSaida: "21:30",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-059",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "162208",
      empresa: "REUNIDAS",
      linhaEntrada: "TLG x SPO 19:30 SOS",
      dataEntrada: "12/09/2026",
      horaEntrada: "23:20",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-060",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "160002",
      empresa: "REUNIDAS",
      linhaEntrada: "SPO x ATA 13:30",
      dataEntrada: "13/09/2026",
      horaEntrada: "00:15",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-061",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "160001",
      empresa: "REUNIDAS",
      linhaEntrada: "SPO x ATA 21:31",
      dataEntrada: "13/09/2026",
      horaEntrada: "05:55",
      motivo: "TAG não abre as cancelas",
      problemaManutencao: "TAG não abre as cancelas",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-062",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "144902",
      empresa: "REUNIDAS",
      linhaEntrada: "STS x ATA 20H00",
      dataEntrada: "13/09/2026",
      horaEntrada: "06:15",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "EM_MANUTENCAO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-063",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "168104",
      empresa: "REUNIDAS",
      linhaEntrada: "CPN x ATA 21H30",
      dataEntrada: "13/09/2026",
      horaEntrada: "06:18",
      motivo: "Veículo molhando poltronas",
      problemaManutencao: "Veículo molhando poltronas",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-064",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "169400",
      empresa: "REUNIDAS",
      linhaEntrada: "SPO x ATA 22H15",
      dataEntrada: "13/09/2026",
      horaEntrada: "07:15",
      motivo: "SEM OCORRÊNCIAS",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-065",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "192602",
      empresa: "REUNIDAS",
      linhaEntrada: "SBC x ATA 20H45",
      dataEntrada: "13/09/2026",
      horaEntrada: "07:48",
      motivo: "SEM OCORRÊNCIAS",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-066",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "166003",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "ATA x CPN 09H00",
      dataSaida: "13/09/2026",
      horaManobra: "-",
      horaSaida: "08:38",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-067",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "144902",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "EM_MANUTENCAO",
      linhaSaida: "ATA x SJP 09H10",
      dataSaida: "13/09/2026",
      horaManobra: "-",
      horaSaida: "09:01",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-068",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "140712",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "ATA x SPO 09H30",
      dataSaida: "13/09/2026",
      horaManobra: "-",
      horaSaida: "09:25",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-069",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "148605",
      empresa: "REUNIDAS",
      linhaEntrada: "RJ x ATA 20H00",
      dataEntrada: "13/09/2026",
      horaEntrada: "11:41",
      motivo: "SEM OCORRÊNCIAS",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-070",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "168108",
      empresa: "REUNIDAS",
      linhaEntrada: "SJP x ATA 08H15",
      dataEntrada: "13/09/2026",
      horaEntrada: "11:44",
      motivo: "SEM OCORRÊNCIAS",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-071",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "212601",
      empresa: "PIRACICABANA",
      linhaEntrada: "RJ x ATA 20H00",
      dataEntrada: "13/09/2026",
      horaEntrada: "13:00",
      motivo: "SEM OCORRÊNCIAS",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-072",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "168104",
      empresa: "REUNIDAS",
      linhaEntrada: "SJP x ATA 18:15",
      dataEntrada: "13/09/2026",
      horaEntrada: "22:30",
      motivo: "Limpador de para-brisas esquerdo não funciona",
      problemaManutencao: "Limpador de para-brisas esquerdo não funciona",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-073",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "140712",
      empresa: "REUNIDAS",
      linhaEntrada: "SPO x ATA 22:20",
      dataEntrada: "14/09/2026",
      horaEntrada: "06:45",
      motivo: "SEM OCORRÊNCIAS",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-074",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "164012",
      empresa: "REUNIDAS",
      linhaEntrada: "STS x ATA 20:00",
      dataEntrada: "14/09/2026",
      horaEntrada: "06:50",
      motivo: "PERCA DE POTÊNCIA",
      problemaManutencao: "PERCA DE POTÊNCIA",
      liberacaoManutencao: "EM_MANUTENCAO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-075",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "212602",
      empresa: "PIRACICABANA",
      linhaEntrada: "SPO x ATA 21:30",
      dataEntrada: "14/09/2026",
      horaEntrada: "06:50",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-076",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "65245",
      empresa: "PENHA",
      linhaEntrada: "-",
      dataEntrada: "14/09/2026",
      horaEntrada: "07:00",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-077",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "146204",
      empresa: "REUNIDAS",
      linhaEntrada: "CPN x ATA 21:30",
      dataEntrada: "14/09/2026",
      horaEntrada: "07:08",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-078",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "6058",
      empresa: "ITAMARATY",
      linhaEntrada: "-",
      dataEntrada: "14/09/2026",
      horaEntrada: "07:38",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-079",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "192604",
      empresa: "REUNIDAS",
      linhaEntrada: "SBC x ATA 20:45",
      dataEntrada: "14/09/2026",
      horaEntrada: "08:00",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-080",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "146204",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "14/09/2026",
      horaManobra: "-",
      horaSaida: "09:17",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-081",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "164012",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "EM_MANUTENCAO",
      linhaSaida: "ATA x SPO 09:30",
      dataSaida: "14/09/2026",
      horaManobra: "-",
      horaSaida: "09:28",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-082",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "462512",
      empresa: "PIRACICABANA",
      linhaEntrada: "SPO x ATA 22:15",
      dataEntrada: "14/09/2026",
      horaEntrada: "09:45",
      motivo: "Carro de troca, sem ocorrência",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-083",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "462512",
      empresa: "PIRACICABANA",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "14/09/2026",
      horaManobra: "-",
      horaSaida: "11:35",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-084",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "6734",
      empresa: "ITAMARATY",
      linhaEntrada: "urbano",
      dataEntrada: "14/09/2026",
      horaEntrada: "12:15",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-085",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "140711",
      empresa: "REUNIDAS",
      linhaEntrada: "RJ x ATA 20:15",
      dataEntrada: "14/09/2026",
      horaEntrada: "12:29",
      motivo: "Porta da cabine não abre por fora",
      problemaManutencao: "Porta da cabine não abre por fora",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-086",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "164012",
      empresa: "REUNIDAS",
      linhaEntrada: "ATA x SPO 9:30",
      dataEntrada: "14/09/2026",
      horaEntrada: "12:30",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "EM_MANUTENCAO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-087",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "7279",
      empresa: "ITAMARATY",
      linhaEntrada: "urbano",
      dataEntrada: "14/09/2026",
      horaEntrada: "12:34",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-088",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "148607",
      empresa: "REUNIDAS",
      linhaEntrada: "RJ x ATA 19:45",
      dataEntrada: "14/09/2026",
      horaEntrada: "12:41",
      motivo: "Limpador esquerdo quebrado",
      problemaManutencao: "Limpador esquerdo quebrado",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-089",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "212606",
      empresa: "PIRACICABANA",
      linhaEntrada: "RJ x ATA 20:00",
      dataEntrada: "14/09/2026",
      horaEntrada: "12:44",
      motivo: "Meia luz direito queimado / milha dianteiro e traseiro não funciona / curto M3 A3",
      problemaManutencao: "Meia luz direito queimado / milha dianteiro e traseiro não funciona / curto M3 A3",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-090",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "162205",
      empresa: "REUNIDAS",
      linhaEntrada: "RJ x ATA 20:30",
      dataEntrada: "14/09/2026",
      horaEntrada: "12:51",
      motivo: "NADA CONSTA",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-091",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "169400",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "ATA x RJ 13:15",
      dataSaida: "14/09/2026",
      horaManobra: "-",
      horaSaida: "13:00",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-092",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "212602",
      empresa: "PIRACICABANA",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "ATA x RJ 13:30",
      dataSaida: "14/09/2026",
      horaManobra: "-",
      horaSaida: "13:11",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-093",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "6058",
      empresa: "ITAMARATY",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "14/09/2026",
      horaManobra: "-",
      horaSaida: "17:30",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-094",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "164014",
      empresa: "REUNIDAS",
      linhaEntrada: "escoteiro",
      dataEntrada: "14/09/2026",
      horaEntrada: "18:06",
      motivo: "SEM OCORRÊNCIA",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-095",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "162208",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "ATA x STS 20:00",
      dataSaida: "14/09/2026",
      horaManobra: "-",
      horaSaida: "19:52",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-096",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "192604",
      empresa: "PIRACICABANA",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "ATA x STS 20:30",
      dataSaida: "14/09/2026",
      horaManobra: "-",
      horaSaida: "20:26",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-097",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "212606",
      empresa: "PIRACICABANA",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "ATA x SPO 21:15",
      dataSaida: "14/09/2026",
      horaManobra: "-",
      horaSaida: "20:53",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-098",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "162204",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "ATA x SPO 21:35",
      dataSaida: "14/09/2026",
      horaManobra: "-",
      horaSaida: "20:55",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-099",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "140712",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "ATA x SPO 21:30",
      dataSaida: "14/09/2026",
      horaManobra: "-",
      horaSaida: "21:05",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-100",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "168108",
      empresa: "REUNIDAS",
      linhaEntrada: "SPO x ATA 13:30",
      dataEntrada: "14/09/2026",
      horaEntrada: "23:30",
      motivo: "Embreagem endurecendo e veículo tem os dois limpadores com problemas",
      problemaManutencao: "Embreagem endurecendo e veículo tem os dois limpadores com problemas",
      liberacaoManutencao: "EM_MANUTENCAO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-101",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "7279",
      empresa: "ITAMARATY",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "14/09/2026",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-102",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "164001",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "ATA x MRP 05:00",
      dataSaida: "15/09/2026",
      horaManobra: "-",
      horaSaida: "05:15",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-103",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "164008",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "ATA x MRP 05:20",
      dataSaida: "15/09/2026",
      horaManobra: "-",
      horaSaida: "05:30",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-104",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "148607",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "ATA x SPO 06:30",
      dataSaida: "15/09/2026",
      horaManobra: "-",
      horaSaida: "06:10",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-105",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "146207",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "ATA x MRP 06:50",
      dataSaida: "15/09/2026",
      horaManobra: "-",
      horaSaida: "06:20",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-106",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "144902",
      empresa: "REUNIDAS",
      linhaEntrada: "STS x ATA 20H00",
      dataEntrada: "15/09/2026",
      horaEntrada: "06:23",
      motivo: "NADA CONSTA",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-107",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "164014",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "ATA x MRP 06:40",
      dataSaida: "15/09/2026",
      horaManobra: "-",
      horaSaida: "06:30",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-108",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "462515",
      empresa: "PIRACICABANA",
      linhaEntrada: "-",
      dataEntrada: "15/09/2026",
      horaEntrada: "06:30",
      motivo: "NADA CONSTA",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-109",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "462602",
      empresa: "PIRACICABANA",
      linhaEntrada: "-",
      dataEntrada: "15/09/2026",
      horaEntrada: "06:37",
      motivo: "NADA CONSTA",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-110",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "168104",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "ATA x LAV 06:30",
      dataSaida: "15/09/2026",
      horaManobra: "-",
      horaSaida: "06:50",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-111",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "168105",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "ATA x LAV 06:40",
      dataSaida: "15/09/2026",
      horaManobra: "-",
      horaSaida: "06:50",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-112",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "144902",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "ATA x MRP 06:45",
      dataSaida: "15/09/2026",
      horaManobra: "-",
      horaSaida: "06:51",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-113",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "160001",
      empresa: "REUNIDAS",
      linhaEntrada: "SPO x ATA 22H20",
      dataEntrada: "15/09/2026",
      horaEntrada: "07:07",
      motivo: "NADA CONSTA",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-114",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "192602",
      empresa: "REUNIDAS",
      linhaEntrada: "SBC x ATA 20H45",
      dataEntrada: "15/09/2026",
      horaEntrada: "08:00",
      motivo: "NADA CONSTA",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-115",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "146207",
      empresa: "REUNIDAS",
      linhaEntrada: "MRP x ATA 08H00",
      dataEntrada: "15/09/2026",
      horaEntrada: "10:05",
      motivo: "NADA CONSTA",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-116",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "168103",
      empresa: "REUNIDAS",
      linhaEntrada: "SJP x ATA 08H15",
      dataEntrada: "15/09/2026",
      horaEntrada: "11:41",
      motivo: "NADA CONSTA",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-117",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "148606",
      empresa: "REUNIDAS",
      linhaEntrada: "RJ x ATA 20:30",
      dataEntrada: "15/09/2026",
      horaEntrada: "12:47",
      motivo: "Vazamento de ar comprimido",
      problemaManutencao: "Vazamento de ar comprimido",
      liberacaoManutencao: "EM_MANUTENCAO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-118",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "212605",
      empresa: "PIRACICABANA",
      linhaEntrada: "RJ x ATA 20:00",
      dataEntrada: "15/09/2026",
      horaEntrada: "13:14",
      motivo: "Água entrando no bagageiro da frente e escorrendo na cabine",
      problemaManutencao: "Água entrando no bagageiro da frente e escorrendo na cabine",
      liberacaoManutencao: "EM_MANUTENCAO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-119",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "148608",
      empresa: "REUNIDAS",
      linhaEntrada: "SPO x ATA 07:30",
      dataEntrada: "15/09/2026",
      horaEntrada: "18:25",
      motivo: "NADA CONSTA",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-120",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "162202",
      empresa: "REUNIDAS",
      linhaEntrada: "BRU x ATA",
      dataEntrada: "15/09/2026",
      horaEntrada: "22:30",
      motivo: "NADA CONSTA",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-121",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "168108",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "ATA x CPN 22:00 SOS",
      dataSaida: "15/09/2026",
      horaManobra: "-",
      horaSaida: "22:40",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-122",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "164012",
      empresa: "REUNIDAS",
      linhaEntrada: "ATA x CPN 22:00 SOS",
      dataEntrada: "15/09/2026",
      horaEntrada: "23:20",
      motivo: "PERDA DE POTÊNCIA, CORTE NA BAIXA ACELERAÇÃO",
      problemaManutencao: "PERDA DE POTÊNCIA, CORTE NA BAIXA ACELERAÇÃO",
      liberacaoManutencao: "EM_MANUTENCAO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-123",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "168109",
      empresa: "REUNIDAS",
      linhaEntrada: "SPO x ATA 13:30",
      dataEntrada: "16/09/2026",
      horaEntrada: "00:10",
      motivo: "NADA CONSTA",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-124",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "164001",
      empresa: "REUNIDAS",
      linhaEntrada: "SPO x ATA 15:00 ESCOTEIRO",
      dataEntrada: "16/09/2026",
      horaEntrada: "01:38",
      motivo: "NADA CONSTA",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-125",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "164008",
      empresa: "REUNIDAS",
      linhaEntrada: "SPO x ATA 15:00 ESCOTEIRO",
      dataEntrada: "16/09/2026",
      horaEntrada: "01:38",
      motivo: "EMBREAGEM DURA",
      problemaManutencao: "EMBREAGEM DURA",
      liberacaoManutencao: "EM_MANUTENCAO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-126",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "168104",
      empresa: "REUNIDAS",
      linhaEntrada: "SPO x ATA 15:00 ESCOTEIRO",
      dataEntrada: "16/09/2026",
      horaEntrada: "01:38",
      motivo: "NADA CONSTA",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-127",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "162204",
      empresa: "REUNIDAS",
      linhaEntrada: "SPO x ATA 21:31",
      dataEntrada: "16/09/2026",
      horaEntrada: "05:50",
      motivo: "NADA CONSTA",
      problemaManutencao: "-",
      liberacaoManutencao: "LIBERADO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-128",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "148605",
      empresa: "REUNIDAS",
      linhaEntrada: "CPN x ATA 21H30",
      dataEntrada: "16/09/2026",
      horaEntrada: "06:00",
      motivo: "Infestação de baratas",
      problemaManutencao: "Infestação de baratas",
      liberacaoManutencao: "EM_MANUTENCAO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-129",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "140712",
      empresa: "REUNIDAS",
      linhaEntrada: "SPO x ATA 22:20",
      dataEntrada: "16/09/2026",
      horaEntrada: "06:10",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-130",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "192604",
      empresa: "REUNIDAS",
      linhaEntrada: "SBC x ATA 20:45",
      dataEntrada: "16/09/2026",
      horaEntrada: "06:50",
      motivo: "Do bagageiro lateral do lado direito batida, multimídia com defeito e porta da cabine do motorista quebrada.",
      problemaManutencao: "Do bagageiro lateral do lado direito batida, multimídia com defeito e porta da cabine do motorista quebrada.",
      liberacaoManutencao: "EM_MANUTENCAO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-131",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "212606",
      empresa: "REUNIDAS",
      linhaEntrada: "SPO x ATA 22:15",
      dataEntrada: "16/09/2026",
      horaEntrada: "06:52",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-132",
      baseOperacional: "ATA",
      tipo: "CHEGOU",
      prefixo: "162208",
      empresa: "REUNIDAS",
      linhaEntrada: "STS x ATA 20:00",
      dataEntrada: "16/09/2026",
      horaEntrada: "07:15",
      motivo: "Perca de potência",
      problemaManutencao: "Perca de potência",
      liberacaoManutencao: "EM_MANUTENCAO",
      linhaSaida: "-",
      dataSaida: "-",
      horaManobra: "-",
      horaSaida: "-",
      historicoSomente: true,
  },
  {
      id: "planilha-hist-133",
      baseOperacional: "ATA",
      tipo: "SAIU",
      prefixo: "148605",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "-",
      problemaManutencao: "-",
      liberacaoManutencao: "-",
      linhaSaida: "-",
      dataSaida: "16/09/2026",
      horaManobra: "-",
      horaSaida: "09:00",
      historicoSomente: true,
  }
]

const retencoesAtivasPlanilhas: Retencao[] = [
  {
      id: "planilha-ret-01",
      baseOperacional: "ATA",
      prefixo: "144903",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "24/05/2026",
      horaEntrada: "-",
      motivo: "MOTOR",
      previsaoSaida: "10/07/2026",
      local: "SPO",
      status: "RETIDO",
      dataLiberacao: "-",
  },
  {
      id: "planilha-ret-02",
      baseOperacional: "ATA",
      prefixo: "144905",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "14/09/2026",
      horaEntrada: "-",
      motivo: "SUSPENSÃO E VAZAMENTO DE ÁGUA",
      previsaoSaida: "-",
      local: "ATA",
      status: "RETIDO",
      dataLiberacao: "-",
  },
  {
      id: "planilha-ret-03",
      baseOperacional: "ATA",
      prefixo: "146203",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "01/05/2026",
      horaEntrada: "-",
      motivo: "MOTOR",
      previsaoSaida: "26/07/2026",
      local: "BRU",
      status: "RETIDO",
      dataLiberacao: "-",
  },
  {
      id: "planilha-ret-04",
      baseOperacional: "ATA",
      prefixo: "148601",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "10/09/2026",
      horaEntrada: "-",
      motivo: "ELÉTRICA",
      previsaoSaida: "-",
      local: "ATA",
      status: "RETIDO",
      dataLiberacao: "-",
  },
  {
      id: "planilha-ret-05",
      baseOperacional: "ATA",
      prefixo: "164004",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "08/09/2026",
      horaEntrada: "-",
      motivo: "FUNILARIA",
      previsaoSaida: "-",
      local: "ATA",
      status: "RETIDO",
      dataLiberacao: "-",
  },
  {
      id: "planilha-ret-06",
      baseOperacional: "ATA",
      prefixo: "164613",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "01/05/2026",
      horaEntrada: "-",
      motivo: "MOTOR",
      previsaoSaida: "10/07/2026",
      local: "BRU",
      status: "RETIDO",
      dataLiberacao: "-",
  },
  {
      id: "planilha-ret-07",
      baseOperacional: "ATA",
      prefixo: "164618",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "06/08/2026",
      horaEntrada: "-",
      motivo: "CÂMBIO",
      previsaoSaida: "11/08/2026",
      local: "ATA",
      status: "RETIDO",
      dataLiberacao: "-",
  },
  {
      id: "planilha-ret-08",
      baseOperacional: "ATA",
      prefixo: "164816",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "-",
      horaEntrada: "-",
      motivo: "RESTAURAÇÃO MUSEU",
      previsaoSaida: "-",
      local: "ATA",
      status: "RETIDO",
      dataLiberacao: "-",
  },
  {
      id: "planilha-ret-09",
      baseOperacional: "ATA",
      prefixo: "168107",
      empresa: "REUNIDAS",
      linhaEntrada: "-",
      dataEntrada: "13/08/2026",
      horaEntrada: "-",
      motivo: "EM ANÁLISE",
      previsaoSaida: "-",
      local: "BRU",
      status: "RETIDO",
      dataLiberacao: "-",
  }
]

const formMovInicial: FormMovimentacao = {
  tipo: 'CHEGOU',
  prefixo: '',
  empresa: 'REUNIDAS',
  linhaEntrada: '',
  dataEntrada: '',
  horaEntrada: '',
  motivo: '',
  condicaoChegada: '',
  linhaSaida: '',
  dataSaida: '',
  horaManobra: '',
  horaSaida: '',
}

const formRetInicial: FormRetencao = {
  prefixo: '',
  empresa: 'REUNIDAS',
  linhaEntrada: '',
  dataEntrada: '',
  horaEntrada: '',
  motivo: '',
  previsaoSaida: '',
  local: 'ATA',
}

const formFinalizacaoInicial: FormFinalizacao = {
  servicoRealizado: '',
  responsavel: '',
  cifResponsavel: '',
}

const formNovaAvariaInicial: FormNovaAvaria = {
  problema: '',
}

const formLimpezaInicial: FormLimpeza = {
  responsavel: '',
  cifResponsavel: '',
}

const atendimentosIniciais: AtendimentoManutencao[] = []

function normalizarEmpresa(empresa: string) {
  const nome = empresa.trim().toUpperCase()
  return nome === 'ITAMARATI' ? 'ITAMARATY' : nome
}

function carregar<T>(chave: string, padrao: T): T {
  try {
    const salvo = localStorage.getItem(chave)
    return salvo ? (JSON.parse(salvo) as T) : padrao
  } catch {
    return padrao
  }
}

function inferirLiberacaoManutencao(item: MovimentacaoSalva): LiberacaoManutencao {
  if (item.tipo === 'SAIU') return '-'
  if (item.liberacaoManutencao) return item.liberacaoManutencao

  return normalizar(item.motivo) === 'nada consta'
    ? 'LIBERADO'
    : 'EM_MANUTENCAO'
}

function carregarMovimentacoes() {
  const dados = carregar<MovimentacaoSalva[]>(
    MOVIMENTACOES_KEY,
    movimentacoesIniciais
  )

  return dados.map(
    (item): Movimentacao => ({
      ...item,
      baseOperacional: item.baseOperacional ?? 'ATA',
      empresa: normalizarEmpresa(item.empresa),
      liberacaoManutencao: inferirLiberacaoManutencao(item),
      problemaManutencao:
        item.problemaManutencao ??
        (inferirLiberacaoManutencao(item) === 'EM_MANUTENCAO'
          ? item.motivo || '-'
          : '-'),
    })
  )
}

function carregarRetencoes() {
  const dados = carregar<RetencaoSalva[]>(RETENCOES_KEY, retencoesIniciais)

  return dados.map(
    (item): Retencao => ({
      ...item,
      baseOperacional: item.baseOperacional ?? 'ATA',
      empresa: normalizarEmpresa(item.empresa),
    })
  )
}

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function dataBR(dataISO: string) {
  if (!dataISO) return '-'
  const [ano, mes, dia] = dataISO.split('-')
  return `${dia}/${mes}/${ano}`
}

function dataISO(data: string) {
  if (!data || data === '-') return ''
  const [dia, mes, ano] = data.split('/')
  return dia && mes && ano ? `${ano}-${mes}-${dia}` : ''
}

function hojeISO() {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function agoraForm() {
  const agora = new Date()
  return {
    data: hojeISO(),
    hora: `${String(agora.getHours()).padStart(2, '0')}:${String(
      agora.getMinutes()
    ).padStart(2, '0')}`,
  }
}

function parseDataBR(data: string) {
  if (!data || data === '-') return null
  const [dia, mes, ano] = data.split('/').map(Number)
  if (!dia || !mes || !ano) return null
  return new Date(ano, mes - 1, dia)
}

function momentoMovimentacao(item: Movimentacao) {
  const data = item.tipo === 'CHEGOU' ? item.dataEntrada : item.dataSaida
  const hora = item.tipo === 'CHEGOU' ? item.horaEntrada : item.horaSaida
  const momento = parseDataBR(data)
  if (!momento) return 0

  if (hora && hora !== '-') {
    const [h, m] = hora.split(':').map(Number)
    momento.setHours(h || 0, m || 0, 0, 0)
  }

  return momento.getTime()
}

function tempoNaGaragem(chegada: Movimentacao) {
  const inicio = momentoMovimentacao(chegada)
  if (!inicio) return '-'

  const diferenca = Math.max(0, Date.now() - inicio)
  const horas = Math.floor(diferenca / 3600000)

  if (horas < 24) return `${horas}h`

  const dias = Math.floor(horas / 24)
  return `${dias}d ${horas % 24}h`
}

function diasRetido(retencao: Retencao) {
  const inicio = parseDataBR(retencao.dataEntrada)
  if (!inicio) return 0

  const fim =
    retencao.status === 'LIBERADO'
      ? parseDataBR(retencao.dataLiberacao)
      : new Date()

  if (!fim) return 0

  const inicioDia = new Date(
    inicio.getFullYear(),
    inicio.getMonth(),
    inicio.getDate()
  )
  const fimDia = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate())

  const diferenca =
    Math.floor((fimDia.getTime() - inicioDia.getTime()) / 86400000) + 1

  return Math.max(1, diferenca)
}

function nivelRetencao(retencao: Retencao) {
  const dias = diasRetido(retencao)

  if (retencao.status === 'LIBERADO') {
    return { classe: 'days-finalizado', rotulo: 'FINALIZADO' }
  }
  if (dias <= 2) return { classe: 'days-recente', rotulo: 'RECENTE' }
  if (dias <= 5) return { classe: 'days-atencao', rotulo: 'ATENÇÃO' }
  if (dias <= 10) return { classe: 'days-alerta', rotulo: 'ALERTA' }
  return { classe: 'days-critico', rotulo: 'CRÍTICO' }
}

function nomeBase(base: BaseOperacional) {
  return BASES_OPERACIONAIS.find((item) => item.codigo === base)?.nome ?? base
}

function localNome(local: Local) {
  return nomeBase(local)
}

function textoLiberacaoManutencao(valor: LiberacaoManutencao) {
  if (valor === 'EM_MANUTENCAO') return 'EM MANUT.'
  if (valor === 'LIBERADO') return 'LIBERADO'
  return '-'
}

function textoLiberacaoLimpeza(valor?: LiberacaoLimpeza) {
  if (valor === 'LIMPAR') return 'LIMPAR'
  if (valor === 'LIMPO') return 'LIMPO'
  return '-'
}

function carregarBaseOperacional(): BaseOperacional {
  try {
    const salva = localStorage.getItem(BASE_OPERACIONAL_KEY)
    if (salva === 'ATA' || salva === 'BRU' || salva === 'SPO') return salva
  } catch {
    // Se o navegador bloquear o armazenamento, o protótipo abre em ATA.
  }

  return 'ATA'
}

function cargaPlanilhasJaAplicada() {
  try {
    return localStorage.getItem(CARGA_PLANILHAS_KEY) === '1'
  } catch {
    return false
  }
}

function backupCargaPlanilhasExiste() {
  try {
    return localStorage.getItem(BACKUP_CARGA_PLANILHAS_KEY) !== null
  } catch {
    return false
  }
}

function App() {
  const [autenticado, setAutenticado] = useState(
    () => sessionStorage.getItem(AUTH_SESSION_KEY) === '1'
  )
  const [senhaAcesso, setSenhaAcesso] = useState('')
  const [erroSenha, setErroSenha] = useState('')
  const [validandoSenha, setValidandoSenha] = useState(false)
  const [pagina, setPagina] = useState<Pagina>('painel')
  const [baseSelecionada, setBaseSelecionada] =
    useState<BaseOperacional>(carregarBaseOperacional)
  const [filtroLocalRetido, setFiltroLocalRetido] =
    useState<FiltroLocalRetido>('TODOS')
  const [movimentacoes, setMovimentacoes] =
    useState<Movimentacao[]>(carregarMovimentacoes)
  const [retencoes, setRetencoes] = useState<Retencao[]>(carregarRetencoes)
  const [atendimentos, setAtendimentos] = useState<AtendimentoManutencao[]>(() =>
    carregar<AtendimentoManutencao[]>(ATENDIMENTOS_KEY, atendimentosIniciais)
  )
  const [busca, setBusca] = useState('')
  const [consultaPrefixo, setConsultaPrefixo] = useState('')
  const [agora, setAgora] = useState(new Date())
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(new Date())
  const [movSelecionada, setMovSelecionada] =
    useState<Movimentacao | null>(movimentacoes[0] ?? null)
  const [retSelecionada, setRetSelecionada] =
    useState<Retencao | null>(retencoes[0] ?? null)
  const [garagemSelecionada, setGaragemSelecionada] =
    useState<Movimentacao | null>(null)
  const [modalMov, setModalMov] = useState(false)
  const [modalRet, setModalRet] = useState(false)
  const [modalFinalizacao, setModalFinalizacao] = useState(false)
  const [alvoFinalizacao, setAlvoFinalizacao] = useState<AlvoFinalizacao | null>(null)
  const [formFinalizacao, setFormFinalizacao] = useState<FormFinalizacao>(
    formFinalizacaoInicial
  )
  const [modalNovaAvaria, setModalNovaAvaria] = useState(false)
  const [alvoNovaAvaria, setAlvoNovaAvaria] = useState<Movimentacao | null>(null)
  const [formNovaAvaria, setFormNovaAvaria] = useState<FormNovaAvaria>(
    formNovaAvariaInicial
  )
  const [modalLimpeza, setModalLimpeza] = useState(false)
  const [alvoLimpeza, setAlvoLimpeza] = useState<Movimentacao | null>(null)
  const [formLimpeza, setFormLimpeza] = useState<FormLimpeza>(formLimpezaInicial)
  const [editandoRetencaoId, setEditandoRetencaoId] =
    useState<string | null>(null)
  const [formMov, setFormMov] = useState<FormMovimentacao>(formMovInicial)
  const [formRet, setFormRet] = useState<FormRetencao>(formRetInicial)
  const [avisoRetido, setAvisoRetido] = useState<Retencao | null>(null)
  const [movPendente, setMovPendente] = useState<Movimentacao | null>(null)
  const [avisoOperacao, setAvisoOperacao] =
    useState<AvisoOperacao | null>(null)
  const [cargaPlanilhasAplicada, setCargaPlanilhasAplicada] =
    useState(cargaPlanilhasJaAplicada)
  const [backupCargaDisponivel, setBackupCargaDisponivel] =
    useState(backupCargaPlanilhasExiste)

  useEffect(() => {
    localStorage.setItem(MOVIMENTACOES_KEY, JSON.stringify(movimentacoes))
  }, [movimentacoes])

  useEffect(() => {
    localStorage.setItem(RETENCOES_KEY, JSON.stringify(retencoes))
  }, [retencoes])

  useEffect(() => {
    localStorage.setItem(ATENDIMENTOS_KEY, JSON.stringify(atendimentos))
  }, [atendimentos])

  useEffect(() => {
    localStorage.setItem(BASE_OPERACIONAL_KEY, baseSelecionada)
  }, [baseSelecionada])

  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const hoje = agora.toLocaleDateString('pt-BR')

  const movimentacoesDaBase = useMemo(
    () =>
      movimentacoes.filter(
        (item) => item.baseOperacional === baseSelecionada
      ),
    [movimentacoes, baseSelecionada]
  )

  const movimentacoesOrdenadas = useMemo(
    () =>
      [...movimentacoesDaBase].sort(
        (a, b) => momentoMovimentacao(b) - momentoMovimentacao(a)
      ),
    [movimentacoesDaBase]
  )

  const retidosAtivos = retencoes.filter((item) => item.status === 'RETIDO')
  const liberados = retencoes.filter((item) => item.status === 'LIBERADO')
  const retidosPrioritarios = [...retidosAtivos].sort(
    (a, b) => diasRetido(b) - diasRetido(a)
  )

  const chegadasHoje = movimentacoesDaBase.filter(
    (item) => item.tipo === 'CHEGOU' && item.dataEntrada === hoje
  )
  const saidasHoje = movimentacoesDaBase.filter(
    (item) => item.tipo === 'SAIU' && item.dataSaida === hoje
  )

  const veiculosNaGaragem = useMemo(() => {
    const ultimas = new Map<string, Movimentacao>()

    for (const item of movimentacoesOrdenadas) {
      if (item.historicoSomente) continue
      if (!ultimas.has(item.prefixo)) ultimas.set(item.prefixo, item)
    }

    return Array.from(ultimas.values()).filter((item) => item.tipo === 'CHEGOU')
  }, [movimentacoesOrdenadas])

  const veiculosEmManutencao = veiculosNaGaragem.filter(
    (item) => item.liberacaoManutencao === 'EM_MANUTENCAO'
  )

  const veiculosAguardandoLimpeza = veiculosNaGaragem.filter(
    (item) => item.liberacaoLimpeza === 'LIMPAR'
  )

  const historicoLimpezaDaBase = useMemo(
    () =>
      movimentacoesDaBase
        .filter(
          (item) =>
            item.tipo === 'CHEGOU' &&
            item.liberacaoLimpeza === 'LIMPO' &&
            Boolean(item.responsavelLimpeza)
        )
        .sort((a, b) => momentoMovimentacao(b) - momentoMovimentacao(a)),
    [movimentacoesDaBase]
  )

  const veiculosGaragemFiltrados = useMemo(() => {
    const termo = normalizar(busca.trim())
    if (!termo) return veiculosNaGaragem

    return veiculosNaGaragem.filter((item) => {
      const retencao = retencoes.find(
        (ret) => ret.prefixo === item.prefixo && ret.status === 'RETIDO'
      )

      return normalizar(
        [
          item.prefixo,
          item.empresa,
          item.linhaEntrada,
          item.dataEntrada,
          item.horaEntrada,
          item.motivo,
          textoLiberacaoManutencao(item.liberacaoManutencao),
          textoLiberacaoLimpeza(item.liberacaoLimpeza),
          item.responsavelLimpeza ?? '',
          item.cifResponsavelLimpeza ?? '',
          retencao?.motivo ?? '',
          retencao?.local ?? '',
        ].join(' ')
      ).includes(termo)
    })
  }, [busca, retencoes, veiculosNaGaragem])

  const garagemAtualSelecionada =
    garagemSelecionada &&
    veiculosNaGaragem.some(
      (item) => item.prefixo === garagemSelecionada.prefixo
    )
      ? garagemSelecionada
      : veiculosNaGaragem[0] ?? null

  const movimentacoesFiltradas = useMemo(() => {
    const termo = normalizar(busca.trim())
    if (!termo) return movimentacoesOrdenadas

    return movimentacoesOrdenadas.filter((item) =>
      normalizar(
        [
          item.tipo,
          item.prefixo,
          item.empresa,
          item.linhaEntrada,
          item.dataEntrada,
          item.horaEntrada,
          item.motivo,
          textoLiberacaoManutencao(item.liberacaoManutencao),
          textoLiberacaoLimpeza(item.liberacaoLimpeza),
          item.responsavelLimpeza ?? '',
          item.linhaSaida,
          item.dataSaida,
          item.horaManobra,
          item.horaSaida,
        ].join(' ')
      ).includes(termo)
    )
  }, [busca, movimentacoesOrdenadas])

  const retencoesFiltradas = useMemo(() => {
    const termo = normalizar(busca.trim())

    let base = retencoes

    if (pagina === 'garagem' && filtroLocalRetido !== 'TODOS') {
      base = base.filter((item) => item.local === filtroLocalRetido)
    }

    if (pagina === 'ocorrencias') {
      base = retencoes.filter(
        (item) =>
          item.status === 'RETIDO' && normalizar(item.motivo) !== 'nada consta'
      )
    }

    if (!termo) return base

    return base.filter((item) =>
      normalizar(
        [
          item.prefixo,
          item.empresa,
          item.linhaEntrada,
          item.dataEntrada,
          item.horaEntrada,
          item.motivo,
          item.previsaoSaida,
          item.local,
          localNome(item.local),
          item.baseOperacional,
          item.status,
        ].join(' ')
      ).includes(termo)
    )
  }, [busca, pagina, retencoes, filtroLocalRetido])

  const manutencaoFiltrada = useMemo(() => {
    const termo = normalizar(busca.trim())

    const base = veiculosEmManutencao
    if (!termo) return base

    return base.filter((item) =>
      normalizar(
        [
          item.prefixo,
          item.empresa,
          item.linhaEntrada,
          item.motivo,
          item.problemaManutencao,
          item.dataEntrada,
          item.horaEntrada,
        ].join(' ')
      ).includes(termo)
    )
  }, [busca, veiculosEmManutencao])

  const limpezaFiltrada = useMemo(() => {
    const termo = normalizar(busca.trim())
    const base = veiculosAguardandoLimpeza
    if (!termo) return base

    return base.filter((item) =>
      normalizar(
        [
          item.prefixo,
          item.empresa,
          item.linhaEntrada,
          item.dataEntrada,
          item.horaEntrada,
          item.motivo,
        ].join(' ')
      ).includes(termo)
    )
  }, [busca, veiculosAguardandoLimpeza])

  const historicoManutencaoDaBase = useMemo(() => {
    const termo = normalizar(busca.trim())
    const base = atendimentos.filter(
      (item) => item.baseOperacional === baseSelecionada
    )

    if (!termo) return base

    return base.filter((item) =>
      normalizar(
        [
          item.prefixo,
          item.empresa,
          item.origem,
          item.problema,
          item.servicoRealizado,
          item.responsavel,
          item.cifResponsavel ?? '',
          item.dataFinalizacao,
          item.horaFinalizacao,
        ].join(' ')
      ).includes(termo)
    )
  }, [atendimentos, baseSelecionada, busca])

  const prefixosConhecidos = useMemo(() => {
    const mapa = new Map<string, string>()

    const registrar = (prefixo: string, empresa: string) => {
      const limpo = prefixo.trim()
      if (!limpo || limpo === '-') return

      const atual = mapa.get(limpo)
      if (!atual || atual === '-' || atual === 'NÃO INFORMADA') {
        mapa.set(limpo, empresa || '-')
      }
    }

    movimentacoes.forEach((item) => registrar(item.prefixo, item.empresa))
    retencoes.forEach((item) => registrar(item.prefixo, item.empresa))
    atendimentos.forEach((item) => registrar(item.prefixo, item.empresa))

    return Array.from(mapa.entries())
      .map(([prefixo, empresa]) => ({ prefixo, empresa }))
      .sort((a, b) =>
        a.prefixo.localeCompare(b.prefixo, 'pt-BR', { numeric: true })
      )
  }, [movimentacoes, retencoes, atendimentos])

  const prefixosConsultaFiltrados = useMemo(() => {
    const termo = normalizar(busca.trim())
    if (!termo) return prefixosConhecidos

    return prefixosConhecidos.filter((item) =>
      normalizar(`${item.prefixo} ${item.empresa}`).includes(termo)
    )
  }, [busca, prefixosConhecidos])

  function retencaoAtivaDoVeiculo(prefixo: string) {
    return (
      retencoes.find(
        (item) => item.prefixo === prefixo && item.status === 'RETIDO'
      ) ?? null
    )
  }

  function ultimaMovimentacaoDoVeiculoNaBase(prefixo: string) {
    return (
      movimentacoesOrdenadas.find(
        (item) => item.prefixo === prefixo && !item.historicoSomente
      ) ?? null
    )
  }

  function veiculoAtivoEmOutraBase(prefixo: string) {
    for (const base of BASES_OPERACIONAIS) {
      if (base.codigo === baseSelecionada) continue

      const ultima = movimentacoes
        .filter(
          (item) =>
            item.baseOperacional === base.codigo &&
            item.prefixo === prefixo &&
            !item.historicoSomente
        )
        .sort((a, b) => momentoMovimentacao(b) - momentoMovimentacao(a))[0]

      if (ultima?.tipo === 'CHEGOU') return ultima
    }

    return null
  }

  function abrirConsultaVeiculo(prefixo: string) {
    setConsultaPrefixo(prefixo)
    setPagina('consulta')
    setBusca('')
  }

  function trocarBase(novaBase: BaseOperacional) {
    setBaseSelecionada(novaBase)
    setBusca('')
    setGaragemSelecionada(null)
    setMovSelecionada(
      movimentacoes.find((item) => item.baseOperacional === novaBase) ?? null
    )
    setUltimaAtualizacao(new Date())
  }

  function abrirMovimentacao() {
    const padrao = agoraForm()

    setFormMov({
      ...formMovInicial,
      dataEntrada: padrao.data,
      horaEntrada: padrao.hora,
      dataSaida: padrao.data,
      horaSaida: padrao.hora,
    })
    setModalMov(true)
  }

  function abrirSaidaDoVeiculo(veiculo: Movimentacao) {
    const padrao = agoraForm()

    setFormMov({
      ...formMovInicial,
      tipo: 'SAIU',
      prefixo: veiculo.prefixo,
      empresa: veiculo.empresa,
      dataSaida: padrao.data,
      horaSaida: padrao.hora,
    })
    setModalMov(true)
  }

  function abrirNovaRetencao() {
    const padrao = agoraForm()

    setEditandoRetencaoId(null)
    setFormRet({
      ...formRetInicial,
      dataEntrada: padrao.data,
      horaEntrada: padrao.hora,
      local: baseSelecionada,
    })
    setModalRet(true)
  }

  function abrirRetencaoDoVeiculo(veiculo: Movimentacao) {
    const existente = retencaoAtivaDoVeiculo(veiculo.prefixo)

    if (existente) {
      setRetSelecionada(existente)
      setPagina('garagem')
      setFiltroLocalRetido('TODOS')
      setBusca('')
      return
    }

    setEditandoRetencaoId(null)
    setFormRet({
      prefixo: veiculo.prefixo,
      empresa: veiculo.empresa,
      linhaEntrada: veiculo.linhaEntrada === '-' ? '' : veiculo.linhaEntrada,
      dataEntrada: dataISO(veiculo.dataEntrada),
      horaEntrada: veiculo.horaEntrada === '-' ? '' : veiculo.horaEntrada,
      motivo: veiculo.motivo === 'Nada consta' ? '' : veiculo.motivo,
      previsaoSaida: '',
      local: baseSelecionada,
    })
    setModalRet(true)
  }

  function abrirEdicaoRetencao(retencao: Retencao) {
    if (retencao.status !== 'RETIDO') {
      window.alert('Esta retenção já foi liberada e faz parte do histórico.')
      return
    }

    setEditandoRetencaoId(retencao.id)
    setFormRet({
      prefixo: retencao.prefixo,
      empresa: retencao.empresa,
      linhaEntrada: retencao.linhaEntrada === '-' ? '' : retencao.linhaEntrada,
      dataEntrada: dataISO(retencao.dataEntrada),
      horaEntrada: retencao.horaEntrada === '-' ? '' : retencao.horaEntrada,
      motivo: retencao.motivo === '-' ? '' : retencao.motivo,
      previsaoSaida:
        retencao.previsaoSaida === '-' ? '' : dataISO(retencao.previsaoSaida),
      local: retencao.local,
    })
    setModalRet(true)
  }

  function fecharModalRetencao() {
    setModalRet(false)
    setEditandoRetencaoId(null)
    setFormRet(formRetInicial)
  }

  function concluirMovimentacao(nova: Movimentacao) {
    setMovimentacoes((anteriores) => [nova, ...anteriores])
    setMovSelecionada(nova)
    setUltimaAtualizacao(new Date())
    setPagina('operacao')
    setModalMov(false)
    setMovPendente(null)
    setAvisoRetido(null)
    setAvisoOperacao(null)
  }

  function validarRetencaoOuConcluir(nova: Movimentacao) {
    const retencao = retencaoAtivaDoVeiculo(nova.prefixo)

    if (retencao) {
      setMovPendente(nova)
      setAvisoRetido(retencao)
      return
    }

    concluirMovimentacao(nova)
  }

  function validarMovimentacao(nova: Movimentacao) {
    const ultima = ultimaMovimentacaoDoVeiculoNaBase(nova.prefixo)
    const outraBase = veiculoAtivoEmOutraBase(nova.prefixo)

    if (nova.tipo === 'CHEGOU') {
      if (ultima?.tipo === 'CHEGOU') {
        setAvisoOperacao({ tipo: 'DUPLICIDADE_CHEGADA', nova, ultima })
        return
      }

      if (outraBase) {
        setAvisoOperacao({
          tipo: 'VEICULO_EM_OUTRA_BASE',
          nova,
          ultima,
          outraBase,
        })
        return
      }

      validarRetencaoOuConcluir(nova)
      return
    }

    if (!ultima) {
      if (outraBase) {
        setAvisoOperacao({
          tipo: 'VEICULO_EM_OUTRA_BASE',
          nova,
          ultima: null,
          outraBase,
        })
        return
      }

      setAvisoOperacao({ tipo: 'SEM_CHEGADA', nova, ultima: null })
      return
    }

    if (ultima.tipo === 'SAIU') {
      if (outraBase) {
        setAvisoOperacao({
          tipo: 'VEICULO_EM_OUTRA_BASE',
          nova,
          ultima,
          outraBase,
        })
        return
      }

      setAvisoOperacao({ tipo: 'DUPLICIDADE_SAIDA', nova, ultima })
      return
    }

    validarRetencaoOuConcluir(nova)
  }

  function salvarMovimentacao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (formMov.tipo === 'CHEGOU' && !formMov.condicaoChegada) {
      window.alert('Selecione a CONDIÇÃO NA CHEGADA.')
      return
    }

    if (
      formMov.tipo === 'CHEGOU' &&
      formMov.condicaoChegada === 'COM_AVARIA' &&
      !formMov.motivo.trim()
    ) {
      window.alert('Descreva a avaria ou problema encontrado no veículo.')
      return
    }

    const chegadaComAvaria =
      formMov.tipo === 'CHEGOU' && formMov.condicaoChegada === 'COM_AVARIA'

    const nova: Movimentacao = {
      id: crypto.randomUUID(),
      baseOperacional: baseSelecionada,
      tipo: formMov.tipo,
      prefixo: formMov.prefixo.trim(),
      empresa: formMov.empresa,
      linhaEntrada:
        formMov.tipo === 'CHEGOU' ? formMov.linhaEntrada.trim() || '-' : '-',
      dataEntrada:
        formMov.tipo === 'CHEGOU' ? dataBR(formMov.dataEntrada) : '-',
      horaEntrada:
        formMov.tipo === 'CHEGOU' ? formMov.horaEntrada || '-' : '-',
      motivo:
        formMov.tipo === 'CHEGOU'
          ? chegadaComAvaria
            ? formMov.motivo.trim()
            : 'Nada consta'
          : '-',
      liberacaoManutencao:
        formMov.tipo === 'CHEGOU'
          ? chegadaComAvaria
            ? 'EM_MANUTENCAO'
            : 'LIBERADO'
          : '-',
      problemaManutencao:
        formMov.tipo === 'CHEGOU' && chegadaComAvaria
          ? formMov.motivo.trim()
          : '-',
      liberacaoLimpeza: formMov.tipo === 'CHEGOU' ? 'LIMPAR' : '-',
      responsavelLimpeza: '',
      cifResponsavelLimpeza: '',
      dataLimpeza: '',
      horaLimpeza: '',
      linhaSaida:
        formMov.tipo === 'SAIU' ? formMov.linhaSaida.trim() || '-' : '-',
      dataSaida: formMov.tipo === 'SAIU' ? dataBR(formMov.dataSaida) : '-',
      horaManobra:
        formMov.tipo === 'SAIU' ? formMov.horaManobra || '-' : '-',
      horaSaida: formMov.tipo === 'SAIU' ? formMov.horaSaida || '-' : '-',
    }

    validarMovimentacao(nova)
  }

  function abrirFinalizacaoChegada(veiculo: Movimentacao) {
    if (veiculo.liberacaoManutencao !== 'EM_MANUTENCAO') {
      window.alert('Este veículo não está marcado como EM MANUT.')
      return
    }

    setAlvoFinalizacao({ origem: 'CHEGADA', movimentacao: veiculo })
    setFormFinalizacao(formFinalizacaoInicial)
    setModalFinalizacao(true)
  }

  function abrirFinalizacaoRetencao(
    retencao: Retencao,
    movimentacaoDepois: Movimentacao | null = null
  ) {
    if (retencao.status !== 'RETIDO') {
      window.alert('Esta retenção já está liberada.')
      return
    }

    setMovPendente(movimentacaoDepois)
    setAlvoFinalizacao({ origem: 'RETENCAO', retencao })
    setFormFinalizacao(formFinalizacaoInicial)
    setModalFinalizacao(true)
    setAvisoRetido(null)
  }

  function fecharFinalizacao() {
    setModalFinalizacao(false)
    setAlvoFinalizacao(null)
    setFormFinalizacao(formFinalizacaoInicial)
    setMovPendente(null)
  }

  function salvarFinalizacao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!alvoFinalizacao) return

    const servicoRealizado = formFinalizacao.servicoRealizado.trim()
    const responsavel = formFinalizacao.responsavel.trim()
    const cifResponsavel = formFinalizacao.cifResponsavel.trim()

    if (!servicoRealizado || !responsavel) {
      window.alert('Informe o serviço realizado e o responsável pelo atendimento.')
      return
    }

    const agoraFinalizacao = agoraForm()
    const referencia =
      alvoFinalizacao.origem === 'CHEGADA'
        ? alvoFinalizacao.movimentacao
        : alvoFinalizacao.retencao

    const atendimento: AtendimentoManutencao = {
      id: crypto.randomUUID(),
      origem: alvoFinalizacao.origem,
      referenciaId: referencia.id,
      baseOperacional: referencia.baseOperacional,
      prefixo: referencia.prefixo,
      empresa: referencia.empresa,
      problema:
        alvoFinalizacao.origem === 'CHEGADA'
          ? alvoFinalizacao.movimentacao.problemaManutencao !== '-'
            ? alvoFinalizacao.movimentacao.problemaManutencao
            : alvoFinalizacao.movimentacao.motivo
          : referencia.motivo,
      servicoRealizado,
      responsavel,
      cifResponsavel,
      dataFinalizacao: dataBR(agoraFinalizacao.data),
      horaFinalizacao: agoraFinalizacao.hora,
    }

    setAtendimentos((anteriores) => [atendimento, ...anteriores])

    if (alvoFinalizacao.origem === 'CHEGADA') {
      const veiculo = alvoFinalizacao.movimentacao
      const atualizado: Movimentacao = {
        ...veiculo,
        liberacaoManutencao: 'LIBERADO',
    problemaManutencao: '-',
      }

      setMovimentacoes((anteriores) =>
        anteriores.map((item) => (item.id === veiculo.id ? atualizado : item))
      )
      setGaragemSelecionada(atualizado)
      setMovSelecionada(atualizado)
      setUltimaAtualizacao(new Date())
      setModalFinalizacao(false)
      setAlvoFinalizacao(null)
      setFormFinalizacao(formFinalizacaoInicial)
      return
    }

    const retencao = alvoFinalizacao.retencao
    const liberada: Retencao = {
      ...retencao,
      status: 'LIBERADO',
      dataLiberacao: dataBR(agoraFinalizacao.data),
    }

    setRetencoes((anteriores) =>
      anteriores.map((item) => (item.id === retencao.id ? liberada : item))
    )
    setRetSelecionada(liberada)
    setUltimaAtualizacao(new Date())

    const pendente = movPendente
    setModalFinalizacao(false)
    setAlvoFinalizacao(null)
    setFormFinalizacao(formFinalizacaoInicial)
    setMovPendente(null)

    if (pendente) {
      concluirMovimentacao(pendente)
    }
  }

  function alterarLiberacaoManutencao(
    veiculo: Movimentacao,
    novoStatus: Exclude<LiberacaoManutencao, '-'>
  ) {
    if (novoStatus === 'LIBERADO') {
      abrirFinalizacaoChegada(veiculo)
      return
    }

    abrirNovaAvaria(veiculo)
  }

  function abrirNovaAvaria(veiculo: Movimentacao) {
    if (veiculo.tipo !== 'CHEGOU') {
      window.alert('Somente veículos que estão na garagem podem receber uma nova avaria.')
      return
    }

    if (veiculo.liberacaoManutencao === 'EM_MANUTENCAO') {
      window.alert('Este veículo já está com uma avaria aberta em manutenção.')
      return
    }

    setAlvoNovaAvaria(veiculo)
    setFormNovaAvaria(formNovaAvariaInicial)
    setModalNovaAvaria(true)
  }

  function fecharNovaAvaria() {
    setModalNovaAvaria(false)
    setAlvoNovaAvaria(null)
    setFormNovaAvaria(formNovaAvariaInicial)
  }

  function salvarNovaAvaria(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!alvoNovaAvaria) return

    const problema = formNovaAvaria.problema.trim()

    if (!problema) {
      window.alert('Descreva a avaria ou problema encontrado no veículo.')
      return
    }

    const atualizado: Movimentacao = {
      ...alvoNovaAvaria,
      problemaManutencao: problema,
      liberacaoManutencao: 'EM_MANUTENCAO',
    }

    setMovimentacoes((anteriores) =>
      anteriores.map((item) =>
        item.id === alvoNovaAvaria.id ? atualizado : item
      )
    )

    setGaragemSelecionada(atualizado)
    setMovSelecionada(atualizado)
    setUltimaAtualizacao(new Date())
    fecharNovaAvaria()
    setPagina('manutencao')
  }

  function abrirFinalizacaoLimpeza(veiculo: Movimentacao) {
    if (veiculo.tipo !== 'CHEGOU') {
      window.alert('Somente veículos que chegaram à garagem podem ser liberados pela limpeza.')
      return
    }

    if (veiculo.liberacaoLimpeza === 'LIMPO') {
      window.alert('Este veículo já consta como LIMPO.')
      return
    }

    setAlvoLimpeza(veiculo)
    setFormLimpeza(formLimpezaInicial)
    setModalLimpeza(true)
  }

  function fecharFinalizacaoLimpeza() {
    setModalLimpeza(false)
    setAlvoLimpeza(null)
    setFormLimpeza(formLimpezaInicial)
  }

  function salvarFinalizacaoLimpeza(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!alvoLimpeza) return

    const responsavel = formLimpeza.responsavel.trim()
    const cifResponsavel = formLimpeza.cifResponsavel.trim()

    if (!responsavel) {
      window.alert('Informe o responsável pela limpeza.')
      return
    }

    const momento = agoraForm()
    const atualizado: Movimentacao = {
      ...alvoLimpeza,
      liberacaoLimpeza: 'LIMPO',
      responsavelLimpeza: responsavel,
      cifResponsavelLimpeza: cifResponsavel,
      dataLimpeza: dataBR(momento.data),
      horaLimpeza: momento.hora,
    }

    setMovimentacoes((anteriores) =>
      anteriores.map((item) => (item.id === alvoLimpeza.id ? atualizado : item))
    )
    setGaragemSelecionada(atualizado)
    setMovSelecionada(atualizado)
    setUltimaAtualizacao(new Date())
    fecharFinalizacaoLimpeza()
  }

  function salvarRetencao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const prefixo = formRet.prefixo.trim()

    if (editandoRetencaoId) {
      const registroAtual = retencoes.find((item) => item.id === editandoRetencaoId)

      if (!registroAtual) {
        window.alert('Não foi possível localizar esta retenção.')
        return
      }

      if (registroAtual.status !== 'RETIDO') {
        window.alert('Esta retenção já foi liberada.')
        fecharModalRetencao()
        return
      }

      const conflito = retencoes.some(
        (item) =>
          item.id !== editandoRetencaoId &&
          item.prefixo === prefixo &&
          item.status === 'RETIDO'
      )

      if (conflito) {
        window.alert(`O prefixo ${prefixo} já possui outra retenção ativa.`)
        return
      }

      const atualizada: Retencao = {
        ...registroAtual,
        prefixo,
        empresa: formRet.empresa,
        linhaEntrada: formRet.linhaEntrada.trim() || '-',
        dataEntrada: dataBR(formRet.dataEntrada),
        horaEntrada: formRet.horaEntrada || '-',
        motivo: formRet.motivo.trim() || '-',
        previsaoSaida: formRet.previsaoSaida ? dataBR(formRet.previsaoSaida) : '-',
        local: formRet.local,
      }

      setRetencoes((anteriores) =>
        anteriores.map((item) =>
          item.id === editandoRetencaoId ? atualizada : item
        )
      )
      setRetSelecionada(atualizada)
      setUltimaAtualizacao(new Date())
      fecharModalRetencao()
      return
    }

    const jaRetido = retencoes.some(
      (item) => item.prefixo === prefixo && item.status === 'RETIDO'
    )

    if (jaRetido) {
      window.alert(`O veículo ${prefixo} já possui uma retenção ativa.`)
      return
    }

    const nova: Retencao = {
      id: crypto.randomUUID(),
      baseOperacional: baseSelecionada,
      prefixo,
      empresa: formRet.empresa,
      linhaEntrada: formRet.linhaEntrada.trim() || '-',
      dataEntrada: dataBR(formRet.dataEntrada),
      horaEntrada: formRet.horaEntrada || '-',
      motivo: formRet.motivo.trim() || '-',
      previsaoSaida: formRet.previsaoSaida ? dataBR(formRet.previsaoSaida) : '-',
      local: formRet.local,
      status: 'RETIDO',
      dataLiberacao: '-',
    }

    setRetencoes((anteriores) => [nova, ...anteriores])
    setRetSelecionada(nova)
    setUltimaAtualizacao(new Date())
    setPagina('garagem')
    setFiltroLocalRetido('TODOS')
    fecharModalRetencao()
  }

  function liberarRetencao(id: string) {
    const retencao = retencoes.find((item) => item.id === id)
    if (!retencao) return

    abrirFinalizacaoRetencao(retencao)
  }

  function mesmaMovimentacaoParaImportacao(
    atual: Movimentacao,
    importada: Movimentacao
  ) {
    if (
      atual.baseOperacional !== importada.baseOperacional ||
      atual.tipo !== importada.tipo ||
      atual.prefixo !== importada.prefixo
    ) {
      return false
    }

    const dataAtual =
      atual.tipo === 'CHEGOU' ? atual.dataEntrada : atual.dataSaida
    const dataImportada =
      importada.tipo === 'CHEGOU'
        ? importada.dataEntrada
        : importada.dataSaida

    if (dataAtual !== dataImportada) return false

    const horaAtual =
      atual.tipo === 'CHEGOU' ? atual.horaEntrada : atual.horaSaida
    const horaImportada =
      importada.tipo === 'CHEGOU'
        ? importada.horaEntrada
        : importada.horaSaida

    const linhaAtual =
      atual.tipo === 'CHEGOU' ? atual.linhaEntrada : atual.linhaSaida
    const linhaImportada =
      importada.tipo === 'CHEGOU'
        ? importada.linhaEntrada
        : importada.linhaSaida

    const horasCompativeis =
      horaAtual === horaImportada ||
      horaAtual === '-' ||
      horaImportada === '-'

    const linhasCompativeis =
      normalizar(linhaAtual) === normalizar(linhaImportada) ||
      linhaAtual === '-' ||
      linhaImportada === '-'

    return horasCompativeis && linhasCompativeis
  }

  function importarCargaPlanilhas() {
    if (cargaPlanilhasAplicada) {
      window.alert('A carga consolidada das planilhas já foi aplicada neste navegador.')
      return
    }

    const confirmar = window.confirm(
      'Importar a carga consolidada das planilhas de 08 a 17/09/2026?\n\n' +
      '• 133 movimentações de 08 a 16/09 entrarão como HISTÓRICO SOMENTE.\n' +
      '• Os registros atuais de 17/09 não serão duplicados.\n' +
      '• 9 retenções ativas serão conferidas/ajustadas pelo snapshot mais recente.\n' +
      '• Será criado um BACKUP AUTOMÁTICO antes de qualquer alteração.\n' +
      '• Dados ausentes não serão inventados.'
    )

    if (!confirmar) return

    try {
      localStorage.setItem(
        BACKUP_CARGA_PLANILHAS_KEY,
        JSON.stringify({
          criadoEm: new Date().toISOString(),
          movimentacoes,
          retencoes,
          atendimentos,
          baseSelecionada,
        })
      )
      setBackupCargaDisponivel(true)
    } catch {
      window.alert(
        'Não foi possível criar o backup automático desta estação.\n\n' +
        'A importação foi cancelada para evitar perda de dados.'
      )
      return
    }

    const novasMovimentacoes = movimentacoesHistoricasPlanilhas.filter(
      (importada) =>
        !movimentacoes.some((atual) =>
          mesmaMovimentacaoParaImportacao(atual, importada)
        )
    )

    const retencoesAtualizadas = [...retencoes]
    let retencoesCriadas = 0
    let retencoesCorrigidas = 0

    for (const alvo of retencoesAtivasPlanilhas) {
      const indice = retencoesAtualizadas.findIndex(
        (item) =>
          item.prefixo === alvo.prefixo &&
          item.baseOperacional === alvo.baseOperacional
      )

      if (indice < 0) {
        retencoesAtualizadas.unshift(alvo)
        retencoesCriadas += 1
        continue
      }

      const atual = retencoesAtualizadas[indice]
      const corrigida: Retencao = {
        ...atual,
        empresa: alvo.empresa || atual.empresa,
        linhaEntrada:
          alvo.linhaEntrada !== '-' ? alvo.linhaEntrada : atual.linhaEntrada,
        dataEntrada:
          alvo.dataEntrada !== '-' ? alvo.dataEntrada : atual.dataEntrada,
        horaEntrada:
          alvo.horaEntrada !== '-' ? alvo.horaEntrada : atual.horaEntrada,
        motivo: alvo.motivo !== '-' ? alvo.motivo : atual.motivo,
        previsaoSaida:
          alvo.previsaoSaida !== '-' ? alvo.previsaoSaida : atual.previsaoSaida,
        local: alvo.local,
        status: 'RETIDO',
        dataLiberacao: '-',
      }

      if (JSON.stringify(corrigida) !== JSON.stringify(atual)) {
        retencoesAtualizadas[indice] = corrigida
        retencoesCorrigidas += 1
      }
    }

    setMovimentacoes((anteriores) => [
      ...novasMovimentacoes,
      ...anteriores,
    ])
    setRetencoes(retencoesAtualizadas)

    try {
      localStorage.setItem(CARGA_PLANILHAS_KEY, '1')
    } catch {
      // O restante do protótipo continua funcionando mesmo sem persistir a marca da carga.
    }

    setCargaPlanilhasAplicada(true)
    setUltimaAtualizacao(new Date())

    window.alert(
      'Carga concluída.\n\n' +
      `${novasMovimentacoes.length} movimentações históricas adicionadas.\n` +
      `${retencoesCriadas} retenção(ões) criada(s).\n` +
      `${retencoesCorrigidas} retenção(ões) atualizada(s).\n\n` +
      'Movimentos históricos não alteram a lista de veículos atualmente na garagem.'
    )
  }

  function desfazerCargaPlanilhas() {
    if (!backupCargaDisponivel) {
      window.alert(
        'Não existe backup automático disponível para desfazer a carga nesta estação.'
      )
      return
    }

    const confirmar = window.confirm(
      'Desfazer a última carga consolidada das planilhas?\n\n' +
      'O sistema restaurará exatamente os dados que existiam nesta estação antes da importação.'
    )

    if (!confirmar) return

    try {
      const bruto = localStorage.getItem(BACKUP_CARGA_PLANILHAS_KEY)

      if (!bruto) {
        setBackupCargaDisponivel(false)
        window.alert('O backup automático não foi encontrado.')
        return
      }

      const backup = JSON.parse(bruto) as {
        movimentacoes: Movimentacao[]
        retencoes: Retencao[]
        atendimentos: AtendimentoManutencao[]
        baseSelecionada?: BaseOperacional
      }

      setMovimentacoes(backup.movimentacoes ?? movimentacoesIniciais)
      setRetencoes(backup.retencoes ?? retencoesIniciais)
      setAtendimentos(backup.atendimentos ?? atendimentosIniciais)

      if (
        backup.baseSelecionada === 'ATA' ||
        backup.baseSelecionada === 'BRU' ||
        backup.baseSelecionada === 'SPO'
      ) {
        setBaseSelecionada(backup.baseSelecionada)
      }

      setFiltroLocalRetido('TODOS')
      setMovSelecionada(null)
      setRetSelecionada(null)
      setGaragemSelecionada(null)
      setBusca('')
      setPagina('configuracoes')
      setCargaPlanilhasAplicada(false)
      setBackupCargaDisponivel(false)
      setUltimaAtualizacao(new Date())

      localStorage.removeItem(CARGA_PLANILHAS_KEY)
      localStorage.removeItem(BACKUP_CARGA_PLANILHAS_KEY)

      window.alert(
        'Carga desfeita com sucesso.\n\n' +
        'Os dados anteriores à importação foram restaurados nesta estação.'
      )
    } catch {
      window.alert(
        'Não foi possível restaurar o backup automático. Nenhuma alteração adicional foi aplicada.'
      )
    }
  }

  function restaurarDemonstracao() {
    const confirmar = window.confirm(
      'Deseja restaurar todos os dados originais da demonstração?'
    )
    if (!confirmar) return

    setMovimentacoes(movimentacoesIniciais)
    setRetencoes(retencoesIniciais)
    setAtendimentos(atendimentosIniciais)
    setBaseSelecionada('ATA')
    setFiltroLocalRetido('TODOS')
    setMovSelecionada(movimentacoesIniciais[0])
    setRetSelecionada(retencoesIniciais[0])
    setGaragemSelecionada(null)
    setBusca('')
    setPagina('painel')
    setUltimaAtualizacao(new Date())
    setCargaPlanilhasAplicada(false)
    setBackupCargaDisponivel(false)

    try {
      localStorage.removeItem(CARGA_PLANILHAS_KEY)
      localStorage.removeItem(BACKUP_CARGA_PLANILHAS_KEY)
    } catch {
      // Sem ação: o estado em memória já foi restaurado.
    }
  }

  function renderSeletorBase() {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginLeft: 'auto',
          marginRight: 10,
        }}
      >
        <div style={{ fontSize: 10, color: '#6f7f8f', textAlign: 'right' }}>
          <div>Base operacional</div>
          <strong style={{ color: '#173e65' }}>
            {baseSelecionada} - {nomeBase(baseSelecionada)}
          </strong>
        </div>

        <select
          value={baseSelecionada}
          onChange={(e) => trocarBase(e.target.value as BaseOperacional)}
          style={{
            height: 39,
            minWidth: 170,
            border: '1px solid #ced8e1',
            borderRadius: 7,
            background: 'white',
            color: '#173e65',
            padding: '0 10px',
            fontWeight: 700,
            outline: 'none',
          }}
        >
          {BASES_OPERACIONAIS.map((base) => (
            <option key={base.codigo} value={base.codigo}>
              {base.codigo} - {base.nome}
            </option>
          ))}
        </select>
      </div>
    )
  }

  function renderCards() {
    return (
      <div className="cards">
        <div className="card">
          <div className="card-icon red">
            <ShieldAlert size={25} />
          </div>
          <div>
            <span>Retidos</span>
            <strong>{retidosAtivos.length}</strong>
            <small>geral / todos os locais</small>
          </div>
        </div>

        <div className="card">
          <div className="card-icon green">
            <Warehouse size={25} />
          </div>
          <div>
            <span>Na garagem</span>
            <strong>{veiculosNaGaragem.length}</strong>
            <small>{veiculosEmManutencao.length} em manutenção • {veiculosAguardandoLimpeza.length} para limpar</small>
          </div>
        </div>

        <div className="card">
          <div className="card-icon blue">
            <Bus size={25} />
          </div>
          <div>
            <span>Chegaram hoje</span>
            <strong>{chegadasHoje.length}</strong>
            <small>{baseSelecionada} - {nomeBase(baseSelecionada)}</small>
          </div>
        </div>

        <div className="card">
          <div className="card-icon orange">
            <ClipboardList size={25} />
          </div>
          <div>
            <span>Saíram hoje</span>
            <strong>{saidasHoje.length}</strong>
            <small>{baseSelecionada} - {nomeBase(baseSelecionada)}</small>
          </div>
        </div>
      </div>
    )
  }

  function renderLiberacaoBadge(valor: LiberacaoManutencao) {
    if (valor === '-') return <span>-</span>

    return (
      <span className={`status ${valor === 'LIBERADO' ? 'liberado' : 'retido'}`}>
        {textoLiberacaoManutencao(valor)}
      </span>
    )
  }

  function renderLimpezaBadge(valor?: LiberacaoLimpeza) {
    if (!valor || valor === '-') return <span>-</span>

    return (
      <span className={`status ${valor === 'LIMPO' ? 'liberado' : 'retido'}`}>
        {textoLiberacaoLimpeza(valor)}
      </span>
    )
  }

  function renderGaragemAtual() {
    const selecionada = garagemAtualSelecionada
    const retencaoSelecionada = selecionada
      ? retencaoAtivaDoVeiculo(selecionada.prefixo)
      : null

    const empresasPresentes = new Set(
      veiculosNaGaragem.map((item) => item.empresa)
    ).size

    const retidosNaGaragem = veiculosNaGaragem.filter((item) =>
      Boolean(retencaoAtivaDoVeiculo(item.prefixo))
    ).length

    return (
      <>
        <div className="cards">
          <div className="card">
            <div className="card-icon blue"><Warehouse size={25} /></div>
            <div>
              <span>Na garagem agora</span>
              <strong>{veiculosNaGaragem.length}</strong>
              <small>{baseSelecionada} - {nomeBase(baseSelecionada)}</small>
            </div>
          </div>

          <div className="card">
            <div className="card-icon red"><Wrench size={25} /></div>
            <div>
              <span>Em manutenção</span>
              <strong>{veiculosEmManutencao.length}</strong>
              <small>LIBERAÇÃO MANUT.</small>
            </div>
          </div>

          <div className="card">
            <div className="card-icon green"><CheckCircle2 size={25} /></div>
            <div>
              <span>Aguardando limpeza</span>
              <strong>{veiculosAguardandoLimpeza.length}</strong>
              <small>LIBERAÇÃO LIMPEZA</small>
            </div>
          </div>

          <div className="card">
            <div className="card-icon orange"><Bus size={25} /></div>
            <div>
              <span>Empresas presentes</span>
              <strong>{empresasPresentes}</strong>
              <small>{retidosNaGaragem} retido(s) entre elas</small>
            </div>
          </div>
        </div>

        <div className="workspace">
          <section className="table-panel">
            <div className="panel-header">
              <div>
                <h2>Veículos atualmente na garagem</h2>
                <p className="panel-subtitle">
                  Base {baseSelecionada} - {nomeBase(baseSelecionada)}
                </p>
              </div>

              <div className="table-actions">
                <div className="table-search">
                  <Search size={17} />
                  <input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar prefixo, empresa..."
                  />
                  {busca && (
                    <button className="clear-search small" onClick={() => setBusca('')}>
                      <X size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Prefixo</th>
                    <th>Empresa</th>
                    <th>Linha entrada</th>
                    <th>Data chegada</th>
                    <th>Hora chegada</th>
                    <th>Tempo garagem</th>
                    <th>Liberação manut.</th>
                    <th>Liberação limpeza</th>
                    <th>Retenção</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {veiculosGaragemFiltrados.map((item) => {
                    const retencao = retencaoAtivaDoVeiculo(item.prefixo)
                    return (
                      <tr
                        key={item.prefixo}
                        className={
                          selecionada?.prefixo === item.prefixo ? 'selected-row' : ''
                        }
                        onClick={() => setGaragemSelecionada(item)}
                      >
                        <td className="prefix">{item.prefixo}</td>
                        <td>{item.empresa}</td>
                        <td>{item.linhaEntrada}</td>
                        <td>{item.dataEntrada}</td>
                        <td>{item.horaEntrada}</td>
                        <td><strong>{tempoNaGaragem(item)}</strong></td>
                        <td>{renderLiberacaoBadge(item.liberacaoManutencao)}</td>
                        <td>{renderLimpezaBadge(item.liberacaoLimpeza)}</td>
                        <td>
                          {retencao ? (
                            <span className="status retido">RETIDO</span>
                          ) : (
                            <span className="local-badge">SEM RETENÇÃO</span>
                          )}
                        </td>
                        <td>{retencao ? retencao.motivo : item.motivo}</td>
                      </tr>
                    )
                  })}

                  {veiculosGaragemFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={10}>Nenhum veículo encontrado nesta base.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="details-panel">
            <h2>Situação do veículo</h2>

            {selecionada ? (
              <>
                <div className="vehicle-head">
                  <div className="vehicle-icon"><Bus size={36} /></div>
                  <div>
                    <span>Prefixo</span>
                    <strong>{selecionada.prefixo}</strong>
                    {renderLiberacaoBadge(selecionada.liberacaoManutencao)}
                  </div>
                </div>

                <div className="details-list">
                  <div><span>Base</span><strong>{selecionada.baseOperacional} - {nomeBase(selecionada.baseOperacional)}</strong></div>
                  <div><span>Empresa</span><strong>{selecionada.empresa}</strong></div>
                  <div><span>Linha entrada</span><strong>{selecionada.linhaEntrada}</strong></div>
                  <div><span>Chegada</span><strong>{selecionada.dataEntrada} {selecionada.horaEntrada}</strong></div>
                  <div><span>Tempo garagem</span><strong>{tempoNaGaragem(selecionada)}</strong></div>
                  <div><span>Liberação manut.</span><strong>{textoLiberacaoManutencao(selecionada.liberacaoManutencao)}</strong></div>
                  <div><span>Liberação limpeza</span><strong>{textoLiberacaoLimpeza(selecionada.liberacaoLimpeza)}</strong></div>
                  {selecionada.responsavelLimpeza && (
                    <div><span>Limpeza por</span><strong>{selecionada.responsavelLimpeza}{selecionada.cifResponsavelLimpeza ? ` — CIF ${selecionada.cifResponsavelLimpeza}` : ''}</strong></div>
                  )}
                  <div><span>Retenção</span><strong>{retencaoSelecionada ? 'RETIDO' : 'SEM RETENÇÃO ATIVA'}</strong></div>
                  {retencaoSelecionada && (
                    <>
                      <div><span>Local físico</span><strong>{retencaoSelecionada.local} - {localNome(retencaoSelecionada.local)}</strong></div>
                      <div><span>Motivo retenção</span><strong>{retencaoSelecionada.motivo}</strong></div>
                      <div><span>Dias retido</span><strong>{diasRetido(retencaoSelecionada)}</strong></div>
                    </>
                  )}
                </div>

                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: '1px solid #e5eaf0',
                  }}
                >
                  <strong style={{ color: '#173e65', fontSize: 11 }}>
                    Histórico de manutenção
                  </strong>

                  {atendimentos.filter((item) => item.prefixo === selecionada.prefixo).length > 0 ? (
                    <div style={{ marginTop: 8 }}>
                      {atendimentos
                        .filter((item) => item.prefixo === selecionada.prefixo)
                        .slice(0, 3)
                        .map((item) => (
                          <div
                            key={item.id}
                            style={{
                              padding: '8px 0',
                              borderBottom: '1px solid #eef1f4',
                              fontSize: 10,
                              lineHeight: 1.4,
                            }}
                          >
                            <div>
                              <strong>{item.dataFinalizacao} {item.horaFinalizacao}</strong>
                              {' '}— {item.origem === 'CHEGADA' ? 'AVARIA' : 'RETENÇÃO'}
                            </div>
                            <div><strong>Problema:</strong> {item.problema}</div>
                            <div><strong>Serviço:</strong> {item.servicoRealizado}</div>
                            <div><strong>Responsável:</strong> {item.responsavel}{item.cifResponsavel ? ` — CIF ${item.cifResponsavel}` : ''}</div>
                          </div>
                        ))}

                      <div style={{ marginTop: 7, color: '#7a8794', fontSize: 9 }}>
                        Total de atendimentos registrados: {' '}
                        {atendimentos.filter((item) => item.prefixo === selecionada.prefixo).length}
                      </div>
                    </div>
                  ) : (
                    <div className="empty-detail" style={{ padding: '10px 0' }}>
                      Nenhum serviço concluído para este prefixo.
                    </div>
                  )}
                </div>

                <button className="detail-action" onClick={() => abrirSaidaDoVeiculo(selecionada)}>
                  <ArrowRightFromLine size={17} /> Registrar saída
                </button>

                {selecionada.liberacaoLimpeza === 'LIMPAR' && (
                  <button
                    className="detail-action"
                    onClick={() => abrirFinalizacaoLimpeza(selecionada)}
                  >
                    <CheckCircle2 size={17} /> Registrar limpeza concluída
                  </button>
                )}

                {selecionada.liberacaoManutencao === 'EM_MANUTENCAO' ? (
                  <button
                    className="detail-action"
                    onClick={() => alterarLiberacaoManutencao(selecionada, 'LIBERADO')}
                  >
                    <CheckCircle2 size={17} /> Marcar LIBERADO
                  </button>
                ) : (
                  <button
                    className="detail-action"
                    onClick={() => alterarLiberacaoManutencao(selecionada, 'EM_MANUTENCAO')}
                  >
                    <Wrench size={17} /> Registrar nova avaria
                  </button>
                )}

                {retencaoSelecionada ? (
                  <button
                    className="detail-action"
                    onClick={() => {
                      setRetSelecionada(retencaoSelecionada)
                      setPagina('garagem')
                      setFiltroLocalRetido('TODOS')
                      setBusca('')
                    }}
                  >
                    <ShieldAlert size={17} /> Abrir retenção
                  </button>
                ) : (
                  <button className="detail-action" onClick={() => abrirRetencaoDoVeiculo(selecionada)}>
                    <ShieldAlert size={17} /> Registrar retenção
                  </button>
                )}

                <button
                  className="detail-action"
                  onClick={() => abrirConsultaVeiculo(selecionada.prefixo)}
                >
                  <Search size={17} /> Ver histórico completo
                </button>
              </>
            ) : (
              <div className="empty-detail">Nenhum veículo atualmente na garagem desta base.</div>
            )}
          </aside>
        </div>
      </>
    )
  }

  function renderMovimentacoes(lista = movimentacoesFiltradas) {
    return (
      <div className="workspace">
        <section className="table-panel">
          <div className="panel-header">
            <div>
              <h2>Movimentações do tráfego</h2>
              <p className="panel-subtitle">
                Base {baseSelecionada} - {nomeBase(baseSelecionada)} • registros históricos aparecem identificados e não alteram a garagem atual
              </p>
            </div>
            <div className="table-actions">
              <div className="table-search">
                <Search size={17} />
                <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar prefixo, linha..." />
                {busca && <button className="clear-search small" onClick={() => setBusca('')}><X size={15} /></button>}
              </div>
              <button className="refresh" onClick={() => setUltimaAtualizacao(new Date())}><RefreshCw size={17} /> Atualizar</button>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Movimentação</th>
                  <th>Prefixo</th>
                  <th>Empresa</th>
                  <th>Linha entrada</th>
                  <th>Dt. entrada</th>
                  <th>Hr. entrada</th>
                  <th>Motivo</th>
                  <th>Liberação manut.</th>
                  <th>Liberação limpeza</th>
                  <th>Linha saída</th>
                  <th>Dt. saída</th>
                  <th>Hr. manobra</th>
                  <th>Hr. saída</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((item) => (
                  <tr
                    key={item.id}
                    className={movSelecionada?.id === item.id ? 'selected-row' : ''}
                    onClick={() => setMovSelecionada(item)}
                  >
                    <td>
                      <span className={`status ${item.tipo.toLowerCase()}`}>{item.tipo}</span>
                      {item.historicoSomente && (
                        <div style={{ marginTop: 4, fontSize: 8, fontWeight: 800, color: '#7a8794' }}>
                          HISTÓRICO
                        </div>
                      )}
                    </td>
                    <td className="prefix">{item.prefixo}</td>
                    <td>{item.empresa}</td>
                    <td>{item.linhaEntrada}</td>
                    <td>{item.dataEntrada}</td>
                    <td>{item.horaEntrada}</td>
                    <td>{item.motivo}</td>
                    <td>{renderLiberacaoBadge(item.liberacaoManutencao)}</td>
                    <td>{renderLimpezaBadge(item.liberacaoLimpeza)}</td>
                    <td>{item.linhaSaida}</td>
                    <td>{item.dataSaida}</td>
                    <td>{item.horaManobra}</td>
                    <td>{item.horaSaida}</td>
                  </tr>
                ))}
                {lista.length === 0 && <tr><td colSpan={13}>Nenhuma movimentação registrada nesta base.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <span>{lista.length} movimentação(ões)</span>
            <span>Base {baseSelecionada}</span>
          </div>
        </section>

        <aside className="details-panel">
          <h2>Detalhes da movimentação</h2>
          {movSelecionada && movSelecionada.baseOperacional === baseSelecionada ? (
            <>
              <div className="vehicle-head">
                <div className="vehicle-icon"><Bus size={36} /></div>
                <div>
                  <span>Prefixo</span>
                  <strong>{movSelecionada.prefixo}</strong>
                  <span className={`status ${movSelecionada.tipo.toLowerCase()}`}>{movSelecionada.tipo}</span>
                </div>
              </div>
              <div className="details-list">
                <div><span>Base</span><strong>{movSelecionada.baseOperacional} - {nomeBase(movSelecionada.baseOperacional)}</strong></div>
                <div>
                  <span>Origem do registro</span>
                  <strong>{movSelecionada.historicoSomente ? 'HISTÓRICO DAS PLANILHAS' : 'OPERAÇÃO ATUAL'}</strong>
                </div>
                <div><span>Empresa</span><strong>{movSelecionada.empresa}</strong></div>
                <div><span>Linha entrada</span><strong>{movSelecionada.linhaEntrada}</strong></div>
                <div><span>Entrada</span><strong>{movSelecionada.dataEntrada} {movSelecionada.horaEntrada}</strong></div>
                <div><span>Motivo</span><strong>{movSelecionada.motivo}</strong></div>
                <div><span>Liberação manut.</span><strong>{textoLiberacaoManutencao(movSelecionada.liberacaoManutencao)}</strong></div>
                <div><span>Liberação limpeza</span><strong>{textoLiberacaoLimpeza(movSelecionada.liberacaoLimpeza)}</strong></div>
                {movSelecionada.responsavelLimpeza && (
                  <div><span>Limpeza por</span><strong>{movSelecionada.responsavelLimpeza}{movSelecionada.cifResponsavelLimpeza ? ` — CIF ${movSelecionada.cifResponsavelLimpeza}` : ''}</strong></div>
                )}
                <div><span>Linha saída</span><strong>{movSelecionada.linhaSaida}</strong></div>
                <div><span>Saída</span><strong>{movSelecionada.dataSaida} {movSelecionada.horaSaida}</strong></div>
              </div>
              <button
                className="detail-action"
                onClick={() => abrirConsultaVeiculo(movSelecionada.prefixo)}
              >
                <Search size={17} /> Ver histórico completo
              </button>
            </>
          ) : (
            <div className="empty-detail">Selecione uma movimentação desta base.</div>
          )}
        </aside>
      </div>
    )
  }

  function renderRetencoes(lista = retencoesFiltradas) {
    const nivelSelecionado = retSelecionada ? nivelRetencao(retSelecionada) : null

    return (
      <div className="workspace">
        <section className="table-panel">
          <div className="panel-header">
            <div>
              <h2>Controle geral de retidos</h2>
              <p className="panel-subtitle">Visão global por local físico do veículo</p>
            </div>
            <div className="table-actions">
              <div className="table-search">
                <Search size={17} />
                <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar prefixo, motivo..." />
                {busca && <button className="clear-search small" onClick={() => setBusca('')}><X size={15} /></button>}
              </div>
            </div>
          </div>

          {pagina === 'garagem' && (
            <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderBottom: '1px solid #e5eaf0', flexWrap: 'wrap' }}>
              {(['TODOS', 'ATA', 'BRU', 'SPO'] as FiltroLocalRetido[]).map((local) => (
                <button
                  key={local}
                  type="button"
                  onClick={() => setFiltroLocalRetido(local)}
                  style={{
                    border: filtroLocalRetido === local ? '1px solid #0d71ce' : '1px solid #d3dce5',
                    background: filtroLocalRetido === local ? '#eaf4ff' : 'white',
                    color: filtroLocalRetido === local ? '#0d5fae' : '#536475',
                    borderRadius: 18,
                    padding: '6px 12px',
                    fontWeight: 700,
                    fontSize: 10,
                  }}
                >
                  {local === 'TODOS' ? 'TODOS' : `${local} - ${localNome(local)}`}
                </button>
              ))}
            </div>
          )}

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Prefixo</th>
                  <th>Empresa</th>
                  <th>Base registro</th>
                  <th>Linha entrada</th>
                  <th>Dt. entrada</th>
                  <th>Hr. entrada</th>
                  <th>Motivo</th>
                  <th>Prev. saída</th>
                  <th>Total dias</th>
                  <th>Local físico</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((item) => {
                  const nivel = nivelRetencao(item)
                  return (
                    <tr
                      key={item.id}
                      className={retSelecionada?.id === item.id ? 'selected-row' : ''}
                      onClick={() => setRetSelecionada(item)}
                    >
                      <td className="prefix">{item.prefixo}</td>
                      <td>{item.empresa}</td>
                      <td><span className="local-badge">{item.baseOperacional}</span></td>
                      <td>{item.linhaEntrada}</td>
                      <td>{item.dataEntrada}</td>
                      <td>{item.horaEntrada}</td>
                      <td>{item.motivo}</td>
                      <td>{item.previsaoSaida}</td>
                      <td><div className={`days-badge ${nivel.classe}`}><strong>{diasRetido(item)}</strong><span>{nivel.rotulo}</span></div></td>
                      <td><span className="local-badge">{item.local}</span></td>
                      <td><span className={`status ${item.status.toLowerCase()}`}>{item.status}</span></td>
                    </tr>
                  )
                })}
                {lista.length === 0 && <tr><td colSpan={11}>Nenhum registro encontrado.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="details-panel">
          <h2>Detalhes da retenção</h2>
          {retSelecionada && nivelSelecionado ? (
            <>
              <div className="vehicle-head">
                <div className="vehicle-icon"><Wrench size={34} /></div>
                <div>
                  <span>Prefixo</span>
                  <strong>{retSelecionada.prefixo}</strong>
                  <span className={`status ${retSelecionada.status.toLowerCase()}`}>{retSelecionada.status}</span>
                </div>
              </div>

              <div className={`retention-priority ${nivelSelecionado.classe}`}>
                <span>Tempo de retenção</span>
                <strong>{diasRetido(retSelecionada)} dia(s)</strong>
                <small>{nivelSelecionado.rotulo}</small>
              </div>

              <div className="details-list">
                <div><span>Base registro</span><strong>{retSelecionada.baseOperacional} - {nomeBase(retSelecionada.baseOperacional)}</strong></div>
                <div><span>Local físico</span><strong>{retSelecionada.local} - {localNome(retSelecionada.local)}</strong></div>
                <div><span>Empresa</span><strong>{retSelecionada.empresa}</strong></div>
                <div><span>Motivo</span><strong>{retSelecionada.motivo}</strong></div>
                <div><span>Entrada</span><strong>{retSelecionada.dataEntrada} {retSelecionada.horaEntrada}</strong></div>
                <div><span>Previsão</span><strong>{retSelecionada.previsaoSaida}</strong></div>
                <div><span>Liberação</span><strong>{retSelecionada.dataLiberacao}</strong></div>
              </div>

              <button
                className="detail-action"
                onClick={() => abrirConsultaVeiculo(retSelecionada.prefixo)}
              >
                <Search size={17} /> Ver histórico completo
              </button>

              {retSelecionada.status === 'RETIDO' ? (
                <>
                  <button className="detail-action" onClick={() => abrirEdicaoRetencao(retSelecionada)}><Pencil size={17} /> Editar retenção</button>
                  <button className="detail-action" onClick={() => liberarRetencao(retSelecionada.id)}><CheckCircle2 size={17} /> Liberar veículo</button>
                </>
              ) : (
                <div className="empty-detail"><LockKeyhole size={18} /><div style={{ marginTop: 6 }}>Registro finalizado.</div></div>
              )}
            </>
          ) : (
            <div className="empty-detail">Selecione uma retenção.</div>
          )}
        </aside>
      </div>
    )
  }

  function renderManutencao() {
    const selecionada =
      garagemSelecionada &&
      manutencaoFiltrada.some((item) => item.id === garagemSelecionada.id)
        ? garagemSelecionada
        : manutencaoFiltrada[0] ?? null

    return (
      <>
        <div className="workspace">
          <section className="table-panel">
            <div className="panel-header">
              <div>
                <h2>Veículos em manutenção</h2>
                <p className="panel-subtitle">
                  Avarias abertas | Base {baseSelecionada} - {nomeBase(baseSelecionada)}
                </p>
              </div>
              <div className="table-search">
                <Search size={17} />
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar prefixo, problema..."
                />
              </div>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Prefixo</th>
                    <th>Empresa</th>
                    <th>Linha entrada</th>
                    <th>Chegada</th>
                    <th>Problema / avaria</th>
                    <th>Liberação manut.</th>
                    <th>Retenção</th>
                  </tr>
                </thead>
                <tbody>
                  {manutencaoFiltrada.map((item) => (
                    <tr
                      key={item.id}
                      className={selecionada?.id === item.id ? 'selected-row' : ''}
                      onClick={() => setGaragemSelecionada(item)}
                    >
                      <td className="prefix">{item.prefixo}</td>
                      <td>{item.empresa}</td>
                      <td>{item.linhaEntrada}</td>
                      <td>{item.dataEntrada} {item.horaEntrada}</td>
                      <td>{item.problemaManutencao !== '-' ? item.problemaManutencao : item.motivo}</td>
                      <td>{renderLiberacaoBadge(item.liberacaoManutencao)}</td>
                      <td>
                        {retencaoAtivaDoVeiculo(item.prefixo) ? (
                          <span className="status retido">RETIDO</span>
                        ) : (
                          <span className="local-badge">SEM RETENÇÃO</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {manutencaoFiltrada.length === 0 && (
                    <tr>
                      <td colSpan={7}>Nenhum veículo aguardando manutenção nesta base.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="details-panel">
            <h2>Atendimento da manutenção</h2>
            {selecionada ? (
              <>
                <div className="vehicle-head">
                  <div className="vehicle-icon"><Wrench size={34} /></div>
                  <div>
                    <span>Prefixo</span>
                    <strong>{selecionada.prefixo}</strong>
                    {renderLiberacaoBadge(selecionada.liberacaoManutencao)}
                  </div>
                </div>
                <div className="details-list">
                  <div><span>Empresa</span><strong>{selecionada.empresa}</strong></div>
                  <div><span>Chegada</span><strong>{selecionada.dataEntrada} {selecionada.horaEntrada}</strong></div>
                  <div><span>Problema</span><strong>{selecionada.problemaManutencao !== '-' ? selecionada.problemaManutencao : selecionada.motivo}</strong></div>
                  <div><span>Tempo garagem</span><strong>{tempoNaGaragem(selecionada)}</strong></div>
                </div>
                <button
                  className="detail-action"
                  onClick={() => abrirFinalizacaoChegada(selecionada)}
                >
                  <CheckCircle2 size={17} /> Finalizar atendimento
                </button>
              </>
            ) : (
              <div className="empty-detail">Nenhum veículo aguardando manutenção.</div>
            )}
          </aside>
        </div>

        <section className="table-panel" style={{ marginTop: 14 }}>
          <div className="panel-header">
            <div>
              <h2>Histórico de serviços realizados</h2>
              <p className="panel-subtitle">
                Atendimentos finalizados na base {baseSelecionada}
              </p>
            </div>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Hora</th>
                  <th>Prefixo</th>
                  <th>Empresa</th>
                  <th>Origem</th>
                  <th>Problema</th>
                  <th>Serviço realizado</th>
                  <th>Responsável</th>
                  <th>CIF</th>
                </tr>
              </thead>
              <tbody>
                {historicoManutencaoDaBase.map((item) => (
                  <tr key={item.id}>
                    <td>{item.dataFinalizacao}</td>
                    <td>{item.horaFinalizacao}</td>
                    <td className="prefix">{item.prefixo}</td>
                    <td>{item.empresa}</td>
                    <td>{item.origem === 'CHEGADA' ? 'AVARIA NA CHEGADA' : 'RETENÇÃO'}</td>
                    <td>{item.problema}</td>
                    <td>{item.servicoRealizado}</td>
                    <td>{item.responsavel}</td>
                    <td>{item.cifResponsavel || '-'}</td>
                  </tr>
                ))}
                {historicoManutencaoDaBase.length === 0 && (
                  <tr>
                    <td colSpan={9}>Nenhum serviço finalizado nesta base.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </>
    )
  }

  function renderLimpeza() {
    const selecionada =
      garagemSelecionada &&
      limpezaFiltrada.some((item) => item.id === garagemSelecionada.id)
        ? garagemSelecionada
        : limpezaFiltrada[0] ?? null

    return (
      <>
        <div className="workspace">
          <section className="table-panel">
            <div className="panel-header">
              <div>
                <h2>Veículos aguardando limpeza</h2>
                <p className="panel-subtitle">
                  Base {baseSelecionada} - {nomeBase(baseSelecionada)} | liberação independente da manutenção
                </p>
              </div>
              <div className="table-search">
                <Search size={17} />
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar prefixo, empresa..."
                />
              </div>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Prefixo</th>
                    <th>Empresa</th>
                    <th>Linha entrada</th>
                    <th>Chegada</th>
                    <th>Limpeza</th>
                    <th>Manutenção</th>
                    <th>Motivo chegada</th>
                  </tr>
                </thead>
                <tbody>
                  {limpezaFiltrada.map((item) => (
                    <tr
                      key={item.id}
                      className={selecionada?.id === item.id ? 'selected-row' : ''}
                      onClick={() => setGaragemSelecionada(item)}
                    >
                      <td className="prefix">{item.prefixo}</td>
                      <td>{item.empresa}</td>
                      <td>{item.linhaEntrada}</td>
                      <td>{item.dataEntrada} {item.horaEntrada}</td>
                      <td>{renderLimpezaBadge(item.liberacaoLimpeza)}</td>
                      <td>{renderLiberacaoBadge(item.liberacaoManutencao)}</td>
                      <td>{item.motivo}</td>
                    </tr>
                  ))}
                  {limpezaFiltrada.length === 0 && (
                    <tr><td colSpan={7}>Nenhum veículo aguardando limpeza nesta base.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="details-panel">
            <h2>Liberação da limpeza</h2>
            {selecionada ? (
              <>
                <div className="vehicle-head">
                  <div className="vehicle-icon"><CheckCircle2 size={34} /></div>
                  <div>
                    <span>Prefixo</span>
                    <strong>{selecionada.prefixo}</strong>
                    {renderLimpezaBadge(selecionada.liberacaoLimpeza)}
                  </div>
                </div>
                <div className="details-list">
                  <div><span>Empresa</span><strong>{selecionada.empresa}</strong></div>
                  <div><span>Chegada</span><strong>{selecionada.dataEntrada} {selecionada.horaEntrada}</strong></div>
                  <div><span>Linha</span><strong>{selecionada.linhaEntrada}</strong></div>
                  <div><span>Manutenção</span><strong>{textoLiberacaoManutencao(selecionada.liberacaoManutencao)}</strong></div>
                  <div><span>Retenção</span><strong>{retencaoAtivaDoVeiculo(selecionada.prefixo) ? 'RETIDO' : 'SEM RETENÇÃO ATIVA'}</strong></div>
                </div>
                <button
                  className="detail-action"
                  onClick={() => abrirFinalizacaoLimpeza(selecionada)}
                >
                  <CheckCircle2 size={17} /> Marcar como LIMPO
                </button>
              </>
            ) : (
              <div className="empty-detail">Nenhum veículo aguardando limpeza.</div>
            )}
          </aside>
        </div>

        <section className="table-panel" style={{ marginTop: 14 }}>
          <div className="panel-header">
            <div>
              <h2>Histórico de liberações da limpeza</h2>
              <p className="panel-subtitle">
                Registros com responsável na base {baseSelecionada}
              </p>
            </div>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Data limpeza</th>
                  <th>Hora</th>
                  <th>Prefixo</th>
                  <th>Empresa</th>
                  <th>Responsável</th>
                  <th>CIF</th>
                  <th>Chegada</th>
                </tr>
              </thead>
              <tbody>
                {historicoLimpezaDaBase.slice(0, 100).map((item) => (
                  <tr key={`limpeza-${item.id}`}>
                    <td>{item.dataLimpeza || '-'}</td>
                    <td>{item.horaLimpeza || '-'}</td>
                    <td className="prefix">{item.prefixo}</td>
                    <td>{item.empresa}</td>
                    <td>{item.responsavelLimpeza || '-'}</td>
                    <td>{item.cifResponsavelLimpeza || '-'}</td>
                    <td>{item.dataEntrada} {item.horaEntrada}</td>
                  </tr>
                ))}
                {historicoLimpezaDaBase.length === 0 && (
                  <tr><td colSpan={7}>Nenhuma liberação de limpeza registrada pelo sistema.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </>
    )
  }

  function renderConsultaVeiculo() {
    const prefixoSelecionado =
      consultaPrefixo &&
      prefixosConhecidos.some((item) => item.prefixo === consultaPrefixo)
        ? consultaPrefixo
        : prefixosConsultaFiltrados[0]?.prefixo ?? ''

    const movs = movimentacoes
      .filter((item) => item.prefixo === prefixoSelecionado)
      .sort((a, b) => momentoMovimentacao(b) - momentoMovimentacao(a))

    const rets = retencoes
      .filter((item) => item.prefixo === prefixoSelecionado)
      .sort((a, b) => {
        const dataA = parseDataBR(a.dataEntrada)?.getTime() ?? 0
        const dataB = parseDataBR(b.dataEntrada)?.getTime() ?? 0
        return dataB - dataA
      })

    const servicos = atendimentos
      .filter((item) => item.prefixo === prefixoSelecionado)
      .sort((a, b) => {
        const da = parseDataBR(a.dataFinalizacao)
        const db = parseDataBR(b.dataFinalizacao)

        if (da && a.horaFinalizacao && a.horaFinalizacao !== '-') {
          const [h, m] = a.horaFinalizacao.split(':').map(Number)
          da.setHours(h || 0, m || 0, 0, 0)
        }

        if (db && b.horaFinalizacao && b.horaFinalizacao !== '-') {
          const [h, m] = b.horaFinalizacao.split(':').map(Number)
          db.setHours(h || 0, m || 0, 0, 0)
        }

        return (db?.getTime() ?? 0) - (da?.getTime() ?? 0)
      })

    const ultimaOperacao =
      movs.find((item) => !item.historicoSomente) ?? null
    const retencaoAtiva =
      rets.find((item) => item.status === 'RETIDO') ?? null
    const empresa =
      ultimaOperacao?.empresa ??
      movs[0]?.empresa ??
      rets[0]?.empresa ??
      servicos[0]?.empresa ??
      '-'

    const naGaragem = ultimaOperacao?.tipo === 'CHEGOU'
    const emManutencao =
      naGaragem && ultimaOperacao?.liberacaoManutencao === 'EM_MANUTENCAO'

    let situacaoAtual = 'SEM ESTADO OPERACIONAL ATUAL'
    if (naGaragem && ultimaOperacao) {
      situacaoAtual = `NA GARAGEM — ${ultimaOperacao.baseOperacional}`
    } else if (ultimaOperacao?.tipo === 'SAIU') {
      situacaoAtual = `SAIU — ${ultimaOperacao.baseOperacional}`
    } else if (retencaoAtiva) {
      situacaoAtual = `RETIDO — ${retencaoAtiva.local}`
    }

    return (
      <>
        <div className="cards">
          <div className="card">
            <div className="card-icon blue"><Bus size={25} /></div>
            <div>
              <span>Prefixo consultado</span>
              <strong>{prefixoSelecionado || '-'}</strong>
              <small>{empresa}</small>
            </div>
          </div>

          <div className="card">
            <div className={`card-icon ${naGaragem ? 'green' : 'blue'}`}><Warehouse size={25} /></div>
            <div>
              <span>Situação operacional</span>
              <strong style={{ fontSize: 15 }}>{situacaoAtual}</strong>
              <small>
                {ultimaOperacao
                  ? `${ultimaOperacao.tipo === 'CHEGOU' ? ultimaOperacao.dataEntrada : ultimaOperacao.dataSaida} — ${ultimaOperacao.historicoSomente ? 'histórico' : 'atual'}`
                  : 'sem movimentação atual'}
              </small>
            </div>
          </div>

          <div className="card">
            <div className={`card-icon ${retencaoAtiva ? 'red' : 'green'}`}><ShieldAlert size={25} /></div>
            <div>
              <span>Retenção ativa</span>
              <strong>{retencaoAtiva ? 'SIM' : 'NÃO'}</strong>
              <small>{retencaoAtiva ? `${retencaoAtiva.local} — ${retencaoAtiva.motivo}` : `${rets.length} registro(s) no histórico`}</small>
            </div>
          </div>

          <div className="card">
            <div className={`card-icon ${emManutencao ? 'red' : 'green'}`}><Wrench size={25} /></div>
            <div>
              <span>Manutenção atual</span>
              <strong>{emManutencao ? 'EM MANUT.' : 'SEM BLOQUEIO'}</strong>
              <small>{servicos.length} serviço(s) finalizado(s)</small>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '280px minmax(0, 1fr)',
            gap: 14,
            alignItems: 'start',
          }}
        >
          <section className="table-panel">
            <div className="panel-header">
              <div>
                <h2>Veículos cadastrados</h2>
                <p className="panel-subtitle">
                  {prefixosConsultaFiltrados.length} prefixo(s) localizado(s)
                </p>
              </div>
            </div>

            <div style={{ padding: '10px 12px', borderBottom: '1px solid #e5eaf0' }}>
              <div className="table-search" style={{ width: '100%' }}>
                <Search size={17} />
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Digite o prefixo..."
                />
                {busca && (
                  <button className="clear-search small" onClick={() => setBusca('')}>
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            <div
              style={{
                maxHeight: '640px',
                overflowY: 'auto',
              }}
            >
              {prefixosConsultaFiltrados.map((item) => (
                <button
                  key={item.prefixo}
                  type="button"
                  onClick={() => setConsultaPrefixo(item.prefixo)}
                  style={{
                    width: '100%',
                    border: 0,
                    borderBottom: '1px solid #edf1f4',
                    background:
                      prefixoSelecionado === item.prefixo ? '#eef6ff' : 'white',
                    padding: '11px 14px',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 900, color: '#173e65', fontSize: 13 }}>
                    {item.prefixo}
                  </div>
                  <div style={{ color: '#7a8794', fontSize: 10, marginTop: 2 }}>
                    {item.empresa}
                  </div>
                </button>
              ))}

              {prefixosConsultaFiltrados.length === 0 && (
                <div className="empty-detail">Nenhum prefixo encontrado.</div>
              )}
            </div>
          </section>

          <div style={{ display: 'grid', gap: 14, minWidth: 0 }}>
            {!prefixoSelecionado ? (
              <section className="table-panel">
                <div className="empty-detail">
                  Digite ou selecione um prefixo para consultar o histórico completo.
                </div>
              </section>
            ) : (
              <>
                <section className="table-panel">
                  <div className="panel-header">
                    <div>
                      <h2>Ficha do veículo {prefixoSelecionado}</h2>
                      <p className="panel-subtitle">
                        Consulta global entre ATA, BRU e SPO
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                      gap: 10,
                      padding: 14,
                    }}
                  >
                    <div className="details-list">
                      <div><span>Empresa</span><strong>{empresa}</strong></div>
                      <div><span>Situação</span><strong>{situacaoAtual}</strong></div>
                      <div><span>Movimentações</span><strong>{movs.length}</strong></div>
                    </div>

                    <div className="details-list">
                      <div><span>Retenções</span><strong>{rets.length}</strong></div>
                      <div><span>Retenção ativa</span><strong>{retencaoAtiva ? 'SIM' : 'NÃO'}</strong></div>
                      <div><span>Serviços concluídos</span><strong>{servicos.length}</strong></div>
                    </div>

                    <div className="details-list">
                      <div><span>Última base</span><strong>{ultimaOperacao?.baseOperacional ?? '-'}</strong></div>
                      <div><span>Liberação manut.</span><strong>{ultimaOperacao ? textoLiberacaoManutencao(ultimaOperacao.liberacaoManutencao) : '-'}</strong></div>
                      <div><span>Liberação limpeza</span><strong>{ultimaOperacao ? textoLiberacaoLimpeza(ultimaOperacao.liberacaoLimpeza) : '-'}</strong></div>
                      <div><span>Dados históricos</span><strong>{movs.filter((item) => item.historicoSomente).length}</strong></div>
                    </div>
                  </div>
                </section>

                <section className="table-panel">
                  <div className="panel-header">
                    <div>
                      <h2>Histórico de movimentações</h2>
                      <p className="panel-subtitle">
                        Registros de todas as bases
                      </p>
                    </div>
                  </div>

                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Tipo</th>
                          <th>Base</th>
                          <th>Linha entrada</th>
                          <th>Entrada</th>
                          <th>Motivo</th>
                          <th>Manut.</th>
                          <th>Limpeza</th>
                          <th>Linha saída</th>
                          <th>Saída</th>
                          <th>Origem</th>
                        </tr>
                      </thead>
                      <tbody>
                        {movs.map((item) => (
                          <tr key={item.id}>
                            <td><span className={`status ${item.tipo.toLowerCase()}`}>{item.tipo}</span></td>
                            <td><span className="local-badge">{item.baseOperacional}</span></td>
                            <td>{item.linhaEntrada}</td>
                            <td>{item.dataEntrada} {item.horaEntrada}</td>
                            <td>{item.motivo}</td>
                            <td>{renderLiberacaoBadge(item.liberacaoManutencao)}</td>
                            <td>{renderLimpezaBadge(item.liberacaoLimpeza)}</td>
                            <td>{item.linhaSaida}</td>
                            <td>{item.dataSaida} {item.horaSaida}</td>
                            <td>
                              <span className="local-badge">
                                {item.historicoSomente ? 'PLANILHA' : 'SISTEMA'}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {movs.length === 0 && (
                          <tr><td colSpan={10}>Nenhuma movimentação registrada.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="table-panel">
                  <div className="panel-header">
                    <div>
                      <h2>Histórico de retenções</h2>
                      <p className="panel-subtitle">
                        Situação e local físico
                      </p>
                    </div>
                  </div>

                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Status</th>
                          <th>Base registro</th>
                          <th>Local físico</th>
                          <th>Entrada</th>
                          <th>Motivo</th>
                          <th>Previsão</th>
                          <th>Liberação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rets.map((item) => (
                          <tr key={item.id}>
                            <td><span className={`status ${item.status.toLowerCase()}`}>{item.status}</span></td>
                            <td>{item.baseOperacional}</td>
                            <td>{item.local}</td>
                            <td>{item.dataEntrada} {item.horaEntrada}</td>
                            <td>{item.motivo}</td>
                            <td>{item.previsaoSaida}</td>
                            <td>{item.dataLiberacao}</td>
                          </tr>
                        ))}
                        {rets.length === 0 && (
                          <tr><td colSpan={7}>Nenhuma retenção registrada.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="table-panel">
                  <div className="panel-header">
                    <div>
                      <h2>Histórico de manutenção</h2>
                      <p className="panel-subtitle">
                        Serviços finalizados e responsáveis
                      </p>
                    </div>
                  </div>

                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Origem</th>
                          <th>Problema</th>
                          <th>Serviço realizado</th>
                          <th>Responsável</th>
                          <th>CIF</th>
                        </tr>
                      </thead>
                      <tbody>
                        {servicos.map((item) => (
                          <tr key={item.id}>
                            <td>{item.dataFinalizacao} {item.horaFinalizacao}</td>
                            <td>{item.origem === 'CHEGADA' ? 'AVARIA' : 'RETENÇÃO'}</td>
                            <td>{item.problema}</td>
                            <td>{item.servicoRealizado}</td>
                            <td>{item.responsavel}</td>
                            <td>{item.cifResponsavel || '-'}</td>
                          </tr>
                        ))}
                        {servicos.length === 0 && (
                          <tr><td colSpan={6}>Nenhum serviço finalizado registrado.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </>
    )
  }

  function renderPainel() {
    return (
      <>
        {renderCards()}
        <div className="dashboard-grid">
          <section className="table-panel">
            <div className="panel-header"><div><h2>Movimentações recentes</h2><p className="panel-subtitle">Base {baseSelecionada} - {nomeBase(baseSelecionada)}</p></div></div>
            <div className="table-container">
              <table>
                <thead><tr><th>Tipo</th><th>Prefixo</th><th>Empresa</th><th>Linha</th><th>Manut.</th><th>Horário</th></tr></thead>
                <tbody>
                  {movimentacoesOrdenadas.slice(0, 6).map((item) => (
                    <tr key={item.id}>
                      <td><span className={`status ${item.tipo.toLowerCase()}`}>{item.tipo}</span></td>
                      <td className="prefix">{item.prefixo}</td>
                      <td>{item.empresa}</td>
                      <td>{item.tipo === 'CHEGOU' ? item.linhaEntrada : item.linhaSaida}</td>
                      <td>{renderLiberacaoBadge(item.liberacaoManutencao)}</td>
                      <td>{item.tipo === 'CHEGOU' ? item.horaEntrada : item.horaSaida}</td>
                    </tr>
                  ))}
                  {movimentacoesOrdenadas.length === 0 && <tr><td colSpan={6}>Nenhuma movimentação registrada nesta base.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <section className="table-panel">
            <div className="panel-header"><div><h2>Retidos prioritários</h2><p className="panel-subtitle">Visão geral - todos os locais</p></div></div>
            <div className="table-container">
              <table>
                <thead><tr><th>Prefixo</th><th>Motivo</th><th>Local</th><th>Dias</th></tr></thead>
                <tbody>
                  {retidosPrioritarios.slice(0, 6).map((item) => {
                    const nivel = nivelRetencao(item)
                    return (
                      <tr key={item.id}>
                        <td className="prefix">{item.prefixo}</td>
                        <td>{item.motivo}</td>
                        <td><span className="local-badge">{item.local}</span></td>
                        <td><div className={`days-badge ${nivel.classe}`}><strong>{diasRetido(item)}</strong><span>{nivel.rotulo}</span></div></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </>
    )
  }

  function renderRelatorios() {
    return (
      <>
        {renderCards()}
        <section className="table-panel">
          <div className="panel-header"><div><h2>Resumo operacional</h2><p className="panel-subtitle">Base {baseSelecionada} + retidos gerais</p></div></div>
          <div className="table-container">
            <table><tbody>
              <tr><th>Na garagem agora</th><td>{veiculosNaGaragem.length}</td></tr>
              <tr><th>Em manutenção</th><td>{veiculosEmManutencao.length}</td></tr>
              <tr><th>Retidos ativos gerais</th><td>{retidosAtivos.length}</td></tr>
              <tr><th>Liberações de retenção registradas</th><td>{liberados.length}</td></tr>
              <tr><th>Chegadas hoje</th><td>{chegadasHoje.length}</td></tr>
              <tr><th>Saídas hoje</th><td>{saidasHoje.length}</td></tr>
              <tr><th>Total movimentações da base</th><td>{movimentacoesDaBase.length}</td></tr>
            </tbody></table>
          </div>
        </section>
      </>
    )
  }

  function renderUsuarios() {
    return (
      <section className="table-panel">
        <div className="panel-header"><div><h2>Usuários</h2><p className="panel-subtitle">Demonstração de perfis por base</p></div></div>
        <div className="table-container">
          <table>
            <thead><tr><th>Usuário</th><th>Perfil</th><th>Base</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td>Oswald</td><td>Operador</td><td>ATA</td><td><span className="status liberado">ATIVO</span></td></tr>
              <tr><td>Supervisor</td><td>Supervisão</td><td>TODAS</td><td><span className="status liberado">ATIVO</span></td></tr>
              <tr><td>Operador Bauru</td><td>Operador</td><td>BRU</td><td><span className="status liberado">ATIVO</span></td></tr>
            </tbody>
          </table>
        </div>
      </section>
    )
  }

  function renderConfiguracoes() {
    return (
      <>
        <div className="cards">
          <div className="card"><div className="card-icon green"><Save size={25} /></div><div><span>Dados locais</span><strong>ON</strong><small>neste navegador</small></div></div>
          <div className="card"><div className="card-icon blue"><Bus size={25} /></div><div><span>Empresas</span><strong>{EMPRESAS.length}</strong><small>cadastradas</small></div></div>
          <div className="card"><div className="card-icon red"><Warehouse size={25} /></div><div><span>Bases</span><strong>{BASES_OPERACIONAIS.length}</strong><small>ATA / BRU / SPO</small></div></div>
          <div className="card"><div className="card-icon orange"><Settings size={25} /></div><div><span>Versão</span><strong>2.1</strong><small>protótipo</small></div></div>
        </div>

        <section className="table-panel">
          <div className="panel-header">
            <div><h2>Estrutura operacional</h2><p className="panel-subtitle">Regras atuais do protótipo</p></div>
            <button className="refresh" onClick={restaurarDemonstracao}><RotateCcw size={17} /> Restaurar demonstração</button>
          </div>
          <div className="table-container">
            <table><tbody>
              <tr><th>Base atual</th><td>{baseSelecionada} - {nomeBase(baseSelecionada)}</td></tr>
              <tr><th>Empresas</th><td>{EMPRESAS.join(', ')}</td></tr>
              <tr><th>Operação</th><td>Separada por base operacional</td></tr>
              <tr><th>Base do terminal</th><td>A última base selecionada fica lembrada neste navegador</td></tr>
              <tr><th>Consistência entre bases</th><td>O mesmo prefixo não pode constar simultaneamente na garagem de duas bases</td></tr>
              <tr><th>Retidos</th><td>Visão geral com filtro por local físico</td></tr>
              <tr><th>Condição na chegada</th><td>NADA CONSTA / COM AVARIA ou PROBLEMA</td></tr>
              <tr><th>Liberação manut.</th><td>Automática na chegada: NADA CONSTA = LIBERADO / AVARIA = EM MANUT.</td></tr>
              <tr><th>Liberação limpeza</th><td>Nova chegada = LIMPAR. A equipe de limpeza informa responsável/CIF e marca LIMPO.</td></tr>
              <tr><th>Nova avaria</th><td>Pode ser aberta depois da chegada sem apagar a condição original registrada pelo tráfego</td></tr>
              <tr><th>Finalização</th><td>Serviço realizado e responsável são obrigatórios; CIF/matrícula pode ser informado quando necessário</td></tr>
              <tr><th>Importante</th><td>LIBERADO na manutenção não significa SAIU da garagem</td></tr>
              <tr><th>Dados antigos</th><td>Movimentações importadas de 08 a 16/09 ficam marcadas como HISTÓRICO e não definem a garagem atual</td></tr>
              <tr><th>Banco compartilhado</th><td>OFF - será implantado após aprovação</td></tr>
            </tbody></table>
          </div>
        </section>

        <section className="table-panel" style={{ marginTop: 14 }}>
          <div className="panel-header">
            <div>
              <h2>Carga consolidada das planilhas</h2>
              <p className="panel-subtitle">
                Histórico validado de 08 a 17/09/2026, com duplicações e conflitos tratados
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button
                className="refresh"
                onClick={desfazerCargaPlanilhas}
                disabled={!cargaPlanilhasAplicada || !backupCargaDisponivel}
                style={{
                  opacity: cargaPlanilhasAplicada && backupCargaDisponivel ? 1 : 0.55,
                  cursor:
                    cargaPlanilhasAplicada && backupCargaDisponivel
                      ? 'pointer'
                      : 'not-allowed',
                }}
              >
                <RotateCcw size={17} />
                Desfazer última carga
              </button>

              <button
                className="refresh"
                onClick={importarCargaPlanilhas}
                disabled={cargaPlanilhasAplicada}
                style={{
                  opacity: cargaPlanilhasAplicada ? 0.55 : 1,
                  cursor: cargaPlanilhasAplicada ? 'not-allowed' : 'pointer',
                }}
              >
                <Save size={17} />
                {cargaPlanilhasAplicada ? 'Carga já aplicada' : 'Importar carga consolidada'}
              </button>
            </div>
          </div>

          <div className="table-container">
            <table>
              <tbody>
                <tr><th>Período analisado</th><td>08/09/2026 a 17/09/2026</td></tr>
                <tr><th>Movimentações históricas para carga</th><td>133 registros de 08 a 16/09</td></tr>
                <tr><th>Movimentos de 17/09</th><td>Não são duplicados; o estado atual do protótipo é preservado</td></tr>
                <tr><th>Backup automático</th><td>{backupCargaDisponivel ? 'DISPONÍVEL - permite desfazer a última carga' : 'Será criado imediatamente antes da próxima importação'}</td></tr>
                <tr><th>Retidos ativos confirmados</th><td>9 prefixos no snapshot mais recente</td></tr>
                <tr><th>Conflito 162204</th><td>Importada apenas a saída ATA x SPO 21:35 às 20:55; a segunda saída conflitante foi excluída da carga</td></tr>
                <tr><th>146204</th><td>Saída de 14/09 às 09:17 preservada sem inventar a linha de saída</td></tr>
                <tr><th>Planejamentos</th><td>VAI CHEGAR e EM TRÂNSITO não foram convertidos em CHEGOU/SAIU</td></tr>
                <tr>
                  <th>Status desta estação</th>
                  <td>
                    <span className={`status ${cargaPlanilhasAplicada ? 'liberado' : 'retido'}`}>
                      {cargaPlanilhasAplicada ? 'IMPORTADA' : 'PENDENTE'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </>
    )
  }

  function trocarPagina(nova: Pagina) {
    setPagina(nova)
    setBusca('')
    if (nova !== 'garagem') setFiltroLocalRetido('TODOS')
  }

  const paginaRetencao = pagina === 'garagem' || pagina === 'ocorrencias'

  function normalizarSenha(valor: string) {
    return valor
      .normalize('NFKC')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\s+/g, '')
  }

  function entrarComSenha(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const senhaDigitada = normalizarSenha(senhaAcesso)
    const senhaEsperada = normalizarSenha(AUTH_PASSWORD)

    if (!senhaDigitada) {
      setErroSenha('Digite a senha de acesso.')
      return
    }

    setValidandoSenha(true)
    setErroSenha('')

    if (senhaDigitada === senhaEsperada) {
      sessionStorage.setItem(AUTH_SESSION_KEY, '1')
      setAutenticado(true)
      setSenhaAcesso('')
      setValidandoSenha(false)
      return
    }

    setErroSenha('Senha incorreta. Verifique e tente novamente.')
    setValidandoSenha(false)
  }

  function sairDoSistema() {
    sessionStorage.removeItem(AUTH_SESSION_KEY)
    setAutenticado(false)
    setSenhaAcesso('')
    setErroSenha('')
    setPagina('painel')
  }

  if (!autenticado) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background:
            'linear-gradient(135deg, #071f3b 0%, #0b3b6e 52%, #0b5aa5 100%)',
          padding: 24,
          fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, \'Segoe UI\', sans-serif',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 430,
            background: '#ffffff',
            borderRadius: 18,
            boxShadow: '0 24px 70px rgba(0, 0, 0, 0.28)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: '#0b3b6e',
              color: '#ffffff',
              padding: '28px 30px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 14,
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              <Bus size={30} />
            </div>
            <div>
              <div style={{ fontSize: 25, fontWeight: 800, lineHeight: 1.1 }}>Reunidas</div>
              <div style={{ marginTop: 5, fontSize: 12, opacity: 0.86, letterSpacing: 0.7 }}>
                CONTROLE OPERACIONAL
              </div>
            </div>
          </div>

          <form onSubmit={entrarComSenha} style={{ padding: 30 }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 16,
                display: 'grid',
                placeItems: 'center',
                background: '#eaf3ff',
                color: '#0b5aa5',
                marginBottom: 20,
              }}
            >
              <LockKeyhole size={27} />
            </div>

            <h1 style={{ margin: 0, fontSize: 24, color: '#0b2f57' }}>Acesso restrito</h1>
            <p style={{ margin: '8px 0 24px', color: '#667085', lineHeight: 1.55 }}>
              Área destinada ao uso interno do Controle Operacional. Informe a senha para continuar.
            </p>

            <label
              htmlFor="senha-acesso"
              style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#344054', marginBottom: 7 }}
            >
              Senha de acesso
            </label>
            <input
              id="senha-acesso"
              type="password"
              value={senhaAcesso}
              onChange={(event) => {
                setSenhaAcesso(event.target.value)
                if (erroSenha) setErroSenha('')
              }}
              autoFocus
              autoComplete="off"
              placeholder="Digite a senha"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                height: 46,
                padding: '0 13px',
                borderRadius: 10,
                border: erroSenha ? '1px solid #e5484d' : '1px solid #d0d5dd',
                outline: 'none',
                fontSize: 15,
              }}
            />

            {erroSenha && (
              <div style={{ marginTop: 9, color: '#c62828', fontSize: 13 }}>
                {erroSenha}
              </div>
            )}

            <button
              type="submit"
              disabled={validandoSenha}
              style={{
                width: '100%',
                height: 46,
                marginTop: 18,
                border: 0,
                borderRadius: 10,
                background: validandoSenha ? '#7b97b4' : '#0b5aa5',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 15,
                cursor: validandoSenha ? 'wait' : 'pointer',
              }}
            >
              {validandoSenha ? 'Validando...' : 'Entrar'}
            </button>

            <div
              style={{
                marginTop: 22,
                paddingTop: 18,
                borderTop: '1px solid #eaecf0',
                fontSize: 12,
                lineHeight: 1.5,
                color: '#7b8493',
              }}
            >
              Protótipo operacional com acesso por senha. A autenticação individual será implantada na etapa de banco de dados.
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><Bus size={28} /></div>
          <div><strong>Reunidas</strong><span>Controle Operacional</span></div>
        </div>

        <nav>
          <button className={`nav-item ${pagina === 'painel' ? 'active' : ''}`} onClick={() => trocarPagina('painel')}><House size={19} /><span>Painel</span></button>
          <button className={`nav-item ${pagina === 'frota' ? 'active' : ''}`} onClick={() => trocarPagina('frota')}><Bus size={19} /><span>Frota</span></button>
          <button className={`nav-item ${pagina === 'consulta' ? 'active' : ''}`} onClick={() => trocarPagina('consulta')}><Search size={19} /><span>Consulta</span></button>
          <button className={`nav-item ${pagina === 'operacao' ? 'active' : ''}`} onClick={() => trocarPagina('operacao')}><ClipboardList size={19} /><span>Operação</span></button>
          <button className={`nav-item ${pagina === 'garagem' ? 'active' : ''}`} onClick={() => trocarPagina('garagem')}><Warehouse size={19} /><span>Retidos</span></button>
          <button className={`nav-item ${pagina === 'manutencao' ? 'active' : ''}`} onClick={() => trocarPagina('manutencao')}><Wrench size={19} /><span>Manutenção</span></button>
          <button className={`nav-item ${pagina === 'limpeza' ? 'active' : ''}`} onClick={() => trocarPagina('limpeza')}><CheckCircle2 size={19} /><span>Limpeza</span></button>
          <button className={`nav-item ${pagina === 'ocorrencias' ? 'active' : ''}`} onClick={() => trocarPagina('ocorrencias')}><TriangleAlert size={19} /><span>Ocorrências</span></button>
          <button className={`nav-item ${pagina === 'relatorios' ? 'active' : ''}`} onClick={() => trocarPagina('relatorios')}><ChartNoAxesColumn size={19} /><span>Relatórios</span></button>
          <button className={`nav-item ${pagina === 'usuarios' ? 'active' : ''}`} onClick={() => trocarPagina('usuarios')}><Users size={19} /><span>Usuários</span></button>
        </nav>

        <div className="sidebar-bottom">
          <button className={`nav-item ${pagina === 'configuracoes' ? 'active' : ''}`} onClick={() => trocarPagina('configuracoes')}><Settings size={19} /><span>Configurações</span></button>
          <button className="nav-item" onClick={sairDoSistema}><LogOut size={19} /><span>Sair</span></button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div><h1>Controle Operacional Reunidas</h1><p>Controle de tráfego, manutenção, retenções e disponibilidade</p></div>
          <div className="topbar-right">
            <div className="date-box"><Clock3 size={20} /><div><span>{agora.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</span><strong>{agora.toLocaleTimeString('pt-BR')}</strong></div></div>
            <div className="global-search"><Search size={18} /><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar prefixo, linha..." />{busca && <button className="clear-search" onClick={() => setBusca('')}><X size={16} /></button>}</div>
            <div className="user"><div className="avatar">O</div><div><strong>Oswald</strong><span>Operador</span></div></div>
          </div>
        </header>

        <section className="content">
          <div className="page-actions">
            <div>
              <h2>
                {pagina === 'painel' && 'Painel operacional'}
                {pagina === 'frota' && 'Veículos na garagem'}
                {pagina === 'consulta' && 'Consulta de veículo'}
                {pagina === 'operacao' && 'Operação'}
                {pagina === 'garagem' && 'Controle de retidos'}
                {pagina === 'manutencao' && 'Manutenção'}
                {pagina === 'limpeza' && 'Limpeza'}
                {pagina === 'ocorrencias' && 'Ocorrências'}
                {pagina === 'relatorios' && 'Relatórios'}
                {pagina === 'usuarios' && 'Usuários'}
                {pagina === 'configuracoes' && 'Configurações'}
              </h2>
              <p>
                {pagina === 'garagem'
                  ? 'Retidos gerais por local físico'
                  : pagina === 'consulta'
                    ? 'Histórico global do prefixo entre todas as bases'
                    : `Base atual: ${baseSelecionada} - ${nomeBase(baseSelecionada)}`}
              </p>
            </div>

            {pagina !== 'consulta' && renderSeletorBase()}

            {pagina === 'operacao' && <button className="new-movement" onClick={abrirMovimentacao}><Plus size={18} /> Registrar movimentação</button>}
            {paginaRetencao && <button className="new-movement" onClick={abrirNovaRetencao}><Plus size={18} /> Registrar retenção</button>}
          </div>

          {pagina === 'painel' && renderPainel()}
          {pagina === 'frota' && renderGaragemAtual()}
          {pagina === 'consulta' && renderConsultaVeiculo()}
          {pagina === 'operacao' && renderMovimentacoes()}
          {pagina === 'garagem' && renderRetencoes()}
          {pagina === 'manutencao' && renderManutencao()}
          {pagina === 'limpeza' && renderLimpeza()}
          {pagina === 'ocorrencias' && renderRetencoes()}
          {pagina === 'relatorios' && renderRelatorios()}
          {pagina === 'usuarios' && renderUsuarios()}
          {pagina === 'configuracoes' && renderConfiguracoes()}
        </section>

        <footer className="statusbar">
          <span className="online-dot"></span>
          <strong>Protótipo online</strong>
          <span>Base: {baseSelecionada} - {nomeBase(baseSelecionada)}</span>
          <span>Atualizado às {ultimaAtualizacao.toLocaleTimeString('pt-BR')}</span>
          <span>{veiculosNaGaragem.length} na garagem</span>
          <span>{veiculosEmManutencao.length} em manutenção</span>
          <span>{veiculosAguardandoLimpeza.length} aguardando limpeza</span>
          <span>{retidosAtivos.length} retido(s) geral</span>
          <span>Protótipo v2.3</span>
        </footer>
      </main>

      {modalMov && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div><h2>Registrar movimentação</h2><p>Registro em <strong>{baseSelecionada} - {nomeBase(baseSelecionada)}</strong></p></div>
              <button className="modal-close" onClick={() => setModalMov(false)}><X size={20} /></button>
            </div>

            <form className="movement-form" onSubmit={salvarMovimentacao}>
              <div className="form-grid">
                <div className="form-group full"><label>Base operacional</label><input readOnly value={`${baseSelecionada} - ${nomeBase(baseSelecionada)}`} /></div>
                <div className="form-group"><label>Movimentação *</label><select value={formMov.tipo} onChange={(e) => setFormMov({ ...formMov, tipo: e.target.value as TipoMovimentacao })}><option value="CHEGOU">CHEGOU</option><option value="SAIU">SAIU</option></select></div>
                <div className="form-group"><label>Prefixo *</label><input required autoFocus value={formMov.prefixo} onChange={(e) => setFormMov({ ...formMov, prefixo: e.target.value.replace(/\D/g, '') })} /></div>
                <div className="form-group"><label>Empresa *</label><select value={formMov.empresa} onChange={(e) => setFormMov({ ...formMov, empresa: e.target.value })}>{EMPRESAS.map((empresa) => <option key={empresa} value={empresa}>{empresa}</option>)}</select></div>

                {formMov.tipo === 'CHEGOU' ? (
                  <>
                    <div className="form-group"><label>Data entrada *</label><input required type="date" value={formMov.dataEntrada} onChange={(e) => setFormMov({ ...formMov, dataEntrada: e.target.value })} /></div>
                    <div className="form-group"><label>Hora entrada *</label><input required type="time" value={formMov.horaEntrada} onChange={(e) => setFormMov({ ...formMov, horaEntrada: e.target.value })} /></div>
                    <div className="form-group full"><label>Linha entrada</label><input value={formMov.linhaEntrada} onChange={(e) => setFormMov({ ...formMov, linhaEntrada: e.target.value })} placeholder="Ex.: SPO x ATA 07:30" /></div>
                    <div className="form-group full">
                      <label>Condição na chegada *</label>
                      <select
                        required
                        value={formMov.condicaoChegada}
                        onChange={(e) =>
                          setFormMov({
                            ...formMov,
                            condicaoChegada: e.target.value as CondicaoChegada,
                            motivo: e.target.value === 'NADA_CONSTA' ? '' : formMov.motivo,
                          })
                        }
                      >
                        <option value="">Selecione...</option>
                        <option value="NADA_CONSTA">NADA CONSTA</option>
                        <option value="COM_AVARIA">COM AVARIA / PROBLEMA</option>
                      </select>
                    </div>

                    {formMov.condicaoChegada === 'COM_AVARIA' && (
                      <div className="form-group full">
                        <label>Descreva a avaria / problema encontrado *</label>
                        <textarea
                          required
                          rows={3}
                          value={formMov.motivo}
                          onChange={(e) => setFormMov({ ...formMov, motivo: e.target.value })}
                          placeholder="Ex.: Ar-condicionado fazendo barulho na parte traseira"
                        />
                      </div>
                    )}

                    {formMov.condicaoChegada === 'NADA_CONSTA' && (
                      <div className="form-group full">
                        <input readOnly value="LIBERAÇÃO MANUT.: LIBERADO automaticamente" />
                      </div>
                    )}

                    {formMov.condicaoChegada === 'COM_AVARIA' && (
                      <div className="form-group full">
                        <input readOnly value="LIBERAÇÃO MANUT.: EM MANUT. automaticamente" />
                      </div>
                    )}

                    <div className="form-group full">
                      <input readOnly value="LIBERAÇÃO LIMPEZA: LIMPAR automaticamente" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group"><label>Data saída *</label><input required type="date" value={formMov.dataSaida} onChange={(e) => setFormMov({ ...formMov, dataSaida: e.target.value })} /></div>
                    <div className="form-group"><label>Hora manobra</label><input type="time" value={formMov.horaManobra} onChange={(e) => setFormMov({ ...formMov, horaManobra: e.target.value })} /></div>
                    <div className="form-group"><label>Hora saída *</label><input required type="time" value={formMov.horaSaida} onChange={(e) => setFormMov({ ...formMov, horaSaida: e.target.value })} /></div>
                    <div className="form-group full"><label>Linha saída</label><input value={formMov.linhaSaida} onChange={(e) => setFormMov({ ...formMov, linhaSaida: e.target.value })} placeholder="Ex.: ATA x SPO 09:30" /></div>
                  </>
                )}
              </div>

              <div className="modal-footer"><button type="button" className="cancel-button" onClick={() => setModalMov(false)}>Cancelar</button><button className="save-button" type="submit"><Save size={17} /> Salvar movimentação</button></div>
            </form>
          </div>
        </div>
      )}

      {modalRet && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div><h2>{editandoRetencaoId ? 'Editar retenção' : 'Registrar retenção'}</h2><p>Base do registro: <strong>{baseSelecionada} - {nomeBase(baseSelecionada)}</strong></p></div>
              <button className="modal-close" onClick={fecharModalRetencao}><X size={20} /></button>
            </div>

            <form className="movement-form" onSubmit={salvarRetencao}>
              <div className="form-grid">
                <div className="form-group"><label>Prefixo *</label><input required autoFocus value={formRet.prefixo} onChange={(e) => setFormRet({ ...formRet, prefixo: e.target.value.replace(/\D/g, '') })} /></div>
                <div className="form-group"><label>Empresa *</label><select value={formRet.empresa} onChange={(e) => setFormRet({ ...formRet, empresa: e.target.value })}>{EMPRESAS.map((empresa) => <option key={empresa} value={empresa}>{empresa}</option>)}</select></div>
                <div className="form-group"><label>Local físico do veículo *</label><select value={formRet.local} onChange={(e) => setFormRet({ ...formRet, local: e.target.value as Local })}>{BASES_OPERACIONAIS.map((base) => <option key={base.codigo} value={base.codigo}>{base.codigo} - {base.nome}</option>)}</select></div>
                <div className="form-group"><label>Data entrada *</label><input required type="date" value={formRet.dataEntrada} onChange={(e) => setFormRet({ ...formRet, dataEntrada: e.target.value })} /></div>
                <div className="form-group"><label>Hora entrada</label><input type="time" value={formRet.horaEntrada} onChange={(e) => setFormRet({ ...formRet, horaEntrada: e.target.value })} /></div>
                <div className="form-group"><label>Previsão saída</label><input type="date" value={formRet.previsaoSaida} onChange={(e) => setFormRet({ ...formRet, previsaoSaida: e.target.value })} /></div>
                <div className="form-group full"><label>Linha entrada</label><input value={formRet.linhaEntrada} onChange={(e) => setFormRet({ ...formRet, linhaEntrada: e.target.value })} /></div>
                <div className="form-group full"><label>Motivo *</label><textarea required rows={3} value={formRet.motivo} onChange={(e) => setFormRet({ ...formRet, motivo: e.target.value })} placeholder="Ex.: Motor, alternador, câmbio..." /></div>
              </div>

              <div className="modal-footer"><button type="button" className="cancel-button" onClick={fecharModalRetencao}>Cancelar</button><button className="save-button" type="submit">{editandoRetencaoId ? <><Pencil size={17} /> Salvar alterações</> : <><Save size={17} /> Registrar retenção</>}</button></div>
            </form>
          </div>
        </div>
      )}

      {modalNovaAvaria && alvoNovaAvaria && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>Registrar nova avaria</h2>
                <p>
                  Prefixo <strong>{alvoNovaAvaria.prefixo}</strong> | {' '}
                  {alvoNovaAvaria.empresa} | Base {alvoNovaAvaria.baseOperacional}
                </p>
              </div>
              <button className="modal-close" onClick={fecharNovaAvaria}>
                <X size={20} />
              </button>
            </div>

            <form className="movement-form" onSubmit={salvarNovaAvaria}>
              <div className="form-grid">
                <div className="form-group full">
                  <label>Situação registrada na chegada</label>
                  <input readOnly value={alvoNovaAvaria.motivo} />
                </div>

                <div className="form-group full">
                  <label>Descreva a nova avaria / problema encontrado *</label>
                  <textarea
                    required
                    autoFocus
                    rows={4}
                    value={formNovaAvaria.problema}
                    onChange={(e) =>
                      setFormNovaAvaria({ problema: e.target.value })
                    }
                    placeholder="Ex.: Ar-condicionado começou a fazer barulho após a chegada do veículo."
                  />
                </div>

                <div className="form-group">
                  <label>Data do registro</label>
                  <input readOnly value={hoje} />
                </div>

                <div className="form-group">
                  <label>Hora</label>
                  <input
                    readOnly
                    value={agora.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="cancel-button" onClick={fecharNovaAvaria}>
                  Cancelar
                </button>
                <button className="save-button" type="submit">
                  <Wrench size={17} /> Abrir atendimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalFinalizacao && alvoFinalizacao && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>Finalizar atendimento da manutenção</h2>
                <p>
                  Prefixo <strong>{alvoFinalizacao.origem === 'CHEGADA' ? alvoFinalizacao.movimentacao.prefixo : alvoFinalizacao.retencao.prefixo}</strong>
                  {' '}| Origem: <strong>{alvoFinalizacao.origem === 'CHEGADA' ? 'Avaria na chegada' : 'Retenção'}</strong>
                </p>
              </div>
              <button className="modal-close" onClick={fecharFinalizacao}><X size={20} /></button>
            </div>

            <form className="movement-form" onSubmit={salvarFinalizacao}>
              <div className="form-grid">
                <div className="form-group full">
                  <label>Problema relatado</label>
                  <textarea
                    readOnly
                    rows={3}
                    value={
                      alvoFinalizacao.origem === 'CHEGADA'
                        ? alvoFinalizacao.movimentacao.problemaManutencao !== '-'
                          ? alvoFinalizacao.movimentacao.problemaManutencao
                          : alvoFinalizacao.movimentacao.motivo
                        : alvoFinalizacao.retencao.motivo
                    }
                  />
                </div>

                <div className="form-group full">
                  <label>Serviço realizado / O que foi feito no veículo *</label>
                  <textarea
                    required
                    autoFocus
                    rows={4}
                    value={formFinalizacao.servicoRealizado}
                    onChange={(e) => setFormFinalizacao({ ...formFinalizacao, servicoRealizado: e.target.value })}
                    placeholder="Ex.: Realizado reaperto do suporte do compressor, inspeção e teste do ar-condicionado. Ruído eliminado."
                  />
                </div>

                <div className="form-group">
                  <label>Responsável pelo serviço *</label>
                  <input
                    required
                    value={formFinalizacao.responsavel}
                    onChange={(e) => setFormFinalizacao({ ...formFinalizacao, responsavel: e.target.value })}
                    placeholder="Nome do mecânico / responsável"
                  />
                </div>

                <div className="form-group">
                  <label>CIF / matrícula</label>
                  <input
                    inputMode="numeric"
                    value={formFinalizacao.cifResponsavel}
                    onChange={(e) =>
                      setFormFinalizacao({
                        ...formFinalizacao,
                        cifResponsavel: e.target.value.replace(/\D/g, ''),
                      })
                    }
                    placeholder="Ex.: 17697"
                  />
                </div>

                <div className="form-group">
                  <label>Data da finalização</label>
                  <input readOnly value={hoje} />
                </div>

                <div className="form-group">
                  <label>Hora</label>
                  <input readOnly value={agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="cancel-button" onClick={fecharFinalizacao}>Cancelar</button>
                <button className="save-button" type="submit"><CheckCircle2 size={17} /> Salvar serviço e liberar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalLimpeza && alvoLimpeza && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>Finalizar limpeza</h2>
                <p>
                  Prefixo <strong>{alvoLimpeza.prefixo}</strong> | {alvoLimpeza.empresa} | Base {alvoLimpeza.baseOperacional}
                </p>
              </div>
              <button className="modal-close" onClick={fecharFinalizacaoLimpeza}><X size={20} /></button>
            </div>

            <form className="movement-form" onSubmit={salvarFinalizacaoLimpeza}>
              <div className="form-grid">
                <div className="form-group full">
                  <label>Veículo / chegada</label>
                  <input readOnly value={`${alvoLimpeza.prefixo} — ${alvoLimpeza.dataEntrada} ${alvoLimpeza.horaEntrada} — ${alvoLimpeza.linhaEntrada}`} />
                </div>
                <div className="form-group">
                  <label>Responsável pela limpeza *</label>
                  <input
                    required
                    autoFocus
                    value={formLimpeza.responsavel}
                    onChange={(e) => setFormLimpeza({ ...formLimpeza, responsavel: e.target.value })}
                    placeholder="Nome do responsável"
                  />
                </div>
                <div className="form-group">
                  <label>CIF / matrícula</label>
                  <input
                    inputMode="numeric"
                    value={formLimpeza.cifResponsavel}
                    onChange={(e) =>
                      setFormLimpeza({
                        ...formLimpeza,
                        cifResponsavel: e.target.value.replace(/\D/g, ''),
                      })
                    }
                    placeholder="Ex.: 17697"
                  />
                </div>
                <div className="form-group">
                  <label>Data</label>
                  <input readOnly value={hoje} />
                </div>
                <div className="form-group">
                  <label>Hora</label>
                  <input readOnly value={agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="cancel-button" onClick={fecharFinalizacaoLimpeza}>Cancelar</button>
                <button className="save-button" type="submit"><CheckCircle2 size={17} /> Marcar LIMPO</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {avisoRetido && movPendente && (
        <div className="modal-overlay">
          <div className="warning-modal">
            <div className="warning-icon"><ShieldAlert size={34} /></div>
            <h2>Veículo com retenção ativa</h2>
            <p>O prefixo <strong>{avisoRetido.prefixo}</strong> ainda consta como <strong>RETIDO</strong>.</p>
            <div className="warning-info">
              <div><span>Base da retenção</span><strong>{avisoRetido.baseOperacional} - {nomeBase(avisoRetido.baseOperacional)}</strong></div>
              <div><span>Local físico</span><strong>{avisoRetido.local} - {localNome(avisoRetido.local)}</strong></div>
              <div><span>Motivo</span><strong>{avisoRetido.motivo}</strong></div>
              <div><span>Dias retido</span><strong>{diasRetido(avisoRetido)} dias</strong></div>
            </div>
            <div className="modal-footer"><button className="cancel-button" onClick={() => { setAvisoRetido(null); setMovPendente(null) }}>Cancelar</button><button className="save-button" onClick={() => abrirFinalizacaoRetencao(avisoRetido, movPendente)}><CheckCircle2 size={17} /> Registrar serviço e liberar</button></div>
          </div>
        </div>
      )}

      {avisoOperacao && (
        <div className="modal-overlay">
          <div className="warning-modal">
            <div className="warning-icon"><CircleAlert size={34} /></div>

            {avisoOperacao.tipo === 'DUPLICIDADE_CHEGADA' && <><h2>Veículo já consta como CHEGOU nesta base</h2><p>O prefixo <strong>{avisoOperacao.nova.prefixo}</strong> já possui uma chegada ativa em <strong>{baseSelecionada}</strong>.</p><div className="modal-footer"><button className="save-button" onClick={() => setAvisoOperacao(null)}>Entendi</button></div></>}

            {avisoOperacao.tipo === 'DUPLICIDADE_SAIDA' && <><h2>Veículo já consta como SAIU desta base</h2><p>Para registrar outra saída em <strong>{baseSelecionada}</strong>, primeiro deve existir uma nova chegada.</p><div className="modal-footer"><button className="save-button" onClick={() => setAvisoOperacao(null)}>Entendi</button></div></>}

            {avisoOperacao.tipo === 'SEM_CHEGADA' && <><h2>Chegada não localizada nesta base</h2><p>Não foi encontrada chegada anterior do prefixo <strong>{avisoOperacao.nova.prefixo}</strong> em <strong>{baseSelecionada} - {nomeBase(baseSelecionada)}</strong>.</p><div className="modal-footer"><button className="cancel-button" onClick={() => setAvisoOperacao(null)}>Voltar e conferir</button><button className="save-button" onClick={() => validarRetencaoOuConcluir(avisoOperacao.nova)}>Registrar saída mesmo assim</button></div></>}

            {avisoOperacao.tipo === 'VEICULO_EM_OUTRA_BASE' && avisoOperacao.outraBase && (
              <>
                <h2>Veículo consta em outra base</h2>
                <p>
                  O prefixo <strong>{avisoOperacao.nova.prefixo}</strong> ainda consta como
                  presente na garagem de <strong>{avisoOperacao.outraBase.baseOperacional} - {nomeBase(avisoOperacao.outraBase.baseOperacional)}</strong>.
                </p>
                <div className="warning-info">
                  <div><span>Base onde consta</span><strong>{avisoOperacao.outraBase.baseOperacional} - {nomeBase(avisoOperacao.outraBase.baseOperacional)}</strong></div>
                  <div><span>Última chegada</span><strong>{avisoOperacao.outraBase.dataEntrada} às {avisoOperacao.outraBase.horaEntrada}</strong></div>
                  <div><span>Linha</span><strong>{avisoOperacao.outraBase.linhaEntrada}</strong></div>
                  <div><span>Registro pretendido</span><strong>{avisoOperacao.nova.tipo} em {baseSelecionada}</strong></div>
                </div>
                <p>
                  Regularize primeiro a saída na base anterior. O sistema não cria essa saída automaticamente porque linha, data e horário precisam refletir o que realmente aconteceu.
                </p>
                <div className="modal-footer">
                  <button className="cancel-button" onClick={() => setAvisoOperacao(null)}>Cancelar</button>
                  <button
                    className="save-button"
                    onClick={() => {
                      const baseAnterior = avisoOperacao.outraBase?.baseOperacional
                      setAvisoOperacao(null)
                      setModalMov(false)
                      if (baseAnterior) trocarBase(baseAnterior)
                      setPagina('frota')
                    }}
                  >
                    <Warehouse size={17} /> Ir para a base anterior
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
