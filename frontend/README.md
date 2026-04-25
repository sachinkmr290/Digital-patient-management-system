# Frontend (React + Vite)

Quickstart:

1. Install dependencies

```bash
cd frontend
npm install
```

2. Create `.env` from `.env.example` and set `VITE_API_URL` and Cloudinary vars.

3. Start development server

```bash
npm run dev
```

Notes:
- The frontend uploads images directly to Cloudinary using an unsigned `upload_preset`. Configure an upload preset in your Cloudinary dashboard and set `VITE_CLOUDINARY_UPLOAD_PRESET`.
- API base URL is read from `VITE_API_URL`.

Deployment (Vercel):

1. Push the repo to GitHub.
2. In Vercel, create a new project and point it to this repo. Set the project root to the `frontend` folder.
3. Add the following Environment Variables in Vercel:
	- `VITE_API_URL` (e.g., `https://your-backend.onrender.com`)
	- `VITE_CLOUDINARY_CLOUD_NAME`
	- `VITE_CLOUDINARY_UPLOAD_PRESET`
4. Vercel will build and deploy automatically (build command: `npm run build`).

If you'd like, I can also add a `vercel.json` file or GitHub Action to automate deploys.
