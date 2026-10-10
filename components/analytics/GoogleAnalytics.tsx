'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { CLARITY_PROJECT_ID, GA_MEASUREMENT_ID, isAnalyticsExcludedPath, trackPageView } from '@/lib/analytics';

// Loads GA4 after hydration. Automatic page views are off; we send our own
// with origin + pathname only, and the referrer is reduced to origin + path.
export function GoogleAnalytics() {
  const pathname = usePathname();
  const excluded = isAnalyticsExcludedPath(pathname);

  // The first page view is sent by the init script (after gtag config);
  // this effect covers client-side navigations only.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (pathname && !excluded) trackPageView(pathname);
  }, [pathname, excluded]);

  if (excluded) return null;

  const config = {
    send_page_view: false,
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  };

  return (
    <>
      {CLARITY_PROJECT_ID && (
        <Script id="ms-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script",${JSON.stringify(CLARITY_PROJECT_ID)});`}
        </Script>
      )}
      {GA_MEASUREMENT_ID && (
      <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());` +
          `gtag('set',{page_location:location.origin+location.pathname,page_referrer:(function(r){try{var u=new URL(r);return u.origin+u.pathname}catch(e){return ''}})(document.referrer)});` +
          `gtag('config',${JSON.stringify(GA_MEASUREMENT_ID)},${JSON.stringify(config)});` +
          `gtag('event','page_view',{page_location:location.origin+location.pathname,page_path:location.pathname,page_title:document.title});`}
      </Script>
      </>
      )}
    </>
  );
}
