import type { Role } from "@/lib/product/curriculum";
import type { IconName } from "./Brand";

export const navigation: Record<Role, { id: string; label: string; icon: IconName }[]> = {
  teacher: [{ id: "overview", label: "Overview", icon: "home" }, { id: "classroom", label: "My classroom", icon: "people" }, { id: "progress", label: "Learning insights", icon: "chart" }, { id: "report", label: "Progress report", icon: "flag" }, { id: "bank", label: "Question bank", icon: "book" }],
  student: [{ id: "overview", label: "My day", icon: "home" }, { id: "learning-path", label: "My learning path", icon: "book" }, { id: "progress", label: "My progress", icon: "chart" }],
  parent: [{ id: "overview", label: "This week", icon: "home" }, { id: "progress", label: "Progress", icon: "chart" }],
};
export function sectionFromHash(role: Role, hash: string) {
  const value = hash.replace(/^#/, "");
  return navigation[role].some(item => item.id === value) ? value : "overview";
}
export function subscribeToNavigation(callback: () => void) {
  window.addEventListener("hashchange", callback);
  window.addEventListener("popstate", callback);
  return () => { window.removeEventListener("hashchange", callback); window.removeEventListener("popstate", callback); };
}
