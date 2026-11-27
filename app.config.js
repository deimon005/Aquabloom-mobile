module.exports = ({ config }) => {
  if (process.env.EXPO_PUBLIC_AQUABLOOM_QA !== '1') return config;
  return {
    ...config,
    name: 'AquaBloom QA',
    scheme: 'aquabloom-qa',
    android: { ...config.android, package: 'com.aquabloom.mobile.qa' },
  };
};
