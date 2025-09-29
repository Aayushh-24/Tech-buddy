// NOTE: The import statement at the top has been removed.

// Define a type for the result for better code quality
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
      // Dynamically import the pdf-parse library only when needed
      const pdf = (await import('pdf-parse')).default;

      // Use the library to extract data from the file buffer
      const data = await pdf(fileBuffer);

      const text = data.text;

      // Check if text extraction returned any content
      if (!text || text.trim().length === 0) {
        throw new Error('No text content found in the PDF. It may be an image-only file.');
      }

      console.log(`Successfully extracted ${text.length} characters from ${originalName}`);

      return {
        success: true,
        text: text,
        metadata: {
          pages: data.numpages,
          processingMethod: 'pdf-parse-library',
        },
      };

    } catch (error) {
      console.error(`Error processing PDF ${originalName}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during PDF parsing.';
      
      return {
        success: false,
        text: `PDF Document: ${originalName}\n\nThis document has been uploaded, but automatic text extraction failed. This can happen if the PDF contains only images, has complex formatting, or is encrypted.`,
        metadata: {
          pages: 0,
          processingMethod: 'pdf-parse-failed',
          error: errorMessage,
        },
      };
    }
  }
}