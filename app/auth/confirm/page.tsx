import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { ConfirmSignIn } from '@/components/auth/ConfirmSignIn';

// Magic-link landing page (auth/session redesign). `referrer: no-referrer`
// keeps this page from ever sending its URL to another origin.
export const metadata: Metadata = {
  title: 'Finish signing in',
  referrer: 'no-referrer',
  robots: { index: false, follow: false },
};

export default function ConfirmSignInPage() {
  return (
    <div>
      <Header title="Sign in" />
      <div className="px-4 py-5">
        <ConfirmSignIn />
      </div>
    </div>
  );
}
