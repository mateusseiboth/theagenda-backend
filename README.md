# Backend - Sistema de Agendamento

API REST para sistema de agendamento online.

## Desenvolvimento Rápido

```bash
# Instalar dependências
bun install

# Criar arquivo .env (copie de .env.example e configure)
cp .env.example .env

# Subir banco de dados
docker-compose up -d

# Executar migrações
bunx prisma migrate dev

# Gerar Prisma Client
bunx prisma generate

# Seed inicial (cria admin e dados de exemplo)
bun run bootstrap

# Iniciar em modo desenvolvimento
bun run dev
```

Servidor rodando em: http://localhost:3002

## Endpoints Principais

- `GET /health` - Health check
- `POST /api/auth/login` - Login admin
- `GET /api/services/public` - Lista serviços (público)
- `GET /api/appointments/public/available-slots` - Horários disponíveis (público)
- `POST /api/appointments/public` - Criar agendamento (público)

Veja a documentação completa no README.md principal.

## Estrutura

```
src/
├── database/          # Configuração Prisma
├── middlewares/       # Auth, validação
├── routes/            # Rotas da API
├── schemas/           # Validações Zod
├── bootstrap.ts       # Seed inicial
├── config.ts          # Configurações
└── index.ts           # Entry point
```

## Scripts

- `bun run dev` - Desenvolvimento com hot reload
- `bun run start` - Produção
- `bun run build` - Build TypeScript
- `bun run bootstrap` - Seed inicial
- `bun run typecheck` - Verificar tipos

## Credenciais Padrão

Após executar `bun run bootstrap`:
- **Telefone**: +5511999999999
- **Senha**: admin123

⚠️ Mude em produção!
