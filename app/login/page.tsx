import { AuthForm } from "@/components/product/AuthForm";
import type { Role } from "@/lib/product/curriculum";
export default async function Page({ searchParams }: { searchParams: Promise<{ account?: string }> }) {
  const { account } = await searchParams;
  const role: Role = account === "student" || account === "parent" ? account : "teacher";
  return <AuthForm initialRole={role}/>;
}
