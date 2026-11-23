import { View, type ViewStyle } from 'react-native';
import { AdminBottomNavigation } from './BottomTabBar';

/** Keeps exactly one persistent Admin bar on top-level management destinations. */
export function AdminMainScreen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[{ flex: 1 }, style]}>{children}<AdminBottomNavigation /></View>;
}
