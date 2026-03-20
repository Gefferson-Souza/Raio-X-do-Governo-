# Plano: Mapa Orcamentario Interativo do Brasil

## Task Type
- [x] Fullstack (Backend: SICONFI + IBGE APIs + cron | Frontend: mapa interativo + filtros)

## Resumo

Mapa interativo do Brasil mostrando arrecadacao e gastos por estado/cidade/regiao, com filtro funcional (saude, educacao, seguranca, etc). Tudo pre-processado via cron — zero queries no client.

## Viabilidade: CONFIRMADA

| Dado | API | Auth | Verificado |
|------|-----|------|-----------|
| Receitas e despesas por estado/cidade | **SICONFI** (Tesouro Nacional) | Nenhuma | Sim — 2.084 items para SP |
| Despesas por funcao (saude, educacao...) | **SICONFI RREO-Anexo 02** | Nenhuma | Sim — 18 funcoes orcamentarias |
| Receitas por fonte (ICMS, IPVA, FPE...) | **SICONFI RREO-Anexo 03** | Nenhuma | Sim — 244 linhas |
| Mapa GeoJSON estados | **IBGE Malhas API v3** | Nenhuma | Sim — 27 poligonos |
| Mapa GeoJSON municipios | **IBGE Malhas API v3** | Nenhuma | Sim — 645 para SP |
| Populacao por estado/cidade | **IBGE SIDRA** | Nenhuma | Sim |
| Transferencias federais | **Portal Transparencia** | API key (ja temos) | Sim |

---

## Complexidade por nivel

| Nivel | Complexidade | Justificativa |
|-------|-------------|---------------|
| Mapa por estado (27 UFs) | **MEDIA** | 27 entidades, GeoJSON leve (~100KB), SICONFI retorna tudo em 27 requests |
| Filtro por regiao | **BAIXA** | Agrupar estados por regiao (mapeamento estatico) |
| Filtro por funcao (saude/educacao) | **MEDIA** | SICONFI RREO-Anexo 02 ja tem o breakdown pronto |
| Drill-down por cidade | **ALTA** | 5.570 municipios, GeoJSON pesado, precisa lazy-load por estado |
| Per capita | **BAIXA** | IBGE SIDRA + divisao simples |

---

## Arquitetura

```
Vercel Cron (1x/semana)
    |
    v
/api/cron/mapa
    |-- SICONFI: RREO-Anexo01 (receita vs despesa) x 27 estados
    |-- SICONFI: RREO-Anexo02 (despesa por funcao) x 27 estados
    |-- SICONFI: RREO-Anexo03 (receita por fonte) x 27 estados
    |-- IBGE: populacao por estado
    |
    v
Redis: "mapa-data" (JSON pre-processado, TTL 7 dias)
    |
    v
/api/mapa (leitura simples — Redis.get)
    |
    v
/mapa (pagina com react-simple-maps)
    |-- GeoJSON dos estados (IBGE, cached no build)
    |-- Dados do Redis (receita, despesa, per capita, funcoes)
    |-- Filtros: regiao, funcao, per capita toggle
```

**Zero queries no client.** O cron busca, processa e salva. O frontend so le.

---

## Fase 1: Backend — APIs e Cron

### 1.1 SICONFI API Client

**Base URL**: `https://apidatalake.tesouro.gov.br/ords/siconfi/tt/`
**Auth**: Nenhuma | **Rate limit**: Nao documentado (ser conservador)

| Arquivo | Operacao | Descricao |
|---------|----------|-----------|
| `src/lib/api/siconfi-types.ts` | NOVO | Types: `EnteSiconfi`, `RREOItem`, `DCAItem`, `MapaEstadoData` |
| `src/lib/api/siconfi.ts` | NOVO | Client: `fetchEntes()`, `fetchRREO(idEnte, ano, anexo)`, `fetchDCA(idEnte, ano, anexo)` |

Endpoints:
- `GET /entes` — lista todas entidades (estados + municipios) com codigo IBGE
- `GET /rreo?an_exercicio=2025&nr_periodo=6&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo 01&id_ente=35` — receita vs despesa de SP
- `GET /rreo?...&no_anexo=RREO-Anexo 02&id_ente=35` — despesa por funcao de SP
- `GET /rreo?...&no_anexo=RREO-Anexo 03&id_ente=35` — receita por fonte de SP

### 1.2 IBGE Population Client

| Arquivo | Operacao | Descricao |
|---------|----------|-----------|
| `src/lib/api/ibge.ts` | NOVO | `fetchPopulacaoEstados()`, `fetchPopulacaoMunicipios(uf)` |

Endpoint:
- SIDRA: `https://apisidra.ibge.gov.br/values/t/6579/n3/all/v/9324/p/last 1`

### 1.3 Cron Route

| Arquivo | Operacao | Descricao |
|---------|----------|-----------|
| `src/app/api/cron/mapa/route.ts` | NOVO | Cron semanal — busca SICONFI + IBGE, processa, salva no Redis |

O cron faz:
1. Para cada um dos 27 estados:
   - Busca RREO-Anexo 01 (totais receita/despesa)
   - Busca RREO-Anexo 02 (despesa por funcao)
   - Busca RREO-Anexo 03 (receita por fonte)
2. Busca populacao de todos os estados (1 request)
3. Calcula per capita
4. Agrega por regiao (Norte, Nordeste, etc)
5. Salva JSON pronto no Redis

Total: ~81 requests (27 estados × 3 anexos) + 1 populacao = 82 requests
Com delay de 500ms entre cada: ~41 segundos

### 1.4 Service Layer

| Arquivo | Operacao | Descricao |
|---------|----------|-----------|
| `src/lib/services/mapa-service.ts` | NOVO | `getMapaData()` — Redis.get("mapa-data") |

### 1.5 API Route (leitura)

| Arquivo | Operacao | Descricao |
|---------|----------|-----------|
| `src/app/api/mapa/route.ts` | NOVO | GET — retorna JSON do Redis com cache headers |

---

## Fase 2: Frontend — Mapa Interativo

### 2.1 Dependencias

```bash
npm install react-simple-maps d3-geo
# OU para React 19:
npm install react19-simple-maps
```

### 2.2 GeoJSON dos estados

| Arquivo | Operacao | Descricao |
|---------|----------|-----------|
| `public/geo/br-states.json` | NOVO | GeoJSON dos 27 estados (da IBGE Malhas API, cached no build) |

Source: `https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?intrarregiao=UF&formato=application/vnd.geo+json&qualidade=minima`

### 2.3 Pagina do Mapa

| Arquivo | Operacao | Descricao |
|---------|----------|-----------|
| `src/app/mapa/page.tsx` | NOVO | Server Component — busca dados do Redis |
| `src/app/mapa/_components/mapa-brasil.tsx` | NOVO | Client Component — mapa interativo com react-simple-maps |
| `src/app/mapa/_components/mapa-filtros.tsx` | NOVO | Client Component — filtros (regiao, funcao, per capita) |
| `src/app/mapa/_components/mapa-tooltip.tsx` | NOVO | Client Component — tooltip com dados ao hover |
| `src/app/mapa/_components/mapa-sidebar.tsx` | NOVO | Client Component — painel lateral com detalhes do estado selecionado |

### 2.4 Interacoes do mapa

1. **Hover em estado**: tooltip com nome, receita total, despesa total, populacao
2. **Click em estado**: sidebar abre com breakdown funcional (barras horizontais)
3. **Filtro por regiao**: highlight Norte/Nordeste/Sul/Sudeste/Centro-Oeste
4. **Filtro por funcao**: cores do mapa mudam para mostrar gasto em saude/educacao/seguranca
5. **Toggle per capita**: valores absolutos vs por habitante
6. **Escala de cor**: verde (superavit) a vermelho (deficit) ou gradient por valor

### 2.5 Navegacao

| Arquivo | Operacao | Descricao |
|---------|----------|-----------|
| `src/components/layout/top-nav.tsx` | Modificar | Adicionar "MAPA" |
| `src/components/layout/side-nav.tsx` | Modificar | Adicionar "Mapa" |

---

## Fase 3: Drill-down por Cidade (FUTURA)

**Complexidade alta** — 5.570 municipios com GeoJSON pesado.

Abordagem: lazy-load por estado.
1. Click em estado no mapa → carrega GeoJSON dos municipios daquele estado
2. Cron separado busca dados SICONFI por municipio (5.570 requests — precisa chunking)
3. Redis armazena dados por UF: `mapa-municipios-SP`, `mapa-municipios-RJ`, etc

Isso e uma feature futura — o mapa por estado ja entrega 90% do valor.

---

## Tipo de dados processados pelo cron

```typescript
interface MapaData {
  estados: MapaEstadoData[]
  regioes: MapaRegiaoData[]
  atualizadoEm: string
  anoReferencia: number
}

interface MapaEstadoData {
  codigoIBGE: number        // 35 para SP
  sigla: string             // "SP"
  nome: string              // "Sao Paulo"
  regiao: string            // "Sudeste"
  populacao: number

  // Totais
  receitaTotal: number
  despesaTotal: number
  saldoOrcamentario: number // receita - despesa

  // Per capita
  receitaPerCapita: number
  despesaPerCapita: number

  // Despesa por funcao (RREO-Anexo 02)
  despesaPorFuncao: {
    legislativa: number
    judiciaria: number
    administracao: number
    segurancaPublica: number
    assistenciaSocial: number
    saude: number
    educacao: number
    cultura: number
    urbanismo: number
    saneamento: number
    transporte: number
    outros: number
  }

  // Receita por fonte (RREO-Anexo 03)
  receitaPorFonte: {
    icms: number
    ipva: number
    irrf: number
    fpe: number
    fundeb: number
    taxas: number
    outros: number
  }
}

interface MapaRegiaoData {
  nome: string              // "Sudeste"
  estados: string[]         // ["SP", "RJ", "MG", "ES"]
  receitaTotal: number
  despesaTotal: number
  populacao: number
  receitaPerCapita: number
  despesaPerCapita: number
}
```

---

## Riscos e Mitigacoes

| Risco | Mitigacao |
|-------|----------|
| SICONFI lenta ou fora do ar | Cache de 7 dias no Redis — dados ficam disponiveis mesmo com API offline |
| GeoJSON pesado para 5.570 municipios | Fase 1: so estados (100KB). Fase 3: lazy-load por UF |
| RREO pode nao ter dados do ano corrente | Fallback para ano anterior (RREO publica bimestralmente) |
| react-simple-maps incompativel com React 19 | Usar react19-simple-maps (fork mantido) |
| 81 requests no cron podem levar tempo | ~41s com delay de 500ms — dentro do maxDuration=300s |

---

## Vercel Cron

```json
{
  "crons": [
    { "path": "/api/cron/politicians", "schedule": "0 6 * * *" },
    { "path": "/api/cron/mapa", "schedule": "0 7 * * 1" }
  ]
}
```

Mapa: segunda-feira as 7h (semanal — dados orcamentarios mudam bimestralmente).

---

## Key Files

| File | Operation | Description |
|------|-----------|-------------|
| `src/lib/api/siconfi-types.ts` | New | SICONFI types |
| `src/lib/api/siconfi.ts` | New | SICONFI API client |
| `src/lib/api/ibge.ts` | New | IBGE population + malhas |
| `src/app/api/cron/mapa/route.ts` | New | Cron semanal |
| `src/lib/services/mapa-service.ts` | New | Redis read |
| `src/app/api/mapa/route.ts` | New | Read-only API |
| `src/app/mapa/page.tsx` | New | Map page |
| `src/app/mapa/_components/mapa-brasil.tsx` | New | Interactive map |
| `src/app/mapa/_components/mapa-filtros.tsx` | New | Filters |
| `src/app/mapa/_components/mapa-tooltip.tsx` | New | Hover tooltip |
| `src/app/mapa/_components/mapa-sidebar.tsx` | New | Detail sidebar |
| `public/geo/br-states.json` | New | Cached GeoJSON |
| `vercel.json` | Modify | Add mapa cron |
| `package.json` | Modify | Add react-simple-maps |
