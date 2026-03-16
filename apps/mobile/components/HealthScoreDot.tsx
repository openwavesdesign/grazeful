import { View } from 'react-native';
import { colors } from '../lib/tokens';

const SCORE_COLORS: Record<number, string> = {
  1: colors.score1,
  2: colors.score2,
  3: colors.score3,
  4: colors.score4,
  5: colors.score5,
};

export function HealthScoreDot({ score, size = 10 }: { score: number; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: SCORE_COLORS[score] || colors.gray,
      }}
    />
  );
}
