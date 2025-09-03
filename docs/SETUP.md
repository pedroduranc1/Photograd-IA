# Photograd-IA Setup Guide

This guide will help you set up Supabase authentication and Turso database for your Photograd-IA application.

## Prerequisites

1. Node.js and npm installed
2. Expo CLI installed (`npm install -g @expo/cli`)
3. A Supabase account and project
4. A Turso account and database

## Environment Variables Setup

1. Copy the environment variables template:
   ```bash
   cp .env.example .env
   ```

2. Fill in your environment variables in `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_TURSO_DATABASE_URL=your_turso_database_url
   EXPO_PUBLIC_TURSO_AUTH_TOKEN=your_turso_auth_token
   ```

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in your project details
4. Wait for the project to be created

### 2. Get Your Supabase Credentials

1. In your Supabase dashboard, go to Settings > API
2. Copy the "Project URL" and "anon public" key
3. Add them to your `.env` file

### 3. Configure Authentication

1. In your Supabase dashboard, go to Authentication > Settings
2. Configure your authentication providers as needed
3. Set up email templates under Authentication > Email Templates

## Turso Setup

### 1. Create a Turso Database

1. Install the Turso CLI:
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   ```

2. Authenticate with Turso:
   ```bash
   turso auth login
   ```

3. Create a new database:
   ```bash
   turso db create photograd-ia
   ```

4. Get your database URL:
   ```bash
   turso db show photograd-ia --url
   ```

5. Create an auth token:
   ```bash
   turso db tokens create photograd-ia
   ```

6. Add the URL and token to your `.env` file

## Installation and Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. The database tables will be automatically created when you first run the app.

## Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Choose your platform:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Press `w` for web

## Testing Authentication

1. Open the app
2. You should see the sign-in screen
3. Create a new account using the sign-up screen
4. Check your email for verification (if enabled in Supabase)
5. Sign in with your credentials

## Database Structure

The application automatically creates the following tables in Turso:

- `user_profiles` - Extended user profile information
- `photos` - Photo metadata and processing status
- `processing_jobs` - Background processing job tracking

## Troubleshooting

### Common Issues

1. **Environment variables not loading**: Make sure your `.env` file is in the root directory and properly formatted.

2. **Supabase connection issues**: Verify your project URL and anon key are correct.

3. **Turso connection issues**: Check that your database URL and auth token are valid.

4. **Database table creation fails**: Ensure your Turso auth token has write permissions.

### Debug Mode

To enable debug logging, add this to your `.env` file:
```
EXPO_PUBLIC_DEBUG=true
```

## Security Notes

- Never commit your `.env` file to version control
- Use different databases for development and production
- Regularly rotate your auth tokens
- Enable Row Level Security (RLS) in Supabase for production

## Next Steps

Once everything is set up:

1. Customize the authentication flow to match your brand
2. Add photo upload functionality
3. Implement photo processing features
4. Set up push notifications
5. Add analytics and monitoring

For more information, check out:
- [Supabase Documentation](https://supabase.com/docs)
- [Turso Documentation](https://docs.turso.tech/)
- [Expo Documentation](https://docs.expo.dev/)