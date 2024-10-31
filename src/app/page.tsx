import { getCloudflareContext } from "@opennextjs/cloudflare";
import { OfferForm } from "../components/OfferForm";
import { useEffect, useState } from "react";
export default function Page() {
  async function getSiteKey() {
    "use server";
    const { env } = await getCloudflareContext();

    return {
      TURNSTILE_SITE_KEY: env.TURNSTILE_SITE_KEY,
      BASE_URL: env.BASE_URL,
    };
  }

  return <OfferForm getSiteKey={getSiteKey} />;
}
