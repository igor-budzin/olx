export interface User {
  id: string;
  firstName: string;
  isActive: boolean;
  registeredAt: number;
}

export interface AdData {
  url: string;
  views: { timestamp: number; count: number, viewOnDay: number }[];
  timestamp?: number;
  title: string;
  nativeId: number | null;
  ownerId: string[];
  accountName: string;
  location: string | null;
}

export interface ParsedAdViews {
  url: string;
  totalViewsOnDay: number;
  timestamp: number;
  title: string;
  nativeId: number;
  location: string;
}