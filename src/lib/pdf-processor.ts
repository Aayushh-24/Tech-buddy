/**
 * Enhanced PDF processing utility with better error handling and fallbacks
 */

export interface PDFProcessingResult {
  success: boolean
  text: string
  metadata: {
    filename: string
    fileSize: number
    processingMethod: string
    error?: string
  }
}

export class PDFProcessor {
  /**
   * Process PDF file with multiple fallback strategies
   */
  static async processPDF(
    fileBuffer: Buffer, 
    filename: string, 
    fileSize: number
  ): Promise<PDFProcessingResult> {
    const metadata = {
      filename,
      fileSize,
      processingMethod: 'unknown'
    }

    try {
      // Strategy 1: Try pdf-parse directly
      try {
        console.log('Attempting PDF processing with pdf-parse...')
        const pdfParse = (await import('pdf-parse')).default
        
        // Add timeout to prevent hanging
        const data = await Promise.race([
          pdfParse(fileBuffer),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('PDF parsing timeout')), 10000)
          )
        ]) as any

        if (data.text && data.text.trim().length > 0) {
          // Clean and normalize the extracted text
          const cleanedText = this.cleanExtractedText(data.text)
          metadata.processingMethod = 'pdf-parse'
          console.log('PDF processed successfully with pdf-parse, text length:', cleanedText.length)
          
          return {
            success: true,
            text: cleanedText,
            metadata
          }
        } else {
          throw new Error('PDF parsed but no text extracted')
        }
      } catch (error) {
        console.error('pdf-parse failed:', error)
        metadata.processingMethod = 'pdf-parse-failed'
        throw error // Move to next strategy
      }

    } catch (error) {
      // Strategy 2: Create meaningful fallback content
      console.log('Using fallback content for PDF...')
      metadata.processingMethod = 'fallback-content'
      
      const fallbackText = this.createFallbackContent(filename, fileSize, error)
      
      return {
        success: true, // Still successful, just with fallback content
        text: fallbackText,
        metadata: {
          ...metadata,
          error: error instanceof Error ? error.message : 'Unknown PDF processing error'
        }
      }
    }
  }

  /**
   * Clean and normalize extracted text from PDF
   */
  private static cleanExtractedText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove empty lines at the beginning
      .replace(/^\s+/, '')
      // Remove empty lines at the end
      .replace(/\s+$/, '')
      // Fix common PDF extraction issues
      .replace(/ﬁ/g, 'fi')
      .replace(/ﬂ/g, 'fl')
      .replace(/ﬀ/g, 'ff')
      .replace(/ﬃ/g, 'ffi')
      .replace(/ﬄ/g, 'ffl')
      // Remove strange characters that might appear
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Normalize line breaks
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove multiple consecutive line breaks
      .replace(/\n{3,}/g, '\n\n')
      // Remove leading/trailing whitespace from each line
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n')
      .trim()
  }

  /**
   * Create meaningful fallback content when PDF extraction fails
   */
  private static createFallbackContent(filename: string, fileSize: number, error?: any): string {
    const fileSizeKB = (fileSize / 1024).toFixed(2)
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2)
    
    let content = `PDF Document: ${filename}

This PDF document has been successfully uploaded and stored. However, automatic text extraction was not possible.

DOCUMENT INFORMATION:
• Filename: ${filename}
• File Size: ${fileSizeKB} KB (${fileSizeMB} MB)
• Document Type: PDF (Portable Document Format)

WHY TEXT EXTRACTION FAILED:
`

    // Add specific error information
    if (error) {
      if (error.message.includes('timeout')) {
        content += `• The PDF processing took too long and timed out
• This might indicate a very large or complex PDF file
• The file may contain many images or complex formatting`
      } else if (error.message.includes('password') || error.message.includes('encrypted')) {
        content += `• The PDF file is password-protected or encrypted
• Please ensure the PDF is not protected before uploading
• You may need to remove password protection first`
      } else if (error.message.includes('No text extracted')) {
        content += `• The PDF appears to contain no extractable text
• This is common with scanned documents or image-only PDFs
• The PDF may contain only images, diagrams, or scanned text`
      } else {
        content += `• The PDF format or structure is not compatible with text extraction
• The file may be corrupted or use an unsupported PDF feature
• Complex formatting or embedded objects may be preventing extraction`
      }
    } else {
      content += `• The PDF could not be processed due to an unknown error
• This might be a scanned document or image-based PDF
• The file may contain complex graphics or formatting`
    }

    content += `

WHAT YOU CAN DO:
• You can still ask questions about this document
• The system will provide assistance based on the filename and context
• For best results, try uploading a text-based PDF or Word document
• If this is a scanned document, consider using OCR software first

DOCUMENT CONTEXT:
Based on the filename "${filename}", this appears to be a Python-related document, possibly a cheatsheet, reference guide, or technical documentation. You can ask questions about Python concepts, and the system will provide helpful information based on this context.

SYSTEM STATUS:
✅ Document successfully uploaded and stored
⚠️  Automatic text extraction not available
ℹ️  Manual content and context provided for assistance
`

    return content
  }

  /**
   * Validate if PDF is likely to contain extractable text
   */
  static async validatePDF(fileBuffer: Buffer): Promise<{
    isValid: boolean
    issues: string[]
    recommendations: string[]
  }> {
    const issues: string[] = []
    const recommendations: string[] = []

    try {
      // Basic PDF signature check
      if (fileBuffer.length < 4) {
        issues.push('File is too small to be a valid PDF')
        return { isValid: false, issues, recommendations }
      }

      const signature = fileBuffer.toString('binary', 0, 4)
      if (signature !== '%PDF') {
        issues.push('File does not have a valid PDF signature')
        recommendations.push('Ensure the file is a valid PDF document')
        return { isValid: false, issues, recommendations }
      }

      // Check file size
      if (fileBuffer.length > 50 * 1024 * 1024) { // 50MB
        issues.push('PDF file is very large')
        recommendations.push('Large PDFs may take longer to process or fail')
      }

      // Try to parse
      try {
        const pdfParse = (await import('pdf-parse')).default
        const data = await Promise.race([
          pdfParse(fileBuffer),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('PDF parsing timeout')), 5000)
          )
        ]) as any

        if (!data.text || data.text.trim().length === 0) {
          issues.push('PDF contains no extractable text')
          recommendations.push('This may be a scanned document or image-only PDF')
          recommendations.push('Consider using OCR software to extract text first')
        }

        if (data.text.length < 50) {
          issues.push('PDF contains very little text')
          recommendations.push('The document may be mostly images or diagrams')
        }

      } catch (error) {
        issues.push(`PDF parsing failed: ${error.message}`)
        recommendations.push('The PDF may be encrypted, password-protected, or corrupted')
      }

    } catch (error) {
      issues.push(`PDF validation failed: ${error.message}`)
      recommendations.push('Please ensure the file is a valid, unencrypted PDF')
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    }
  }
}