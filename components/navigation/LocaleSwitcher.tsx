'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { routing } from '@/i18n/routing';

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleSwitch = (newLocale: string) => {
    const segments = pathname.split('/');
    if (routing.locales.includes(segments[1] as 'en' | 'fr')) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    router.push(segments.join('/'));
  };

  return (
    <div className="locale-switcher">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          onClick={() => handleSwitch(loc)}
          className={`locale-btn ${locale === loc ? 'active' : ''}`}
          aria-label={loc === 'en' ? 'English' : 'Français'}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
