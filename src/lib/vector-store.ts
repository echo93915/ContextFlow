import { ProcessedDocument, TextChunk, findRelevantChunks } from './text-processing';

export interface VectorStore {
  addDocument(document: ProcessedDocument): void;
  removeDocument(documentId: string): void;
  searchSimilar(query: string, topK?: number): Promise<SearchResult[]>;
  getDocument(documentId: string): ProcessedDocument | undefined;
  getAllDocuments(): ProcessedDocument[];
  clear(): void;
}

export interface SearchResult {
  chunk: TextChunk;
  score: number;
  document: ProcessedDocument;
}

class InMemoryVectorStore implements VectorStore {
  private documents: Map<string, ProcessedDocument> = new Map();

  addDocument(document: ProcessedDocument): void {
    this.documents.set(document.id, document);
  }

  removeDocument(documentId: string): void {
    this.documents.delete(documentId);
  }

  async searchSimilar(query: string, topK: number = 5): Promise<SearchResult[]> {
    const allDocuments = Array.from(this.documents.values());
    return await findRelevantChunks(query, allDocuments, topK);
  }

  getDocument(documentId: string): ProcessedDocument | undefined {
    return this.documents.get(documentId);
  }

  getAllDocuments(): ProcessedDocument[] {
    return Array.from(this.documents.values());
  }

  clear(): void {
    this.documents.clear();
  }

  // Persistence methods for localStorage
  saveToStorage(): void {
    if (typeof window !== 'undefined') {
      const data = JSON.stringify(Array.from(this.documents.entries()));
      localStorage.setItem('vector-store', data);
    }
  }

  loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('vector-store');
      if (data) {
        try {
          const entries = JSON.parse(data);
          this.documents = new Map(entries.map(([id, doc]: [string, any]) => [
            id,
            {
              ...doc,
              metadata: {
                ...doc.metadata,
                processedAt: new Date(doc.metadata.processedAt)
              }
            }
          ]));
        } catch (error) {
          console.error('Error loading vector store from storage:', error);
        }
      }
    }
  }
}

// Global vector store instance
export const vectorStore = new InMemoryVectorStore();

// Auto-save to localStorage when documents are modified
const originalAddDocument = vectorStore.addDocument.bind(vectorStore);
const originalRemoveDocument = vectorStore.removeDocument.bind(vectorStore);
const originalClear = vectorStore.clear.bind(vectorStore);

vectorStore.addDocument = function(document: ProcessedDocument) {
  originalAddDocument(document);
  this.saveToStorage();
};

vectorStore.removeDocument = function(documentId: string) {
  originalRemoveDocument(documentId);
  this.saveToStorage();
};

vectorStore.clear = function() {
  originalClear();
  this.saveToStorage();
};

// Load from storage on initialization (client-side only)
if (typeof window !== 'undefined') {
  vectorStore.loadFromStorage();
}
