# Sir Ahmed Yekini – Computing Assistant

A mobile-friendly JHS 1–3 Computing tutor powered by the Gemini API.

## Free deployment

This project is designed for Vercel Hobby + a Gemini API free-tier model.

1. Create a Google AI Studio API key.
2. Create a GitHub repository and upload all files in this folder.
3. Import the repository into Vercel.
4. In Vercel Project Settings → Environment Variables, add:
   - Name: `GEMINI_API_KEY`
   - Value: your Google AI Studio API key
5. Redeploy.
6. Open the Vercel URL and test the chat.

Never put your Gemini API key inside `index.html` or `app.js`. It belongs only in the server-side environment variable.

## Local development

Install Node.js and Vercel CLI, then run:

    npm install -g vercel
    vercel dev

Set the environment variable before running locally.

## Next versions

- Add a structured JHS 1–3 Computing curriculum/knowledge base.
- Add quiz mode and scoring.
- Add teacher/admin dashboard.
- Add conversation history.
- Add WhatsApp integration through the WhatsApp Business Platform.
