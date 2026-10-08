import { createRoot } from 'react-dom/client';
import { mountAuthV2 } from './auth-v2/main';
import './styles.css';
import './uiux-v2.css';

const root = createRoot(document.getElementById('root')!);

mountAuthV2(root);
