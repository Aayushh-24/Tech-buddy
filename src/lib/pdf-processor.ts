import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

// --- THIS IS THE FIX ---
// This line explicitly disables a browser-only feature called "workers",
// forcing the library to run in a simple, server-compatible mode.
pdfjs.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.js';
// --- END OF FIX ---

type PDFProcessResult = {
  success: boolean; text: string; metadata: { pages: number; processingMethod: string; error?: string; };
};

export class PDFProcessor {
  public static async processPDF(fileBuffer: Buffer, originalName: string): Promise<PDFProcessResult> {
    try {
      const loadingTask = pdfjs.getDocument({ data: fileBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(item => (item as TextItem).str).join(' ') + '\n';
      }

      if (!fullText.trim()) throw new Error('No text content found in PDF.');
      
      return { success: true, text: fullText, metadata: { pages: pdf.numPages, processingMethod: 'pdfjs-dist' } };
    } catch (error) {
      console.error(`Error processing PDF ${originalName}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error.';
      return {
        success: false, text: `Failed to extract text from ${originalName}.`,
        metadata: { pages: 0, processingMethod: 'pdfjs-dist-failed', error: errorMessage },
      };
    }
  }
}