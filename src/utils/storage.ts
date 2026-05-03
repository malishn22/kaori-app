import AsyncStorage from '@react-native-async-storage/async-storage';

export async function safeGet(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch (e) {
    console.warn(`[Kaori] storage.get failed for ${key}:`, e);
    return null;
  }
}

export async function safeSet(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    console.warn(`[Kaori] storage.set failed for ${key}:`, e);
  }
}

export async function safeMultiSet(pairs: [string, string][]): Promise<void> {
  try {
    await AsyncStorage.multiSet(pairs);
  } catch (e) {
    console.warn('[Kaori] storage.multiSet failed:', e);
  }
}

export async function safeMultiGet(keys: string[]): Promise<[string, string | null][]> {
  try {
    return await AsyncStorage.multiGet(keys);
  } catch (e) {
    console.warn('[Kaori] storage.multiGet failed:', e);
    return keys.map(k => [k, null]);
  }
}

export async function safeMultiRemove(keys: string[]): Promise<void> {
  try {
    await AsyncStorage.multiRemove(keys);
  } catch (e) {
    console.warn('[Kaori] storage.multiRemove failed:', e);
  }
}
