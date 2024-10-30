import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

const offerSchema = z.object({
  email: z.string(),
  amount: z.number(),
  description: z.string(),
  timestamp: z.string(),
});

export type DomainOffer = z.infer<typeof offerSchema>;

const offersResponseSchema = z.object({
  domain: z.string(),
  offers: z.array(offerSchema),
});

export async function getDomainOffers(domain: string): Promise<DomainOffer[]> {
  try {
    const response = await fetch(
      `https://durable-object-starter.noxford1.workers.dev?domain=${encodeURIComponent(
        domain
      )}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer YELLOW_BEAR_SUN",
        },
        // Add cache control for production
        cache: process.env.NODE_ENV === "production" ? "no-cache" : undefined,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Validate response data
    const parsed = offersResponseSchema.safeParse(data);
    if (!parsed.success) {
      console.error("Invalid response data:", parsed.error);
      throw new Error("Invalid response data from server");
    }

    return parsed.data.offers;
  } catch (error) {
    console.error("Error fetching domain offers:", error);
    throw new Error("Failed to fetch domain offers");
  }
}

// Also add the submit function for completeness
export async function submitDomainOffer(
  domain: string,
  offer: {
    email: string;
    amount: number;
    description: string;
  }
) {
  const response = await fetch(
    `https://durable-object-starter.noxford1.workers.dev?domain=${encodeURIComponent(
      domain
    )}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer YELLOW_BEAR_SUN",
      },
      body: JSON.stringify(offer),
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
