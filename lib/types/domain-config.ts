interface DomainConfig {
  domain: string;
  template: string;
  customization: {
    title: string;
    description: string;
    colors: {
      primary: string;
      secondary: string;
    };
  };
  settings: {
    minimumOffer: number;
    contactEmail: string;
  };
}
