import { DurableObjectNamespace } from "@cloudflare/workers-types";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest } from "next/server";

export const runtime = "edge";

interface DomainOffer {
  email: string;
  amount: number;
  description?: string;
  timestamp: string;
}

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://agi-2025.com",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Max-Age": "86400",
};

class DomainOffersDO {
  private state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async trackDomainRequest(domain: string) {
    let requests =
      (await this.state.storage.get<number>(`domain:${domain}`)) || 0;
    requests++;

    await this.state.storage.put(`domain:${domain}`, requests);

    return {
      domain,
      requests,
      timestamp: new Date().toISOString(),
    };
  }

  async getDomainRequests(domain: string) {
    return (await this.state.storage.get<number>(`domain:${domain}`)) || 0;
  }

  async submitDomainOffer(
    domain: string,
    offer: Omit<DomainOffer, "timestamp">
  ) {
    const offers =
      (await this.state.storage.get<DomainOffer[]>(`domain:${domain}`)) || [];

    const newOffer: DomainOffer = {
      ...offer,
      timestamp: new Date().toISOString(),
    };

    offers.push(newOffer);
    await this.state.storage.put(`domain:${domain}`, offers);

    return {
      domain,
      offer: newOffer,
      totalOffers: offers.length,
    };
  }

  async getDomainOffers(domain: string) {
    return (
      (await this.state.storage.get<DomainOffer[]>(`domain:${domain}`)) || []
    );
  }

  async deleteDomainOffers(domain: string) {
    await this.state.storage.delete(`domain:${domain}`);
    return {
      domain,
      message: "Domain offers deleted successfully",
      timestamp: new Date().toISOString(),
    };
  }
}

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
