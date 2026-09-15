import { Header } from '@/components/layout/Header';
import { MethodPracticeFlow } from '@/components/raml/practice/MethodPracticeFlow';
import { KM_CHAPTERS } from '@/content/manuscripts/kanzul-mikban';
import { practicableMethodsForChapter } from '@/lib/raml/methodPractice';

// Prompt 23 (offline): this route needs no per-request server data — every
// value it renders is resolved client-side from bundled content and the
// user's own cast chart — so there is no reason for it to be dynamically
// server-rendered per request. Its param space is small and fully known at
// build time (one entry per verified, practicable method), so statically
// generating every combination removes the one real offline risk a dynamic
// route would carry here: a service worker serving a cached response for
// the WRONG chapter/method pair. Reuses the same eligibility function the
// chapter CTA already uses — never a second list of "which methods exist".
export function generateStaticParams() {
  return KM_CHAPTERS.flatMap((chapter) =>
    practicableMethodsForChapter(chapter.id).map((m) => ({
      chapterId: chapter.id,
      methodId: m.method.id,
    })),
  );
}

export default function MethodPracticePage({
  params,
}: {
  params: { chapterId: string; methodId: string };
}) {
  return (
    <div>
      <Header title="Practice a method" />
      <MethodPracticeFlow chapterId={params.chapterId} methodId={params.methodId} />
    </div>
  );
}
