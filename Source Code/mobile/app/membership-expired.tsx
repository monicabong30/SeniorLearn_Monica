import { Redirect } from "expo-router";

/** Legacy route retained for old links; membership is now the single UI. */
export default function MembershipExpiredRedirect() { return <Redirect href="/membership" />; }
