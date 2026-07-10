# Cloud Finanças

Sistema de controle financeiro pra pequenos negócios. Nasceu de uma pergunta simples: a maioria das ferramentas desse tipo mostra planilha bonita mas não conta pro lojista se o caixa dele está saudável ou não. Esse projeto tenta resolver isso — além do CRUD de receita/despesa, tem um indicador que calcula quanto da receita já foi consumido em despesa no período e avisa quando isso passa de um limite razoável.

Full-stack: API em Node/Express, banco Postgres, frontend em React.

## Arquitetura e decisões

**Multi-tenancy por coluna, não por schema separado.** Cada tabela (transactions, categories) tem uma user_id e toda query filtra por ela. Optei por isso em vez de um schema/banco por cliente porque, na escala que esse projeto tem hoje, simplicidade de manutenção pesa mais que isolamento físico total. Se crescer muito, dá pra migrar depois.

**JWT em vez de sessão com cookie.** Decisão pensada pro frontend rodar separado do backend (portas diferentes em dev, domínios diferentes em produção) sem precisar lidar com CORS + cookie cross-origin, que dá mais dor de cabeça que o ganho de segurança marginal do cookie httpOnly nesse contexto.

**Categorias padrão criadas no registro.** Em vez de deixar o usuário configurar do zero, o registro já popula 10 categorias comuns pro tipo de negócio (Vendas, Fornecedores, Aluguel, etc). Reduz o atrito de setup — a maior causa de abandono em ferramentas financeiras é a pessoa desistir antes de lançar a primeira transação.

## Stack

Backend: Express, PostgreSQL (pg, sem ORM), JWT, bcrypt, express-validator, express-rate-limit no login.

Frontend: React + Vite, Chart.js, React Router, Axios com interceptor pra token.

## Endpoints principais

- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- GET /api/categories
- POST /api/categories
- DELETE /api/categories/:id
- GET /api/transactions (aceita filtros: type, category_id, status, start_date, end_date, search, page)
- POST /api/transactions
- PUT /api/transactions/:id
- DELETE /api/transactions/:id
- GET /api/dashboard/summary (aceita start_date, end_date)

## Rodando local

Precisa de Node 18+ e um Postgres rodando (local ou algo tipo Neon/Supabase).

Backend:

    cd backend
    npm install
    cp .env.example .env
    npm run migrate
    npm run dev

Frontend (em outro terminal):

    cd frontend
    npm install
    npm run dev

## O que ainda falta

Não tem cobrança implementada, não tem deploy em produção, não tem recuperação de senha. É a base técnica funcionando de ponta a ponta, mas ainda não é um produto pronto pra vender — falta a parte de negócio em volta (billing, termos de uso, infraestrutura de produção).