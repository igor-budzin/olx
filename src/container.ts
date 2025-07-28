import { DataStore } from './DataStore';
import { AdData } from './types';

export const container = {
  adStore: new DataStore<AdData>(),
};