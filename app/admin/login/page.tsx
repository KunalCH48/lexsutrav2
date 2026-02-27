import { LoginForm } from "@/components/admin/LoginForm";

export const metadata = { title: "Admin Login — LexSutra" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#060a14" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-serif font-bold" style={{ color: "#c9a84c" }}>
            Lex
          </span>
          <span className="text-2xl font-serif font-bold text-white">Sutra</span>
          <p className="text-xs mt-1" style={{ color: "#3d4f60" }}>
            Admin Dashboard
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl p-8"
          style={{ background: "#0d1827", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <h1 className="text-xl font-serif font-semibold text-white mb-6">
            Sign in
          </h1>
          <LoginForm error={error} />
        </div>
      </div>
    </div>
  );
}
