import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing } from '../theme';

// Includes the floating dock, its safe-area inset, and a small readable gap.
export default function useFloatingTabBarClearance() {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, Spacing.sm) + 86;
}
