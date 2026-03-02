let uuidCounter = 0;

export const v7 = (): string => {
  uuidCounter++;
  return `mocked-uuid-v7-${Date.now()}-${uuidCounter}`;
};

export const v4 = (): string => {
  uuidCounter++;
  return `mocked-uuid-v4-${Date.now()}-${uuidCounter}`;
};
