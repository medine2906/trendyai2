const buckets = new Map<string, { count: number; resetAt: number }>();

// Basit, tek-process in-memory rate limiter. Birden fazla sunucu instance'ı
// arkasında (örn. serverless/çoklu makine) paylaşılmaz — o durumda Redis gibi
// paylaşılan bir store gerekir. Bu proje tek instance çalıştığı için yeterli.
export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count };
}

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
