# Plano: Integracao de Dados de Politicos

## Task Type
- [x] Fullstack (Backend: 4 APIs novas + services | Frontend: 3 paginas novas + nav)

## Resumo

Integrar dados de gastos individuais de politicos usando 4 APIs publicas:
1. **Camara dos Deputados** — gastos CEAP por deputado
2. **Codante Senator API** — gastos CEAPS por senador
3. **Portal da Transparencia** — salarios de ministros, viagens, cartao corporativo
4. **TSE DivulgaCandContas** — patrimonio declarado, financas de campanha

O Judiciario (CNJ) NAO tem API programatica — os dados estao em dashboards e PDFs.

---

## Fase 1: API Clients e Types (Backend puro)

### 1.1 Camara dos Deputados Client

**Base URL**: `https://dadosabertos.camara.leg.br/api/v2/`
**Auth**: Nenhuma | **Rate limit**: ~5 req/seg (conservador)

| Arquivo | Operacao | Descricao |
|---------|----------|-----------|
| `src/lib/api/camara-types.ts` | NOVO | Interfaces: `Deputado`, `DespesaDeputado`, `DeputadoResumo` |
| `src/lib/api/camara.ts` | NOVO | Client: `fetchDeputados()`, `fetchDespesasDeputado(id, ano)`, `fetchTiposDespesa()` |

Endpoints usados:
- `GET /deputados?siglaPartido=X&siglaUf=Y&idLegislatura=57&itens=100`
- `GET /deputados/{id}/despesas?ano=2026&itens=100&pagina=N`
- `GET /referencias/deputados/tipoDespesa`

### 1.2 Senado Client (via Codante API)

**Base URL**: `https://apis.codante.io/senator-expenses`
**Auth**: Nenhuma | **Rate limit**: 100 req/min

| Arquivo | Operacao | Descricao |
|---------|----------|-----------|
| `src/lib/api/senado-types.ts` | NOVO | Interfaces: `Senador`, `DespesaSenador`, `SenadorResumo` |
| `src/lib/api/senado.ts` | NOVO | Client: `fetchSenadores()`, `fetchDespesasSenador(id, ano)`, `fetchResumoPartido()`, `fetchResumoUF()` |

Endpoints usados:
- `GET /senators?active=true`
- `GET /senators/{id}/expenses?year=2026`
- `GET /summary/by-party`
- `GET /summary/by-uf`

### 1.3 Portal da Transparencia — Novos endpoints

Ja temos API key. Adicionar ao client existente (`transparency.ts`):

| Arquivo | Operacao | Descricao |
|---------|----------|-----------|
| `src/lib/api/types.ts` | Modificar | Adicionar: `ServidorRemuneracao`, `ViagemOficial`, `CartaoPagamento` |
| `src/lib/api/transparency.ts` | Modificar | Adicionar: `fetchRemuneracao(cpf, mesAno)`, `fetchViagens(dataInicio, dataFim)`, `fetchCartoes(dataInicio, dataFim)` |

Endpoints:
- `GET /servidores/remuneracao?cpf=X&mesAno=YYYYMM`
- `GET /viagens?dataIdaDe=DD/MM/AAAA&dataIdaAte=DD/MM/AAAA`
- `GET /cartoes?dataTransacaoDe=DD/MM/AAAA&dataTransacaoAte=DD/MM/AAAA`

### 1.4 TSE Client

**Base URL**: `https://divulgacandcontas.tse.jus.br/divulga/rest/v1`
**Auth**: Nenhuma | **CORS**: Nao suportado (server-side only)

| Arquivo | Operacao | Descricao |
|---------|----------|-----------|
| `src/lib/api/tse-types.ts` | NOVO | Interfaces: `Candidato`, `BemCandidato`, `FinancaCampanha` |
| `src/lib/api/tse.ts` | NOVO | Client: `fetchCandidatos(ano, cargo)`, `fetchCandidato(ano, id)`, `fetchFinancas(ano, id)` |

Endpoints:
- `GET /candidatura/listar/{ano}/{municipio}/{eleicao}/{cargo}/candidatos`
- `GET /candidatura/buscar/{ano}/{municipio}/{eleicao}/candidato/{id}`

---

## Fase 2: Service Layer com Cache

| Arquivo | Operacao | Descricao |
|---------|----------|-----------|
| `src/lib/services/deputies-service.ts` | NOVO | `getTopGastadores(ano, limit)` — cache 1h, agrega por deputado |
| `src/lib/services/senators-service.ts` | NOVO | `getTopSenadoresGastadores(ano, limit)` — cache 1h |
| `src/lib/services/salaries-service.ts` | NOVO | `getMinisterSalaries(mesAno)` — cache 6h, busca top cargos DAS/NES |
| `src/lib/services/travel-service.ts` | NOVO | `getRecentTravels(days)` — cache 1h |

Cache strategy:
- Deputados/Senadores: 1 hora TTL (dados mudam raramente)
- Salarios: 6 horas TTL (atualizacao mensal)
- Viagens: 1 hora TTL

### Problema de performance: 513 deputados

Buscar despesas de todos os 513 deputados e um por um e lento. Solucao:
1. **Background job**: primeira requisicao dispara fetch em background
2. **Bulk CSV**: baixar CSV anual da Camara e processar (mais eficiente)
3. **Pre-computed cache**: armazenar ranking no Redis com TTL de 6h
4. **Abordagem incremental**: buscar top 50 por dia e agregar

Recomendacao: usar **bulk CSV** para o ranking geral + **API individual** para detalhes de um deputado.

---

## Fase 3: Paginas Frontend

### 3.1 Pagina `/politicos` — Hub central

| Arquivo | Operacao | Descricao |
|---------|----------|-----------|
| `src/app/politicos/page.tsx` | NOVO | Hub com 3 tabs: Deputados / Senadores / Ministros |

Layout:
- Header: "RAIO-X DOS POLITICOS"
- Filtros: Partido, UF, Periodo
- Tab Deputados: ranking top 20 por gasto CEAP
- Tab Senadores: ranking top 20 por gasto CEAPS
- Tab Ministros: top salarios do executivo

Cada card mostra: foto, nome, partido-UF, total gasto, equivalencia

### 3.2 Pagina `/politicos/deputados/[id]` — Detalhe deputado

| Arquivo | Operacao | Descricao |
|---------|----------|-----------|
| `src/app/politicos/deputados/[id]/page.tsx` | NOVO | Detalhe de um deputado |

Secoes:
1. Perfil: foto, nome, partido, UF, email
2. Total gasto no ano (numero grande + equivalencia)
3. Breakdown por tipo de despesa (barras horizontais):
   - Passagens Aereas
   - Telefonia
   - Manutencao de Gabinete
   - Combustiveis
   - Divulgacao
   - Consultoria
4. Maiores fornecedores (quem recebeu mais dinheiro)
5. Historico mensal (grafico de linha)
6. Comparacao com a media da bancada do partido

### 3.3 Pagina `/politicos/senadores/[id]` — Detalhe senador

Mesma estrutura do deputado mas com dados CEAPS.

### 3.4 Navegacao

| Arquivo | Operacao | Descricao |
|---------|----------|-----------|
| `src/components/layout/top-nav.tsx` | Modificar | Adicionar "POLITICOS" |
| `src/components/layout/side-nav.tsx` | Modificar | Adicionar "POLITICOS" com icone `how_to_reg` |
| `src/components/layout/bottom-nav.tsx` | Modificar | Trocar "Dossies" por "Politicos" |

---

## Fase 4: Dados Extras (Portal da Transparencia)

### 4.1 Secao de viagens na homepage ou ranking

| Arquivo | Operacao | Descricao |
|---------|----------|-----------|
| `src/app/ranking/page.tsx` | Modificar | Nova secao "VIAGENS OFICIAIS" com ultimas viagens |

### 4.2 Cartao corporativo

Adicionar como sub-secao do ranking ou pagina propria.

---

## Fase 5: TSE — Patrimonio e Campanhas (feature futura)

| Arquivo | Operacao | Descricao |
|---------|----------|-----------|
| `src/app/politicos/patrimonio/page.tsx` | NOVO | Patrimonio declarado dos candidatos eleitos |
| `src/app/politicos/campanhas/page.tsx` | NOVO | Financas de campanha: doadores, gastos |

Depende da API TSE que nao tem CORS — precisa de server-side proxy.

---

## Riscos e Mitigacoes

| Risco | Mitigacao |
|-------|----------|
| API da Camara lenta para 513 deputados | Usar bulk CSV + cache agressivo (6h) |
| Codante API e third-party, pode sair do ar | Fallback para CSV do Senado |
| Portal Transparencia rate limit (90 req/min dia) | Priorizar batch com delay entre requests |
| TSE sem CORS | Server-side fetch only |
| CNJ sem API | Documentar como limitacao, nao integrar |

---

## Dados INDISPONIVEIS (sem API)

1. **Salarios do Judiciario** — CNJ publica em dashboard, sem API REST
2. **Beneficios individuais de legisladores** (moradia, saude) — nao disponivel
3. **Salarios de deputados/senadores** — fixados por lei (R$ 44.174,97/mês), nao tem endpoint
4. **Gastos internos do Senado** — oficial API so tem perfis, nao despesas

---

## Ordem de execucao recomendada

```
Fase 1.1 (Camara) + 1.2 (Senado)  — paralelo, sem dependencias
         ↓
Fase 2 (Services)                  — depende dos clients
         ↓
Fase 3.1 (Hub /politicos)         — depende dos services
         ↓
Fase 3.2 + 3.3 (Detalhes)         — paralelo
         ↓
Fase 3.4 (Navegacao)              — rapido, final
         ↓
Fase 4 (Viagens/Cartao)           — independente
         ↓
Fase 5 (TSE)                      — feature futura
```

## Estimativa de arquivos

- **Novos**: ~15 arquivos (types, clients, services, pages)
- **Modificados**: ~5 arquivos (nav, transparency.ts, types.ts)
- **Testes**: ~8 arquivos novos

## Key Files

| File | Operation | Description |
|------|-----------|-------------|
| `src/lib/api/camara.ts` | New | Camara API client |
| `src/lib/api/camara-types.ts` | New | Camara types |
| `src/lib/api/senado.ts` | New | Senado API client (via Codante) |
| `src/lib/api/senado-types.ts` | New | Senado types |
| `src/lib/api/tse.ts` | New | TSE API client |
| `src/lib/api/tse-types.ts` | New | TSE types |
| `src/lib/api/transparency.ts` | Modify | Add remuneracao, viagens, cartoes |
| `src/lib/api/types.ts` | Modify | Add ServidorRemuneracao, ViagemOficial |
| `src/lib/services/deputies-service.ts` | New | Deputies with cache |
| `src/lib/services/senators-service.ts` | New | Senators with cache |
| `src/lib/services/salaries-service.ts` | New | Minister salaries |
| `src/app/politicos/page.tsx` | New | Politicians hub |
| `src/app/politicos/deputados/[id]/page.tsx` | New | Deputy detail |
| `src/app/politicos/senadores/[id]/page.tsx` | New | Senator detail |
| `src/components/layout/top-nav.tsx` | Modify | Add nav link |
| `src/components/layout/side-nav.tsx` | Modify | Add nav link |
| `src/components/layout/bottom-nav.tsx` | Modify | Fix label |
