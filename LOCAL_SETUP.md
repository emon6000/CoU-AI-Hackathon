# Local Workstation Setup Guide (Node.js & pgAdmin)

This guide is designed for local setup on a workstation with **Node.js** and **pgAdmin** installed.

---

## 1. System Requirements
- **Node.js**: v18.x, v20.x, or v22.x LTS (Run `node -v` in terminal to confirm)
- **PostgreSQL & pgAdmin 4**: Standard installation (PostgreSQL 14, 15, 16, or 17)
- **Operating System**: Windows 10/11, macOS, or Ubuntu Linux

---

## 2. Step 1: Initialize Database in pgAdmin 4

1. Open **pgAdmin 4** on your computer.
2. In the left sidebar tree, expand **Servers** and click your PostgreSQL instance. Enter your master password when prompted.
3. Right-click on **Databases** ➔ Select **Create** ➔ **Database...**.
   - **Database**: Enter `ai_hackathon_db`
   - Click **Save**.
4. In the sidebar, expand **Databases**, right-click the new `ai_hackathon_db` ➔ Select **Query Tool**.
5. Click the folder icon in the Query Tool toolbar, or open `db/setup_pgadmin.sql` from this project folder, and paste its full content into the editor.
6. Press **F5** (or click the Execute ▶ button on the toolbar).
7. You will see:
   ```
   Query returned successfully: AI Hackathon Portal Database Setup Complete!
   ```
   All 16 tables, constraints, indexes, and initial accounts have been initialized.

---

## 3. Step 2: Configure Environment

Inside the project directory, verify your `.env` file (copied from `.env.example`):

```env
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/ai_hackathon_db
JWT_SECRET=cou_ai_hackathon_secret_key_2026
```
*(Replace `YOUR_PASSWORD` with your local PostgreSQL password, typically `postgres` or `admin`)*.

---

## 4. Step 3: Install Node.js Dependencies & Run Tests

Open your terminal in the project directory:

```bash
# 1. Install packages
npm install

# 2. Run unit tests to verify business rules logic
npx tsx --test src/utils/rules.test.ts
```
Expected output:
```
# tests 8
# pass 8
# fail 0
```

---

## 5. Step 4: Start the Web Portal

Run the development server:

```bash
npm run dev
```

Open your browser at:
```
http://localhost:3000
```

---

## 6. Accessing Accounts

| Role | Endpoint | Credentials | Purpose |
| :--- | :--- | :--- | :--- |
| **Public Visitor** | `/` | No login needed | View the event page and public information |
| **Team Leader** | `/register` | Create a new team during registration | Register a team, pay the fee, and later log in with the approved team account |
| **Super Admin** | `/staff/login` | `admin@cou.ac.bd` / `admin123` | Full control: settings, staff management, review flow, and event release controls |

This project is intentionally bootstrapped with only the super admin account. No demo moderator, judge, or dummy teams are created by default.

---

## 7. Handover Documentation

- Read [`FACULTY_HANDOVER_MANUAL.md`](./FACULTY_HANDOVER_MANUAL.md) for the official faculty committee operational guide.
- Read [`ADMIN_MANUAL.md`](./ADMIN_MANUAL.md) for daily organizing committee instructions.
- Read [`HOSTING.md`](./HOSTING.md) for deploying to university servers or cloud infrastructure.
