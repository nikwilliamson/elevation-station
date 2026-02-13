import { createContext, useContext } from 'react';
import type { ColorFormat } from './colorPalette';

export const ColorFormatContext = createContext<ColorFormat>('oklch');

export function useColorFormat(): ColorFormat {
  return useContext(ColorFormatContext);
}
