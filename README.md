# Cloud Finanças 👑

Dashboard financeiro completo para pequenos negócios e lojistas — controle de receitas, despesas, categorias e fluxo de caixa, com gráficos e indicadores em tempo real.

## 🚀 Sobre o projeto

Sistema full-stack de gestão financeira, com autenticação segura, isolamento de dados por usuário (multi-tenancy), dashboard com gráficos interativos e design responsivo (funciona em desktop e mobile).

## 🛠️ Tecnologias

**Backend**
- Node.js + Express
- PostgreSQL
- JWT (autenticação)
- bcrypt (criptografia de senha)
- express-validator, express-rate-limit (segurança)

**Frontend**
- React + Vite
- Chart.js (gráficos)
- React Router
- Axios

## ✨ Funcionalidades

- Cadastro e login com autenticação JWT
- Categorias de receita/despesa (10 categorias padrão criadas automaticamente)
- CRUD completo de transações (criar, editar, excluir, filtrar, paginar)
- Dashboard com:
  - Indicadores de receita, despesa, resultado e margem
  - Gráfico de evolução mensal (receitas x despesas)
  - Gráfico de despesas por categoria
  - Medidor de saúde do caixa
  - Seletor de mês/ano
- Isolamento total de dados entre usuários (multi-tenancy)
- Design responsivo (desktop e mobile)

## 📦 Como rodar o projeto localmente

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+

### Backend

```bash
cd backend
npm install
cp .env.example .env
# edite o .env com sua connection string do PostgreSQL e uma chave JWT_SECRET
npm run migrate
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`.

## 📸 Screenshots

_(em breve)_

## 📝 Licença

Este projeto é proprietário — todos os direitos reservados.