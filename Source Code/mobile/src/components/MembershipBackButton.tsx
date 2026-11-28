import { PageHeaderBack } from "./PageHeader";

/** Stack-header back control with a safe dashboard fallback. */
export function MembershipBackButton() {
  return <PageHeaderBack fallback="/(tabs)" label="Back to dashboard" />;
}
