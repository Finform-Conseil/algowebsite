'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, List } from '@phosphor-icons/react';
import { GLOSSARY_TERMS } from '@/core/data/GlossaryData';

export default function GlossaryDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const termIndex = GLOSSARY_TERMS.findIndex(t => t.slug === slug);
  const term = GLOSSARY_TERMS[termIndex];

  const bodyRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef('');
  const [activeSection, setActiveSection] = useState<string>('');

  const tocItems: { id: string; label: string }[] = [
    { id: 'resume', label: 'En résumé' },
    { id: 'en-clair', label: 'En clair' },
    ...(term && term.formula ? [{ id: 'formule', label: 'Formule' }] : []),
    ...(term ? term.sections.map(s => ({ id: s.id, label: s.title })) : []),
  ];

  useEffect(() => {
    const container = bodyRef.current;
    if (!container) return;

    container.scrollTop = 0;
    setActiveSection('');
    activeRef.current = '';

    const onScroll = () => {
      const containerTop = container.getBoundingClientRect().top;
      const sections = container.querySelectorAll<HTMLElement>('section[id]');
      let current = '';
      sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top - containerTop;
        if (sectionTop <= 60) {
          current = section.id;
        }
      });
      if (current !== activeRef.current) {
        activeRef.current = current;
        setActiveSection(current);
      }
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => container.removeEventListener('scroll', onScroll);
  }, [slug]);

  const handleTocClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const container = bodyRef.current;
    if (!container) return;
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
    container.scrollTo({ top: top - 10, behavior: 'smooth' });
    history.replaceState(null, '', `#${id}`);
  };

  if (!term) {
    return (
      <main className="term-detail-page slide-up">
        <Link href="/glossary" className="back-btn">
          <ArrowLeft size={16} />
          Retour au Glossaire
        </Link>
        <div className="error-state">
          <h1>Terme introuvable</h1>
          <p>Le concept recherché n&apos;existe pas ou a été déplacé.</p>
          <Link href="/glossary" className="back-btn">
            Retour à la liste des termes
          </Link>
        </div>
      </main>
    );
  }

  const prevTerm = termIndex > 0 ? GLOSSARY_TERMS[termIndex - 1] : null;
  const nextTerm = termIndex < GLOSSARY_TERMS.length - 1 ? GLOSSARY_TERMS[termIndex + 1] : null;

  const relatedTerms = term.relatedSlugs
    .map(s => GLOSSARY_TERMS.find(t => t.slug === s))
    .filter((t): t is typeof GLOSSARY_TERMS[number] => !!t);

  const renderFormula = (formula: string) => {
    if (formula.includes(' / ')) {
      const options = formula.split('  ou  ');
      return (
        <div className="formula-options">
          {options.map((opt, i) => {
            const parts = opt.split(' / ');
            if (parts.length === 2) {
              return (
                <div key={i} className="formula-option">
                  {i > 0 && <span className="formula-sep">ou</span>}
                  <span className="fraction">
                    <span className="numerator">{parts[0]}</span>
                    <span className="denominator">{parts[1]}</span>
                  </span>
                </div>
              );
            }
            return <span key={i}>{opt}</span>;
          })}
        </div>
      );
    }
    return <span>{formula}</span>;
  };

  return (
    <main className="term-detail-page">
      <Link href="/glossary" className="back-btn">
        <ArrowLeft size={16} />
        Retour au Glossaire
      </Link>

      <nav className="detail-breadcrumb">
        <Link href="/">Accueil</Link>
        <span className="bc-sep">›</span>
        <Link href="/glossary">Glossaire</Link>
        <span className="bc-sep">›</span>
        <span>{term.term}</span>
      </nav>

      <div className="detail-layout">
        <article className="detail-main">
          <div className="detail-main-header">
            <div className="detail-badges">
              <span className="detail-badge">{term.category}</span>
              {term.secondaryBadge && (
                <span className="detail-badge-secondary">{term.secondaryBadge}</span>
              )}
            </div>

            <h1>{term.term}</h1>
            {term.subtitle && <p className="detail-subtitle">{term.subtitle}</p>}
          </div>

          <div className="detail-main-body" ref={bodyRef}>

          <section id="resume" className="detail-section">
            <h3>En résumé</h3>
            <div className="section-content">
              <p>{term.definition}</p>
            </div>
          </section>

          <section id="en-clair" className="detail-section">
            <h3>En clair</h3>
            <div className="section-content simply-put-box">
              <p>{term.simplyPut}</p>
            </div>
          </section>

          {term.formula && (
            <section id="formule" className="detail-section">
              <h3>Formule</h3>
              <div className="section-content formula-box">
                {renderFormula(term.formula)}
              </div>
            </section>
          )}

          {term.sections.map(section => (
            <section key={section.id} id={section.id} className="detail-section">
              <h3>{section.title}</h3>
              <div className="section-content">
                {section.content.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </section>
          ))}

          {term.screenerLink && (
            <div className="screener-link-box">
              <p>
                Utiliser le screener <strong>{term.screenerLink}</strong>
              </p>
            </div>
          )}

          {relatedTerms.length > 0 && (
            <section className="related-terms">
              <h3>Concepts associés</h3>
              <div className="related-list">
                {relatedTerms.map(rt => (
                  <Link key={rt.slug} href={`/glossary/${rt.slug}`} className="related-item">
                    <strong>{rt.term}</strong>
                    <span>{rt.definition}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <nav className="detail-nav">
            {prevTerm ? (
              <Link href={`/glossary/${prevTerm.slug}`} className="nav-link nav-prev">
                <ArrowLeft size={16} />
                <div>
                  <span className="nav-label">Précédent</span>
                  <span className="nav-term">{prevTerm.term}</span>
                </div>
              </Link>
            ) : <div />}
            {nextTerm ? (
              <Link href={`/glossary/${nextTerm.slug}`} className="nav-link nav-next">
                <div>
                  <span className="nav-label">Suivant</span>
                  <span className="nav-term">{nextTerm.term}</span>
                </div>
                <ArrowRight size={16} />
              </Link>
            ) : <div />}
          </nav>
        </div>{/* detail-main-body */}
      </article>

        <aside className="detail-toc">
          <div className="toc-inner">
            <h4>
              <List size={16} />
              Sur cette page
            </h4>
            <nav>
              {tocItems.map(item => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`toc-link${activeSection === item.id ? ' active' : ''}`}
                  onClick={(e) => handleTocClick(e, item.id)}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      </div>
    </main>
  );
}
