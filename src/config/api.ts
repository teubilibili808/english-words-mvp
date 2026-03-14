const DEFAULT_API_BASE = 'http://localhost:3001/api';

export const API_BASE = process.env.EXPO_PUBLIC_API_BASE?.trim() || DEFAULT_API_BASE;
