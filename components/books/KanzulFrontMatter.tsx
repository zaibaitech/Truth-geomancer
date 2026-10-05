import { FigureGlyph } from "@/components/raml/FigureGlyph";
import { STARS } from "@/content/stars";
import { ProseParagraph } from "@/components/books/Prose";
import type { KmFrontMatterSection } from "@/lib/server/content/kanzulMikban";

/** The authoritative Kanzul Mikban edition's own front matter (title pages,
 * "A Note on This Edition", the glossary) and its Opening Invocation, shown in
 * the order the book prints them — before Chapter One. The text is the
 * edition's, verbatim; the only addition is drawing the one figure the edition
 * prints inside its note on reading the figures. */
export function KanzulTitlePage({ title, subtitle, edition }: { title: string; subtitle: string; edition: string }) {
  return (
    <div className="pb-2 text-center">
      <h2 className="font-logo type-title leading-snug text-sand-light">{title}</h2>
      <p className="mt-1 type-body italic text-sand/80">{subtitle}</p>
      <p className="mt-1 type-evidence italic text-sand/65">{edition}</p>
    </div>
  );
}

export function KanzulFrontMatterSections({ sections }: { sections: KmFrontMatterSection[] }) {
  return (
    <div>
      {sections.map((section) => (
        <section key={section.id} id={section.id} className={section.level === 1 ? "mt-10 scroll-mt-16 border-t border-sand/10 pt-8" : "mt-6 scroll-mt-16"}>
          {section.level === 1 ? (
            <h2 className="font-logo type-title leading-snug text-sand-light">{section.title}</h2>
          ) : (
            <h3 className="font-logo type-section italic leading-snug text-sand-light">{section.title}</h3>
          )}
          <div className="mt-3">
            {section.paragraphs.map((text, i) => (
              <ProseParagraph key={i} text={text} />
            ))}
            {section.exampleFigureStarId ? (
              <div className="mb-5 flex justify-center" data-example-figure={section.exampleFigureStarId}>
                <FigureGlyph pattern={STARS.find((s) => s.id === section.exampleFigureStarId)!.pattern} size="md" />
              </div>
            ) : null}
          </div>
        </section>
      ))}
    </div>
  );
}
