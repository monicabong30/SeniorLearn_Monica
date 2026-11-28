import { PageHeaderBack } from "./PageHeader";

type Props = {
  label: string;
  fallback: string | ((params: Record<string, string | string[] | undefined>) => any);
};

/** Shared, safe navigation control for stack-based administration screens. */
export function AdminBackButton({ label, fallback }: Props) {
  return <PageHeaderBack fallback={fallback} label={`Back to ${label}`} />;
}
