import { notFound } from "next/navigation";
import { MODULES } from "@/lib/content";
import { ModuleView } from "./ModuleView";

export function generateStaticParams() {
  return MODULES.map((m) => ({ slug: m.slug }));
}

export default async function ModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = MODULES.find((x) => x.slug === slug);
  if (!m) notFound();
  return <ModuleView slug={slug} />;
}
