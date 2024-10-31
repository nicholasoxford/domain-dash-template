import { getCloudflareContext } from "@opennextjs/cloudflare";
import { OfferForm } from "../components/OfferForm";
import { useEffect, useState } from "react";
export default function Page() {
  async function getSiteKey() {
    "use server";
    const { env } = await getCloudflareContext();

    return env;
  }

  return <OfferForm getSiteKey={getSiteKey} />;
}
