import { NextRequest, NextResponse } from 'next/server';
const pdfParse = require('pdf-parse');

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdfParse(buffer);

    return NextResponse.json({ text: data.text });
  } catch (error: any) {
    console.error('Erreur lors du parsing du PDF:', error);
    return NextResponse.json({ error: 'Erreur lors de la lecture du fichier PDF' }, { status: 500 });
  }
}
