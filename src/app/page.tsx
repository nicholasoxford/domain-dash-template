import { getCloudflareContext } from "@opennextjs/cloudflare";
import { OfferForm } from "../components/OfferForm";
import { DomainOffersKV } from "@/lib/kv-storage";

export default function Page() {
  async function getSiteKey() {
    "use server";
    const { env } = await getCloudflareContext();

    return {
      TURNSTILE_SITE_KEY: env.TURNSTILE_SITE_KEY,
      BASE_URL: env.BASE_URL,
    };
  }

  async function trackVisit() {
    "use server";
    const { env } = await getCloudflareContext();

    const kv = env.kvcache;
    const domainOffersKV = new DomainOffersKV(kv);
    const domain = env.BASE_URL;

    await domainOffersKV.incrementVisits(domain);
  }

  return <OfferForm getSiteKey={getSiteKey} trackVisit={trackVisit} />;
}
