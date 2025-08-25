# ContextFlow

**Intelligent Multi-Agent System with Advanced Context Engineering**

![Next.js](https://img.shields.io/badge/Next.js-15.5.0-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![LangGraph](https://img.shields.io/badge/LangGraph-Agent-green) ![Gemini](https://img.shields.io/badge/AI-Google_Gemini-orange)

## Features

- **Intelligent Agent System**: Multi-tier routing with automatic classification between document queries, general chat, and code generation
- **Advanced Code Generation**: Parallel subtask execution with interactive task management and dependency handling
- **Enhanced RAG Pipeline**: Smart document processing with semantic vector search and multi-provider fallback
- **Modern Chat Interface**: Conversation history with visual task cards and multi-workflow support

## Architecture

```
User Input → Agent Classification → [CONDITIONAL ROUTING]
     ↓
[Document Query] → Embedding → Similarity Search → Context → Response
[Code Generation] → Task Analysis → Parallel Execution → Integration → Response
[General Chat] → Context Enrichment → Response Generation
```

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, shadcn/ui, Tailwind CSS, Radix UI
- **AI**: Google Gemini API, OpenAI (fallback), LangGraph agents
- **RAG**: Custom vector store, HNSW search, LangChain
- **Processing**: pdf-parse, pdfjs-dist, advanced text chunking

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

1. **Upload Documents**: Drag & drop PDF files for processing
2. **Ask Questions**: Get AI responses based on document content or request code generation
3. **Monitor Progress**: View real-time progress for complex code generation tasks
4. **Review Results**: Access generated code and document insights

## API Endpoints

- `POST /api/chat` - Multi-workflow chat with intelligent routing
- `POST /api/process-document` - Upload and process documents
- `POST /api/retrieve-context` - Semantic search with vector similarity
- `POST /api/extract-text` - PDF text extraction
- `GET /api/debug-rag` - Pipeline debugging

## Project Structure

```
src/
├── app/api/           # API routes
├── components/        # UI components
└── lib/              # Core libraries
    ├── enhanced-vector-store.ts
    ├── pdf-processor.ts
    ├── llm-unified.ts
    └── text-processing.ts
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

**Built with Next.js 15, LangGraph Agents, Google Gemini, and Advanced RAG + Code Generation Architecture**
