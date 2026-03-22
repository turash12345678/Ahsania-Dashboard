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
            // Use require to avoid Turbopack ESM issues with pdf-parse
            const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
            const data = await pdfParse(buffer);
            const text = data.text.slice(0, 12000);
            return NextResponse.json({
                type: 'text',
                content: `[PDF: ${fileName}]\n\n${text}`,
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
