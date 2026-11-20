const backendUrl = (
  import.meta.env.VITE_API_URL || 'https://serverbokhub-kpbp.vercel.app'
).replace(/\/+$/, '');
const apiOrigin = import.meta.env.DEV ? '' : backendUrl;

export const API = `${apiOrigin}/api`;
