# Raio-X do Governo

Dashboard de transparencia que mostra em tempo real como o governo federal brasileiro gasta o dinheiro publico. Transforma dados brutos do Portal da Transparencia em informacoes acessiveis, com equivalencias do tipo "isso equivale a X escolas" para facilitar a compreensao.

## Funcionalidades

- **Dashboard de gastos** — Total pago, empenhado e liquidado por orgao, atualizado a cada 5 minutos
- **Ranking de ministerios** — Podio dos maiores gastadores com barra de execucao orcamentaria
- **Contratos recentes** — Top contratos agrupados por fornecedor
- **Politicos** — Deputados e senadores com despesas detalhadas, filtro por partido e estado
- **Gerador de impacto** — Cria cards compartilhaveis que convertem valores em equivalencias (escolas, salarios, cestas basicas)
- **Compartilhamento** — WhatsApp, LinkedIn, Twitter e download de imagem com OG preview

## Stack

- **Next.js 16** (App Router, SSR + ISR)
- **React 19** + **React Query 5** (client-side polling)
- **Tailwind CSS 4**
- **Framer Motion** (animacoes)
- **Upstash Redis** (cache distribuido, opcional)
- **Vitest** (testes unitarios)

## Fontes de dados

| API | Dados |
|-----|-------|
| Portal da Transparencia | Despesas por orgao, contratos |
| Camara dos Deputados | Deputados e suas despesas |
| Senado (Codante) | Senadores, despesas e partidos |

## Setup

```bash
# Instalar dependencias
npm install

# Configurar variaveis de ambiente
cp .env.example .env
# Editar .env com sua chave de API
```

### Variaveis de ambiente

| Variavel | Obrigatorio | Descricao |
|----------|-------------|-----------|
| `TRANSPARENCY_API_KEY` | Sim | Chave da API do Portal da Transparencia |
| `UPSTASH_REDIS_REST_URL` | Nao | URL do Redis (fallback: cache em memoria) |
| `UPSTASH_REDIS_REST_TOKEN` | Nao | Token do Redis |
| `CRON_SECRET` | Nao | Verificacao do endpoint de cron |

## Desenvolvimento

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de producao
npm run test         # Testes em modo watch
npm run test:run     # Testes (execucao unica)
npm run test:coverage # Cobertura de testes
npm run lint         # ESLint
```

### SonarQube (opcional)

```bash
npm run sonar:up     # Sobe container SonarQube
npm run sonar:check  # Roda testes + scan
npm run sonar:down   # Para container
```

## Arquitetura

```
src/
├── app/                    Pages e API routes (Next.js App Router)
│   ├── api/                Endpoints: spending, politicians, cron, og
│   ├── ranking/            Ranking de ministerios
│   ├── carrinho/           Contratos agrupados
│   ├── gerador/            Gerador de cards de impacto
│   └── politicos/          Deputados, senadores, partidos, congresso
├── components/
│   ├── layout/             TopNav, SideNav, BottomNav, Footer
│   └── ui/                 SpendingPoller, PoliticiansContent, CounterHero, etc.
└── lib/
    ├── api/                Clients: transparency, camara, senado, tse, cache
    ├── services/           Cache-aside wrappers (spending, contracts, politicians)
    └── utils/              Formatacao, equivalencias, compartilhamento, constantes
```

Documentacao tecnica detalhada em `docs/CODEMAPS/`.
