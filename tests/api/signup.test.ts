import { describe, it, expect, afterAll } from "vitest";
import { POST } from "../../src/app/api/signup/route";
import { db } from "../../src/lib/db";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const TEST_EMAIL = "otomasyon-test-kullanici@example.com";
const TEST_USERNAME = "otomasyon_test_kullanici";

describe("POST /api/signup", () => {
  it("geçersiz form verisiyle 400 döner", async () => {
    const res = await POST(jsonRequest({ name: "A", username: "ab", email: "gecersiz", password: "123" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it("geçerli veriyle yeni kullanıcı oluşturur (201)", async () => {
    const res = await POST(
      jsonRequest({
        name: "Otomasyon Test",
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: "guvenli-sifre-123",
      })
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBeTruthy();

    const created = await db.user.findUnique({ where: { email: TEST_EMAIL } });
    expect(created).not.toBeNull();
    expect(created?.passwordHash).not.toBe("guvenli-sifre-123");
  });

  it("aynı email ile tekrar denendiğinde 409 döner", async () => {
    const res = await POST(
      jsonRequest({
        name: "Otomasyon Test 2",
        username: "farkli_kullanici_adi",
        email: TEST_EMAIL,
        password: "guvenli-sifre-123",
      })
    );
    expect(res.status).toBe(409);
  });
});

afterAll(async () => {
  await db.user.deleteMany({ where: { email: TEST_EMAIL } });
  await db.$disconnect();
});
