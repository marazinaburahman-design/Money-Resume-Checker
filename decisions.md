# Decision document

## 1. Scope of version one

### Decision
Scope the MVP strictly to single PDF resume uploads against four core developer roles with immediate rule-and-LLM based scoring, skill gap detection, and three actionable suggestions.

### Options considered
1. **Full Career Platform**: Multi-page/multi-format parsing, LinkedIn sync, auto-tailoring, cover letters, and live job board matching.
2. **Strict Rule-based Keyword Matcher**: Simple regex dictionary scan without contextual feedback or semantic understanding.
3. **Focused Single-Flow AI Analyzer (Chosen)**: Single PDF upload, 4 role targets, deterministic skill extraction paired with LLM evaluation, score /100, and 3 plain-language improvement tips.

### Chosen
Option 3: Focused Single-Flow AI Analyzer.

### Why
- Delivers end-to-end user value within days without infrastructure complexity.
- Directly targets entry-level student anxieties (missing skills, unquantified impact).
- Keeps inference latency low and eliminates multi-modal/auth failure points.

### Revisit when
- The core single-upload flow achieves a consistent >80% user satisfaction rate.
- Users actively request multi-format support (DOCX), job description copy-pasting, or ATS-reformatting features.

## 2. Architecture

### Decision
Adopt a decoupled React frontend paired with a standalone Node.js + Express backend that securely holds `GROQ_API_KEY` and brokers all interactions with Groq and MongoDB.

### Options considered
1. **Client-side Direct (React to Groq)**: Browser directly calls Groq API using frontend environment variables or client-side keys.
2. **Serverless Functions (e.g., Vercel Functions)**: Ephemeral backend functions invoked per request without an active server process.
3. **Dedicated Node.js + Express Server (Chosen)**: Long-running Express server managing CORS, rate limiting, PDF parsing, Groq API calls with `GROQ_API_KEY`, and MongoDB persistence.

### Chosen
Option 3: Dedicated Node.js + Express Server.

### Why
- Keeps `GROQ_API_KEY` completely hidden on the server, avoiding critical client-side exposure in React builds or network bundles.
- Allows simple in-memory or Redis rate limiting (`express-rate-limit`) to prevent abuse and manage AI token budgets before queries reach Groq.
- Maintains reliable, persistent connection pooling to MongoDB for saving resume analysis results and token usage logs without serverless connection leak issues.
- Offers a familiar local debugging workflow (`console.log`, Postman, nodemon) free of serverless environment simulation overhead.

### Revisit when
- Traffic grows to thousands of concurrent requests where auto-scaling serverless infrastructure or container orchestration (e.g., ECS/K8s) reduces idle hosting costs.
- Analysis pipelines expand into asynchronous multi-stage worker queues (e.g., BullMQ) handling batch uploads.
