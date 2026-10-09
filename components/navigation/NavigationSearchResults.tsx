'use client';
import Link from 'next/link';
import { CaretRight, MagnifyingGlass } from '@phosphor-icons/react';
import type { NavItem } from './Navbar';
export default function NavigationSearchResults({ query, items, onClear, onNavigate }: {
  query: string; items: NavItem[]; onClear: () => void; onNavigate: () => void;
}) {
  const q = query.trim().toLocaleLowerCase();
  const all = items.flatMap(item => (item.items ?? []).flatMap(sub => [
    { href: sub.href, label: sub.label, section: item.label },
    ...(sub.subItems ?? []).map(nested => ({ href: nested.href, label: nested.label, section: item.label })),
  ]));
  const found = q ? all.filter(x => (x.label + ' ' + x.section).toLocaleLowerCase().includes(q)).slice(0, 30) : [];
  return <li className="shared-nav-mobile-search-results" aria-live="polite">
    {!q ? <div className="shared-nav-mobile-search-empty"><MagnifyingGlass size={26} weight="regular" aria-hidden="true" /><strong>Explorer les rubriques</strong><span>Recherchez une page dans les marchés, les fonds et les outils financiers.</span></div>
      : !found.length ? <div className="shared-nav-mobile-search-empty"><MagnifyingGlass size={26} aria-hidden="true" /><strong>Aucun résultat</strong><span>Aucune rubrique ne correspond à « {query.trim()} ».</span><button type="button" onClick={onClear}>Effacer la recherche</button></div>
      : <div className="shared-nav-mobile-search-list">{found.map((x,i) => <Link href={x.href} key={x.href+i} onClick={onNavigate}><span>{x.label}</span><small>{x.section}</small><CaretRight size={16}/></Link>)}</div>}
  </li>;
}