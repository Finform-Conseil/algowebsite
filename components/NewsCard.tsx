import { NewsItem } from '@/core/data/News';

interface NewsCardProps {
  news: NewsItem;
}

export default function NewsCard({ news }: NewsCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const categoryLabels = {
    market: 'Marchés',
    tech: 'Technologie',
    economy: 'Économie',
    company: 'Entreprise',
  };

  return (
    <div className="card card--news fade-in">
      <div className="card__body">
        <span className={`badge badge--${news.category}`}>
          {categoryLabels[news.category]}
        </span>
        <h3 className="news-title">{news.title}</h3>
        <p className="news-summary">{news.summary}</p>
        <p className="news-date">{formatDate(news.date)}</p>
      </div>
    </div>
  );
}
