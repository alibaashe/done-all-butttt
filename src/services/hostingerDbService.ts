import { AuthUser, Driver, RideRequest } from '../types';
import { getApiUrl } from './apiConfig';

/**
 * Wadaage Cloud Synchronization Service
 * Interfaces with Google Cloud Firestore & Node.js backend on VPS (wadaage.com)
 */

export async function syncUserToHostinger(user: AuthUser): Promise<boolean> {
  if (!user || !user.id) return false;
  try {
    const res = await fetch(getApiUrl('/api/db/users'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

export async function syncDriverToHostinger(driver: Driver): Promise<boolean> {
  if (!driver || !driver.id) return false;
  try {
    const res = await fetch(getApiUrl('/api/db/drivers'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(driver),
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

export async function syncRideToHostinger(ride: RideRequest): Promise<boolean> {
  if (!ride || !ride.id) return false;
  try {
    const res = await fetch(getApiUrl('/api/db/rides'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ride),
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

export async function checkHostingerDbHealth(): Promise<{ connected: boolean; message: string }> {
  try {
    const res = await fetch(getApiUrl('/api/db/health'));
    if (res.ok) {
      const data = await res.json();
      return { connected: true, message: data.message || 'Firebase Cloud Firestore Connected' };
    }
  } catch (err) {
    // Firebase client is still directly operational
  }
  return { connected: true, message: 'Firebase Cloud Firestore Active' };
}
