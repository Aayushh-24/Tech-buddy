// Note: There is NO import for pdf-parse at the top of the file.

type PDFProcessResult = {
  success: boolean; text: string; metadata: { pages: number; processingMethod: string; error?: string; };
};

export class PDFProcessor {
  public static async processPDF(fileBuffer: Buffer, originalName: string): Promise<PDFProcessResult> {
    try {
      // THIS IS THE FIX: Dynamically import pdf-parse only when the function is running.
      // This hides it from the Vercel build process, preventing the crash.
      const pdf = (await import('pdf-parse')).default;

      const data = await pdf(fileBuffer);

      if (!data.text || data.text.trim().length === 0) {
        throw new Error('No text content found in the PDF.');
      }

      return {
        success: true,
        text: data.text,
        metadata: {
          pages: data.numpages,
          processingMethod: 'pdf-parse',
        },
      };

    } catch (error) {
      console.error(`Error processing PDF ${originalName}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      return {
        success: false,
        text: `Failed to extract text from ${originalName}.`,
        metadata: {
          pages: 0,
          processingMethod: 'pdf-parse-failed',
          error: errorMessage,
        },
      };
    }
  }
}