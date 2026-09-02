import './styles/main.css';
import { createApp } from './ui/app.js';

const root = document.getElementById('app');
if (!root) throw new Error('Falta el contenedor #app en index.html');

createApp(root);
