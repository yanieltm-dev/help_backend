const config = {
  '*.{ts,tsx,js,jsx}': ['eslint --cache --fix'],
  '*.{ts,tsx}': ['jest --bail jest --passWithNoTests'],
  '*.{md,json}': ['prettier --write'],
};

export default config;
