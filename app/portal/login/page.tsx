import { ClientLoginForm } from "@/components/portal/ClientLoginForm";

export const metadata = { title: "Client Portal — LexSutra" };

export default async function PortalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#080c14" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mb-3">
            <span className="text-2xl font-serif font-bold" style={{ color: "#2d9cdb" }}>
              Lex
            </span>
            <span className="text-2xl font-serif font-bold" style={{ color: "#e8f4ff" }}>
              Sutra
            </span>
          </div>
          <p className="text-xs" style={{ color: "#3d4f60" }}>
            Client Portal
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl p-8"
          style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.15)" }}
        >
          <h1
            className="text-xl font-semibold mb-2"
            style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}
          >
            Sign in to your portal
          </h1>
          <p className="text-sm mb-6" style={{ color: "#3d4f60" }}>
            Access your compliance overview, documents, and reports.
          </p>
          <ClientLoginForm error={error} />
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#3d4f60" }}>
          Are you a LexSutra admin?{" "}
          <a href="/admin/login" className="gold-link">
            Admin login →
          </a>
        </p>
      </div>
    </div>
  );
}
