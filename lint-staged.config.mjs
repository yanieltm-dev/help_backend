const config = {
  '*.{ts,tsx,js,jsx}': ['eslint --cache --fix'],
  '*.{ts,tsx}': ['jest --findRelatedTests --bail'],
  '*.{md,json}': ['prettier --write'],
};

export default config;
