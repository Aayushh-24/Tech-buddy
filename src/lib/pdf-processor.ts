// Note: All 'import' statements at the top of the file are removed.

import type { TextItem } from 'pdfjs-dist/types/src/display/api';

type PDFProcessResult = {
  success: boolean;
  text: string;
  metadata: {
    pages: number;
    processingMethod: string;
    error?: string;
  };
};

export class PDFProcessor {
  public static async processPDF(
    fileBuffer: Buffer,
    originalName: string,
    fileSize: number
  ): Promise<PDFProcessResult> {
    try {
      // Dynamically import pdfjs-dist ONLY when the function runs
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

      const loadingTask = pdfjs.getDocument({ data: fileBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      let fullText = '';

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => (item as TextItem).str).join(' ');
        fullText += pageText + '\n';
      }

      if (!fullText || fullText.trim().length === 0) {
        throw new Error('No text content found in the PDF. It may be an image-only file.');
      }

      return {
        success: true,
        text: fullText,
        metadata: {
          pages: numPages,
          processingMethod: 'pdfjs-dist',
        },
      };

    } catch (error) {
      console.error(`Error processing PDF ${originalName}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during PDF parsing.';
      
      return {
        success: false,
        text: `PDF Document: ${originalName}\n\nThis document has been uploaded, but automatic text extraction failed.`,
        metadata: {
          pages: 0,
          processingMethod: 'pdfjs-dist-failed',
          error: errorMessage,
        },
      };
    }
  }
}