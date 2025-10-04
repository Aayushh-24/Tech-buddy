import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { put } from '@vercel/blob';

// Helper to call the external PDF extraction API
async function extractTextFromPdfUrl(fileUrl: string): Promise<string> {
    const apiKey = process.env.PDF_CO_API_KEY;
    if (!apiKey) throw new Error("PDF.co API Key is not configured.");

    const response = await fetch('https://api.pdf.co/v1/pdf/convert/to/text-simple', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fileUrl, inline: true }),
    });
    const data = await response.json();
    if (data.error) throw new Error(`PDF.co API error: ${data.message}`);
    return data.body;
}

// Helper to chunk text
function createSimpleChunks(text: string): string[] {
    const chunks: string[] = [];
    const chunkSize = 1000, chunkOverlap = 200;
    const cleanedText = text.replace(/\s{2,}/g, ' ').trim();
    for (let i = 0; i < cleanedText.length; i += chunkSize - chunkOverlap) {
        const chunk = cleanedText.substring(i, i + chunkSize);
        if (chunk.trim().length > 0) chunks.push(chunk);
    }
    return chunks;
}

export async function POST(request: NextRequest) {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !['pdf', 'docx'].includes(fileExtension)) {
        return NextResponse.json({ error: 'Invalid file type.' }, { status: 400 });
    }

    let documentId = '';
    try {
        const filename = `${uuidv4()}.${fileExtension}`;
        const blob = await put(filename, file, { access: 'public' });

        let user = await db.user.findUnique({ where: { id: 'default-user' } }) || await db.user.create({ data: { id: 'default-user', email: 'default@example.com', name: 'Default User' } });

        const document = await db.document.create({
            data: { filename, originalName: file.name, fileType: fileExtension, fileSize: file.size, filePath: blob.url, status: 'processing', userId: user.id }
        });
        documentId = document.id;

        let extractedText = '';
        if (fileExtension === 'pdf') {
            extractedText = await extractTextFromPdfUrl(blob.url);
        } else if (fileExtension === 'docx') {
            const mammoth = (await import('mammoth')).default;
            const buffer = Buffer.from(await file.arrayBuffer());
            const result = await mammoth.extractRawText({ buffer });
            extractedText = result.value;
        }

        if (!extractedText.trim()) throw new Error('No text could be extracted.');

        const chunks = createSimpleChunks(extractedText);
        await db.documentChunk.createMany({
            data: chunks.map((content, index) => ({ documentId: document.id, content, chunkIndex: index, embedding: '[]', metadata: '{}' })),
        });

        await db.document.update({ where: { id: document.id }, data: { status: 'ready' } });

        return NextResponse.json({ message: 'File processed successfully', document });
    } catch (error) {
        console.error('Upload and process error:', error);
        if (documentId) {
            // FIX: Add 'any' type to the error parameter 'e'
            await db.document.update({ where: { id: documentId }, data: { status: 'error' } }).catch((e: any) => console.error("Failed to update status to error:", e));
        }
        return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
    }
}