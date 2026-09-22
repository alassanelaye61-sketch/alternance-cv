import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Models to try in order of preference
const MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
];

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateWithRetryAndFallback(prompt: string) {
  for (const modelName of MODELS) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Trying model ${modelName}, attempt ${attempt}/${MAX_RETRIES}...`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
          }
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log(`Success with model ${modelName} on attempt ${attempt}`);
        return text;
      } catch (error: any) {
        const is503 = error?.message?.includes('503') || error?.status === 503;
        const is429 = error?.message?.includes('429') || error?.status === 429;
        const isRetryable = is503 || is429;

        if (isRetryable && attempt < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1) + Math.random() * 500;
          console.warn(`Model ${modelName} returned ${is503 ? '503' : '429'}, retrying in ${Math.round(delay)}ms...`);
          await sleep(delay);
          continue;
        }

        if (isRetryable) {
          console.warn(`Model ${modelName} exhausted retries, trying next model...`);
          break; // try next model
        }

        // Non-retryable error — throw immediately
        throw error;
      }
    }
  }

  throw new Error(
    'Le service d\'IA est temporairement surchargé. Tous les modèles sont indisponibles. Veuillez réessayer dans quelques minutes.'
  );
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is missing in environment variables' }, { status: 500 });
    }

    const { cvText, jobDescription } = await req.json();

    if (!cvText || !jobDescription) {
      return NextResponse.json({ error: 'CV and Job Description are required' }, { status: 400 });
    }

    const prompt = `# Role: Expert en Recrutement, Design de CV & Adaptation d'Alternance

Tu es un expert reconnu en recrutement, en ingénierie de CV et en design d'informations. Ton rôle est d'adapter sur-mesure le CV d'un candidat pour maximiser ses chances d'obtenir une alternance, tout en garantissant un respect absolu du design et de la mise en page d'origine.

---

## 🎯 Objectif Principal
Analyser le CV du candidat et la description de poste fournie, puis réécrire/optimiser le contenu du CV pour y intégrer les mots-clés ATS et les compétences requises, **sans jamais dépasser la longueur du texte d'origine** afin de ne pas altérer le design initial.

---

## 📥 Entrées Réceptionnées
1. **CV Original** :
${cvText}

2. **Fiche de Poste Target** :
${jobDescription}

---

## 🛠️ Directives et Règles Strictes

### 1. Analyse du Matching (Poste vs CV)
- Identifie les **mots-clés stratégiques**, les **hard skills** et les **soft skills** essentiels dans la fiche de poste.
- Repère les éléments du CV original qui correspondent déjà à l'offre et valorise-les.

### 2. Adaptation du Contenu & Mots-Clés
- Réécris les phrases et les listes à puces (*bullet points*) en intégrant les mots-clés de l'offre.
- Ajuste le vocabulaire pour correspondre au jargon du secteur visé.
- **Interdiction d'inventer :** Ne crée pas de fausses expériences ou de compétences absentes de l'expérience réelle du candidat.

### 3. Respect du Design (Contrainte de Longueur - SMART FITTING)
- **Règle d'or :** Le texte optimisé d'une section ne doit **PAS** être plus long que le texte d'origine (+/- 5% maximum de variation en nombre de caractères).
- Si tu ajoutes un mot-clé, supprime des mots secondaires ou des formules de remplissage pour conserver la même longueur visuelle.

### 4. Audit Design & Conseils
- Fournis 3 recommandations visuelles simples (hiérarchie, typographie, lisibilité, couleurs) adaptées au secteur du poste pour rendre le CV encore plus percutant.

---

## 📤 Format de Sortie Souhaité (JSON)

Génère la réponse strictement dans la structure JSON suivante :

\`\`\`json
{
  "analyse_matching": {
    "score_pertinence": "Pourcentage de correspondance estimé (ex: 85%)",
    "mots_cles_cles_integres": ["Mot-clé 1", "Mot-clé 2", "Compétence X"],
    "points_forts": ["Raison 1", "Raison 2"]
  },
  "sections_modifiees": [
    {
      "id_section": "titre_cv",
      "texte_original": "Texte d'origine...",
      "texte_optimise": "Nouveau titre optimisé...",
      "caracteres_originaux": 40,
      "caracteres_optimises": 38
    },
    {
      "id_section": "resume_professionnel",
      "texte_original": "Texte d'origine...",
      "texte_optimise": "Texte réécrit intégrant les mots-clés...",
      "caracteres_originaux": 220,
      "caracteres_optimises": 215
    },
    {
      "id_section": "experience_1",
      "texte_original": "Texte d'origine...",
      "texte_optimise": "Texte réécrit avec puces optimisées...",
      "caracteres_originaux": 350,
      "caracteres_optimises": 348
    }
  ],
  "conseils_design": [
    "Conseil 1 concernant la hiérarchie visuelle ou la lisibilité.",
    "Conseil 2 sur la palette de couleurs recommandée pour ce secteur.",
    "Conseil 3 sur l'agencement des éléments."
  ]
}
\`\`\`
`;

    const text = await generateWithRetryAndFallback(prompt);
    
    // MimeType application/json already parses it as valid JSON string, but sometimes we need to strip markdown backticks
    let cleanText = text.trim();
    if (cleanText.startsWith('\`\`\`json')) {
      cleanText = cleanText.slice(7, -3).trim();
    } else if (cleanText.startsWith('\`\`\`')) {
      cleanText = cleanText.slice(3, -3).trim();
    }
    
    const jsonResponse = JSON.parse(cleanText);

    return NextResponse.json(jsonResponse);

  } catch (error: any) {
    console.error('Error generating optimization:', error);
    
    const userMessage = error.message?.includes('surchargé')
      ? error.message
      : 'Une erreur est survenue lors de l\'optimisation. Veuillez réessayer.';
    
    return NextResponse.json({ error: userMessage }, { status: 503 });
  }
}
