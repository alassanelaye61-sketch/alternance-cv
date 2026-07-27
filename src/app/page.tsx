'use client';

import { useState, useRef } from 'react';
import CVTemplate, { CVData } from '../components/CVTemplate';
import { jsPDF } from 'jspdf';

type OptimizationResult = {
  analyse_matching: {
    score_pertinence: string;
    mots_cles_cles_integres: string[];
    points_forts: string[];
  };
  sections_modifiees: {
    id_section: string;
    texte_original: string;
    texte_optimise: string;
    caracteres_originaux: number;
    caracteres_optimises: number;
  }[];
  conseils_design: string[];
};

export default function Home() {
  const [cvText, setCvText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await handleFileUpload(file);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Veuillez uploader un fichier PDF.');
      return;
    }
    setCvFile(file);
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCvText(data.text);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la lecture du CV');
      setCvFile(null);
      setCvText('');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (!cvText.trim() || !jobDescription.trim()) {
      setError('Veuillez remplir les deux champs.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cvText, jobDescription }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue.');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!result || !cvText) return;
    setIsGeneratingPdf(true);
    
    try {
      // Créer le texte final en remplaçant les parties originales par les optimisées
      let fullOptimizedText = cvText;
      result.sections_modifiees.forEach(section => {
        if (fullOptimizedText.includes(section.texte_original)) {
           fullOptimizedText = fullOptimizedText.replace(section.texte_original, section.texte_optimise);
        }
      });

      // Extraire les données via l'API
      const res = await fetch('/api/extract-cv-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText: fullOptimizedText })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCvData(data); // Render it invisibly

      // Attendre un instant que React affiche le template
      setTimeout(async () => {
        const element = document.getElementById('cv-template-container');
        if (element) {
          const html2pdf = (await import('html2pdf.js')).default;
          const opt: any = {
            margin:       0,
            filename:     'CV_Optimise_Design.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };
          await html2pdf().set(opt).from(element).save();
        }
        setIsGeneratingPdf(false);
      }, 800);

    } catch (err: any) {
      setError("Erreur lors de la génération du PDF : " + err.message);
      setIsGeneratingPdf(false);
    }
  };

  return (
    <main className="container">
      <header>
        <h1>Smart Fit Alternance</h1>
        <p style={{ textAlign: 'center', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
          Optimisez votre CV pour correspondre parfaitement à l'offre d'alternance visée, tout en respectant la longueur originale de vos textes pour ne pas casser votre design.
        </p>
      </header>

      <div className="grid grid-2">
        <div className="glass-panel">
          <h2>1. Votre CV Actuel</h2>
          <p>Glissez-déposez votre CV au format PDF ou cliquez pour l'importer.</p>
          <div 
            className={`input-group drag-drop-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: isDragging ? '2px dashed #3b82f6' : '2px dashed rgba(255,255,255,0.2)',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: isDragging ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.02)',
              transition: 'all 0.3s ease',
              marginBottom: '1rem'
            }}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileInput} 
              accept=".pdf" 
              style={{ display: 'none' }} 
            />
            {cvFile ? (
              <div>
                <span style={{ fontSize: '2rem' }}>📄</span>
                <p style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>{cvFile.name}</p>
                <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Cliquez pour modifier</p>
              </div>
            ) : (
              <div>
                <span style={{ fontSize: '2rem' }}>📁</span>
                <p style={{ marginTop: '0.5rem' }}>Glissez votre PDF ici ou cliquez</p>
              </div>
            )}
          </div>
          
          {cvText && (
            <div className="input-group">
              <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem', opacity: 0.8 }}>Texte extrait (modifiable) :</p>
              <textarea
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                placeholder="Le texte de votre CV s'affichera ici..."
                style={{ height: '150px' }}
              />
            </div>
          )}
        </div>

        <div className="glass-panel">
          <h2>2. Fiche de Poste (Cible)</h2>
          <p>Collez ici la description de l'offre d'alternance que vous visez.</p>
          <div className="input-group">
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Ex: Nous recherchons un développeur React..."
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button 
          className="btn btn-primary" 
          onClick={handleOptimize} 
          disabled={loading}
          style={{ maxWidth: '300px' }}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Analyse en cours...
            </>
          ) : (
            'Optimiser mon CV ✨'
          )}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', color: '#fca5a5', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {result && (
        <div className="result-section">
          <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
            <div className="glass-panel">
              <h2>Analyse du Matching</h2>
              <div className="score-badge">{result.analyse_matching.score_pertinence}</div>
              
              <h3 style={{ fontSize: '1.1rem', marginTop: '1rem' }}>Mots-clés intégrés :</h3>
              <div style={{ marginBottom: '1rem' }}>
                {result.analyse_matching.mots_cles_cles_integres.map((kw, i) => (
                  <span key={i} className="tag">{kw}</span>
                ))}
              </div>

              <h3 style={{ fontSize: '1.1rem' }}>Points forts :</h3>
              <div>
                {result.analyse_matching.points_forts.map((pf, i) => (
                  <div key={i} className="list-item">{pf}</div>
                ))}
              </div>
            </div>

            <div className="glass-panel">
              <h2>Conseils Design</h2>
              <p>Recommandations visuelles pour votre secteur :</p>
              <div>
                {result.conseils_design.map((conseil, i) => (
                  <div key={i} className="list-item">{conseil}</div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-panel">
            <h2>Sections Optimisées</h2>
            <p>Remplacez le texte de votre CV par ces versions optimisées. La longueur est préservée.</p>
            
            <div style={{ marginTop: '2rem' }}>
              {result.sections_modifiees.map((section, index) => {
                const diffRatio = Math.abs(section.caracteres_optimises - section.caracteres_originaux) / section.caracteres_originaux;
                const isMatch = diffRatio <= 0.1; // tolerance of 10%

                return (
                  <div key={index} style={{ marginBottom: '3rem' }}>
                    <h3 style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                      Section: {section.id_section}
                    </h3>
                    
                    <div className="diff-container">
                      <div className="diff-box">
                        <div className="diff-header diff-original">
                          Original
                          <span className="char-count">{section.caracteres_originaux} chars</span>
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{section.texte_original}</div>
                      </div>
                      
                      <div className="diff-box" style={{ borderColor: isMatch ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)' }}>
                        <div className="diff-header diff-optimized">
                          Optimisé ✨
                          <span className={`char-count ${isMatch ? 'char-match' : 'char-diff'}`}>
                            {section.caracteres_optimises} chars
                          </span>
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{section.texte_optimise}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div style={{ marginTop: '3rem', textAlign: 'center' }}>
              <button 
                className="btn btn-primary" 
                onClick={handleDownloadPDF}
                disabled={isGeneratingPdf}
                style={{ background: '#10b981', color: '#fff', border: 'none', padding: '1rem 2rem', fontSize: '1.1rem', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {isGeneratingPdf ? (
                  <><span className="spinner"></span> Génération du design...</>
                ) : (
                  <><span>📄</span> Télécharger mon CV optimisé en PDF</>
                )}
              </button>
              <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.7 }}>
                Génère un PDF reprenant exactement le design original de votre CV.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hidden PDF Template */}
      <div style={{ position: 'absolute', top: 0, left: 0, opacity: 0.001, pointerEvents: 'none', zIndex: -1000 }}>
        <CVTemplate data={cvData} />
      </div>
    </main>
  );
}
