import path from "path";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Nonce'suz, statik bir CSP: proje next/image kullanmıyor (Amazon/Trendyol
// görselleri düz <img> ile gösteriliyor), bu yüzden img-src'yi https: ile
// geniş tutmak gerekiyor. unsafe-inline hem style hem script için Tailwind/
// Next.js'in inline stil ve bootstrap script'leri için gerekli (nonce
// altyapısı kurulmadıkça kaldırılamaz).
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https:;
  font-src 'self' data:;
  connect-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
`
  .replace(/\s{2,}/g, " ")
  .trim();

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspHeader },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  // Test otomasyonu (Playwright) ayrı bir build klasörü kullanır — kullanıcının
  // olası "npm run dev" sürecinin .next klasörüyle aynı anda yazılıp önbelleğin
  // bozulmasını (bkz. CLAUDE.md "Önemli ders / tuzaklar") önlemek için.
  distDir: process.env.TEST_AUTOMATION === "1" ? ".next-test" : ".next",
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
