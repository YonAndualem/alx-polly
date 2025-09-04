# ALX Polly: A Secure Polling Application

Welcome to ALX Polly, a production-ready polling application built with modern web technologies and enterprise-level security practices. This application demonstrates secure full-stack development with comprehensive authentication, authorization, and data protection.

## 🔒 Security Audit Complete

**This application has undergone a comprehensive security audit and all identified vulnerabilities have been remediated.**

For detailed information about the security improvements, see: [SECURITY_AUDIT.md](./SECURITY_AUDIT.md)

### Security Improvements Implemented:
- ✅ **Admin Panel Authorization**: Proper role-based access control
- ✅ **IDOR Protection**: Ownership verification for all CRUD operations  
- ✅ **Input Validation**: Comprehensive validation and sanitization
- ✅ **Authentication Bypass Prevention**: Server-side authentication checks
- ✅ **Vote Manipulation Protection**: Duplicate vote prevention and validation

## 📋 Table of Contents

- [About the Application](#about-the-application)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Database Configuration](#database-configuration)
- [Running the Application](#running-the-application)
- [Usage Examples](#usage-examples)
- [API Documentation](#api-documentation)
- [Security Architecture](#security-architecture)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🎯 About the Application

ALX Polly is a feature-rich polling platform that allows users to create, share, and participate in polls with enterprise-grade security. The application showcases modern web development practices with a focus on security, scalability, and user experience.

### Key Capabilities:
- **Secure User Authentication**: Registration, login, and session management
- **Poll Management**: Create, edit, delete, and share polls with rich validation
- **Voting System**: Secure voting with duplicate prevention and real-time results
- **Admin Dashboard**: Administrative interface for system oversight
- **Responsive Design**: Mobile-first design with modern UI components
- **Real-time Updates**: Live poll results and immediate UI feedback

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/) for type safety
- **UI Library**: [React 19](https://react.dev/) with Server Components
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- **Components**: [shadcn/ui](https://ui.shadcn.com/) for modern UI components
- **Icons**: [Lucide React](https://lucide.dev/) for consistent iconography

### Backend & Database
- **Backend**: [Supabase](https://supabase.io/) for authentication and database
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth with email verification
- **Real-time**: Supabase real-time subscriptions (ready for implementation)

### Development & Security
- **Validation**: [Zod](https://zod.dev/) for runtime type validation
- **Forms**: [React Hook Form](https://react-hook-form.com/) with validation
- **Security**: Input sanitization, CSRF protection, secure session management
- **TypeScript**: Strict type checking for enhanced code quality

## ✨ Features

### 🔐 Authentication & Authorization
- **User Registration**: Secure account creation with email verification
- **User Login**: Credential-based authentication with session management
- **Role-Based Access**: Admin and user roles with appropriate permissions
- **Session Management**: Automatic token refresh and secure logout

### 📊 Poll Management
- **Create Polls**: Rich poll creation with 2-10 customizable options
- **Edit Polls**: Update poll content with ownership verification
- **Delete Polls**: Secure poll deletion with cascading vote removal
- **Poll Sharing**: Generate shareable links for poll distribution

### 🗳️ Voting System
- **Secure Voting**: One vote per user with duplicate prevention
- **Anonymous Voting**: Optional guest voting capability
- **Real-time Results**: Live vote tallies and percentage calculations
- **Vote Validation**: Input validation and option verification

### 👑 Admin Features
- **System Overview**: View all polls across the platform
- **Content Moderation**: Admin-only poll deletion capabilities
- **User Management**: Monitor user activity and poll ownership
- **Audit Trail**: Comprehensive logging of admin actions

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v20.x or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Git** for version control
- **Supabase Account** - [Sign up here](https://supabase.io/)

### Quick Start

1. **Clone the Repository**
   ```bash
   git clone https://github.com/YonAndualem/alx-polly.git
   cd alx-polly
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set Up Environment Variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Configure Database**
   - Set up your Supabase project
   - Run the provided SQL schema
   - Configure Row Level Security policies

5. **Start Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Open Your Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Environment Setup

### Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Admin Configuration (Optional)
# Comma-separated list of admin email addresses
ADMIN_EMAILS=admin@alxpolly.com,your-admin-email@domain.com
```

### Getting Supabase Credentials

1. **Create a Supabase Project**
   - Go to [supabase.io](https://supabase.io/)
   - Create a new project
   - Wait for the database to be ready

2. **Get Your Credentials**
   - Navigate to Project Settings → API
   - Copy the Project URL and anon/public key
   - Paste them into your `.env.local` file

3. **Configure Authentication**
   - Go to Authentication → Settings
   - Configure your site URL: `http://localhost:3000`
   - Set up email templates (optional)

## 🗄️ Database Configuration

### Database Schema

Run the following SQL in your Supabase SQL editor to set up the required tables:

```sql
-- Create polls table
CREATE TABLE polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL CHECK (char_length(question) <= 500),
  options TEXT[] NOT NULL CHECK (array_length(options, 1) BETWEEN 2 AND 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create votes table
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Ensure valid option index
  CHECK (option_index >= 0),
  
  -- Prevent duplicate voting by authenticated users
  UNIQUE(poll_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_polls_user_id ON polls(user_id);
CREATE INDEX idx_polls_created_at ON polls(created_at DESC);
CREATE INDEX idx_votes_poll_id ON votes(poll_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);

-- Enable Row Level Security
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for polls table
CREATE POLICY "Anyone can view polls" ON polls
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own polls" ON polls
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own polls" ON polls
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own polls" ON polls
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for votes table
CREATE POLICY "Anyone can view votes" ON votes
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create votes" ON votes
  FOR INSERT WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_polls_updated_at
  BEFORE UPDATE ON polls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Storage Configuration (Optional)

If you plan to add file uploads for poll images:

```sql
-- Create a bucket for poll images
INSERT INTO storage.buckets (id, name, public) VALUES ('poll-images', 'poll-images', true);

-- Allow authenticated users to upload images
CREATE POLICY "Users can upload poll images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'poll-images' AND auth.role() = 'authenticated');

-- Allow public access to poll images
CREATE POLICY "Anyone can view poll images" ON storage.objects
  FOR SELECT USING (bucket_id = 'poll-images');
```

## 🏃‍♂️ Running the Application

### Development Mode

```bash
# Start the development server
npm run dev

# The application will be available at:
# http://localhost:3000
```

### Production Build

```bash
# Create a production build
npm run build

# Start the production server
npm start
```

### Linting and Type Checking

```bash
# Run ESLint
npm run lint

# Run TypeScript type checking
npx tsc --noEmit
```

## 📖 Usage Examples

### Creating a Poll

1. **Navigate to Create Poll**
   - Click "Create Poll" in the navigation or go to `/create`
   - Ensure you're logged in (redirect to login if not)

2. **Fill Out Poll Form**
   ```typescript
   // Example poll data
   {
     question: "What's your favorite programming language?",
     options: ["JavaScript", "Python", "TypeScript", "Go"]
   }
   ```

3. **Submit and Share**
   - Poll is created and you're redirected to your polls list
   - Use the share functionality to distribute your poll

### Voting on a Poll

1. **Access Poll**
   - Navigate to poll URL: `/polls/[poll-id]`
   - Polls are publicly viewable

2. **Cast Your Vote**
   - Select your preferred option
   - Click "Submit Vote"
   - View real-time results (if you've already voted)

3. **View Results**
   - Results show percentages and vote counts
   - Updates automatically as new votes come in

### Administrative Tasks

1. **Access Admin Panel**
   - Ensure your email is in the admin list
   - Navigate to `/admin`
   - View all polls in the system

2. **Moderate Content**
   - Review polls for inappropriate content
   - Delete polls if necessary (admin privilege required)
   - Monitor user activity and poll statistics

## 📚 API Documentation

### Authentication Endpoints

#### `POST /api/auth/login`
Authenticate user with email and password.

```typescript
// Request body
{
  email: string;
  password: string;
}

// Response
{
  error: string | null;
}
```

#### `POST /api/auth/register`
Create new user account.

```typescript
// Request body
{
  name: string;
  email: string;
  password: string;
}

// Response
{
  error: string | null;
}
```

### Poll Management

#### `POST /api/polls/create`
Create a new poll (authenticated users only).

```typescript
// FormData fields
{
  question: string; // 1-500 characters
  options: string[]; // 2-10 options, each 1-200 characters
}

// Response
{
  error: string | null;
}
```

#### `GET /api/polls/user`
Get polls owned by current user.

```typescript
// Response
{
  polls: Poll[];
  error: string | null;
}
```

#### `GET /api/polls/[id]`
Get specific poll by ID.

```typescript
// Response
{
  poll: Poll | null;
  error: string | null;
  canEdit: boolean;
}
```

### Voting

#### `POST /api/votes/submit`
Submit a vote for a poll option.

```typescript
// Request body
{
  pollId: string;
  optionIndex: number; // 0-based index
}

// Response
{
  error: string | null;
}
```

## 🔐 Security Architecture

### Authentication Flow

1. **User Registration**
   - Email/password validation
   - Account creation in Supabase
   - Email verification sent
   - Account activated upon verification

2. **User Login**
   - Credential validation
   - Session creation
   - JWT token generation
   - Secure cookie storage

3. **Session Management**
   - Automatic token refresh
   - Middleware-based route protection
   - Secure logout and cleanup

### Authorization Model

- **Public Access**: View polls and vote (anonymous or authenticated)
- **User Access**: Create, edit, delete own polls
- **Admin Access**: View and moderate all content

### Data Protection

- **Input Validation**: All user inputs validated and sanitized
- **SQL Injection Prevention**: Parameterized queries via Supabase
- **XSS Protection**: React's built-in XSS prevention + validation
- **CSRF Protection**: SameSite cookies and token validation

## 🧪 Testing

### Manual Testing Checklist

#### Authentication
- [ ] User registration with email verification
- [ ] User login with valid credentials
- [ ] User login with invalid credentials
- [ ] Automatic redirect to login for protected routes
- [ ] Session persistence across browser reload
- [ ] Secure logout and session cleanup

#### Poll Management
- [ ] Create poll with valid data
- [ ] Create poll with invalid data (validation errors)
- [ ] Edit own poll successfully
- [ ] Attempt to edit another user's poll (should fail)
- [ ] Delete own poll successfully
- [ ] Attempt to delete another user's poll (should fail)

#### Voting System
- [ ] Vote on poll as authenticated user
- [ ] Vote on poll as guest (if enabled)
- [ ] Attempt duplicate voting (should fail)
- [ ] Vote with invalid option index (should fail)
- [ ] View real-time results after voting

#### Admin Functions
- [ ] Access admin panel with admin account
- [ ] Access admin panel with regular account (should fail)
- [ ] View all polls in system
- [ ] Delete any poll as admin
- [ ] Admin functions properly secured

### Automated Testing Setup

```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom jest

# Run tests (when implemented)
npm test
```

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Prepare for Deployment**
   ```bash
   # Ensure all environment variables are set
   # Run production build locally to test
   npm run build
   ```

2. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel --prod
   ```

3. **Set Environment Variables**
   - Add all environment variables in Vercel dashboard
   - Update Supabase site URL to your production domain

### Docker Deployment

```dockerfile
# Dockerfile example
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Environment-Specific Configurations

```bash
# Development
NEXT_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
NEXTAUTH_URL=http://localhost:3000

# Production
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXTAUTH_URL=https://your-domain.com
```

## 🤝 Contributing

We welcome contributions to ALX Polly! Please follow these guidelines:

### Development Setup

1. **Fork the Repository**
   ```bash
   git clone https://github.com/your-username/alx-polly.git
   cd alx-polly
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Follow the existing code style
   - Add appropriate documentation
   - Include security considerations

4. **Test Your Changes**
   - Run the application locally
   - Test all affected functionality
   - Verify security measures

5. **Submit Pull Request**
   - Provide clear description of changes
   - Include any breaking changes
   - Reference related issues

### Code Standards

- **TypeScript**: Use strict type checking
- **ESLint**: Follow configured linting rules
- **Security**: Include security impact assessment
- **Documentation**: Update relevant documentation
- **Testing**: Add tests for new functionality

### Security Considerations

When contributing, please:
- Follow secure coding practices
- Validate all user inputs
- Implement proper authorization checks
- Consider potential security implications
- Document security-relevant changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** for providing excellent backend-as-a-service
- **Next.js** team for the amazing React framework
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** for beautiful UI components
- **ALX** for the learning opportunity

## 📞 Support

For support, please:
- Check the [documentation](#table-of-contents)
- Review [security guidelines](./SECURITY_AUDIT.md)
- Open an issue on GitHub
- Contact the maintainers

---

**✨ Built with security in mind - demonstrating how to create secure, production-ready web applications.**

**Made with ❤️ by the ALX Polly Team**

## About the Application

ALX Polly allows authenticated users to create, share, and vote on polls. It's a simple yet powerful application that demonstrates key features of modern web development:

-   **Authentication**: Secure user sign-up and login.
-   **Poll Management**: Users can create, view, and delete their own polls.
-   **Voting System**: A straightforward system for casting and viewing votes.
-   **User Dashboard**: A personalized space for users to manage their polls.

The application is built with a modern tech stack:

-   **Framework**: [Next.js](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Backend & Database**: [Supabase](https://supabase.io/)
-   **UI**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)
-   **State Management**: React Server Components and Client Components

---

## 🚀 The Challenge: Security Audit & Remediation

As a developer, writing functional code is only half the battle. Ensuring that the code is secure, robust, and free of vulnerabilities is just as critical. This version of ALX Polly has been intentionally built with several security flaws, providing a real-world scenario for you to practice your security auditing skills.

**Your mission is to act as a security engineer tasked with auditing this codebase.**

### Your Objectives:

1.  **Identify Vulnerabilities**:
    -   Thoroughly review the codebase to find security weaknesses.
    -   Pay close attention to user authentication, data access, and business logic.
    -   Think about how a malicious actor could misuse the application's features.

2.  **Understand the Impact**:
    -   For each vulnerability you find, determine the potential impact.Query your AI assistant about it. What data could be exposed? What unauthorized actions could be performed?

3.  **Propose and Implement Fixes**:
    -   Once a vulnerability is identified, ask your AI assistant to fix it.
    -   Write secure, efficient, and clean code to patch the security holes.
    -   Ensure that your fixes do not break existing functionality for legitimate users.

### Where to Start?

A good security audit involves both static code analysis and dynamic testing. Here’s a suggested approach:

1.  **Familiarize Yourself with the Code**:
    -   Start with `app/lib/actions/` to understand how the application interacts with the database.
    -   Explore the page routes in the `app/(dashboard)/` directory. How is data displayed and managed?
    -   Look for hidden or undocumented features. Are there any pages not linked in the main UI?

2.  **Use Your AI Assistant**:
    -   This is an open-book test. You are encouraged to use AI tools to help you.
    -   Ask your AI assistant to review snippets of code for security issues.
    -   Describe a feature's behavior to your AI and ask it to identify potential attack vectors.
    -   When you find a vulnerability, ask your AI for the best way to patch it.

---

## Getting Started

To begin your security audit, you'll need to get the application running on your local machine.

### 1. Prerequisites

-   [Node.js](https://nodejs.org/) (v20.x or higher recommended)
-   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
-   A [Supabase](https://supabase.io/) account (the project is pre-configured, but you may need your own for a clean slate).

### 2. Installation

Clone the repository and install the dependencies:

```bash
git clone <repository-url>
cd alx-polly
npm install
```

### 3. Environment Variables

The project uses Supabase for its backend. An environment file `.env.local` is needed.Use the keys you created during the Supabase setup process.

### 4. Running the Development Server

Start the application in development mode:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

Good luck, engineer! This is your chance to step into the shoes of a security professional and make a real impact on the quality and safety of this application. Happy hunting!
