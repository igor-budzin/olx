import { db } from '../firebase';
import { AdData } from '../types';
import admin from 'firebase-admin';

export class AdRepository {
  private readonly collectionName = 'ads';

  /**
   * Create a new ad or update if it already exists
   */
  async createAd(ad: AdData): Promise<void> {
    const adId = ad.nativeId.toString();
    const now = Date.now();
    
    // Set created timestamp if not exists
    if (!ad.timestamp) {
      ad.timestamp = now;
    }
    
    await db.collection(this.collectionName).doc(adId).set({
      ...ad,
      lastUpdated: now
    }, { merge: true });
  }

  /**
   * Get ad by ID
   */
  async getAdById(adId: string): Promise<AdData | null> {
    const doc = await db.collection(this.collectionName).doc(adId).get();
    
    if (!doc.exists) {
      return null;
    }
    
    return doc.data() as AdData;
  }

  /**
   * Update an existing ad
   */
  async updateAd(adId: string, data: Partial<AdData>): Promise<void> {
    await db.collection(this.collectionName).doc(adId).update({
      ...data,
      lastUpdated: Date.now()
    });
  }

  /**
   * Get all ads owned by a specific user
   */
  async getAdsByOwnerId(ownerId: string): Promise<AdData[]> {
    const snapshot = await db.collection(this.collectionName)
      .where('ownerId', '==', ownerId)
      .get();
      
    return snapshot.docs.map(doc => doc.data() as AdData);
  }

  /**
   * Get all ads in the system
   */
  async getAllAds(): Promise<AdData[]> {
    const snapshot = await db.collection(this.collectionName).get();
    return snapshot.docs.map(doc => doc.data() as AdData);
  }

  /**
   * Add a view record to an ad
   */
  async addViewToAd(adId: string, viewCount: number): Promise<void> {
    const adRef = db.collection(this.collectionName).doc(adId);
    const adDoc = await adRef.get();
    
    if (!adDoc.exists) {
      throw new Error(`Ad with ID ${adId} not found`);
    }
    
    const now = Date.now();
    const viewData = {
      timestamp: now,
      count: viewCount
    };
    
    // Add to views array and update lastUpdated
    await adRef.update({
      views: admin.firestore.FieldValue.arrayUnion(viewData),
      lastUpdated: now
    });
  }

  /**
   * Get ads that haven't been updated in a specified time period
   */
  async getStaleAds(maxAgeMs: number): Promise<AdData[]> {
    const cutoffTime = Date.now() - maxAgeMs;
    
    const snapshot = await db.collection(this.collectionName)
      .where('lastUpdated', '<', cutoffTime)
      .get();
      
    return snapshot.docs.map(doc => doc.data() as AdData);
  }

  /**
   * Remove an ad
   */
  async removeAd(adId: string): Promise<void> {
    await db.collection(this.collectionName).doc(adId).delete();
  }

  /**
   * Transfer ownership of an ad to another user
   */
  async transferOwnership(adId: string, newOwnerId: string): Promise<void> {
    await db.collection(this.collectionName).doc(adId).update({
      ownerId: newOwnerId,
      lastUpdated: Date.now()
    });
  }
}
