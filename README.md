# Attendance Please Frontend

Next.js frontend for Attendance Please, with Microsoft Entra ID (Azure OAuth 2.0) sign-in and Orval-generated API hooks.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5176
NEXT_PUBLIC_AZURE_TENANT_ID=2f2dcb5d-f3e1-4f33-8584-dcacd25d604d
NEXT_PUBLIC_AZURE_CLIENT_ID=562c6df4-0ce8-4165-8969-f300f4c1842a
NEXT_PUBLIC_AZURE_SCOPE=api://562c6df4-0ce8-4165-8969-f300f4c1842a/api_access
NEXT_PUBLIC_AZURE_REDIRECT_URI=http://localhost:5173/auth
NEXT_PUBLIC_AZURE_POST_LOGOUT_REDIRECT_URI=http://localhost:5173/login
```

3. Start the app:

```bash
npm run dev
```

The dev server runs on `http://127.0.0.1:5173`.

## Authentication Notes

- Sign-in is handled via `@azure/msal-react` and `@azure/msal-browser`.
- API calls from Orval-generated hooks go through `customInstance` and automatically attach a bearer token when available.
- Ensure backend JWT validation is configured for Microsoft Entra ID tokens and the scope above.

## API Client Generation

Regenerate API hooks/models from `v1.json`:

```bash
npm run generate
```
