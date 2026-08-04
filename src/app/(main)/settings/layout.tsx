import Link from "next/link";

const items = [
  { href: "/settings/profile", label: "Profili düzenle" },
  { href: "/settings/privacy", label: "Hesap gizliliği" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-4xl gap-8 p-6">
      <aside className="w-64 shrink-0">
        <h1 className="mb-4 text-xl font-semibold">Ayarlar</h1>
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Hesaplar Merkezi</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Meta teknolojileri arasındaki bağlantılı deneyimlerini ve hesap ayarlarını yönet.
          </p>
        </div>
        <nav className="mt-4 flex flex-col gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
