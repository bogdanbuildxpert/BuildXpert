# BuildXpert

BuildXpert is a comprehensive platform for construction painting professionals and clients to connect, post jobs, and manage projects.

## Features

- **User Authentication**: Secure login and registration with email verification
- **Job Posting**: Clients can post detailed job requirements
- **Job Applications**: Professionals can apply to jobs
- **Messaging System**: Real-time chat between clients and professionals
- **Admin Dashboard**: Comprehensive admin controls
- **Contact Form**: With automated email responses
- **Project Showcase**: Gallery of completed projects
- **Responsive Design**: Works on all devices

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Email**: Nodemailer
- **Deployment**: Vercel (recommended)
- **Storage**: Supabase

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/buildxpert.git
   cd buildxpert
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:

   ```
   # PostgreSQL Connection String
   DATABASE_URL="postgresql://username:password@localhost:5432/buildxpert?schema=public"
   DIRECT_URL="postgresql://username:password@localhost:5432/buildxpert?schema=public"

   # App URL
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   APP_URL="http://localhost:3000"

   # JWT Secret for Authentication
   JWT_SECRET="your-secret-key"

   # Email configuration
   EMAIL_SERVER_HOST="smtp.example.com"
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER="your-email@example.com"
   EMAIL_SERVER_PASSWORD="your-password"
   EMAIL_FROM_NAME="BuildXpert"

   # Supabase Storage
   NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

   # Prisma settings
   PRISMA_CLIENT_ENGINE_TYPE="library"
   ```

4. Set up the database:

   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Vercel Deployment

The recommended way to deploy BuildXpert is with Vercel:

1. Push your code to a GitHub repository
2. Import the project into Vercel
3. Set the environment variables in the Vercel dashboard
4. Deploy your project

### Database Troubleshooting

If you encounter database connection issues:

1. Check your connection string format:

   - Make sure it starts with `postgresql://` and not `prisma://`
   - Format should be `postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE`

2. Testing database connectivity:

   - Visit `/api/auth/test-db` endpoint to check database connection
   - Run `npm run check-db` locally to test direct connectivity

3. Common issues:
   - Firewall blocking connections to your database
   - Incorrect credentials in environment variables
   - Database server not allowing remote connections

## Setting Up Supabase for Image Storage

BuildXpert uses Supabase for storing and serving job images with automatic compression. Follow these steps to set up Supabase:

1. Create a free Supabase account at [https://supabase.com](https://supabase.com)
2. Create a new project and note your project URL and anon key
3. Set up storage:
   - Go to Storage in the Supabase dashboard
   - Create a new bucket called `app-images`
   - Set the bucket's privacy setting to public
   - Add these policies to the bucket to allow authenticated users to upload and manage files:
     - For SELECT: `true`
     - For INSERT: `auth.role() = 'authenticated'`
     - For UPDATE: `auth.uid() = owner_id`
     - For DELETE: `auth.uid() = owner_id`
4. Update your `.env` file with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

The application will automatically handle image compression before uploading and will store image URLs in the job metadata. Users can upload up to 10 images per job with a maximum file size of 5MB per image. Files are automatically compressed to optimize storage and loading speed.

## Project Structure

- `/app`: Next.js app router pages and API routes
- `/components`: Reusable React components
- `/lib`: Utility functions and shared code
- `/prisma`: Database schema and migrations
- `/public`: Static assets
- `/scripts`: Utility scripts for database and deployment

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

## Update

Last reset to commit 69f821f on: $(date) - Reset for deployment
