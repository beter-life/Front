import { Link } from 'react-router';
import { CreditCard } from 'lucide-react';
import { Badge } from '../../components/ui/surface';
import type { Card } from './contracts.generated';

export function CardAccountLink({ card }: { card: Card }) {
  return <div className="account-card-link"><Badge><CreditCard aria-hidden="true"/>Cartão vinculado</Badge>
    <Link className="ui-text-link" to={'/finance/cards/'+card.id} aria-label={'Ver cartão '+card.displayName}>{card.displayName}</Link>
    {card.status==='ARCHIVED'&&<Badge>Cartão arquivado</Badge>}
  </div>;
}
