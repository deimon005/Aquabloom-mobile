import Constants from 'expo-constants';

export const androidQa =
  process.env.EXPO_PUBLIC_AQUABLOOM_QA === '1' &&
  Constants.expoConfig?.android?.package === 'com.aquabloom.mobile.qa';

export const qaApiUrl = 'https://api.aquabloom.invalid';
export const qaAuthUrl = 'https://auth.aquabloom.invalid';
