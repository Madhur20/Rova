import { createDemoStore } from "./browser-demo";
import { demoFiles } from "./demo-files";

// Browser demo is the default, including on Vercel. The old local server mode is opt-in.
export const browserDemo = process.env.NEXT_PUBLIC_ROVA_MODE !== "server";
let store: ReturnType<typeof createDemoStore> | undefined;
export function browserStore() {
  store ??= createDemoStore({ local: window.localStorage, session: window.sessionStorage, files: demoFiles, lock: async action => {
    if (!navigator.locks) throw new Error("Use a current Chrome, Edge, Firefox, or Safari browser on HTTPS (or localhost) for this demo.");
    return await navigator.locks.request("rova-product-demo-v1", action);
  } });
  return store;
}
export async function productRequest(url: string, init?: RequestInit): Promise<Response> {
  if (!browserDemo) return fetch(url, init);
  return browserStore().request(url, init);
}
export async function downloadDemoMaterial(id: string) {
  const { file, name } = await browserStore().material(id);
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
