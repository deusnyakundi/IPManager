export interface Site {
  id: string;
  name: string;
  regionId: string;
  region?: {
    id: string;
    name: string;
  };
  ipAddress?: string;
} 