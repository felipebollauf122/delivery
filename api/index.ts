// Vercel Serverless Function — re-exports the Express app from
// netlify/functions/api.ts so both Netlify and Vercel deployments stay in sync.
// Vercel invokes the default export with (req, res); Express is exactly that.
import app from "../netlify/functions/api";

export default app;
