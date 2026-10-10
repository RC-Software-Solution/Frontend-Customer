import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Build an unsigned JWT whose `exp` is `secondsFromNow` away (negative = already expired). */
export const makeJwt = (secondsFromNow: number) => {
  const part = (o: object) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${part({ alg: 'none' })}.${part({ exp: Math.floor(Date.now() / 1000) + secondsFromNow })}.sig`;
};

/** In-memory SecureStore fake from jest.setup.ts */
export const secureStore = (SecureStore as any).__store as Map<string, string>;

export const resetStorage = async () => {
  secureStore.clear();
  await AsyncStorage.clear();
};
