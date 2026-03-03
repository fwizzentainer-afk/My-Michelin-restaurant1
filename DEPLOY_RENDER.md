# Deploy no Render (Web + Postgres)

Este projeto usa Node/Express + Socket.IO + sessão + Postgres.
O caminho com menos ajuste é Render com 1 Web Service stateful + 1 banco Postgres.

## 1) Para que serve cada variável

- `NODE_ENV=production`: ativa modo produção (cookies `secure`, validações de segurança).
- `DATABASE_URL`: string de conexão do Postgres.
- `SESSION_SECRET`: chave usada para assinar sessão/cookie. Deve ser forte.
- `ADMIN_USER`: usuário admin inicial.
- `ADMIN_PASSWORD`: senha do admin inicial (obrigatória para criação automática no boot).
- `CORS_ORIGINS`: lista CSV de origens permitidas no browser (ex.: `https://app.exemplo.com,https://app2.exemplo.com`).

## 2) Arquivo `render.yaml`

O `render.yaml` já está pronto para criar:
- 1 Web Service (`my-michelin-web`)
- 1 Postgres (`my-michelin-db`)

Ele já liga `DATABASE_URL` automaticamente no app e gera `SESSION_SECRET`.
Você só precisa preencher manualmente:
- `ADMIN_PASSWORD`
- `CORS_ORIGINS`

## 3) Ordem correta para evitar erro

1. Push deste código para o GitHub.
2. No Render, criar Blueprint a partir do repositório (ele lê `render.yaml`).
3. Antes de liberar tráfego, definir env vars pendentes (`ADMIN_PASSWORD`, `CORS_ORIGINS`).
4. Abrir Shell do serviço e rodar migração:
   - `npm run db:push`
5. Reiniciar o serviço.
6. Validar saúde:
   - `GET /api/health`

## 4) Valor correto para `CORS_ORIGINS`

Use o(s) domínio(s) do frontend que vão abrir o app nos tablets.
Exemplo:

```bash
CORS_ORIGINS=https://my-michelin-web.onrender.com
```

Se tiver domínio customizado, troque para ele.

## 5) Socket tablets

No build do frontend, definir:

```bash
VITE_SOCKET_URL=https://my-michelin-web.onrender.com
```

Assim sala e cozinha apontam para o mesmo backend na internet.
