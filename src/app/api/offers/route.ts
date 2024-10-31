import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest } from "next/server";
import { DomainOffer, DomainOffersKV } from "@/lib/kv-storage";

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
  console.log("HITTING API");
  // Get KV namespace
  const { env } = await getCloudflareContext();
  const kv = env.kvcache;
  const domainOffersKV = new DomainOffersKV(kv);

  // Get domain from query param
  const domain = env.BASE_URL;

  if (request.method === "POST") {
    try {
      const { email, amount, description, token } =
        (await request.json()) as DomainOffer;

      if (!email || !amount || !token) {
        return new Response("Email, amount, and token are required", {
          status: 400,
          headers: corsHeaders,
        });
      }

      // Verify the token
      const isValid = await verifyToken(token, env);
      if (!isValid) {
        return new Response("Invalid token", {
          status: 400,
          headers: corsHeaders,
        });
      }

      const result = await domainOffersKV.submitDomainOffer(domain, {
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

  if (request.method === "DELETE") {
    try {
      // Check auth token
      const authToken = request.headers.get("Authorization");
      if (checkAuthToken(authToken, env)) {
        return new Response("Unauthorized", { status: 401 });
      }

      const result = await domainOffersKV.deleteDomainOffers(domain);
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

  // Check auth token
  const authToken = request.headers.get("Authorization");

  if (checkAuthToken(authToken, env)) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // GET request
  const offers = await domainOffersKV.getDomainOffers(domain);

  return new Response(JSON.stringify({ domain, offers }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function checkAuthToken(authToken: string | null, env: CloudflareEnv) {
  return (
    !authToken ||
    !authToken.startsWith("Bearer ") ||
    authToken.split(" ")[1] !== env.API_AUTH_TOKEN
  );
}

const VERIFY_ENDPOINT =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Update the verifyToken function
async function verifyToken(token: string, env: CloudflareEnv) {
  const res = await fetch(VERIFY_ENDPOINT, {
    method: "POST",
    body: `secret=${encodeURIComponent(
      env.TURNSTILE_SECRET_KEY
    )}&response=${encodeURIComponent(token)}`,
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
  });

  const data = (await res.json()) as { success: boolean };
  return data.success;
}

export const GET = handleRequest;
export const POST = handleRequest;
export const DELETE = handleRequest;
