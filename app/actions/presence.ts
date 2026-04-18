"use server";

import { redis } from "@/utils/redis";

export interface CardLockData {
  authorId: string;
  authorName: string;
  lockedAt: number;
}

const PRESENCE_TTL_SECONDS = 60; // 1-minute expiration to prevent stale lock states

/**
 * Attempt to lock a card for a specific user to prevent concurrent editing visual conflicts.
 * This runs securely as a Server Action.
 */
export async function setCardLock(cardId: string, authorId: string, authorName: string) {
  if (!redis) {
    return { success: false, reason: "redis-unavailable" };
  }

  const key = `presence:card-lock:${cardId}`;

  // First verify if it's already locked by someone else
  const existingLock = await redis.get<CardLockData>(key);
  if (existingLock && existingLock.authorId !== authorId) {
    return { 
      success: false, 
      reason: "locked",
      lockedBy: existingLock.authorName 
    };
  }

  // Set the lock with an expiration to prevent permanent locks if user disconnects
  await redis.setex(key, PRESENCE_TTL_SECONDS, {
    authorId,
    authorName,
    lockedAt: Date.now()
  });

  return { success: true };
}

/**
 * Get the current lock status of a card, useful for polling intervals on the client UI.
 */
export async function getCardLock(cardId: string) {
  if (!redis) return null;

  const key = `presence:card-lock:${cardId}`;
  const lock = await redis.get<CardLockData>(key);
  
  return lock || null;
}

/**
 * Explicitly release the card lock when user finishes editing.
 * Checks author permission so someone else can't arbitrarily unlock it.
 */
export async function unlockCard(cardId: string, authorId: string) {
  if (!redis) return;

  const key = `presence:card-lock:${cardId}`;
  
  // Quick check so we only delete if we own it
  const lock = await redis.get<CardLockData>(key);
  if (lock && lock.authorId === authorId) {
    await redis.del(key);
  }
}
