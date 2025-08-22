I'll analyze how PDF upload, text extraction, chunking, embeddings, and vector storage are implemented in your DocuChat project. Let me examine the codebase to understand the order and libraries used for each step.

[6 tools called]

Now let me check the unified LLM interface and settings to understand the complete flow:

[4 tools called]

Based on my analysis of the DocuChat codebase, here's a comprehensive breakdown of how PDF upload, text extraction, chunking, embeddings, and vector storage are achieved:

## PDF Processing Flow Analysis

### **Order of Operations:**

1. **PDF Upload** → 2. **Text Extraction** → 3. **Chunking** → 4. **Embeddings Generation** → 5. **Vector Storage**

---

## **1. PDF Upload**

**Location:** `src/app_streamlit.py` (lines 165-190)
**Libraries:** Streamlit built-in file uploader

- **Process:** Users upload PDF via Streamlit's `st.file_uploader()`
- **Validation:** File is temporarily saved and validated using `validate_pdf_file()`
- **Temporary storage:** Uses Python's `tempfile.NamedTemporaryFile()`

---

## **2. Text Extraction**

**Location:** `src/pdf_utils.py` (lines 25-79)
**Libraries:**

- **Primary:** `pypdf` (PyPDF)
- **Fallback:** `PyPDF2` (for older versions)

**Implementation Details:**

```python
from pypdf import PdfReader  # or PyPDF2 as fallback
```

**Process:**

- Opens PDF with `PdfReader`
- Extracts text page by page using `page.extract_text()`
- Adds page markers: `[PAGE {page_num}]\n{page_text}`
- Handles extraction errors gracefully
- Cleans text removing null bytes, BOM, excessive whitespace

---

## **3. Text Chunking**

**Location:** `src/pdf_utils.py` (lines 113-201)
**Libraries:** Pure Python (no external dependencies)

**Strategy:**

- **Chunk Size:** Default 1200 characters (configurable via `settings.chunk_size`)
- **Overlap:** Default 200 characters (configurable via `settings.chunk_overlap`)
- **Smart Splitting:** Attempts to break at sentence boundaries (`.!?`)
- **Minimum Chunk Size:** 100 characters to avoid tiny fragments

**Algorithm:**

1. Sliding window approach with configurable overlap
2. Searches for sentence endings within ±100 characters of target boundary
3. Falls back to character-based splitting if no good break point found
4. Creates `DocumentChunk` objects with metadata

---

## **4. Embeddings Generation**

**Location:** `src/llm_unified.py` (with fallback chain)
**Libraries:** Multiple providers with intelligent fallback

**Provider Hierarchy:**

1. **Google Gemini** (Primary) - `google.generativeai`

   - Model: `models/text-embedding-004`
   - Individual text processing (no batch support)
   - 768-dimensional vectors

2. **OpenAI Direct API** (Secondary) - `requests`

   - Model: `text-embedding-3-small`
   - Batch processing support
   - 1536-dimensional vectors

3. **OpenAI SDK** (Tertiary) - `openai` package

   - Same model as Direct API
   - Uses official SDK

4. **Mock Provider** (Fallback) - For testing
   - Generates deterministic random embeddings

**Process:**

- Filters out empty texts
- Generates embeddings with retry logic (3 attempts)
- Handles rate limiting with exponential backoff
- Returns list of embedding vectors

---

## **5. Vector Storage**

**Location:** `src/vectorstore.py`
**Libraries:**

- **FAISS** (Primary): `faiss-cpu==1.8.0.post1`
- **ChromaDB** (Alternative): `chromadb==0.5.5`

### **FAISS Implementation (Default):**

- **Index Type:** `IndexFlatIP` (Inner Product for cosine similarity)
- **Normalization:** L2 normalization for cosine similarity search
- **Storage Files:**
  - `faiss.index` - FAISS index
  - `chunks.pkl` - Original text chunks (pickle)
  - `embeddings.npy` - NumPy array of embeddings
  - `metadata.json` - Index metadata

### **ChromaDB Implementation (Alternative):**

- **Collection-based storage**
- **Automatic persistence**
- **Built-in metadata handling**

**Search Process:**

1. Query text → Generate embedding
2. Normalize query vector
3. Similarity search using FAISS/ChromaDB
4. Return top-k most similar chunks

---

## **Complete Processing Pipeline**

**Triggered from:** `src/app_streamlit.py` → `process_document()` function

```python
# 1. Validate PDF
validate_pdf_file(tmp_file_path)

# 2. Extract and chunk text
chunks, metadata = process_pdf(tmp_file_path, chunk_size, overlap)

# 3. Build vector index (includes embedding generation)
chunk_texts = [chunk.text for chunk in chunks]
build_index(chunk_texts)  # This calls embed_texts() internally

# 4. Generate suggested questions (optional)
suggestions = get_suggested_questions(chunk_texts[:5])
```

---

## **Configuration**

**Location:** `src/settings.py`
**Key Parameters:**

- `chunk_size: 1200` characters
- `chunk_overlap: 200` characters
- `vector_store: "faiss"` (vs "chroma")
- `top_k: 4` results for retrieval
- `embedding_model: "text-embedding-3-small"`

---

## **Dependencies Summary**

From `requirements.txt`:

- **PDF Processing:** `pypdf==4.3.1`
- **Vector Storage:** `faiss-cpu==1.8.0.post1`, `chromadb==0.5.5`
- **LLM APIs:** `openai==1.40.6`, `google-generativeai` (inferred)
- **Data Handling:** `numpy==1.26.4`, `pandas==2.2.2`
- **Web Interface:** `streamlit==1.37.1`
- **Utilities:** `pydantic==2.9.2`, `tenacity==8.5.0`

The system is designed with robust error handling, multiple provider fallbacks, and configurable parameters, making it resilient and adaptable for different use cases.

[1 tool called]

Let me analyze how PDF content flows to the Gemini API in your DocuChat system by examining the specific pipeline.

[1 tool called]

Now let me examine the specific flow of how PDF content gets to Gemini API by looking at the embedding and chat completion calls:

[2 tools called]

Now let me check how the RAG pipeline constructs the prompts with PDF content:

[1 tool called]

Perfect! Now I have a complete understanding of how PDF content flows to the Gemini API. Let me create a clear explanation of this process.

## How PDF Content Becomes Available to Gemini API

The PDF content reaches the Gemini API through **two distinct pathways** in your DocuChat system:

### **Pathway 1: Embeddings Generation (During PDF Processing)**

**Flow:** PDF → Text Extraction → Chunking → **Gemini Embeddings API**

```python
# Location: src/llm_unified.py (lines 113-117)
result = genai.embed_content(
    model=settings.gemini_embedding_model,  # "models/text-embedding-004"
    content=text,  # Each individual chunk from PDF
    task_type="retrieval_document"
)
```

**Process:**

1. **PDF Upload & Processing:** PDF is extracted and chunked into ~1200 character segments
2. **Individual Chunk Processing:** Each text chunk is sent **one by one** to Gemini (no batch support)
3. **Gemini API Call:** `genai.embed_content()` receives raw PDF text chunks
4. **Rate Limiting:** 0.1 second delay between calls to avoid rate limits
5. **Storage:** Resulting embeddings are stored in FAISS vector database

**What Gemini Sees:** Raw extracted text chunks like:

```
"This document outlines the company's privacy policy. Personal data is collected through various means including..."
```

---

### **Pathway 2: Chat Completion (During Q&A)**

**Flow:** User Question → Vector Search → Retrieved PDF Chunks → **Gemini Chat API**

```python
# Location: src/rag.py (lines 84-89) + src/llm_unified.py (lines 177-184)

# 1. Context assembly in RAG
user_message = f"""Question: {query}

Context:
[Context 1]
{chunk_from_pdf_1}

[Context 2]
{chunk_from_pdf_2}

Please answer the question based strictly on the provided context."""

# 2. Sent to Gemini
prompt = f"System: {system_message}\n\nUser: {user_message}"
response = model.generate_content(prompt)
```

**Process:**

1. **User Query:** User asks a question
2. **Semantic Search:** Query is embedded and searched against PDF chunk vectors
3. **Context Retrieval:** Top-k most relevant PDF chunks are retrieved (default k=4)
4. **Prompt Construction:** System message + User question + Retrieved PDF chunks
5. **Gemini API Call:** `model.generate_content()` receives formatted prompt with PDF content
6. **Response:** Gemini generates answer based on provided PDF context

**What Gemini Sees:** A structured prompt containing:

```
System: You are a precise assistant that answers questions based strictly on the provided context...

User: Question: What is the company's data retention policy?

Context:
[Context 1]
Data retention policies vary by data type. Personal information is retained for no more than 7 years after account closure...

[Context 2]
Financial records must be maintained according to regulatory requirements for a minimum of 10 years...

Please answer the question based strictly on the provided context.
```

---

### **Key Technical Details:**

**Gemini Configuration:**

- **Embedding Model:** `models/text-embedding-004` (768 dimensions)
- **Chat Model:** `gemini-1.5-flash`
- **Task Type:** `"retrieval_document"` for embeddings
- **Processing:** Sequential (one chunk at a time) due to Gemini API limitations

**Content Preprocessing:**

- PDF text is cleaned: removes null bytes, BOM, excessive whitespace
- Page markers `[PAGE n]` are stripped before sending to Gemini
- Empty/whitespace-only chunks are filtered out
- Text is trimmed and normalized

**Fallback System:**
If Gemini fails, the system automatically falls back to:

1. OpenAI Direct API
2. OpenAI SDK
3. Mock responses (for testing)

**Privacy Note:** The PDF content is sent to Google's Gemini API servers for processing. The actual document text becomes part of the API requests, so users should be aware of this when uploading sensitive documents.

The system is designed to be robust with retry logic (3 attempts) and exponential backoff for both embedding generation and chat completion calls.
