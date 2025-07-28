export interface AdData {
  url: string;
  views: { timestamp: number; count: number }[];
  timestamp?: number;
  title: string;
  nativeId: number | null;
}

export interface ParsedAdViews {
  url: string;
  views: number;
  timestamp: number;
  title: string;
  nativeId: number;
}