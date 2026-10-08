import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Application } from "@/components/application";
import { categories, getLesson } from "@/domain/curriculum";
type Props = { params: Promise<{ slug?: string[] }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug = [] } = await params;
  const title =
    slug[0] === "lesson"
      ? getLesson(slug[1])?.title
      : slug[0] === "learn" && slug[1]
        ? categories.find((c) => c.id === slug[1])?.name
        : (
            {
              learn: "Curriculum",
              simulator: "Passing lab",
              designer: "Play designer",
              training: "Training",
              glossary: "Glossary",
              sandbox: "7-on-7 sandbox",
              profiles: "Opponent profiles",
              workspace: "Workspace data",
            } as Record<string, string>
          )[slug[0]];
  return {
    title: title ? `${title} — Fieldwork` : "Fieldwork — Understand the game",
  };
}
export default async function Page({ params }: Props) {
  const { slug = [] } = await params;
  const [section, id] = slug;
  const valid =
    slug.length === 0 ||
    ([
      "simulator",
      "designer",
      "training",
      "glossary",
      "sandbox",
      "profiles",
      "workspace",
    ].includes(section) &&
      slug.length === 1) ||
    (section === "learn" &&
      slug.length <= 2 &&
      (!id || categories.some((c) => c.id === id))) ||
    (section === "lesson" && slug.length === 2 && Boolean(getLesson(id)));
  if (!valid) notFound();
  return <Application />;
}
