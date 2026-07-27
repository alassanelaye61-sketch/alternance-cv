import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { cvText } = await req.json();

    if (!cvText) {
      return NextResponse.json({ error: 'CV text is required' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      generationConfig: {
        responseMimeType: 'application/json',
      }
    });

    const prompt = `Tu es un expert en analyse de CV.
Ton objectif est de prendre le texte brut suivant d'un CV et de le transformer STRICTEMENT en un objet JSON structuré.

Voici la structure JSON attendue :
{
  "header": {
    "name": "string",
    "title": "string",
    "subtitle": "string (ex: Rythme : 1 semaine école...)"
  },
  "contact": {
    "phone": "string",
    "email": "string",
    "location": "string",
    "linkedin": "string",
    "portfolio": "string"
  },
  "summary": "string (le profil hybride ou description sous le header)",
  "education": [
    {
      "degree": "string (ex: Mastère Management...)",
      "school": "string",
      "date": "string"
    }
  ],
  "experience": [
    {
      "title": "string",
      "company": "string",
      "date": "string",
      "bullets": [
        {
          "keyword": "string (ex: Collecte & structuration des données)",
          "description": "string (le reste de la puce)"
        }
      ]
    }
  ],
  "skillsLeft": [
    {
      "category": "string (ex: Stratégie & Communication digitale)",
      "bullets": ["string"]
    }
  ],
  "skillsRight": [
    {
      "category": "string (ex: Data, IA & Automatisation)",
      "bullets": ["string"]
    }
  ],
  "languages": ["string"],
  "interests": ["string"],
  "software": ["string"],
  "qualities": ["string"]
}

Si une information est absente, mets une chaîne vide "" ou un tableau vide [].
Pour les expériences, si une puce commence par des mots clés (souvent en gras ou suivi de ' : '), sépare-les dans 'keyword' et le reste dans 'description'. Si ce n'est pas le cas, mets tout dans 'description' et laisse 'keyword' vide.
Dans les skills, répartis équitablement les compétences ou selon les grands titres si le texte le permet (les 2 grandes catégories principales vont dans skillsLeft et skillsRight).

ATTENTION CRITIQUE : N'oublie SURTOUT PAS les sections tout en bas du CV ! Tu dois impérativement chercher les mots "LANGUES", "CENTRES D'INTÉRÊT", "LOGICIELS" et "QUALITÉS" dans le texte et extraire tous les éléments correspondants dans les tableaux de la structure JSON.

Voici le texte du CV à analyser :
"""
${cvText}
"""
`;

    const result = await model.generateContent(prompt);
    const text = (await result.response).text();
    
    // Nettoyage au cas où l'IA renvoie des balises Markdown
    let cleanText = text.trim();
    if (cleanText.startsWith('\`\`\`json')) {
      cleanText = cleanText.slice(7, -3).trim();
    } else if (cleanText.startsWith('\`\`\`')) {
      cleanText = cleanText.slice(3, -3).trim();
    }
    
    return NextResponse.json(JSON.parse(cleanText));
  } catch (error: any) {
    console.error("Extraction error:", error);
    return NextResponse.json({ error: error.message || 'Une erreur est survenue lors de l\'extraction.' }, { status: 500 });
  }
}
