import React from 'react';

export type CVData = {
  header: {
    name: string;
    title: string;
    subtitle: string;
  };
  contact: {
    phone: string;
    email: string;
    location: string;
    linkedin: string;
    portfolio: string;
  };
  summary: string;
  education: {
    degree: string;
    school: string;
    date: string;
  }[];
  experience: {
    title: string;
    company: string;
    date: string;
    bullets: {
      keyword: string;
      description: string;
    }[];
  }[];
  skillsLeft: {
    category: string;
    bullets: string[];
  }[];
  skillsRight: {
    category: string;
    bullets: string[];
  }[];
  languages: string[];
  interests: string[];
  software: string[];
  qualities: string[];
};

export default function CVTemplate({ data }: { data: CVData | null }) {
  if (!data) return null;

  return (
    <div 
      id="cv-template-container" 
      style={{
        width: '210mm',
        height: '296mm', // Slightly less than 297 to avoid second page
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: 'Arial, Helvetica, sans-serif',
        padding: '10mm', // Reduced padding
        boxSizing: 'border-box',
        fontSize: '8.5pt', // Reduced font size
        lineHeight: '1.2' // Reduced line height
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2mm' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ color: '#1E3A8A', fontSize: '24pt', margin: '0 0 1mm 0', fontWeight: 'bold' }}>
            {data.header.name}
          </h1>
          <div style={{ color: '#EA580C', fontSize: '10pt', fontWeight: 'bold', maxWidth: '140mm' }}>
            {data.header.title}
          </div>
          <div style={{ color: '#EA580C', fontSize: '10pt', fontWeight: 'bold' }}>
            {data.header.subtitle}
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '8.5pt', color: '#333' }}>
          <div>{data.contact.phone}</div>
          <div>{data.contact.email}</div>
          <div>{data.contact.location}</div>
          {data.contact.linkedin && <div style={{ color: '#2563EB', textDecoration: 'underline' }}>LinkedIn</div>}
          {data.contact.portfolio && <div style={{ color: '#2563EB', textDecoration: 'underline' }}>Portfolio</div>}
        </div>
      </header>

      <div style={{ marginBottom: '2mm', fontSize: '8.5pt', textAlign: 'justify' }}>
        {data.summary}
      </div>

      <Section title="DIPLÔMES ET FORMATIONS" />
      <div style={{ marginBottom: '2mm' }}>
        {data.education.map((edu, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1mm' }}>
            <div>
              <strong>{edu.degree}{edu.school ? ` – ${edu.school}` : ''}</strong>
            </div>
            <div>{edu.date}</div>
          </div>
        ))}
      </div>

      <Section title="EXPÉRIENCES PROFESSIONNELLES" />
      <div style={{ marginBottom: '2mm' }}>
        {data.experience.map((exp, i) => (
          <div key={i} style={{ marginBottom: '1.5mm' }}>
            <div style={{ fontWeight: 'bold', fontSize: '9.5pt', marginBottom: '0.5mm' }}>
              {exp.title} {exp.company ? `– ${exp.company}` : ''} {exp.date ? `, ${exp.date}` : ''}
            </div>
            <ul style={{ margin: 0, paddingLeft: '5mm', listStyleType: 'disc' }}>
              {exp.bullets.map((b, j) => (
                <li key={j} style={{ marginBottom: '0.5mm', fontSize: '8.5pt' }}>
                  {b.keyword && <span style={{ color: '#EA580C', fontWeight: 'bold' }}>{b.keyword} : </span>}
                  {b.description}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Section title="COMPÉTENCES" />
      <div style={{ display: 'flex', gap: '8mm', marginBottom: '2mm' }}>
        <div style={{ flex: 1 }}>
          {data.skillsLeft.map((cat, i) => (
            <div key={i} style={{ marginBottom: '1.5mm' }}>
              <div style={{ fontWeight: 'bold', color: '#1E3A8A', marginBottom: '0.5mm' }}>{cat.category}</div>
              <ul style={{ margin: 0, paddingLeft: '5mm', fontSize: '8.5pt', listStyleType: 'disc' }}>
                {cat.bullets.map((b, j) => (
                  <li key={j} style={{ marginBottom: '0.5mm' }}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          {data.skillsRight.map((cat, i) => (
            <div key={i} style={{ marginBottom: '1.5mm' }}>
              <div style={{ fontWeight: 'bold', color: '#1E3A8A', marginBottom: '0.5mm' }}>{cat.category}</div>
              <ul style={{ margin: 0, paddingLeft: '5mm', fontSize: '8.5pt', listStyleType: 'disc' }}>
                {cat.bullets.map((b, j) => (
                  <li key={j} style={{ marginBottom: '0.5mm' }}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5pt' }}>
        <div style={{ flex: 1 }}>
          <SimpleSection title="LANGUES" />
          {data.languages.map((l, i) => <div key={i} style={{ marginBottom: '0.5mm' }}>{l}</div>)}
        </div>
        <div style={{ flex: 1 }}>
          <SimpleSection title="CENTRES D'INTÉRÊT" />
          {data.interests.map((c, i) => <div key={i} style={{ marginBottom: '0.5mm' }}>{c}</div>)}
        </div>
        <div style={{ flex: 1 }}>
          <SimpleSection title="LOGICIELS" />
          {data.software.map((s, i) => <div key={i} style={{ marginBottom: '0.5mm' }}>{s}</div>)}
        </div>
        <div style={{ flex: 1 }}>
          <SimpleSection title="QUALITÉS" />
          {data.qualities.map((q, i) => <div key={i} style={{ marginBottom: '0.5mm' }}>{q}</div>)}
        </div>
      </div>
    </div>
  );
}

function SimpleSection({ title }: { title: string }) {
  return (
    <h2 style={{ 
      color: '#1E3A8A', 
      fontSize: '9.5pt', 
      marginBottom: '1mm',
      marginTop: '0',
      textTransform: 'uppercase'
    }}>
      {title}
    </h2>
  );
}

function Section({ title }: { title: string }) {
  return (
    <h2 style={{ 
      color: '#1E3A8A', 
      fontSize: '10pt', 
      borderBottom: '2px solid #1E3A8A', 
      paddingBottom: '0.5mm', 
      marginBottom: '1.5mm',
      marginTop: '0',
      textTransform: 'uppercase'
    }}>
      {title}
    </h2>
  );
}
