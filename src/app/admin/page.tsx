import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import LoginForm from "./login-form";
import { DomainOffersKV } from "@/lib/kv-storage";
import { DomainSelector } from "@/components/DomainSelector";
import { DeleteOfferButton } from "@/components/DeleteOfferButton";

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

// Add this server action
async function deleteOffers(domain: string) {
  "use server";

  const cookieStore = cookies();
  const authCookie = cookieStore.get("admin_auth");

  if (!authCookie?.value || authCookie.value !== "true") {
    throw new Error("Unauthorized");
  }

  const { env } = await getCloudflareContext();
  const domainOffersKV = new DomainOffersKV(env.kvcache);

  await domainOffersKV.deleteDomainOffers(domain);
}

// Add this server action
async function deleteOffer(domain: string, timestamp: string) {
  "use server";

  const cookieStore = cookies();
  const authCookie = cookieStore.get("admin_auth");

  if (!authCookie?.value || authCookie.value !== "true") {
    throw new Error("Unauthorized");
  }

  const { env } = await getCloudflareContext();
  const domainOffersKV = new DomainOffersKV(env.kvcache);

  await domainOffersKV.deleteSingleOffer(domain, timestamp);
}

// Add this helper function at the top of the file
async function getTotalVisits(
  domainOffersKV: DomainOffersKV,
  domains: string[]
) {
  const visits = await Promise.all(
    domains.map((domain) => domainOffersKV.getVisits(domain))
  );
  return visits.reduce((sum, count) => sum + count, 0);
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { domain?: string };
}) {
  const { env } = await getCloudflareContext();
  const isAuthenticated = await checkAuth();
  const domainOffersKV = new DomainOffersKV(env.kvcache);

  // Get all domains and offers
  const [allDomains, offers] = await Promise.all([
    domainOffersKV.getAllDomains(),
    searchParams.domain === "all"
      ? domainOffersKV.getAllOffers()
      : domainOffersKV
          .getDomainOffers(searchParams.domain || env.BASE_URL)
          .then((offers) =>
            offers.map((offer) => ({
              ...offer,
              domain: searchParams.domain || env.BASE_URL,
            }))
          ),
  ]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-800 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
            Admin Dashboard
          </h1>
          <div className="flex gap-4 items-center">
            <DomainSelector
              domains={allDomains}
              currentDomain={searchParams.domain || env.BASE_URL}
            />

            <form action={handleLogout}>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Logout
              </button>
            </form>
          </div>
        </div>

        <div className="grid gap-6 mb-8">
          <div className="bg-slate-800/50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-slate-200 mb-4">
              Offer Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 divide-x divide-slate-700/50">
              <div className="bg-slate-900/50 p-6 rounded-lg transform hover:scale-105 transition-all">
                <p className="text-slate-400 text-sm mb-2">Total Offers</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-purple-400">
                    {offers.length}
                  </p>
                  <p className="text-xs text-green-400 flex items-center">
                    <span className="mr-1">↑</span> 2 new this week
                  </p>
                </div>
              </div>
              <div className="bg-slate-900/50 p-6 rounded-lg">
                <p className="text-slate-400 text-sm mb-2">Highest Offer</p>
                <p className="text-3xl font-bold text-purple-400">
                  $
                  {offers.length
                    ? Math.max(...offers.map((o) => o.amount)).toLocaleString()
                    : "0"}
                </p>
              </div>
              <div className="bg-slate-900/50 p-6 rounded-lg">
                <p className="text-slate-400 text-sm mb-2">Average Offer</p>
                <p className="text-3xl font-bold text-purple-400">
                  $
                  {offers.length
                    ? Math.round(
                        offers.reduce((acc, o) => acc + o.amount, 0) /
                          offers.length
                      ).toLocaleString()
                    : "0"}
                </p>
              </div>
              <div className="bg-slate-900/50 p-6 rounded-lg">
                <p className="text-slate-400 text-sm mb-2">Total Visits</p>
                <p className="text-3xl font-bold text-purple-400">
                  {searchParams.domain === "all"
                    ? await getTotalVisits(domainOffersKV, allDomains)
                    : await domainOffersKV.getVisits(
                        searchParams.domain || env.BASE_URL
                      )}
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
                    <th className="p-4">Domain</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Description</th>
                    <th className="p-4 w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((offer) => (
                    <tr
                      key={offer.timestamp}
                      className="border-t border-slate-700 hover:bg-slate-800/30 transition-colors cursor-pointer"
                    >
                      <td className="p-4">
                        {new Date(offer.timestamp).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-medium text-purple-400">
                        {offer.domain}
                      </td>
                      <td className="p-4">{offer.email}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          ${offer.amount.toLocaleString()}
                          {offer.amount >= 5000 && (
                            <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded-full font-medium">
                              High Value
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 truncate max-w-xs">
                        {offer.description}
                      </td>
                      <td className="p-4">
                        <DeleteOfferButton
                          domain={offer.domain}
                          timestamp={offer.timestamp}
                          onDelete={deleteOffer}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold text-slate-200 mb-4">
            Domain Statistics
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-slate-200">
              <thead className="text-sm text-slate-400">
                <tr>
                  <th className="p-4">Domain</th>
                  <th className="p-4">Total Views</th>
                  <th className="p-4">Last Offer</th>
                  <th className="p-4">Avg Offer</th>
                  <th className="p-4">Top Offer</th>
                  <th className="p-4">Total Offers</th>
                </tr>
              </thead>
              <tbody>
                {(await domainOffersKV.getDomainStats()).map((stat) => (
                  <tr
                    key={stat.domain}
                    className="border-t border-slate-700 hover:bg-slate-800/30 transition-colors cursor-pointer"
                  >
                    <td className="p-4 font-medium text-purple-400">
                      {stat.domain}
                    </td>
                    <td className="p-4">
                      {stat.visits === 0 ? (
                        <span className="text-slate-500">-</span>
                      ) : (
                        stat.visits.toLocaleString()
                      )}
                    </td>
                    <td className="p-4">
                      {stat.lastOffer
                        ? stat.lastOffer.toLocaleDateString()
                        : "No offers"}
                    </td>
                    <td className="p-4">${stat.avgOffer.toLocaleString()}</td>
                    <td className="p-4">${stat.topOffer.toLocaleString()}</td>
                    <td className="p-4">{stat.offerCount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
