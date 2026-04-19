export type SGO = {
  id: string;
  name: string;
  exchange: string;
  latitude: number;
  longitude: number;
  opcvmCount: number;
  opcvmNames: string[];
  address?: string;
  city?: string;
  country?: string;
};

export type ExchangeSGOData = {
  exchange: string;
  exchangeName: string;
  sgos: SGO[];
  center: {
    latitude: number;
    longitude: number;
  };
  zoom: number;
};
