# Vercel browser-only demo

This deployment is a **Simulated demo**, not a secure multi-user service. It needs no database, storage integration, API key, or environment variables. Only use fictional information and disposable demo passwords.

## Deploy from GitHub

1. Commit the browser-demo changes and push them to `Madhur20/Rova`. Nothing needs to be pushed to the teammate's repository.
2. In Vercel, choose **Add New → Project**, import `Madhur20/Rova`, and select the branch containing these changes. Merge that branch into `main` before using `main` for production.
3. Keep the root directory at the repository root and the framework at **Next.js**. `vercel.json` supplies `npm ci` and `npm run build`. Keep the default Next.js output directory; this is not an `out/` static export.
4. Use **Node.js 24.x** (also declared in `package.json` and `.nvmrc`). No environment variables are required. In particular, do not set `NEXT_PUBLIC_ROVA_MODE=server` on Vercel.
5. Deploy. No paid storage resources are needed. Do not approve paid upgrades to follow these instructions.
6. Open the resulting HTTPS URL and perform the acceptance checks below. A successful build alone does not prove the hosted flow works.

Official references: [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs), [project settings](https://vercel.com/docs/project-configuration/general-settings), [Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

## Sample access

| Role | Email | Password |
| --- | --- | --- |
| Teacher | `teacher@rova.school` | `rova2026` |
| Student | `student@rova.school` | `rova2026` |
| Parent | `parent@rova.school` | `rova2026` |

Sign-up also works locally inside this browser: student class code `MAPLE4`, parent family code `MAYA4` (or the demo student's profile code). These are simulated accounts, not real authentication. New demo passwords are salted/derived rather than saved as plaintext, but the browser owner can inspect/edit all accounts and data. Do not reuse a real password.

## Storage and rehearsal

- Workspace, accounts, attempts, conversations, lessons, notes, and checklist state live under the versioned `rova-product-demo-v1` **localStorage** key.
- Each tab's simulated login lives in **sessionStorage**, so teacher, student, and parent can be open side-by-side without signing each other out. Opening a different role in a duplicated tab may initially inherit the duplicated tab's login; sign out in that tab and log in again.
- Same-origin tabs share workspace changes. The app refreshes on storage changes, focus, and every five seconds. Web Locks serialize read/modify/write operations across tabs.
- Uploaded PDF, Word, and text files live in this browser's **IndexedDB**, not Vercel. Only the simulated teacher view offers downloads. This is presentation filtering, not security against someone using developer tools. The 10 MB file limit does not pass through a Vercel Function.
- Expand **Simulated demo** in the workspace footer (or on the login screen) for implementation information and **Reset demo**. Reset asks for confirmation, restores the sample classroom, removes this demo's uploaded files and created accounts, and invalidates all tabs' simulated sessions. Other websites' or apps' storage is untouched. No technical banner interrupts lessons or dashboards.
- A refresh preserves saved work. New devices, browser profiles, incognito sessions, different domains, and preview URLs have separate data. Closing a tab ends its login; browser session restore behavior may restore it.
- Browser quotas/private-mode restrictions can prevent saving. Errors are shown instead of silently clearing progress. Corrupt state is kept until the presenter explicitly resets it. Clearing site data removes the demo permanently.
- Use a current browser on HTTPS (or localhost). The demo requires localStorage, sessionStorage, IndexedDB, Web Crypto, and Web Locks.
- Existing `.rova/workspace.json` data is not imported automatically. It remains untouched on your computer. The hosted demo starts from fictional seeds.

## Acceptance checks

1. Open `/login`, sign in as teacher, share a fractions lesson with Maya.
2. Open a second tab, sign out there if it inherited the teacher's session, then use the student account. Confirm Maya sees the assignment. Type a greeting then a correct answer: it should remain independent; ask for a real hint on the next question: it should count as support.
3. Finish the chosen lesson. Refresh both tabs. Confirm the teacher sees completion, saved conversation, and code-derived progress.
4. In a third tab, sign in as parent. Confirm the teacher's family note and child's progress appear without chat transcripts or safety messages.
5. In teacher Question bank, add a text/PDF file. Refresh and download it. Remove the material and confirm it is gone.
6. Test a safety phrase only with fictional data in a rehearsal: the teacher sees the explicit safety banner. This is an in-browser flag, not a notification to a real teacher or an emergency service.
7. Confirm Reset demo clears this demo, restores sample data, and signs out the other tabs. Test canceling reset first.
8. Open the deployment in an incognito window: it must start with its own untouched sample data.

## Local commands

```bash
nvm use
npm ci
npm run dev
npm test
npm run lint
npm run build
```

The browser demo is the default locally and when deployed. Optional **local-only** server mode uses `NEXT_PUBLIC_ROVA_MODE=server` in `.env.local` and `ROVA_DATA_DIR`; restart/rebuild after changing it. File-backed account/learning/material APIs explicitly refuse requests on Vercel rather than attempting filesystem writes. The old server mode is not a production hosting option.

No deployment or cloud resources are created by these files. Before real users: secure server-side identity/authorization, durable shared storage and file storage, privacy review, proper tenant isolation, and operational safeguards are required.
