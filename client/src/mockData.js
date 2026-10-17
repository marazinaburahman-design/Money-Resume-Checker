// Structured placeholder results for MVP demonstration
// These will be replaced by real Groq AI evaluation in the next phase.

export const ROLE_OPTIONS = [
  { id: 'Frontend Developer', label: 'Frontend Developer', icon: 'desktop' },
  { id: 'Backend Developer', label: 'Backend Developer', icon: 'server' },
  { id: 'Full-stack Developer', label: 'Full-stack Developer', icon: 'layers' },
  { id: 'AI Engineer', label: 'AI Engineer', icon: 'cpu' },
];

export const MOCK_ANALYSIS_DATA = {
  'Frontend Developer': {
    score: 82,
    role: 'Frontend Developer',
    summary: 'Strong foundation in core web technologies and modern React component authoring.',
    skillsFound: ['JavaScript (ES6+)', 'React 19', 'Tailwind CSS', 'HTML5 & Semantic Markup', 'Git & GitHub'],
    skillsMissing: ['TypeScript', 'Next.js / SSR', 'Jest / React Testing Library', 'Web Accessibility (a11y)'],
    improvements: [
      {
        id: 1,
        title: 'Quantify project achievements with metrics',
        description:
          'Replace general statements like "Built an e-commerce app" with tangible impact, such as "Developed a responsive e-commerce web app with 50+ mock items, cutting initial page load under 1.2s".',
      },
      {
        id: 2,
        title: 'Add TypeScript to at least one portfolio repository',
        description:
          'Most modern frontend roles require type safety. Converting an existing JavaScript project to TypeScript demonstrates immediate industry readiness.',
      },
      {
        id: 3,
        title: 'Include working live preview URLs for all projects',
        description:
          'Recruiters review resumes in seconds. Put clickable, deployed links (Vercel, Netlify, or GitHub Pages) directly beneath every project title.',
      },
    ],
  },
  'Backend Developer': {
    score: 78,
    role: 'Backend Developer',
    summary: 'Solid grasp of RESTful API development and Node.js server lifecycle.',
    skillsFound: ['Node.js', 'Express.js', 'MongoDB & Mongoose', 'REST API Design', 'Git Version Control'],
    skillsMissing: ['Docker & Containerization', 'PostgreSQL / SQL Modeling', 'JWT & OAuth Security', 'Unit Testing (Mocha/Jest)'],
    improvements: [
      {
        id: 1,
        title: 'Document API performance and throughput numbers',
        description:
          'Describe how your endpoints perform under stress, e.g., "Engineered Express REST endpoints serving 500+ simulated requests/sec with MongoDB index optimization".',
      },
      {
        id: 2,
        title: 'Demonstrate secure authentication and validation',
        description:
          'Highlight input sanitization and token-based session handling, showing you build with production security considerations in mind.',
      },
      {
        id: 3,
        title: 'Containerize a sample project using Docker',
        description:
          'Add a Dockerfile and docker-compose.yml to your backend project repo to prove you understand team collaboration and cloud deployment setups.',
      },
    ],
  },
  'Full-stack Developer': {
    score: 84,
    role: 'Full-stack Developer',
    summary: 'Well-rounded breadth across client-side state management and backend database CRUD operations.',
    skillsFound: ['React', 'Node.js', 'Express', 'MongoDB Atlas', 'Tailwind CSS', 'REST APIs'],
    skillsMissing: ['CI/CD Pipelines (GitHub Actions)', 'Redis Caching', 'End-to-End Testing (Playwright/Cypress)', 'Cloud Deployment (AWS/Render)'],
    improvements: [
      {
        id: 1,
        title: 'Highlight end-to-end architecture cohesion',
        description:
          'Explain how frontend state reacts to backend database mutations, detailing error-handling patterns across both layers.',
      },
      {
        id: 2,
        title: 'Add automated CI/CD pipeline badges to your repositories',
        description:
          'Implement a basic GitHub Actions workflow that runs linter and unit tests on every pull request to show engineering discipline.',
      },
      {
        id: 3,
        title: 'Showcase database schema design rationale',
        description:
          'Include a brief note about why you structured your MongoDB schemas or relationships a certain way to handle scaling.',
      },
    ],
  },
  'AI Engineer': {
    score: 80,
    role: 'AI Engineer',
    summary: 'Promising familiarity with LLM APIs, modern prompt engineering, and Python tooling.',
    skillsFound: ['Python', 'Groq API / LLM Integrations', 'Prompt Engineering', 'FastAPI', 'Git'],
    skillsMissing: ['Vector Databases (Chroma/Pinecone)', 'Retrieval-Augmented Generation (RAG)', 'LLM Evaluation & Benchmarking', 'Model Quantization'],
    improvements: [
      {
        id: 1,
        title: 'Quantify retrieval and evaluation metrics',
        description:
          'Rather than saying "Built an AI chatbot", state "Built a customer FAQ assistant with Groq LLM scoring 91% factual accuracy across 100 test prompts".',
      },
      {
        id: 2,
        title: 'Implement and showcase a RAG workflow',
        description:
          'Incorporate a local vector store or semantic search pipeline into your project to show you can handle domain-specific knowledge retrieval.',
      },
      {
        id: 3,
        title: 'Document inference latency and token budget controls',
        description:
          'Describe how you handled rate limiting, token caching, and error fallbacks when dealing with external LLM providers.',
      },
    ],
  },
};
