export const SYMBOL_NAMES = [
  'apple',
  'avocado',
  'orange',
  'watermelon',
  'cerejas',
  'grape',
  'strawberries',
  'banana',
  'lemon',
  'plum',
] as const;

export type SymbolName = (typeof SYMBOL_NAMES)[number];
