import { Header } from '@/components/layout/Header';
import { MethodPracticeFlow } from '@/components/raml/practice/MethodPracticeFlow';

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
