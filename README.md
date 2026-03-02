<p align="center">
  <img src="assets/logo.png" width="200" alt="Help Logo" />
</p>

<h1 align="center">Help • Backend Service</h1>

<p align="center">
  <strong>A social network for spiritual and emotional support.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black" alt="Drizzle ORM" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
</p>

---

## 🕊️ About Help

Add description ...

---

## 🛠️ Tech Stack

This backend is built with a focus on **performance**, **security**, and **scalability**, utilizing the latest web development technologies:

- **[NestJS](https://nestjs.com/):** A robust Node.js framework for building efficient and scalable server-side applications.
- **[Drizzle ORM](https://orm.drizzle.team/):** High-performance, type-safe TypeScript ORM for seamless database management.
- **[PostgreSQL](https://www.postgresql.org/):** The world's most advanced open-source relational database.
- **[Swagger](https://swagger.io/):** Interactive API documentation for smooth integration.
- **[Pino](https://getpino.io/):** Extremely fast logging system for Node.js.
- **[Helmet](https://helmetjs.github.io/):** Enhanced security for HTTP headers.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or higher recommended)
- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)

### Environment Setup

1. Clone the repository.
2. Create your `.env` file:
   ```bash
   cp .env.example .env
   ```
3. Configure the environment variables in the `.env` file (DATABASE_URL, etc.).

### Installation and Run

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Start the database with Docker:
   ```bash
   docker-compose up -d
   ```
3. Run database migrations:
   ```bash
   pnpm db:push
   ```
4. Start the server in development mode:
   ```bash
   pnpm dev
   ```

The server will be available at `http://localhost:3000/api`.

---

## 📖 API Documentation

Interactive documentation (Swagger) is available to facilitate development and testing:

🔗 **Documentation URL:** `http://localhost:3000/docs`

There you can find all available endpoints, data models, and response codes.

---

## 🏗️ Project Structure

The project follows a modular and organized structure based on NestJS best practices:

```text
src/
├── core/             # Core functionality and global configuration
│   ├── config/       # Validated environment configuration
│   └── database/     # Database layer (Drizzle ORM, schema, connection)
├── modules/          # Feature-specific modules (e.g. health)
├── shared/           # Shared utilities, filters, decorators, etc.
├── app.module.ts     # Main application module
├── main.ts           # Application entry point & configuration
└── metadata.ts       # Swagger and plugin metadata
```

---

## 🔐 Security & Best Practices

- **Throttling:** Protection against brute-force attacks.
- **Helmet:** Protection against common web vulnerabilities.
- **Data Validation:** Use of `class-validator` to ensure entry integrity.
- **Versioning:** API versioned via URI (`/api/v1/...`).

---
