import * as SecureStore from 'expo-secure-store';

const options: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

// Never fall back to plaintext storage if the OS keychain fails.
export const sessionStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key, options),
  setItem: (key: string, value: string) =>
    SecureStore.setItemAsync(key, value, options),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key, options),
};
