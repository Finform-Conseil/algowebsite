import { Carnet as CarnetMainScreen } from './CarnetMainScreen';

export interface CarnetOrder {
  id: string;
  sens: string;
  titre: string;
  marche: string;
  devise: string;
  qte: number | string;
  prix: number | string;
  statut: string;
  pf: string;
}

export interface CarnetInitialContext {
  marche?: string;
  instrument?: string | null;
  cessionOrders?: CarnetOrder[];
  [key: string]: unknown;
}

interface CarnetOrdresProps {
  orders: CarnetOrder[];
  initial?: CarnetInitialContext | null;
}

export function CarnetOrdres({ orders, initial }: CarnetOrdresProps) {
  void orders;
  return <CarnetMainScreen initial={initial} />;
}
