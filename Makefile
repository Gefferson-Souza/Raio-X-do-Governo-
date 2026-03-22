.PHONY: help dev dev-infra dev-tools stop build test lint sonar clean prisma-migrate prisma-generate api-build web-build docker-build

# ── Cores ──
CYAN := \033[36m
GREEN := \033[32m
RESET := \033[0m

help: ## Mostra comandos disponiveis
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-20s$(RESET) %s\n", $$1, $$2}'

# ── Desenvolvimento ──

dev-infra: ## Sobe PostgreSQL + Redis (infra local)
	docker compose -f docker-compose.dev.yml up -d postgres redis
	@echo "$(GREEN)Postgres: localhost:5432 | Redis: localhost:6379$(RESET)"

dev-tools: ## Sobe pgAdmin + RedisInsight (UIs opcionais)
	docker compose -f docker-compose.dev.yml --profile tools up -d pgadmin redisinsight
	@echo "$(GREEN)pgAdmin: localhost:5050 | RedisInsight: localhost:5540$(RESET)"

dev: dev-infra ## Sobe infra + roda Next.js e NestJS em paralelo
	@echo "$(GREEN)Infra pronta. Rode em terminais separados:$(RESET)"
	@echo "  npm run dev        (Next.js em localhost:3000)"
	@echo "  npm run api:dev    (NestJS em localhost:3001)"

stop: ## Para todos os containers
	docker compose -f docker-compose.dev.yml --profile tools down
	docker compose -f docker-compose.sonar.yml down 2>/dev/null || true

# ── Build ──

build: web-build api-build ## Builda web + api

web-build: ## Build do Next.js via Nx
	npx nx build web

api-build: ## Type-check do NestJS
	npx tsc --project apps/api/tsconfig.json --noEmit

docker-build: ## Build das imagens Docker de producao
	docker compose build

# ── Testes ──

test: ## Roda todos os testes
	npm run test:run

test-coverage: ## Roda testes com cobertura
	npm run test:coverage

lint: ## Roda ESLint
	npm run lint

# ── Prisma ──

prisma-generate: ## Gera o Prisma Client
	npx prisma generate --schema=apps/api/prisma/schema.prisma

prisma-migrate: ## Roda migracoes no banco local
	DATABASE_URL=postgresql://raioxgoverno:raioxgoverno_dev@localhost:5433/raioxdogoverno \
		npx prisma migrate dev --schema=apps/api/prisma/schema.prisma --config=apps/api/prisma/prisma.config.ts

prisma-studio: ## Abre o Prisma Studio (UI do banco)
	DATABASE_URL=postgresql://raioxgoverno:raioxgoverno_dev@localhost:5433/raioxdogoverno \
		npx prisma studio --schema=apps/api/prisma/schema.prisma

# ── SonarQube ──

sonar-up: ## Sobe o SonarQube local
	docker compose -f docker-compose.sonar.yml up -d
	@echo "$(GREEN)SonarQube: localhost:9000 (usuario: admin, senha: admin)$(RESET)"
	@echo "Aguarde ~2min para inicializar..."

sonar-scan: test-coverage ## Roda testes + scan do SonarQube
	@if [ -z "$$SONAR_TOKEN" ] && [ -f .env.sonar ]; then \
		export $$(cat .env.sonar | xargs); \
	fi; \
	docker run --rm --network sonar-net \
		-e SONAR_TOKEN=$$SONAR_TOKEN \
		-v "$$(pwd):/usr/src" \
		sonarsource/sonar-scanner-cli \
		-Dsonar.token=$$SONAR_TOKEN

sonar-down: ## Para o SonarQube
	docker compose -f docker-compose.sonar.yml down

# ── Limpeza ──

clean: ## Remove artefatos de build
	rm -rf dist .next apps/web/.next coverage .nx/cache
	@echo "$(GREEN)Artefatos removidos$(RESET)"

clean-all: clean stop ## Remove tudo (artefatos + containers + volumes)
	docker compose -f docker-compose.dev.yml down -v
	docker compose -f docker-compose.sonar.yml down -v 2>/dev/null || true
	@echo "$(GREEN)Tudo limpo$(RESET)"
