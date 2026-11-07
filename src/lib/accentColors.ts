// Cores de sistema da Apple: tom do modo claro, do escuro e as versões sóbrias de "Aumentar contraste"
export const ACCENT_COLORS: Record<string, { name: string; hex: string; dark: string; soberLight: string; soberDark: string }> = {
  orange: { name: 'Laranja', hex: '#FF9500', dark: '#FF9F0A', soberLight: '#C93400', soberDark: '#FFB340' },
  blue: { name: 'Azul', hex: '#007AFF', dark: '#0A84FF', soberLight: '#0040DD', soberDark: '#409CFF' },
  purple: { name: 'Roxo', hex: '#AF52DE', dark: '#BF5AF2', soberLight: '#8944AB', soberDark: '#DA8FFF' },
  green: { name: 'Verde', hex: '#34C759', dark: '#30D158', soberLight: '#248A3D', soberDark: '#30DB5B' },
  red: { name: 'Vermelho', hex: '#FF3B30', dark: '#FF453A', soberLight: '#D70015', soberDark: '#FF6961' },
  pink: { name: 'Rosa', hex: '#FF2D55', dark: '#FF375F', soberLight: '#D30F45', soberDark: '#FF6482' },
};
