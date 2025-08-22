# ContextFlow

**AI-powered chatbot with RAG (Retrieval-Augmented Generation) for document-based conversations.**

![Next.js](https://img.shields.io/badge/Next.js-15.5.0-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Gemini](https://img.shields.io/badge/AI-Google_Gemini-orange)

## Features

- **RAG Pipeline**: Upload PDFs, get AI answers based on document content
- **Smart Chat**: Modern interface with conversation history
- **Multi-Provider AI**: Google Gemini + OpenAI fallback
- **Vector Search**: Semantic similarity search for precise context retrieval
- **Real-time Processing**: Live document processing with progress feedback

## RAG Pipeline

```
PDF Upload → Text Extraction → Chunking → Embeddings → Vector Storage
     ↓
User Query → Embedding → Similarity Search → Context Retrieval → Answer Generation
```

## Tech Stack

- **Framework**: Next.js 15 with TypeScript
- **AI**: Google Gemini API, OpenAI (fallback)
- **RAG**: LangChain, Transformers.js, HNSW vector search
- **PDF Processing**: pdf-parse, pdfjs-dist
- **UI**: shadcn/ui, Tailwind CSS, Radix UI

## Quick Start

### Prerequisites

- Node.js 18.17.0+
- Google Gemini API key ([Get one here](https://aistudio.google.com/))

### Installation

```bash
# Clone and install
git clone https://github.com/echo93915/ContextFlow.git
cd ContextFlow
npm install

# Setup environment
echo "GEMINI_API_KEY=your_key_here" > .env.local
echo "OPENAI_API_KEY=your_openai_key_here" >> .env.local  # Optional

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

```env
# Required
GEMINI_API_KEY=your_gemini_api_key

# Optional
OPENAI_API_KEY=your_openai_api_key
GEMINI_CHAT_MODEL=gemini-1.5-flash
```

## Usage

1. **Upload Document**: Drag & drop PDF files
2. **Wait for Processing**: Documents are chunked and embedded
3. **Ask Questions**: Get AI responses based on document content
4. **View Sources**: See which document sections informed the answer

## API Endpoints

- `POST /api/chat` - Chat with RAG context
- `POST /api/process-document` - Upload and process documents
- `POST /api/retrieve-context` - Search document content
- `GET /api/debug-rag` - Pipeline debugging

## Project Structure

```
src/
├── app/api/           # API routes for RAG pipeline
├── components/        # UI components
└── lib/
    ├── enhanced-vector-store.ts    # Vector similarity search
    ├── pdf-processor.ts           # PDF text extraction
    ├── llm-unified.ts            # Multi-provider AI interface
    └── text-processing.ts        # Document chunking
```

## Deployment

### Vercel (Recommended)

```bash
npm run build
vercel --prod
```

Add environment variables in Vercel dashboard:

- `GEMINI_API_KEY` (required)
- `OPENAI_API_KEY` (optional)

## Troubleshooting

**Installation Issues:**

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Native modules
npm rebuild
```

**API Issues:**

```bash
# Test Gemini API
curl -H "Authorization: Bearer $GEMINI_API_KEY" \
     https://generativelanguage.googleapis.com/v1/models
```

**Memory Issues:**

```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=8192" npm run dev
```

## Development

```bash
npm run dev    # Development server
npm run build  # Production build
npm run lint   # Code linting
```

## License

MIT License

---

**Built with Next.js 15, Google Gemini, and modern RAG architecture**
