import React, { createContext, useContext } from 'react';

export const AppearanceContext = createContext({
  preference: 'system',
  colorScheme: 'light',
  setPreference: async () => {},
});

export function useAppAppearance() {
  return useContext(AppearanceContext);
}
