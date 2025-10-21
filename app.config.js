export default ({ config }) => {
  // Determine bundle ID based on environment
  const isProduction = process.env.APP_VARIANT === 'production';
  const bundleIdentifier = isProduction ? 'com.asktoddy.prod' : 'com.asktoddy.staging';
  
  return {
    ...config,
    ios: {
      ...config.ios,
      bundleIdentifier,
    },
    android: {
      ...config.android,
      package: bundleIdentifier,
    },
  };
};