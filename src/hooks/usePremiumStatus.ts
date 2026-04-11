import { db } from '../db';
import { appSettings } from '../db/schema';
import { usePremiumStore } from '../stores/premiumStore';
import { eq } from 'drizzle-orm';

export const loadPremiumStatus = async (): Promise<void> => {
  const row = db.select().from(appSettings).where(eq(appSettings.key, 'is_premium')).get();
  const isPremium = row?.value === '1';
  usePremiumStore.getState().setIsPremium(isPremium);
};

export const savePremiumStatus = async (isPremium: boolean): Promise<void> => {
  db.insert(appSettings)
    .values({ key: 'is_premium', value: isPremium ? '1' : '0' })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: isPremium ? '1' : '0' } })
    .run();
  usePremiumStore.getState().setIsPremium(isPremium);
};
