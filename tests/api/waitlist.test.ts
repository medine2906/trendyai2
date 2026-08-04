import { describe, it, expect, afterAll } from "vitest";
import { POST } from "../../src/app/api/waitlist/route";
import { db } from "../../src/lib/db";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const TEST_EMAIL = "otomasyon-test-waitlist@example.com";

describe("POST /api/waitlist", () => {
  it("geçersiz email ile 400 döner", async () => {
    const res = await POST(jsonRequest({ email: "gecersiz" }));
    expect(res.status).toBe(400);
  });

  it("geçerli email ile listeye ekler (201)", async () => {
    const res = await POST(jsonRequest({ email: TEST_EMAIL }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.ok).toBe(true);

    const created = await db.waitlistEmail.findUnique({ where: { email: TEST_EMAIL } });
    expect(created).not.toBeNull();
  });

  it("aynı email tekrar eklenmeye çalışıldığında 409 döner", async () => {
    const res = await POST(jsonRequest({ email: TEST_EMAIL }));
    expect(res.status).toBe(409);
  });
});

afterAll(async () => {
  await db.waitlistEmail.deleteMany({ where: { email: TEST_EMAIL } });
  await db.$disconnect();
});
