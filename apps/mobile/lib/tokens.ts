export const colors = {
  primary: '#2D7A4F',
  primaryLight: '#E8F5EE',
  dark: '#1A1A1A',
  gray: '#666666',
  border: '#E0E0E0',
  background: '#F9F9F9',
  white: '#FFFFFF',
  warning: '#F0A500',
  error: '#D93025',
  score5: '#2D7A4F',
  score4: '#6BBF6B',
  score3: '#F0A500',
  score2: '#E07830',
  score1: '#D93025',
};

export const typography = {
  heading1: { fontSize: 28, fontWeight: '700' as const },
  heading2: { fontSize: 22, fontWeight: '700' as const },
  heading3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  small: { fontSize: 13, fontWeight: '400' as const },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  full: 999,
};

// Health score labels and emoji
export const scoreConfig = [
  { score: 5, emoji: '🥗', label: 'Super healthy', color: colors.score5 },
  { score: 4, emoji: '😊', label: 'Pretty good', color: colors.score4 },
  { score: 3, emoji: '😐', label: 'Okay', color: colors.score3 },
  { score: 2, emoji: '😬', label: 'Not great', color: colors.score2 },
  { score: 1, emoji: '🍕', label: 'Treat meal', color: colors.score1 },
];
