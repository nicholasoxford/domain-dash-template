import { DurableObjectNamespace } from "@cloudflare/workers-types";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest } from "next/server";
import { DomainOffer, DomainOffersDO } from "@/lib/durable-objects";
export const runtime = "edge";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://agi-2025.com",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

async function handleRequest(request: NextRequest) {
  const ctx = await getCloudflareContext();
  const env = ctx.env;

  // Check auth token
  const authToken = request.headers.get("Authorization");
  if (
    !authToken ||
    !authToken.startsWith("Bearer ") ||
    authToken.split(" ")[1] !== env.API_AUTH_TOKEN
  ) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(request.url);
  const domain = url.searchParams.get("domain");

  if (!domain) {
    return new Response("Domain parameter is required", { status: 400 });
  }

  // Get Durable Object instance
  const domainOffersDoNamespace = env.DOMAIN_OFFERS_DO;
  const domainOffersDoId = domainOffersDoNamespace.idFromName(
    `domain-offers:${domain}`
  );
  const domainOffersDoStub = domainOffersDoNamespace.get(
    domainOffersDoId
  ) as any;
  const domainOffersDo = new DomainOffersDO(domainOffersDoStub.state);

  if (request.method === "DELETE") {
    try {
      const result = await domainOffersDo.deleteDomainOffers(domain);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response("Error deleting domain offers", {
        status: 500,
        headers: corsHeaders,
      });
    }
  }

  if (request.method === "POST") {
    try {
      const { email, amount, description } =
        (await request.json()) as DomainOffer;

      if (!email || !amount) {
        return new Response("Email and amount are required", {
          status: 400,
          headers: corsHeaders,
        });
      }

      const result = await domainOffersDo.submitDomainOffer(domain, {
        email,
        amount,
        description,
      });

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response("Invalid request body", {
        status: 400,
        headers: corsHeaders,
      });
    }
  }

  // GET request
  const offers = await domainOffersDo.getDomainOffers(domain);
  return new Response(JSON.stringify({ domain, offers }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export const GET = handleRequest;
export const POST = handleRequest;
export const DELETE = handleRequest;
