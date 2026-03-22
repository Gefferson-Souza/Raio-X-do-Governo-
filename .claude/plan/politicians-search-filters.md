# Plano: Busca, Filtros e Perfil Individual de Politicos

## Task Type
- [x] Backend (NestJS endpoints com paginacao, filtros, busca)
- [x] Frontend (UI de filtros, busca, paginacao, card de compartilhamento)
- [x] Design (Stitch MCP para mockups)
- [x] Fullstack

---

## Visao Geral

Transformar a pagina `/politicos` de uma lista estatica de 20 deputados em uma ferramenta de busca completa que permite ao cidadao brasileiro encontrar qualquer politico, ver seus gastos detalhados por periodo, e compartilhar os dados nas redes sociais.

---

## Disponibilidade de Dados por Periodo

| API | Filtro por Ano | Filtro por Mes | Busca por Nome | Filtro por Partido | Filtro por UF |
|-----|---------------|----------------|----------------|-------------------|---------------|
| Camara (deputados) | SIM (`ano`) | SIM (`mes`) | SIM (`nome`) | SIM (`siglaPartido`) | SIM (`siglaUf`) |
| Senado (Codante) | SIM (`year`) | NAO | NAO (client-side) | NAO (client-side) | NAO (client-side) |

**Conclusao**: A Camara tem filtros completos server-side. O Senado precisara de filtros client-side sobre os dados ja sincronizados no banco.

---

## Fase 0 — Design (Stitch MCP)

Criar mockups via Stitch para 3 telas:

### Tela 1: Hub de Politicos (`/politicos`) — MOBILE-FIRST

**Mobile (375px) — layout padrao:**
```
┌──────────────────────────────┐
│ RAIO-X DOS POLITICOS         │
│ DADOS ABERTOS — CAMARA +     │
│ SENADO FEDERAL               │
│                              │
│ [Buscar por nome...       ]  │
│                              │
│ [TODOS] [CAMARA] [SENADO]    │
│ [2026] [2025] [2024]         │
│ [Filtros (partido, UF...)]   │ ← abre drawer/modal
│                              │
│ 718 deputados + 81 senadores │
│ Ordenar: [Maior gasto v]     │
│                              │
│ ┌────────────────────────┐   │
│ │ 1. EUNICIO OLIVEIRA    │   │
│ │    MDB-CE | Deputado   │   │
│ │    R$ 140.213 em 2026  │   │
│ │    Fonte: Camara       │   │
│ │    [VER DETALHES ->]   │   │
│ ├────────────────────────┤   │
│ │ 2. NOME (PT-SP)        │   │
│ │    R$ 130.000 em 2026  │   │
│ │    Fonte: Camara       │   │
│ │    [VER DETALHES ->]   │   │
│ └────────────────────────┘   │
│                              │
│ [< Anterior] 1/36 [Prox >]  │
│                              │
│ Fonte: Camara dos Deputados  │
│ + Senado Federal             │
│ Periodo: Jan-Mar 2026       │
└──────────────────────────────┘
```

**Desktop (1280px)**: Filtros de partido e UF ficam inline como chips.
Em mobile: botao "Filtros" abre drawer com partido, UF, ordenacao expandidos.

**Regra 4**: Todo card mostra "Fonte: Camara" ou "Fonte: Senado" + periodo.
**Regra 5**: Layout mobile-first, filtros colapsados em drawer.

### Tela 2: Perfil Individual (`/politicos/deputados/:id` ou `/politicos/senadores/:id`)

**Regra 1**: Secoes SEM dados reais NAO sao renderizadas.
- `byMonth` so aparece para deputados (Camara tem mes, Senado nao)
- Se `byType` estiver vazio, secao nao renderiza
- Comparacoes so aparecem se dados de media estiverem disponiveis

**Regra 4**: Fonte e periodo obrigatorios em TODA secao de dados.

**SEO**: `generateMetadata()` com titulo "Gastos de [Nome] ([Partido]-[UF]) — Raio-X do Governo"

```
┌──────────────────────────────┐
│ <- VOLTAR PARA LISTA         │
│                              │
│ [FOTO] EUNICIO OLIVEIRA      │
│        MDB-CE | Deputado     │
│        Legislatura 57        │
│                              │
│ R$ 140.213 EM 2026           │
│ Periodo: [2026 v] [Jan-Dez]  │
│                              │
│ -- GASTOS POR TIPO --        │
│ (renderiza SO se dados >0)   │
│ Passagens   ======== 45.000  │
│ Gabinete    =====    35.000  │
│ Telefonia   ====     28.000  │
│                              │
│ -- GASTOS POR MES --         │
│ (SO para deputados — Senado  │
│  nao tem dados mensais)      │
│ Jan ====== 15.200            │
│ Fev ====   12.100            │
│ Mar ========== 25.000        │
│                              │
│ -- COMPARAR COM --           │
│ (SO se medias disponiveis)   │
│ Media MDB: R$ 95.000        │
│ Media CE: R$ 88.000         │
│ Media geral: R$ 75.000      │
│                              │
│ [COMPARTILHAR] [GERAR CARD]  │
│                              │
│ Fonte: Camara dos Deputados  │
│ Periodo: Jan-Mar 2026       │
│ Atualizado: 22/03/2026      │
└──────────────────────────────┘
```

### Tela 3: Card de Compartilhamento (1200x630)
```
┌─────────────────────────────────────────────────┐
│ RAIO-X DO GOVERNO                               │
│                                                 │
│ [FOTO]  EUNICIO OLIVEIRA                        │
│         Deputado | MDB-CE                       │
│                                                 │
│         R$ 140.213                              │
│         GASTOS EM 2026                          │
│                                                 │
│ = 86 salarios minimos                           │
│ = 206 cestas basicas                            │
│                                                 │
│ raioxdogoverno.com/politicos/deputados/220624   │
└─────────────────────────────────────────────────┘
```

---

## Fase 1 — Backend: Endpoints com Filtros e Paginacao

### Validacao de input (Zod + class-validator)

Toda entrada externa DEVE ser validada conforme Regra 7 do CLAUDE.md.

```typescript
// DTO com class-validator (NestJS)
class SearchPoliticiansDto {
  @IsOptional() @IsString() @MaxLength(100)
  q?: string

  @IsOptional() @IsIn(['camara', 'senado', 'all'])
  house?: string = 'all'

  @IsOptional() @IsString()
  party?: string   // CSV: "MDB,PT,PL"

  @IsOptional() @IsString()
  state?: string   // CSV: "CE,SP"

  @IsOptional() @IsInt() @Min(2000) @Max(2100)
  @Type(() => Number)
  year?: number

  @IsOptional() @IsIn(['spending_desc', 'spending_asc', 'name_asc', 'name_desc'])
  sort?: string = 'spending_desc'

  @IsOptional() @IsInt() @Min(1)
  @Type(() => Number)
  page?: number = 1

  @IsOptional() @IsInt() @Min(1) @Max(50)
  @Type(() => Number)
  limit?: number = 20
}
```

### Novos endpoints NestJS

```
GET /api/v1/politicians/search
  ?q=eunicio                     ← busca por nome (case-insensitive, max 100 chars)
  &house=camara|senado|all       ← filtro por casa (validado via @IsIn)
  &party=MDB,PT,PL              ← filtro por partido (multiplos, CSV)
  &state=CE,SP                  ← filtro por UF (multiplos, CSV)
  &year=2026                    ← ano dos gastos (validado: 2000-2100)
  &sort=spending_desc|spending_asc|name_asc|name_desc
  &page=1                       ← paginacao (min: 1)
  &limit=20                     ← itens por pagina (min: 1, max: 50, default: 20)

  Response: {
    data: PoliticianListItem[],
    pagination: { page, limit, total, totalPages },
    filters: { parties: string[], states: string[], years: number[] },
    meta: { atualizadoEm, source, fonte: 'Camara dos Deputados + Senado Federal' }
  }

GET /api/v1/politicians/deputies/:id
  ?year=2026
  Response: {
    profile: { id, nome, partido, uf, foto, email, legislatura },
    spending: {
      total: number,
      byType: { tipo, total }[],           ← breakdown por tipo de despesa
      byMonth: { mes, total }[],           ← breakdown mensal
      byYear: { ano, total }[],            ← historico por ano
    },
    comparisons: {
      partyAverage: number,
      stateAverage: number,
      overallAverage: number,
    },
    equivalences: Equivalences,
    periodo: { ano, mesInicio, mesFim },
    atualizadoEm: string,
  }

GET /api/v1/politicians/senators/:id
  ?year=2026
  Response: (mesma estrutura, sem byMonth — API do Senado nao tem)

GET /api/v1/politicians/filters
  Response: {
    parties: { sigla: string, count: number }[],
    states: { uf: string, count: number }[],
    years: number[],
    houses: { house: string, count: number }[],
  }
```

### Mudancas no Prisma Schema

O schema atual salva tudo como JSONB em `PoliticiansSnapshot`. Para suportar busca e filtros, precisamos de tabelas normalizadas:

```prisma
model Politician {
  externalId Int      // ID da API (Camara ou Codante)
  house      String   // 'camara' | 'senado'
  nome       String
  partido    String
  uf         String
  foto       String   @default("")
  email      String?
  active     Boolean  @default(true)
  updatedAt  DateTime @default(now())

  expenses   PoliticianExpense[]

  @@id([externalId, house])  // Chave composta: evita colisao entre deputado 123 e senador 123
  @@index([partido])
  @@index([uf])
  @@index([nome])
  @@map("politicians")
}

model PoliticianExpense {
  id              String   @id @default(uuid())
  politicianExtId Int
  politicianHouse String
  politician      Politician @relation(fields: [politicianExtId, politicianHouse], references: [externalId, house])
  ano             Int
  mes             Int?      // null para senadores (API nao tem mes)
  tipoDespesa     String?
  valor           Decimal  @db.Decimal(14, 2)
  syncJobId       String?
  createdAt       DateTime @default(now())

  @@index([politicianExtId, politicianHouse, ano])
  @@index([ano, mes])
  @@index([tipoDespesa])
  @@map("politician_expenses")
}
```

### Sync Service Atualizado

O `PoliticiansSyncService` passa a salvar dados normalizados:
1. Upsert cada deputado/senador na tabela `politicians`
2. Insert cada despesa individual na tabela `politician_expenses` (com ano E mes para deputados)
3. Manter o `PoliticiansSnapshot` para backward compatibility

### Query para busca (PoliticiansService)

```typescript
async search(params: SearchParams) {
  const where = {
    ...(params.q ? { nome: { contains: params.q, mode: 'insensitive' } } : {}),
    ...(params.house !== 'all' ? { house: params.house } : {}),
    ...(params.parties?.length ? { partido: { in: params.parties } } : {}),
    ...(params.states?.length ? { uf: { in: params.states } } : {}),
    active: true,
  }

  const [data, total] = await Promise.all([
    this.prisma.politician.findMany({
      where,
      include: {
        expenses: {
          where: { ano: params.year },
          select: { valor: true },
        },
      },
      orderBy: params.sort === 'name_asc' ? { nome: 'asc' } : undefined,
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    this.prisma.politician.count({ where }),
  ])

  // Calcular total gasto por politico (imutavel — Regra 3 CLAUDE.md)
  const withTotals = data.map(p => ({
    ...p,
    totalGasto: p.expenses.reduce((s, e) => s + Number(e.valor), 0),
  }))

  // IMPORTANTE: usar toSorted() ou [...arr].sort() — NUNCA mutar in-place
  const sorted = params.sort?.startsWith('spending')
    ? [...withTotals].sort((a, b) =>
        params.sort === 'spending_desc' ? b.totalGasto - a.totalGasto : a.totalGasto - b.totalGasto
      )
    : withTotals

  return {
    data: sorted,
    pagination: { page: params.page, limit: params.limit, total, totalPages: Math.ceil(total / params.limit) },
  }
}

// NOTA: Para performance com muitos registros, considerar usar Prisma _sum aggregation:
// const totals = await prisma.politicianExpense.groupBy({
//   by: ['politicianExtId', 'politicianHouse'],
//   _sum: { valor: true },
//   where: { ano: params.year },
// })
// Isso evita carregar todas as expenses em memoria.
```

---

## Fase 2 — Frontend: Componentes de Filtro e Busca

### Novos componentes

```
apps/web/src/components/ui/
  politician-filters.tsx        ← Barra de filtros (casa, partido, UF, ano, sort)
  politician-search.tsx         ← Input de busca com debounce
  politician-card.tsx           ← Card de cada politico na lista
  politician-pagination.tsx     ← Controle de paginacao
  politician-share-card.tsx     ← Card de compartilhamento (1200x630)
  expense-breakdown.tsx         ← Barras horizontais de gasto por tipo
  expense-timeline.tsx          ← Grafico mensal de gastos
```

### Pagina `/politicos` refatorada

**Regra de tamanho**: Cada arquivo <400 linhas (ideal), <800 max.
O `politicians-content.tsx` atual (429 linhas) sera substituido por componentes menores.

```
apps/web/src/app/politicos/
  page.tsx                      ← Server Component, busca filtros iniciais (<100 linhas)
  _components/
    politicians-hub.tsx         ← Client Component: estado dos filtros via nuqs (<150 linhas)
    politicians-list.tsx        ← Renderiza lista de cards (<100 linhas)
    filter-drawer.tsx           ← Modal/drawer mobile para partido/UF (<150 linhas)
```

### Estado dos filtros (URL-based via `nuqs`)

```typescript
// Usar nuqs para filtros na URL (ja instalado no projeto)
const [search, setSearch] = useQueryState('q', { defaultValue: '' })
const [house, setHouse] = useQueryState('casa', { defaultValue: 'all' })
const [party, setParty] = useQueryState('partido', { defaultValue: '' })
const [state, setState] = useQueryState('uf', { defaultValue: '' })
const [year, setYear] = useQueryState('ano', { defaultValue: String(currentYear) })
const [sort, setSort] = useQueryState('ordem', { defaultValue: 'spending_desc' })
const [page, setPage] = useQueryState('pagina', { defaultValue: '1' })
```

Isso permite links compartilhaveis como:
`/politicos?q=eunicio&casa=camara&partido=MDB&ano=2026`

### Filtros dinamicos (chip buttons)

**SEM emojis** — usar Material Symbols (icones ja no projeto).

```
Casa:     [TODOS] [CAMARA (718)] [SENADO (81)]
Ano:      [2026] [2025] [2024]
Ordenar:  [payments MAIOR GASTO] [sort_by_alpha NOME A-Z]
Partidos: [PT (68)] [PL (99)] [MDB (44)] ... [+ver todos]
Estados:  [SP (70)] [RJ (46)] [MG (53)] ... [+ver todos]
```
(`payments` e `sort_by_alpha` sao nomes de icones Material Symbols)

Cada chip mostra a contagem de politicos. Ao clicar, filtra a lista.

---

## Fase 3 — Pagina Individual do Politico

### `/politicos/deputados/:id` refatorada

Layout:
1. **Header**: Foto, nome, partido-UF, cargo, legislatura
2. **Selector de periodo**: Dropdown de ano + range de meses
3. **KPIs**: Total gasto, per capita, equivalencias
4. **Gasto por tipo**: Barras horizontais (passagens, gabinete, telefonia...)
5. **Gasto por mes**: Grafico de barras (Jan-Dez)
6. **Comparacoes**: Media do partido, media do estado, media geral
7. **Botoes de acao**: Compartilhar no WhatsApp/Twitter/LinkedIn, Gerar Card

### `/politicos/senadores/:id` (NOVO)

Mesma estrutura, sem breakdown mensal (API do Senado nao suporta).

### Card de compartilhamento

Reutilizar o endpoint `/api/og` existente com novos parametros:
```
GET /api/og?tipo=politico&nome=EUNICIO+OLIVEIRA&partido=MDB-CE&valor=R$+140.213&ano=2026&foto=URL
```

Gera imagem 1200x630 com o design definido na Tela 3.

---

## Fase 4 — Sync Service Atualizado

O `PoliticiansSyncService` precisa ser atualizado para:

1. Salvar cada deputado/senador na tabela `politicians` (upsert)
2. Buscar despesas **detalhadas** (com mes e tipo) para cada deputado
3. Salvar cada despesa individual na tabela `politician_expenses`
4. Buscar para **multiplos anos** (2024, 2025, 2026) — nao so o ano atual
5. Manter o snapshot JSONB para backward compatibility

### Estimativa de volume

| Entidade | Registros | Frequencia |
|----------|-----------|-----------|
| politicians | ~800 | Upsert diario |
| politician_expenses (deputados) | ~513 deps x 12 meses x 5 tipos = ~30.000/ano | Insert diario |
| politician_expenses (senadores) | ~81 sens x 1 total/ano = ~81/ano | Insert diario |
| **Total por ano** | **~30.000 rows** | |

Storage: ~30K rows x ~100 bytes = ~3MB/ano — insignificante.

---

## Ordem de Execucao (TDD — Regra do development-workflow.md)

### Dia 1: Design + Schema
1. Criar mockups no Stitch MCP (3 telas)
2. Adicionar models `Politician` e `PoliticianExpense` ao Prisma schema (chave composta)
3. Rodar migracao
4. Verificar nuqs compatibilidade com Next.js 16 App Router

### Dia 2: Backend (TDD: testes PRIMEIRO)
5. **TESTES PRIMEIRO**: Escrever specs para search, details, filters endpoints
6. Criar `SearchPoliticiansDto` com class-validator (validacao Zod no frontend)
7. Criar `GET /api/v1/politicians/search` — fazer testes passarem
8. Criar `GET /api/v1/politicians/deputies/:id` — fazer testes passarem
9. Criar `GET /api/v1/politicians/senators/:id` — fazer testes passarem
10. Criar `GET /api/v1/politicians/filters` — fazer testes passarem
11. Atualizar `PoliticiansSyncService` para salvar dados normalizados
12. Verificar cobertura >= 80%

### Dia 3: Frontend (lista)
13. Criar `politician-filters.tsx` (chips, SEM emojis, Material Symbols)
14. Criar `politician-search.tsx` (input com debounce 300ms)
15. Criar `politician-card.tsx` (com fonte e periodo obrigatorios)
16. Criar `politician-pagination.tsx`
17. Criar `filter-drawer.tsx` (modal mobile para filtros expandidos)
18. Refatorar `/politicos/page.tsx` (<100 linhas, Server Component)
19. Criar `politicians-hub.tsx` (<150 linhas, Client Component com nuqs)
20. Criar `politicians-list.tsx` (<100 linhas)

### Dia 4: Frontend (perfil individual)
21. Refatorar `/politicos/deputados/[id]/page.tsx` com `generateMetadata()` para SEO
22. Criar `/politicos/senadores/[id]/page.tsx` com `generateMetadata()` para SEO
23. Criar `expense-breakdown.tsx` (barras por tipo, renderiza SO se dados > 0)
24. Criar `expense-timeline.tsx` (grafico mensal, SO para deputados)
25. Criar `politician-share-card.tsx`

### Dia 5: Compartilhamento + Testes
26. Atualizar `/api/og/route.tsx` para cards de politicos
27. Botoes de compartilhamento (WhatsApp, Twitter, LinkedIn) — usar share.ts existente
28. Testes E2E com Playwright (busca, filtros, navegacao, perfil)
29. Code review final

---

## Key Files

| File | Operation | Description |
|------|-----------|-------------|
| `apps/api/prisma/schema.prisma` | Modify | Add Politician + PoliticianExpense models |
| `apps/api/src/politicians/politicians.controller.ts` | Rewrite | Endpoints search, details, filters |
| `apps/api/src/politicians/politicians.service.ts` | Rewrite | Search with Prisma queries |
| `apps/api/src/sync/politicians-sync.service.ts` | Modify | Save normalized data |
| `apps/web/src/app/politicos/page.tsx` | Rewrite | Server Component with filters |
| `apps/web/src/app/politicos/_components/politicians-hub.tsx` | Create | Client hub with state |
| `apps/web/src/components/ui/politician-filters.tsx` | Create | Filter chips |
| `apps/web/src/components/ui/politician-search.tsx` | Create | Search input |
| `apps/web/src/components/ui/politician-card.tsx` | Create | List card |
| `apps/web/src/components/ui/politician-pagination.tsx` | Create | Pagination |
| `apps/web/src/app/politicos/deputados/[id]/page.tsx` | Rewrite | Detail page |
| `apps/web/src/app/politicos/senadores/[id]/page.tsx` | Create | Senator detail |
| `apps/web/src/components/ui/expense-breakdown.tsx` | Create | Horizontal bars |
| `apps/web/src/components/ui/expense-timeline.tsx` | Create | Monthly chart |
| `apps/web/src/components/ui/politician-share-card.tsx` | Create | Share card |
| `apps/web/src/app/api/og/route.tsx` | Modify | Politician OG cards |

## Risks and Mitigation

| Risk | Mitigation |
|------|------------|
| Sync de 513 deps x despesas detalhadas e lento (~30 min) | Ja funciona com batching no NestJS, sem limite de tempo |
| Codante API nao tem filtro por mes para senadores | Documentar na UI: "Dados do Senado disponiveis apenas por ano" |
| Muitos filtros combinados geram query lenta | Indices no Prisma (partido, uf, house, nome) + paginacao |
| Card de compartilhamento precisa de fonte customizada | Reutilizar o OG route existente que ja carrega Epilogue + Space Grotesk |

## SESSION_ID
- CODEX_SESSION: N/A
- GEMINI_SESSION: N/A
