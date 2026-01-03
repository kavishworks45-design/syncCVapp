# Deploying SyncCV to Vercel

## Prerequisites
- A [GitHub](https://github.com/) account.
- A [Vercel](https://vercel.com/) account (you can sign up with GitHub).

## Step 1: Push Code to GitHub
1.  Initialize a Git repository in the `ResumeMaker` folder if you haven't already:
    ```bash
    git init
    git add .
    git commit -m "Initial commit for SyncCV"
    ```
2.  Create a **New Repository** on GitHub.
3.  Push your code:
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
    git branch -M main
    git push -u origin main
    ```

## Step 2: Import into Vercel
1.  Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Select your GitHub repository (`ResumeMaker` or whatever you named it) and click **Import**.

## Step 3: Configure Project
Vercel will detect `vercel.json` and configure most things automatically. You just need to set the environment variables.

1.  **Framework Preset**: Leave as "Other" or "Vite" (Vercel usually auto-detects Vite).
2.  **Root Directory**: Leave as `./` (Root).
3.  **Environment Variables**:
    Expand the "Environment Variables" section and add the following:
    
    | Key | Value |
    |-----|-------|
    | `GEMINI_API_KEY` | `AIza...` (Your actual Google Gemini API Key) |
    | `VITE_API_BASE_URL` | leave empty or set to `/` (Since we handle routing internally via vercel.json) |

4.  Click **Deploy**.

## Step 4: Verify
- Vercel will build the frontend and set up the backend serverless functions.
- Once done, you will get a URL (e.g., `https://synccv.vercel.app`).
- **Test it**: Open the URL, log in with Google, and try tailoring a resume!
