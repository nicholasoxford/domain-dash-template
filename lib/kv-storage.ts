export interface DomainOffer {
  email: string;
  amount: number;
  description?: string;
  timestamp: string;
  token?: string;
}

export class DomainOffersKV {
  private kv: KVNamespace;

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  async trackDomainRequest(domain: string) {
    const key = `requests:${domain}`;
    const currentRequests = parseInt((await this.kv.get(key)) || "0", 10);
    const newRequests = currentRequests + 1;

    await this.kv.put(key, newRequests.toString());

    return {
      domain,
      requests: newRequests,
      timestamp: new Date().toISOString(),
    };
  }

  async getDomainRequests(domain: string) {
    const key = `requests:${domain}`;
    const requests = await this.kv.get(key);
    return parseInt(requests || "0", 10);
  }

  async submitDomainOffer(
    domain: string,
    offer: Omit<DomainOffer, "timestamp">
  ) {
    const key = `offers:${domain}`;
    const existingOffersJson = await this.kv.get(key);
    const offers: DomainOffer[] = existingOffersJson
      ? JSON.parse(existingOffersJson)
      : [];

    const newOffer: DomainOffer = {
      ...offer,
      timestamp: new Date().toISOString(),
    };

    offers.push(newOffer);
    await this.kv.put(key, JSON.stringify(offers));

    return {
      domain,
      offer: newOffer,
      totalOffers: offers.length,
    };
  }

  async getDomainOffers(domain: string) {
    const key = `offers:${domain}`;
    const offersJson = await this.kv.get(key);
    const offers = offersJson ? (JSON.parse(offersJson) as DomainOffer[]) : [];

    // Sort by timestamp, newest first
    return offers.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async deleteDomainOffers(domain: string) {
    const key = `offers:${domain}`;
    await this.kv.delete(key);
    return {
      domain,
      message: "Domain offers deleted successfully",
      timestamp: new Date().toISOString(),
    };
  }

  async getAllDomains() {
    const { keys } = await this.kv.list({ prefix: "offers:" });
    return keys.map((key) => key.name.replace("offers:", ""));
  }

  async getAllOffers() {
    const { keys } = await this.kv.list({ prefix: "offers:" });
    const allOffers: (DomainOffer & { domain: string })[] = [];

    for (const key of keys) {
      const domain = key.name.replace("offers:", "");
      const offersJson = await this.kv.get(key.name);
      if (offersJson) {
        const offers = JSON.parse(offersJson) as DomainOffer[];
        allOffers.push(
          ...offers.map((offer) => ({
            ...offer,
            domain,
          }))
        );
      }
    }

    // Sort by timestamp, newest first
    return allOffers.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async deleteSingleOffer(domain: string, timestamp: string) {
    const key = `offers:${domain}`;
    const offersJson = await this.kv.get(key);

    if (!offersJson) return;

    const offers: DomainOffer[] = JSON.parse(offersJson);
    const filteredOffers = offers.filter(
      (offer) => offer.timestamp !== timestamp
    );

    if (filteredOffers.length === 0) {
      await this.kv.delete(key);
    } else {
      await this.kv.put(key, JSON.stringify(filteredOffers));
    }

    return {
      domain,
      message: "Offer deleted successfully",
      timestamp: new Date().toISOString(),
    };
  }

  async initializeDomain(domain: string) {
    const key = `offers:${domain}`;
    const existingOffersJson = await this.kv.get(key);

    // Only initialize if the key doesn't exist
    if (!existingOffersJson) {
      await this.kv.put(key, JSON.stringify([]));
    }

    return {
      domain,
      message: "Domain initialized successfully",
      timestamp: new Date().toISOString(),
    };
  }

  async incrementVisits(domain: string) {
    const key = `visits:${domain}`;
    const currentVisits = parseInt((await this.kv.get(key)) || "0", 10);
    const newVisits = currentVisits + 1;

    await this.kv.put(key, newVisits.toString());

    return {
      domain,
      visits: newVisits,
      timestamp: new Date().toISOString(),
    };
  }

  async getVisits(domain: string) {
    const key = `visits:${domain}`;
    const visits = await this.kv.get(key);
    return parseInt(visits || "0", 10);
  }

  async getDomainStats() {
    const domains = await this.getAllDomains();
    const stats = await Promise.all(
      domains.map(async (domain) => {
        const offers = await this.getDomainOffers(domain);
        const visits = await this.getVisits(domain);

        const lastOffer = offers[0]?.timestamp
          ? new Date(offers[0].timestamp)
          : null;
        const avgOffer = offers.length
          ? Math.round(
              offers.reduce((sum, o) => sum + o.amount, 0) / offers.length
            )
          : 0;
        const topOffer = offers.length
          ? Math.max(...offers.map((o) => o.amount))
          : 0;

        return {
          domain,
          visits,
          lastOffer,
          avgOffer,
          topOffer,
          offerCount: offers.length,
        };
      })
    );

    // Sort by visits desc
    return stats.sort((a, b) => b.visits - a.visits);
  }
}

export type DomainStat = {
  domain: string;
  visits: number;
  lastOffer: Date | null;
  avgOffer: number;
  topOffer: number;
  offerCount: number;
};
