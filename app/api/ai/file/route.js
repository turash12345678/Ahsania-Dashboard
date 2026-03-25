import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const fileName = file.name || '';
        const mimeType = file.type || '';
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (buffer.byteLength > MAX_BYTES) {
            return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 413 });
        }

        const ext = fileName.split('.').pop()?.toLowerCase();

        // --- PDF ---
        if (ext === 'pdf' || mimeType === 'application/pdf') {
            // Extract readable text directly from the PDF buffer without external deps
            // This works for most text-based PDFs by scanning for text stream content
            const raw = buffer.toString('latin1');
            const textMatches = [];
            // Match text content blocks in PDF streams
            const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
            let match;
            while ((match = streamRegex.exec(raw)) !== null) {
                const streamContent = match[1];
                // Extract visible text via BT...ET blocks and Tj/TJ operators
                const textRegex = /\(((?:[^()\\]|\\.)*)\)\s*Tj|\[((?:[^\[\]])*)\]\s*TJ/g;
                let textMatch;
                while ((textMatch = textRegex.exec(streamContent)) !== null) {
                    const chunk = textMatch[1] || textMatch[2] || '';
                    const cleaned = chunk
                        .replace(/\\n/g, '\n')
                        .replace(/\\r/g, '')
                        .replace(/\\t/g, ' ')
                        .replace(/\\\(/g, '(')
                        .replace(/\\\)/g, ')')
                        .replace(/\\\\/g, '\\');
                    if (cleaned.trim()) textMatches.push(cleaned);
                }
            }
            const text = textMatches.join(' ').replace(/\s+/g, ' ').trim().slice(0, 12000);
            return NextResponse.json({
                type: 'text',
                content: text
                    ? `[PDF: ${fileName}]\n\n${text}`
                    : `[PDF: ${fileName}]\n\nThis PDF appears to use image-based or encrypted content which cannot be extracted as text. Please copy and paste the relevant text manually.`,
                fileName
            });
        }

        // --- Excel / CSV ---
        if (['xlsx', 'xls', 'csv'].includes(ext)) {
            const XLSX = await import('xlsx');
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            let content = `[Excel: ${fileName}]\n\n`;
            workbook.SheetNames.slice(0, 3).forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                const csv = XLSX.utils.sheet_to_csv(sheet);
                content += `Sheet: ${sheetName}\n${csv.slice(0, 4000)}\n\n`;
            });
            return NextResponse.json({ type: 'text', content: content.slice(0, 12000), fileName });
        }

        // --- Word ---
        if (['docx', 'doc'].includes(ext)) {
            const mammoth = (await import('mammoth')).default;
            const result = await mammoth.extractRawText({ buffer });
            const text = result.value.slice(0, 12000);
            return NextResponse.json({
                type: 'text',
                content: `[Word: ${fileName}]\n\n${text}`,
                fileName
            });
        }

        // --- Image ---
        if (mimeType.startsWith('image/')) {
            const base64 = buffer.toString('base64');
            return NextResponse.json({
                type: 'image',
                base64,
                mimeType,
                fileName
            });
        }

        return NextResponse.json({ error: 'Unsupported file type. Supported: Image, PDF, Excel, Word' }, { status: 400 });

    } catch (error) {
        console.error('File processing error:', error);
        return NextResponse.json({ error: 'Failed to process file: ' + error.message }, { status: 500 });
    }
}
