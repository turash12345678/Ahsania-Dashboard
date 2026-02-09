---
description: deployment workflow rules
---

# Deployment Workflow Rules

1.  **DEFAULT BRANCH**: Always work on the `dev` branch.
    *   Command: `git checkout dev`
2.  **ROUTINE DEPLOYMENT**: When the user asks to "deploy", "save", or "fix" something, **ALWAYS push to `dev`**.
    *   Command: `git push origin dev`
    *   URL: `https://admin-ahsania-git-dev-turashahsan8-5636s-projects.vercel.app`
3.  **FINAL DEPLOYMENT**: Only when the user explicitly says **"Final Deploy"** or **"Deploy to Main"**:
    *   Merge `dev` into `main`.
    *   Push `main` to production.
    *   Command Sequence:
        ```bash
        git checkout main
        git merge dev
        git push origin main
        git checkout dev
        ```
    *   URL: `https://admin-ahsania.vercel.app/`
