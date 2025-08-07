// src/repositories/FirebaseUserRepository.ts
import { db } from '../firebase';
import { User } from '../types';
import admin from 'firebase-admin';

export class UserRepository {
  async createUser(user: User): Promise<void> {
    await db.collection('users').doc(user.id).set(user);
  }

  async getUserById(id: string): Promise<User | null> {
    const doc = await db.collection('users').doc(id).get();
    return doc.exists ? (doc.data() as User) : null;
  }

  async updateUser(id: string, data: Partial<User>): Promise<void> {
    await db.collection('users').doc(id).update(data);
  }

  async getAllActiveUsers(): Promise<User[]> {
    const snapshot = await db.collection('users')
      .where('isActive', '==', true)
      .get();
    return snapshot.docs.map(doc => doc.data() as User);
  }

  async addAdToUser(id: string, adId: string): Promise<void> {
    await db.collection('users').doc(id).update({
      adIds: admin.firestore.FieldValue.arrayUnion(adId)
    });
  }

  async removeAdFromUser(id: string, adId: string): Promise<void> {
    await db.collection('users').doc(id).update({
      adIds: admin.firestore.FieldValue.arrayRemove(adId)
    });
  }
}
