import { ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScaledText as Text } from '../src/components/ScaledText';
import { AppButton, Card, PageTitle } from '../src/components/ui';
import { colors, space } from '../src/theme/tokens';

export default function PaymentCancelled() {
  const router=useRouter();
  return <ScrollView contentContainerStyle={s.page}><PageTitle title="Payment not completed" subtitle="Your membership has not changed." /><Card><Text>You can return to Membership and try the DemoPay payment again whenever you are ready.</Text></Card><AppButton label="Return to membership" onPress={() => router.replace('/membership')} /></ScrollView>;
}
const s=StyleSheet.create({page:{flexGrow:1,padding:space.lg,gap:space.lg,backgroundColor:colors.background}});
