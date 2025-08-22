import { ProcessedDocument } from './text-processing';

// Shared global document store that persists across API routes
class SharedDocumentStore {
  private static instance: SharedDocumentStore;
  private documents: Map<string, ProcessedDocument> = new Map();

  private constructor() {}

  public static getInstance(): SharedDocumentStore {
    if (!SharedDocumentStore.instance) {
      SharedDocumentStore.instance = new SharedDocumentStore();
    }
    return SharedDocumentStore.instance;
  }

  public set(uploadId: string, document: ProcessedDocument): void {
    this.documents.set(uploadId, document);
    console.log(`📚 Document stored: ${uploadId} (${document.metadata.title})`);
    console.log(`📊 Total documents in store: ${this.documents.size}`);
  }

  public get(uploadId: string): ProcessedDocument | undefined {
    return this.documents.get(uploadId);
  }

  public has(uploadId: string): boolean {
    return this.documents.has(uploadId);
  }

  public delete(uploadId: string): boolean {
    const deleted = this.documents.delete(uploadId);
    console.log(`🗑️ Document deleted: ${uploadId}, success: ${deleted}`);
    console.log(`📊 Remaining documents: ${this.documents.size}`);
    return deleted;
  }

  public getAllDocuments(): ProcessedDocument[] {
    const documents = Array.from(this.documents.values());
    console.log(`🔍 Retrieved ${documents.length} documents for search`);
    return documents;
  }

  public getSize(): number {
    return this.documents.size;
  }

  public clear(): void {
    this.documents.clear();
    console.log('🧹 Document store cleared');
  }

  public getStats(): {
    totalDocuments: number;
    totalChunks: number;
    documentList: Array<{
      id: string;
      uploadId: string;
      title: string;
      source: string;
      sourceType: string;
      chunksCount: number;
      processedAt: Date;
    }>;
  } {
    const documents = Array.from(this.documents.entries());
    const totalChunks = documents.reduce((sum, [, doc]) => sum + doc.chunks.length, 0);
    
    return {
      totalDocuments: documents.length,
      totalChunks,
      documentList: documents.map(([uploadId, doc]) => ({
        id: doc.id,
        uploadId,
        title: doc.metadata.title,
        source: doc.metadata.source,
        sourceType: doc.metadata.sourceType,
        chunksCount: doc.chunks.length,
        processedAt: doc.metadata.processedAt,
      })),
    };
  }
}

// Export singleton instance
export const sharedDocumentStore = SharedDocumentStore.getInstance();
