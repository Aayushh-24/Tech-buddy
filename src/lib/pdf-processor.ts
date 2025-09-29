import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

// This is needed to prevent a Vercel build error with this specific library
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
      // Load the PDF document from the buffer
      const loadingTask = pdfjs.getDocument({ data: fileBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      let fullText = '';

      // Extract text from each page
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => (item as TextItem).str).join(' ');
        fullText += pageText + '\n';
      }

      if (!fullText || fullText.trim().length === 0) {
        throw new Error('No text content found in the PDF. It may be an image-only file.');
      }

      console.log(`Successfully extracted ${fullText.length} characters from ${originalName}`);

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