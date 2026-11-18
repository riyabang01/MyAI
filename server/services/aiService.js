import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const FREE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash'
];

async function fetchExactWikimediaImage(query) {
  try {
    const params = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrsearch: query.trim(),
      gsrlimit: '1',
      prop: 'pageimages',
      piprop: 'thumbnail',
      pithumbsize: '600',
      format: 'json',
      origin: '*'
    });

    const endpoint = ['https:/', 'en.wikipedia.org', 'w', 'api.php'].join('/');
    const res = await fetch(`${endpoint}?${params.toString()}`, {
      headers: { 'User-Agent': 'MyAIMernBuilder/1.0' }
    });

    const data = await res.json();
    const pages = data?.query?.pages;

    if (pages) {
      const firstPage = Object.values(pages);
      if (firstPage?.thumbnail?.source) {
        return firstPage.thumbnail.source;
      }
    }
  } catch (err) {
    console.warn(`Image lookup failed for "${query}":`, err.message);
  }

  const fallbackHost = ['https:/', 'placehold.co', '600x400', '1e293b', 'ffffff'].join('/');
  return `${fallbackHost}?text=${encodeURIComponent(query.trim())}`;
}

async function resolveExactImagesInFiles(files) {
  const regex = /IMAGE_QUERY:([^"'`\n\r}]+)/g;
  const cache = new Map();

  for (const file of files) {
    if (!file.code || !file.code.includes('IMAGE_QUERY:')) continue;

    const matches = [...file.code.matchAll(regex)];

    for (const match of matches) {
      const fullPlaceholder = match;
      const searchKeyword = match.trim();

      if (!cache.has(searchKeyword)) {
        const exactUrl = await fetchExactWikimediaImage(searchKeyword);
        cache.set(searchKeyword, exactUrl);
      }

      file.code = file.code.replaceAll(fullPlaceholder, cache.get(searchKeyword));
    }
  }

  return files;
}

export async function generateRawText(promptText) {
  let lastError;
  for (const modelName of FREE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: promptText,
      });
      return response.text;
    } catch (error) {
      lastError = error;
      console.error(`Model ${modelName} error:`, error.message);
    }
  }
  throw lastError;
}

async function generateWithFallback(promptText) {
  let lastError;
  for (const modelName of FREE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
          maxOutputTokens: 65536,
        },
      });
      const rawText = response.text.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(rawText);
    } catch (error) {
      lastError = error;
      console.error(`Model ${modelName} failed:`, error.message);
    }
  }
  throw lastError;
}

export async function generateStructuredMERNProject(prompt) {
  const systemPrompt = `You are a Senior Full-Stack MERN Architect & UI/UX Engineer. 
Analyze the user's request and generate a clean, modular, production-ready MERN Stack project tailored specifically to the requested app domain (whether it is a Dashboard, SaaS, Blog, Task Manager, Expense Tracker, Chat App, Booking System, Portfolio, or E-Commerce Store).

STRICT MODULAR ARCHITECTURE RULES:
1. NEVER put all code in a single big file. Split code into small, clean, feature-named files matching the exact domain of the user's request.
2. Include BOTH "client/" and "server/" folders plus root "vercel.json":
   - vercel.json (routes /api/(.*) to server/server.js and /(.*) to client)
   - client/package.json (react, react-dom, axios, lucide-react, vite, @vitejs/plugin-react, tailwindcss, postcss, autoprefixer, "build": "vite build")
   - client/vite.config.js
   - client/tailwind.config.js
   - client/postcss.config.js
   - client/index.html
   - client/src/index.css (@tailwind base; @tailwind components; @tailwind utilities;)
   - client/src/main.jsx
   - client/src/utils/api.js (axios instance)
   - client/src/components/ui/ (generic reusable UI primitives like Navbar.jsx or Sidebar.jsx, Modal.jsx, Badge.jsx, StatCard.jsx as needed by the app type)
   - client/src/components/ (2-3 domain-specific components matching the user's app, e.g., ExpenseTable.jsx, PostCard.jsx, TaskBoard.jsx, BookingForm.jsx)
   - client/src/App.jsx (clean structured layout tailored to the app's real-world UX)
   - server/package.json ("type": "module", express, mongoose, cors, dotenv, "start": "node server.js")
   - server/config/db.js
   - server/models/<DomainModel>.js
   - server/controllers/<domain>Controller.js
   - server/routes/<domain>Routes.js
   - server/server.js (must include "export default app;" for Vercel)

DOMAIN-APPROPRIATE UI & CONDITIONAL IMAGES RULE:
3. Use "lucide-react" icons and modern Tailwind CSS styling suited to the app's tone (e.g., clean data tables & KPI cards for finance/admin dashboards; cards & modals for content/booking/store apps).
4. ONLY include images when the app domain naturally uses visuals (e.g., E-commerce, Grocery, Food, Blog, Travel, Real Estate, Social, Portfolio). Do NOT force product photos into text-based apps like Calculators, Expense Trackers, or Todo Lists.
5. Whenever images ARE used, populate realistic sample items and write every image URL as: "IMAGE_QUERY:<Exact Subject Name>" (e.g., "IMAGE_QUERY:Red Apple fruit", "IMAGE_QUERY:Taj Mahal", "IMAGE_QUERY:Modern office desk"). Add an onError fallback on every <img> tag.

Return ONLY raw valid JSON:
{
  "name": "Short Project Title",
  "files": [
    { "path": "vercel.json", "code": "..." },
    { "path": "client/src/App.jsx", "code": "..." }
  ]
}

User Request: ${prompt}`;

  const parsed = await generateWithFallback(systemPrompt);
  if (parsed.files) {
    parsed.files = await resolveExactImagesInFiles(parsed.files);
  }
  return parsed;
}

export async function regenerateUpdatedMERNProject(existingFiles, editPrompt) {
  const updatePrompt = `You are a Senior Full-Stack MERN Architect & UI/UX Engineer.
Existing project files: ${JSON.stringify(existingFiles)}

User requested changes or new files: "${editPrompt}"

IMPORTANT RULES:
1. Return ONLY the files that were modified or newly created. Return the complete code for each modified/new file.
2. Keep the exact same "path" string when updating an existing file (e.g., "client/src/App.jsx").
3. Maintain the modular component structure (client/src/components/ui/, lucide-react icons, responsive Tailwind layouts).
4. If adding any visual items/cards that require photos, use "IMAGE_QUERY:<Exact Subject Name>" so our backend resolves exact photos.

Return ONLY raw valid JSON:
{
  "files": [
    { "path": "exact/file/path", "code": "complete updated or new file code" }
  ]
}`;

  const parsed = await generateWithFallback(updatePrompt);
  if (parsed.files) {
    parsed.files = await resolveExactImagesInFiles(parsed.files);
  }
  return parsed;
}
