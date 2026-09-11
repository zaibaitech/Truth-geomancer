import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Truth Geomancer',
    short_name: 'Geomancer',
    description: 'Ilm al-Raml — cast the sand, read the figures.',
    start_url: '/',
    display: 'standalone',
    background_color: '#161009',
    theme_color: '#161009',
    icons: [],
  };
}
