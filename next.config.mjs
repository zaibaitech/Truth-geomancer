/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Paystack's Apple Pay domain-verification file is served from
        // public/.well-known/ with the Content-Type Paystack requires.
        source: '/.well-known/apple-developer-merchantid-domain-association',
        headers: [{ key: 'Content-Type', value: 'application/text' }],
      },
    ];
  },
};

export default nextConfig;
