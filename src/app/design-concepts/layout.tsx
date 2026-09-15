export const metadata = {
  title: "ShopMind — Tasarım Konseptleri",
  robots: { index: false, follow: false },
};

export default function DesignConceptsLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen w-full">{children}</div>;
}
