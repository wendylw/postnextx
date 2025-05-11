# PostNextX
⚡ PostNextX – A blazing-fast full-stack template powered by Next.js, Express &amp; PostgreSQL.

---

## 🖥️ Environment

macOS

---

## 🛠️ Tech Stack

- **Frontend:** TypeScript, Next.js
- **Backend:** TypeScript, Express, PostgreSQL, Prisma
- **Tools & Deployment:** Vercel, Railway, Neon
- **Environment:**  
  - nvm  
  - npm  
  - Node.js: `22.15.0`

---

## 📂 Structure

```
/
├── frontend/ → Next.js frontend application
└── backend/ → Express backend API with PostgreSQL (Prisma ORM)
```

---

## 🚀 Installation

### 🐘 Install PostgreSQL Locally

1. Download from: [https://postgresapp.com/](https://postgresapp.com/)
2. Install and move it to your Applications folder.
3. Open the app and click **Initialize** to create a default server.
4. Add PostgreSQL binaries to your `PATH` by adding this line to your `.zshrc` or `.bash_profile`:
```bash
   export PATH=$PATH:/Applications/Postgres.app/Contents/Versions/latest/bin
```
5. Restart your terminal and check the version:
```bash
psql --version
```

### Install PostgreSQL GUI (Postico)

1. Download from: https://eggerapps.at/postico/
2. Open it and click New Server to connect to your local database:

### Install packages & Run

```bash
cd frontend
npm install
npm run dev
```

```bash
cd backend
npm install
npm run prisma:dbpull
npm run prisma:migrate:dev init
npm run prisma:seed
npm run dev
```
