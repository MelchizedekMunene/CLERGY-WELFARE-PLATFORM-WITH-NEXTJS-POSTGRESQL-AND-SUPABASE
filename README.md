# 🙏 Shepherds Welfare Platform

A modern, secure web application designed to manage and support community welfare initiatives. Built with cutting-edge technologies and best practices for performance, security, and scalability.

![CI Pipeline](https://github.com/MelchizedekMunene/CLERGY-WELFARE-PLATFORM-WITH-NEXTJS-POSTGRESQL-AND-SUPABASE/actions/workflows/ci.yml/badge.svg)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Technologies Stack](#-technologies-stack)
- [Architecture](#-architecture)
- [Environment Configuration](#-environment-configuration)
- [Installation & Setup](#-installation--setup)
- [Development](#-development)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Available Scripts](#-available-scripts)
- [Contributing](#-contributing)

---

## 📖 Overview

The **Shepherds Welfare Platform** is a comprehensive welfare management system built to streamline community support operations. The platform provides:

- ✅ User authentication and authorization
- ✅ Contribution tracking (monthly, special, loan repayment)
 - ✅ Contribution tracking (monthly, special, investments)
 - ✅ Group asset/investment management
- ✅ Event coordination and management
- ✅ Role-based access control (Admin & Member)
- ✅ Real-time data synchronization
- ✅ Secure password hashing and JWT authentication

---

## 🛠️ Technologies Stack

### Frontend

- **Next.js 16.1.1** - React framework for production
- **React 19.2.3** - UI library
- **React DOM 19.2.3** - DOM rendering
- **TailwindCSS 4** - Utility-first CSS framework
- **Babel React Compiler** - Advanced React optimization

### Backend & Authentication

- **Next.js API Routes** - Serverless backend
- **NextAuth v4.24.13** - Authentication & session management
- **JWT (jsonwebtoken 9.0.3)** - Secure token management
- **Bcrypt 6.0.0** - Password hashing

### Database & ORM

- **PostgreSQL** - Primary relational database
- **Supabase** - Backend-as-a-Service with PostgreSQL hosting
- **Prisma 5.22.0** - Type-safe ORM for database queries
- **Supabase Auth Helpers** - Authentication integration

### Development & Code Quality

- **ESLint 9.39.2** - Code linting & quality
- **Prettier 3.7.4** - Code formatting
- **dotenv-cli 11.0.0** - Environment variable management
- **TypeScript support** - Type safety

### Infrastructure

- **Supabase Auth** - JWT-based authentication
- **GitHub Actions** - CI/CD pipeline
- **Node.js 20** - Runtime environment

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│           SHEPHERDS WELFARE PLATFORM (Next.js)          │
└─────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────┐
│              FRONTEND LAYER (React Components)            │
│  • Sign-In Page          • Dashboard                      │
│  • User Profile          • Event Management               │
│  • Contribution Tracking • Asset/Investment Management    │
└──────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────┐
│            MIDDLEWARE LAYER (NextAuth)                    │
│  • Session Management    • Token Verification            │
│  • Role-Based Access     • JWT Handling                   │
└──────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────┐
│           API ROUTES LAYER (Next.js API)                 │
│  • Authentication Routes    • User Routes                │
│  • Contribution Routes      • Asset/Investment Routes    │
│  • Event Routes             • Profile Routes             │
└──────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────┐
│         ORM LAYER (Prisma Type-Safe Queries)             │
│  • Query Builder    • Migration Management               │
│  • Type Validation  • Data Transformation                │
└──────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────┐
│    DATABASE LAYER (Supabase PostgreSQL)                  │
│  • Users Table             • Contributions Table          │
│  • Assets Table            • Events Table                 │
│  • Row-Level Security      • Real-time Subscriptions      │
└──────────────────────────────────────────────────────────┘
```

### Key Design Patterns

| Layer               | Pattern              | Technology               |
| ------------------- | -------------------- | ------------------------ |
| **Authentication**  | JWT + Session        | NextAuth + Supabase Auth |
| **Database Access** | ORM with Type Safety | Prisma                   |
| **API Design**      | RESTful Routes       | Next.js API Routes       |
| **Code Quality**    | Lint + Format        | ESLint + Prettier        |
| **Deployment**      | Automated CI/CD      | GitHub Actions           |

---

## 🔧 Environment Configuration

### Required Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_PROVIDERS=supabase,email

# Database Configuration (Prisma)
DATABASE_URL="postgresql://user:password@host:6543/database?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/database"

# Application Settings
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development
```

### Configuration Connections

**Database Connection Flow:**

1. `DATABASE_URL` - Uses connection pooling for API routes
2. `DIRECT_URL` - Direct connection for database migrations
3. Both connect to Supabase PostgreSQL instance
4. Prisma manages both connections automatically

**Authentication Flow:**

1. User credentials sent to `/api/auth/signin`
2. NextAuth verifies with Supabase Auth
3. JWT token generated and stored in secure session
4. Token included in subsequent API requests
5. Middleware validates token for protected routes

---

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** v20 or higher
- **npm** v10 or higher
- **Git** for version control
- **Supabase Account** for database and authentication
- **GitHub Account** for CI/CD workflows

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd shepherds-welfare-platform
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Copy the template and add your Supabase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase configuration from your project dashboard.

### Step 4: Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Seed database with sample data
npx prisma db seed
```

### Step 5: Verify Setup

```bash
# Check Prisma schema validity
npx prisma validate

# Lint code
npm run lint

# Format code
npm run format
```

---

## 💻 Development

### Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Hot Reload

The development server supports hot module reloading:

- Edit React components and see changes instantly
- Modify API routes and refresh to test
- CSS changes apply without full page reload

### Code Formatting & Linting

```bash
# Format all files with Prettier
npm run format

# Check formatting without changes
npm run format:check

# Run ESLint
npm run lint

# Fix linting errors automatically
npm run lint --fix
```

---

## 📁 Project Structure

```
shepherds-welfare-platform/
├── src/
│   ├── app/
│   │   ├── globals.css          # Global styles
│   │   ├── layout.js            # Root layout wrapper
│   │   ├── page.js              # Home page
│   │   ├── api/                 # API routes
│   │   │   ├── auth/            # Authentication endpoints
│   │   │   ├── users/           # User management
│   │   │   ├── contributions/   # Contribution tracking
│   │   │   ├── assets/          # Asset & investment management
│   │   │   └── events/          # Event management
│   │   └── Components/          # Reusable components
│
├── prisma/
│   └── schema.prisma            # Database schema & models
│
├── .github/
│   └── workflows/
│       └── ci.yml               # CI/CD pipeline
│
├── .env                         # Environment variables
├── .env.example                 # Environment template
├── package.json                 # Dependencies & scripts
├── next.config.mjs              # Next.js configuration
├── jsconfig.json                # JavaScript compiler options
├── tailwind.config.js           # Tailwind CSS config
├── postcss.config.mjs           # PostCSS configuration
├── .eslintrc.json               # ESLint rules
├── .prettierrc                  # Prettier formatting rules
└── README.md                    # This file
```

---

## 📊 Database Schema

The platform uses Prisma ORM with the following core models:

### Users

```prisma
model User {
  id               String
  email            String (unique)
  phone            String (unique)
  full_name        String
  role             Role (ADMIN | MEMBER)
  church_name      String?
  registration_date DateTime
  is_active        Boolean
  created_at       DateTime
  updated_at       DateTime
}
```

### Contributions

```prisma
model Contribution {
  id               String
  user_id          String (FK)
  amount           Float
  contribution_type ContributionType (MONTHLY | SPECIAL)
  contribution_date DateTime
  recorded_by      String (FK)
}
```

### Assets / Investments

```prisma
model Asset {
  id            String
  name          String
  description   String?
  purchase_date DateTime?
  purchase_price Float?
  current_value  Float?
}

model AssetInvestment {
  id           String
  asset_id     String (FK)
  total_amount Float
  acquired_at  DateTime
}
```

### Events

```prisma
model Event {
  id               String
  title            String
  description      String?
  event_type       EventType (MEETING | PROJECT | SOCIAL)
  event_date       DateTime
  location         String?
}
```

For the complete schema, see [prisma/schema.prisma](prisma/schema.prisma).

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

The project includes an automated CI/CD pipeline that:

1. **Checkout** - Retrieves the latest code
2. **Setup Node.js** - Configures Node.js v20 environment
3. **Install Dependencies** - Runs `npm ci` for consistency
4. **Lint Code** - Validates code quality with ESLint
5. **Format Check** - Ensures Prettier compliance
6. **Validate Schema** - Checks Prisma schema integrity
7. **Build Application** - Builds Next.js for production

### Workflow Triggers

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

### GitHub Secrets Configuration

Set these secrets in your GitHub repository settings:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add the following secrets:
   - `DATABASE_URL` - Your production database URL
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Your Supabase anonymous key

---

## 📦 Available Scripts

| Command                | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `npm run dev`          | Start development server (http://localhost:3000) |
| `npm run build`        | Build application for production                 |
| `npm start`            | Start production server                          |
| `npm run lint`         | Run ESLint code quality checks                   |
| `npm run format`       | Format code with Prettier                        |
| `npm run format:check` | Check code formatting without changes            |

---

## 🛡️ Security Features

- **JWT Authentication** - Stateless token-based auth
- **Password Hashing** - Bcrypt with salt rounds
- **NextAuth Sessions** - Secure session management
- **Environment Variables** - Sensitive data protection
- **Row-Level Security** - Supabase RLS policies
- **Prisma Type Safety** - SQL injection prevention
- **HTTPS Ready** - Production-ready security

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and commit: `git commit -m "Add feature"`
3. Push to your branch: `git push origin feature/your-feature`
4. Open a Pull Request for review

Please ensure all tests pass and code is properly formatted before submitting a PR.

---

## 📞 Support & Documentation

For more detailed information, see:

- [Backend Architecture Guide](../Backend%20Architecture%20Guide/ARCHITECTURE_REFERENCE.md)
- [Supabase Setup Guide](../Backend%20Architecture%20Guide/SUPABASE_SETUP_GUIDE.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

**Last Updated:** January 2025  
**Version:** 0.1.0  
**Status:** Active Development
