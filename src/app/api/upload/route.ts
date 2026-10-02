import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    const uploadsDir = path.resolve(process.cwd(), 'public/uploads/medicines');

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // 1. Handle multipart/form-data
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      let files = formData.getAll('files') as File[];
      if (!files || files.length === 0) {
        files = formData.getAll('file') as File[];
      }

      if (!files || files.length === 0 || !files[0]) {
        return NextResponse.json({ success: false, error: 'No files provided in form data' }, { status: 400 });
      }

      const uploadedUrls: string[] = [];
      const filenames: string[] = [];

      for (const file of files) {
        if (!file || typeof file.arrayBuffer !== 'function') continue;
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const ext = path.extname(file.name) || '.jpg';
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `med_${Date.now()}_${Math.floor(Math.random() * 1000)}_${cleanName}`;
        const filePath = path.join(uploadsDir, filename);

        fs.writeFileSync(filePath, buffer);
        uploadedUrls.push(`/uploads/medicines/${filename}`);
        filenames.push(filename);
      }

      return NextResponse.json({
        success: true,
        urls: uploadedUrls,
        url: uploadedUrls[0] || '',
        filenames,
      });
    }

    // 2. Handle application/json with base64 Data URL
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { dataUrl, filename: origName } = body;

      if (!dataUrl || typeof dataUrl !== 'string') {
        return NextResponse.json({ success: false, error: 'No dataUrl provided in JSON body' }, { status: 400 });
      }

      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return NextResponse.json({ success: false, error: 'Invalid base64 Data URL format' }, { status: 400 });
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      let ext = '.jpg';
      if (mimeType.includes('png')) ext = '.png';
      else if (mimeType.includes('webp')) ext = '.webp';
      else if (mimeType.includes('gif')) ext = '.gif';

      const cleanName = (origName || 'upload').replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `med_${Date.now()}_${cleanName}${cleanName.endsWith(ext) ? '' : ext}`;
      const filePath = path.join(uploadsDir, filename);

      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/medicines/${filename}`;
      return NextResponse.json({
        success: true,
        url: publicUrl,
        filename,
      });
    }

    return NextResponse.json({ success: false, error: 'Unsupported Content-Type' }, { status: 400 });
  } catch (error: any) {
    console.error('Error uploading medicine image:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error while saving image' },
      { status: 500 }
    );
  }
}
