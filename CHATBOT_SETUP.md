# Chatbot Setup — Read This Before Deploying

The chatbot is fully built and wired up, but it needs one manual step from you
on Vercel — the OpenAI key is never stored in any file in this project.

## 1. Set the environment variable in Vercel

1. Go to your project on vercel.com
2. Project → Settings → Environment Variables
3. Add a new variable:
   - Name: `OPENAI_API_KEY`
   - Value: your OpenAI key
   - Environment: Production (and Preview, if you want it working on preview deploys too)
4. Save, then redeploy the project (Vercel → Deployments → ⋯ → Redeploy)

That's it. The function at `/api/chat.js` reads `process.env.OPENAI_API_KEY` at
request time — the key lives only on Vercel's servers and is never sent to the
browser.

## 2. About the key you pasted in this chat

Since the key was shared directly in this conversation rather than typed
straight into Vercel's dashboard, it's now sitting in a chat log. That's not
the end of the world, but as good hygiene: consider regenerating a fresh key
in your OpenAI dashboard (API keys → revoke the old one → create a new one)
and using the new one in Vercel. Going forward, paste keys directly into
Vercel/your host's environment variable settings rather than into chat, here
or anywhere else.

## 3. What's in this project

- `chatbot.js` — the widget itself (floating button + panel). No key, no
  secrets — it only ever talks to your own `/api/chat` endpoint.
- `api/chat.js` — a Vercel Serverless Function. This is the *only* file that
  uses the OpenAI key, and it reads it from the environment variable above.
- The widget is already linked on all 17 pages.

## 4. Testing after deploy

Once the environment variable is set and redeployed, open your live site,
click the chat bubble (bottom-right), and send a message. If something's
misconfigured, the bot will show a friendly fallback message rather than
failing silently — check Vercel's function logs (Project → Deployments →
your deployment → Functions → `/api/chat`) if you want to see the underlying
error.

## 5. Cost control already built in

- Conversations are capped to the last 12 messages sent to OpenAI per
  request, so long conversations don't balloon in cost.
- Responses are capped at 400 tokens.
- The system prompt keeps the bot on-topic (Eazify only), which also keeps
  responses short and cheap rather than open-ended.
