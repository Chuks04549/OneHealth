import React, { createContext, useContext } from 'react';

export const UnitContext = createContext({
  unitSystem: 'imperial',
  setUnitSystem: async () => {},
});

export function useUnits() {
  return useContext(UnitContext);
}

export function formatDistance(km, unitSystem = 'imperial') {
  const value = Number(km) || 0;
  return unitSystem === 'imperial'
    ? `${Math.round(value * 0.621371 * 10) / 10} mi`
    : `${Math.round(value * 10) / 10} km`;
}

export function formatPace(paceMinPerKm, unitSystem = 'imperial') {
  const pace = (Number(paceMinPerKm) || 0) * (unitSystem === 'imperial' ? 1.609344 : 1);
  let minutes = Math.floor(pace);
  let seconds = Math.round((pace - minutes) * 60);
  if (seconds === 60) {
    minutes += 1;
    seconds = 0;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')} /${unitSystem === 'imperial' ? 'mi' : 'km'}`;
}
