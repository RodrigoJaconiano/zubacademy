# Zubacademy

Plataforma de treinamento online desenvolvida para conduzir usuários por um fluxo simples de aprendizagem: acesso ao curso, acompanhamento de progresso, realização de quiz final e emissão automática de certificado.

O projeto foi construído com **Next.js + Supabase**, aproveitando autenticação integrada, banco de dados PostgreSQL e rotas server-side.

A ideia principal foi criar uma experiência direta para o aluno: entrar, completar o cadastro, assistir às aulas, validar o conhecimento e receber o certificado ao final.

---

# Stack

O projeto utiliza uma stack moderna focada em aplicações web fullstack com React.

## Frontend

- Next.js (App Router)
- React
- TypeScript
- TailwindCSS

## Backend

- Next.js Server Components
- API Routes
- Supabase

## Infraestrutura

- Supabase (Auth + Database)
- PostgreSQL
- Vercel (deploy)

---

# Funcionalidades

A aplicação cobre todo o fluxo de um treinamento simples.

## Autenticação

Login via Supabase Auth.

Após autenticar, o sistema verifica se o usuário possui perfil completo antes de liberar o acesso ao curso.

---

## Perfil do usuário

Antes de acessar o conteúdo, o aluno precisa completar o cadastro com:

- nome
- telefone
- email
- CPF
- CEP
- cidade
- estado
- endereço
- número
- aceite dos termos de utilização

O sistema também realiza:

- validação de CPF (11 dígitos)
- validação de CEP
- preenchimento automático de endereço via API de CEP

---

## Curso

A página do curso apresenta o conteúdo do treinamento e registra o progresso do aluno conforme as aulas são concluídas.

Esse progresso é salvo na tabela `lesson_progress`.

---

## Quiz final

O quiz só é liberado quando **todas as aulas foram concluídas**.

A tentativa do quiz é registrada na tabela `quiz_attempts`.

Caso aprovado, o usuário passa a ter acesso ao certificado.

---

## Certificado

Após aprovação no quiz final, o sistema libera automaticamente o certificado.

O certificado contém:

- nome do aluno
- nome do curso
- data de emissão
- código único de verificação

Os dados são armazenados na tabela `certificates`.

---

# Estrutura do projeto

A aplicação segue o padrão do **Next.js App Router**.

```
app
 ├── api
 │   └── profile
 │       └── route.ts
 │
 ├── certificado
 │   └── page.tsx
 │
 ├── curso
 │   └── page.tsx
 │
 ├── dashboard
 │   └── page.tsx
 │
 ├── login
 │   └── page.tsx
 │
 ├── perfil
 │   └── page.tsx
 │
 ├── quiz
 │   └── page.tsx
 │
 ├── layout.tsx
 └── page.tsx
```

Componentes reutilizáveis ficam organizados em:

```
components
 ├── certificate
 ├── course
 ├── profile
 ├── quiz
 └── ui
```

---

# Banco de dados

O banco utiliza PostgreSQL via Supabase.

Principais tabelas:

## profiles

Armazena os dados do usuário.

Campos principais:

- id
- name
- email
- phone
- cpf
- cep
- city
- state
- address
- number
- terms_accepted
- terms_accepted_at

---

## lesson_progress

Controla quais aulas foram concluídas por cada usuário.

---

## quiz_attempts

Registra as tentativas do quiz final.

---

## certificates

Armazena os certificados emitidos.

Cada certificado possui um código único de identificação.

---

# Regras de acesso

Algumas rotas possuem verificações antes de permitir o acesso.

## Perfil incompleto

Se o usuário não completou o cadastro:

```
redirect("/perfil")
```

---

## Quiz bloqueado

O quiz só é liberado quando todas as aulas foram concluídas.

---

## Certificado bloqueado

O certificado só aparece após aprovação no quiz final.

---

# Executando o projeto

Clone o repositório:

```
git clone <repo>
```

Instale as dependências:

```
npm install
```

Configure as variáveis de ambiente:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Execute o projeto:

```
npm run dev
```

A aplicação ficará disponível em:

```
http://localhost:3000
```

---

# Deploy

O projeto está preparado para deploy na **Vercel**.

Basta configurar as mesmas variáveis de ambiente utilizadas no desenvolvimento.

---

# Objetivo do projeto

Esse projeto foi construído como base para uma plataforma de treinamento simples e escalável.

A arquitetura permite evoluir facilmente para:

- múltiplos cursos
- área administrativa
- acompanhamento de alunos
- geração avançada de certificados
- analytics de progresso

---

# Autor

Felipe  
Desenvolvedor Full Stack

Stack principal:

- Next.js
- TypeScript
- Supabase
- PostgreSQL