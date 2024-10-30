export interface DomainOffer {
  email: string;
  amount: number;
  description?: string;
  timestamp: string;
}

export class DomainOffersDO {
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
