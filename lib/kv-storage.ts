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
    return offersJson ? (JSON.parse(offersJson) as DomainOffer[]) : [];
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
}
