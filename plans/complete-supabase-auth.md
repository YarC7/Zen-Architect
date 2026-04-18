# Implementation Plan - Complete Supabase Auth

This document outlines the steps to implement a complete authentication system using Supabase Auth for the ZenArc project.

## User Requirements
- Email/Password authentication.
- No public sign-up; admin users manually create accounts for others.
- Route protection for all paths under `(workspace)`.
- Pure Supabase Auth (no Prisma).

## Proposed Architecture
- **Middleware-based Protection**: Use Next.js Middleware to verify sessions and handle redirects.
- **Server Actions**: Handle login, logout, and admin-level user creation.
- **Supabase SSR**: Utilize `@supabase/ssr` for seamless session management in App Router.

## Phase 1: Authentication Logic & Actions
- [ ] **Auth Actions** (`app/auth/actions.ts`):
    - `signInAction`: Validate credentials and call `supabase.auth.signInWithPassword`.
    - `signOutAction`: Call `supabase.auth.signOut` and redirect to login.
- [ ] **Admin Actions** (`app/actions/admin.ts`):
    - `adminCreateUser`: A server-side action using the `service_role` key to bypass RLS and Auth restrictions to create new users.

## Phase 2: UI Implementation
- [ ] **Login Page** (`app/(auth)/login/page.tsx`):
    - Create a clean, premium login form using existing UI components.
    - Implement error handling and loading states.
- [ ] **User Management UI** (Update `app/(workspace)/users/page.tsx`):
    - Add/update functionality to allow admin users to trigger the `adminCreateUser` action.

## Phase 3: Route Protection (Middleware)
- [ ] **Middleware Update** (`middleware.ts` / `utils/supabase/middleware.ts`):
    - Logic: If path starts with `(workspace)` components and user is NOT authenticated -> Redirect to `/login`.
    - Logic: If user IS authenticated and tries to access `/login` -> Redirect to `/`.

## Phase 4: Verification
- [ ] Test login flow.
- [ ] Test illegal access to workspace routes.
- [ ] Test admin user creation functionality.

---
**Status**: Ready to begin Phase 1.
