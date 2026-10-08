import { Home, ChevronRight } from 'lucide-react';
import { C, F_BODY } from '../../shared/theme/theme';

export function ClientBreadcrumb({ items }) {
  return (
    <div
      className="gsm-native-clientcommon-970608097"
      style={{ color: C.sub, ...F_BODY }}
    >
      <Home size={13} />
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className="gsm-native-clientcommon-288f88c0c">
          {index > 0 && <ChevronRight size={13} />}
          <span
            style={{
              color: index === items.length - 1 ? C.ink : C.sub,
              fontWeight: index === items.length - 1 ? 600 : 500,
            }}
          >
            {item}
          </span>
        </span>
      ))}
    </div>
  );
}

