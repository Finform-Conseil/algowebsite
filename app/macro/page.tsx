"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

type AnalysisCategory = "analysis" | "reports" | "insights" | "updates";
interface MacroAnalysis {
  id: string;
  title: string;
  category: AnalysisCategory;
  country: string;
  date: string;
  excerpt: string;
  featured: boolean;
}

const macroPages = [
  {
    title: "Key Economic Indicators",
    description: "Growth, inflation, employment, and economic conditions",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
    link: "/macro/key-indicators",
    color: "#00BFFF",
  },
  {
    title: "Currency & Central Banks",
    description: "Monetary policies and interest rates",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
    link: "/macro/currencies-central-banks",
    color: "#00BFFF",
  },
  {
    title: "Public Finance & Budget",
    description: "Deficits, Debt, and Fiscal Policy",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    link: "/macro/public-finances",
    color: "#00BFFF",
  },
  {
    title: "Foreign Trade & Currencies",
    description: "International Trade and Exchange Rates",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    link: "/macro/external-sector-fx",
    color: "#00BFFF",
  },
  {
    title: "Macro Analysis",
    description: "Macro Analysis",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    link: "/macro/macro-analysis",
    color: "#00BFFF",
  },
  {
    title: "Macroeconomic Calendar",
    description: "Macroeconomic Calendar",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <line x1="12" y1="20" x2="12" y2="10" />
        <line x1="18" y1="20" x2="18" y2="4" />
        <line x1="6" y1="20" x2="6" y2="16" />
      </svg>
    ),
    link: "/macro/economic-calendar",
    color: "#00BFFF",
  },
];

export default function MacroHomePage() {
  const [countdown, setCountdown] = useState(15);

  const [currentAnalysisIndex, setCurrentAnalysisIndex] = useState(0);

  const mockAnalyses: MacroAnalysis[] = [
    {
      id: "1",
      title:
        "Perspectives économiques 2025 : Croissance soutenue dans la zone UEMOA",
      category: "analysis",
      country: "UEMOA",
      date: "2025-05-20",
      excerpt:
        "Les prévisions indiquent une croissance moyenne de 6.2% pour la zone UEMOA en 2025, portée par les investissements infrastructurels et la transformation digitale.",
      featured: true,
    },
    {
      id: "2",
      title: "Impact de l'inflation sur les économies africaines",
      category: "reports",
      country: "Afrique",
      date: "2025-05-18",
      excerpt:
        "Analyse détaillée des pressions inflationnistes et des mesures de politique monétaire adoptées par les banques centrales africaines.",
      featured: true,
    },
    {
      id: "3",
      title: "Secteur réel : Performance du Bénin au T1 2025",
      category: "insights",
      country: "Bénin",
      date: "2025-05-15",
      excerpt:
        "Le secteur réel béninois affiche une croissance de 5.8% au premier trimestre, tirée par l'agriculture et les services.",
      featured: false,
    },
    {
      id: "4",
      title: "Mise à jour des indicateurs monétaires - Mai 2025",
      category: "updates",
      country: "BCEAO",
      date: "2025-05-10",
      excerpt:
        "Publication des derniers chiffres de la masse monétaire et du crédit à l'économie dans la zone UEMOA.",
      featured: false,
    },
  ];

  const featuredAnalyses = mockAnalyses.filter((a) => a.featured);

  const getCategoryLabel = (category: AnalysisCategory): string => {
    const labels: Record<AnalysisCategory, string> = {
      analysis: "Analyse",
      reports: "Rapport",
      insights: "Insights",
      updates: "Mise à jour",
    };
    return labels[category];
  };
  const handleAnalysisNavigation = (direction: "prev" | "next") => {
    if (direction === "next") {
      setCurrentAnalysisIndex((prev) => (prev + 1) % featuredAnalyses.length);
    } else {
      setCurrentAnalysisIndex(
        (prev) =>
          (prev - 1 + featuredAnalyses.length) % featuredAnalyses.length,
      );
    }
    setCountdown(15);
  };
  return (
    <div className="macro-home-page">
      <div className="macro-header-wrapper">
        <div
          className="macro-header"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7))`,
            backgroundSize: "cover",
            backgroundPosition: "center center",
            transition: "background-image 1s ease-in-out",
          }}
        >
          <div className="header-content">
            <h1>African Macroeconomic Indicators</h1>
            <p>Track key economic metrics and trends across African markets</p>
          </div>
        </div>
      </div>

      <div className="macro-content">
        <div className="left-column">
          <div className="macro-tools-section">
            <h2 className="section-title">Macro Economy Universe</h2>
            <div className="tools-grid">
              {macroPages.map((tool, idx) => (
                <Link key={idx} href={tool.link} className="tool-card">
                  <div
                    className="tool-icon"
                    style={{
                      backgroundColor: `${tool.color}15`,
                      color: tool.color,
                    }}
                  >
                    {tool.icon}
                  </div>
                  <div className="tool-content">
                    <h3 style={{ color: tool.color }}>{tool.title}</h3>
                    <p>{tool.description}</p>
                  </div>
                  <div className="tool-arrow">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="right-column">
          <>
            <div className="featured-analysis-section">
              <div className="featured-analysis-nav">
                <button
                  onClick={() => handleAnalysisNavigation("prev")}
                  className="nav-arrow"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  onClick={() => handleAnalysisNavigation("next")}
                  className="nav-arrow"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>

              <div className="countdown-timer">
                <svg width="40" height="40" viewBox="0 0 40 40">
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeDasharray={`${2 * Math.PI * 16}`}
                    strokeDashoffset={`${2 * Math.PI * 16 * (1 - countdown / 15)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 20 20)"
                    style={{ transition: "stroke-dashoffset 1s linear" }}
                  />
                </svg>
                <span className="countdown-number">{countdown}</span>
              </div>

              {featuredAnalyses.length > 0 && (
                <div className="featured-analysis-card">
                  <div className="featured-analysis-image">
                    <div
                      className="image-placeholder"
                      style={{
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      }}
                    />
                    <span
                      className={`featured-category category-${featuredAnalyses[currentAnalysisIndex].category}`}
                    >
                      {getCategoryLabel(
                        featuredAnalyses[currentAnalysisIndex].category,
                      )}
                    </span>
                  </div>
                  <div className="featured-analysis-content">
                    <h3>{featuredAnalyses[currentAnalysisIndex].title}</h3>
                    <p>{featuredAnalyses[currentAnalysisIndex].excerpt}</p>
                    <div className="featured-analysis-meta">
                      <span className="meta-country">
                        {featuredAnalyses[currentAnalysisIndex].country}
                      </span>
                      <span className="meta-date">
                        {new Date(
                          featuredAnalyses[currentAnalysisIndex].date,
                        ).toLocaleDateString("fr-FR", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="meta-read">5 min</span>
                    </div>
                    <Link href="/macro" className="read-more-btn">
                      Lire l'analyse →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="recommended-analysis-section">
              <h3 className="recommended-title">Analyses Recommandées</h3>
              <div className="recommended-analysis-grid">
                {mockAnalyses.slice(0, 2).map((analysis) => (
                  <Link
                    key={analysis.id}
                    href="/macro"
                    className="recommended-analysis-card"
                  >
                    <span
                      className={`analysis-category category-${analysis.category}`}
                    >
                      {getCategoryLabel(analysis.category)}
                    </span>
                    <h4>{analysis.title}</h4>
                    <p>{analysis.excerpt}</p>
                    <div className="recommended-meta">
                      <span>{analysis.country}</span>
                      <span>
                        {new Date(analysis.date).toLocaleDateString("fr-FR", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        </div>
      </div>
    </div>
  );
}
