const isDev = process.env.NODE_ENV === "development"

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      ...(process.env.NEXT_PUBLIC_CDN_HOSTNAME
        ? [
            {
              protocol: "https",
              hostname: process.env.NEXT_PUBLIC_CDN_HOSTNAME,
            },
          ]
        : []),
    ],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
        },
        {
          // `unsafe-eval` is only needed by Turbopack's dev-mode HMR — never in
          // production. `unsafe-inline` stays because tightening script-src to
          // a nonce requires generating one per request in proxy.ts, and
          // Next.js only applies nonces to *dynamically rendered* pages: it
          // would opt this whole site out of static generation. See
          // https://nextjs.org/docs/app/guides/content-security-policy
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com https://info.ewaltech.com`,
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https:",
            "font-src 'self' https://fonts.gstatic.com",
            "connect-src 'self' https://info.ewaltech.com https://challenges.cloudflare.com",
            "frame-src https://js.stripe.com https://challenges.cloudflare.com",
            "frame-ancestors 'none'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            ...(isDev ? [] : ["upgrade-insecure-requests"]),
          ].join("; "),
        },
      ],
    },
  ],
}

export default nextConfig
