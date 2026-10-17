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
