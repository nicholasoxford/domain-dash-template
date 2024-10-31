import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import LoginForm from "./login-form";
import { DomainOffersKV } from "@/lib/kv-storage";

const passwordSchema = z.object({
  password: z.string().min(1),
});

// Server Action for password verification
async function verifyPassword(formData: FormData) {
  "use server";

  const password = formData.get("password");
  const parsed = passwordSchema.safeParse({ password });

  const ctx = await getCloudflareContext();
  const adminPassword = ctx.env.ADMIN_PASSWORD;
  if (!parsed.success || password !== adminPassword) {
    return { error: "Invalid password" };
  }

  cookies().set("admin_auth", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 3600, // 1 hour
  });

  cookies().set("admin_auth_time", Date.now().toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 3600,
  });

  // Redirect to the same page to show the dashboard
  redirect("/admin");
}

async function handleLogout() {
  "use server";
  cookies().delete("admin_auth");
  cookies().delete("admin_auth_time");
  redirect("/");
}

// Check if authenticated
async function checkAuth() {
  const cookieStore = cookies();
  const authCookie = cookieStore.get("admin_auth");

  if (!authCookie?.value || authCookie.value !== "true") {
    return false;
  }

  const cookieAge = cookieStore.get("admin_auth_time")?.value;
  if (!cookieAge || Date.now() - parseInt(cookieAge) > 3600000) {
    // 1 hour
    return false;
  }

  return true;
}

export default async function AdminPage() {
  const { env } = await getCloudflareContext();
  const isAuthenticated = await checkAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-800 p-8">
          <h1 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
            Admin Access
          </h1>

          <LoginForm verifyPassword={verifyPassword} />
        </div>
      </div>
    );
  }

  // If authenticated, show dashboard
  const offers = await new DomainOffersKV(env.kvcache).getDomainOffers(
    env.BASE_URL
  );

  console.log({ offers });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-800 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
            Admin Dashboard
          </h1>
          <form action={handleLogout}>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Logout
            </button>
          </form>
        </div>

        <div className="grid gap-6 mb-8">
          <div className="bg-slate-800/50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-slate-200 mb-4">
              Offer Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/50 p-4 rounded-lg">
                <p className="text-slate-400 text-sm">Total Offers</p>
                <p className="text-2xl font-bold text-purple-400">
                  {offers.length}
                </p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-lg">
                <p className="text-slate-400 text-sm">Highest Offer</p>
                <p className="text-2xl font-bold text-purple-400">
                  ${Math.max(...offers.map((o) => o.amount)).toLocaleString()}
                </p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-lg">
                <p className="text-slate-400 text-sm">Average Offer</p>
                <p className="text-2xl font-bold text-purple-400">
                  $
                  {(
                    offers.reduce((acc, o) => acc + o.amount, 0) / offers.length
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-slate-200 mb-4">
              Recent Offers
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-slate-200">
                <thead className="text-sm text-slate-400">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {offers
                    .sort(
                      (a, b) =>
                        new Date(b.timestamp).getTime() -
                        new Date(a.timestamp).getTime()
                    )
                    .map((offer, i) => (
                      <tr key={i} className="border-t border-slate-700">
                        <td className="p-4">
                          {new Date(offer.timestamp).toLocaleDateString()}
                        </td>
                        <td className="p-4">{offer.email}</td>
                        <td className="p-4">
                          ${offer.amount.toLocaleString()}
                        </td>
                        <td className="p-4 truncate max-w-xs">
                          {offer.description}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
