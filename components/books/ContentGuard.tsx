'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

// Honest about what this can and can't do: no website can block the OS
// screenshot function (power+volume, or any screen-recording API) — that's
// true of every web reader, this one included. What it CAN do is raise the
// friction on casual copying (selection, copy/cut, right-click, drag-out),
// obscure the page the moment it's not in the foreground (so a screenshot
// of the app-switcher/recents view doesn't leak a readable page), and stamp
// a watermark across the whole scrollable text so a screenshot that IS
// taken carries a visible mark back to this app rather than passing as a
// clean, source-free copy. None of this stops a determined reader; all of
// it makes casual leaking visibly not worth doing.

function watermarkLayer(text: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="260">
    <text x="10" y="150" transform="rotate(-30 210 130)" font-family="Georgia, 'Times New Roman', serif" font-size="15" letter-spacing="1.5" fill="#ecd6a4" fill-opacity="0.09">${text}</text>
  </svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function ContentGuard({
  children,
  watermarkText = 'TRUTH GEOMANCER · PERSONAL COPY',
}: {
  children: ReactNode;
  watermarkText?: string;
}) {
  const [obscured, setObscured] = useState(false);
  const [notice, setNotice] = useState(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const flashNotice = () => {
      setNotice(true);
      clearTimeout(noticeTimer.current);
      noticeTimer.current = setTimeout(() => setNotice(false), 2200);
    };
    const blockClipboard = (e: ClipboardEvent) => {
      e.preventDefault();
      flashNotice();
    };
    const blockContextMenu = (e: MouseEvent) => e.preventDefault();
    const blockDrag = (e: DragEvent) => e.preventDefault();
    // Obscure the content the instant the tab/app isn't in the foreground,
    // so it can't show up readable in an OS app-switcher screenshot.
    const onVisibility = () => setObscured(document.hidden);

    document.addEventListener('copy', blockClipboard);
    document.addEventListener('cut', blockClipboard);
    document.addEventListener('contextmenu', blockContextMenu);
    document.addEventListener('dragstart', blockDrag);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('copy', blockClipboard);
      document.removeEventListener('cut', blockClipboard);
      document.removeEventListener('contextmenu', blockContextMenu);
      document.removeEventListener('dragstart', blockDrag);
      document.removeEventListener('visibilitychange', onVisibility);
      clearTimeout(noticeTimer.current);
    };
  }, []);

  return (
    <div
      className={`relative select-none transition-[filter] duration-150 ${obscured ? 'blur-2xl' : ''}`}
      onCopy={(e) => e.preventDefault()}
    >
      {children}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10"
        style={{ backgroundImage: watermarkLayer(watermarkText), backgroundRepeat: 'repeat' }}
      />

      <div
        role="status"
        className={`pointer-events-none fixed inset-x-4 bottom-24 z-30 flex justify-center transition-opacity duration-200 ${
          notice ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <p className="rounded-full border border-sand/15 bg-ink-card px-4 py-2 text-[12px] text-sand-light shadow-lg">
          Copying is disabled to protect this manuscript.
        </p>
      </div>
    </div>
  );
}
