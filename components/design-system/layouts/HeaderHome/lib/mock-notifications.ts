/**
 * Types et données mock pour le système de notifications
 * Génère des notifications réalistes pour démonstration UI/UX
 */

export type NotificationType = 'success' | 'warning' | 'info' | 'error';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  type: NotificationType;
  iconType: string;
  link?: string;
  duration?: number;
}

/**
 * Formate un timestamp en temps relatif (ex: "Il y a 5 min")
 */
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'À l\'instant';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Il y a ${diffInMinutes} min`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Il y a ${diffInHours}h`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `Il y a ${diffInDays}j`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  return `Il y a ${diffInWeeks} sem`;
};

/**
 * Génère des notifications mock réalistes pour la démonstration
 */
export const getMockNotifications = (): AppNotification[] => {
  const now = new Date();

  return [
    {
      id: '1',
      title: 'Alerte de marché',
      message: 'Apple (AAPL) a dépassé le seuil de 180$ (+2.5%)',
      timestamp: new Date(now.getTime() - 5 * 60 * 1000), // Il y a 5 min
      isRead: false,
      type: 'warning',
      iconType: 'faExclamationTriangle',
      link: '/market/AAPL'
    },
    {
      id: '2',
      title: 'Dividende versé',
      message: 'Microsoft Corp. a versé un dividende de 0.68$ par action',
      timestamp: new Date(now.getTime() - 30 * 60 * 1000), // Il y a 30 min
      isRead: false,
      type: 'success',
      iconType: 'faCoins',
      link: '/dividends'
    },
    {
      id: '3',
      title: 'Nouveau rapport disponible',
      message: 'Analyse trimestrielle Q4 2024 - Secteur Tech',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // Il y a 2h
      isRead: true,
      type: 'info',
      iconType: 'faFileAlt',
      link: '/reports/q4-2024'
    },
    {
      id: '4',
      title: 'Performance de portefeuille',
      message: 'Votre portefeuille a progressé de +1.8% aujourd\'hui',
      timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000), // Il y a 4h
      isRead: true,
      type: 'success',
      iconType: 'faChartLine',
      link: '/portfolio'
    },
    {
      id: '5',
      title: 'Événement à venir',
      message: 'Conférence des résultats Tesla - 15 Déc 2024',
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Il y a 1 jour
      isRead: true,
      type: 'info',
      iconType: 'faBell',
      link: '/calendar'
    }
  ];
};
