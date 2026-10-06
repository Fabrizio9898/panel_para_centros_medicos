# Clerk Setup Guide

This guide covers the setup and configuration of Clerk authentication used in this starter template.

## Clerk Scopes Required

- **Authentication** - User sign-in/sign-up and session management

## Setup Instructions

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application or select your existing one
3. Copy your API keys into your `.env.local` file:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

4. Set the redirect URLs:

```env
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/auth/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/auth/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard/overview"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard/overview"
```

## Usage in Code

**Server-side auth checks:**

```typescript
import { auth } from '@clerk/nextjs/server';

const { userId } = await auth();
if (!userId) redirect('/auth/sign-in');
```

**Client-side components:**

The sign-in and sign-up pages use Clerk's `<SignIn />` and `<SignUp />` components in `src/features/auth/components/`.

**Route protection:**

`src/proxy.ts` uses `clerkMiddleware` to protect all `/dashboard(.*)` routes.