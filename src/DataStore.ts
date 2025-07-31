export interface IDataStore<T> {
  save(collection: string, id: string, data: T): Promise<void>;
  update(collection: string, id: string, data: Partial<T>): Promise<void>;
  get(collection: string, id: string): Promise<T | null>;
  addToArrayField?(collection: string, id: string, field: string, value: any): Promise<void>;
  getAll?(collection: string): Promise<T[]>;
}

// Firestore implementation
import { db } from './firebase';
import admin from 'firebase-admin';

export class DataStore<T> implements IDataStore<T> {
  async save(collection: string, id: string, data: T): Promise<void> {
    await db.collection(collection).doc(id).set(data as FirebaseFirestore.DocumentData);
  }

  async update(collection: string, id: string, data: Partial<T>): Promise<void> {
    await db.collection(collection).doc(id).update(data);
  }

  async get(collection: string, id: string): Promise<T | null> {
    const doc = await db.collection(collection).doc(id).get();
    return doc.exists ? (doc.data() as T) : null;
  }

  async addToArrayField(collection: string, id: string, field: string, value: any): Promise<void> {
    await db.collection(collection).doc(id).update({
      [field]: admin.firestore.FieldValue.arrayUnion(value)
    });
  }

  async getAll(collection: string): Promise<T[]> {
    const snapshot = await db.collection(collection).get();
    return snapshot.docs.map(doc => doc.data() as T);
  }
}