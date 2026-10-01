import { createRoot } from 'react-dom/client';
import './styles.css';

const root = createRoot(document.getElementById('root')!);

if (import.meta.env.MODE === 'auth-v2') {
  void import('./auth-v2/main').then(({ mountAuthV2 }) => mountAuthV2(root));
} else {
  void import('./legacy-main').then(({ mountLegacy }) => mountLegacy(root));
}
