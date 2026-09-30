import { create } from 'zustand';

const DECIMAL_SEPARATOR_PATTERN = /[.,]/;
const DISPLAYED_DECIMAL_SEPARATOR = ',';

type DraftingInputState = {
  isAngleLockActive: boolean;
  isGridSnapEnabled: boolean;
  typedLengthInput: string;
  setAngleLockActive: (isActive: boolean) => void;
  toggleGridSnap: () => void;
  appendTypedLengthCharacter: (character: string) => void;
  removeLastTypedLengthCharacter: () => void;
  clearTypedLength: () => void;
};

export const useDraftingInputStore = create<DraftingInputState>()((set) => ({
  isAngleLockActive: false,
  isGridSnapEnabled: true,
  typedLengthInput: '',
  setAngleLockActive: (isActive) => set({ isAngleLockActive: isActive }),
  toggleGridSnap: () => set((state) => ({ isGridSnapEnabled: !state.isGridSnapEnabled })),
  appendTypedLengthCharacter: (character) =>
    set((state) => {
      const isDecimalSeparator = DECIMAL_SEPARATOR_PATTERN.test(character);
      const alreadyHasDecimalSeparator = DECIMAL_SEPARATOR_PATTERN.test(state.typedLengthInput);

      if (isDecimalSeparator && alreadyHasDecimalSeparator) {
        return state;
      }

      const normalizedCharacter = isDecimalSeparator ? DISPLAYED_DECIMAL_SEPARATOR : character;

      return { typedLengthInput: state.typedLengthInput + normalizedCharacter };
    }),
  removeLastTypedLengthCharacter: () =>
    set((state) => ({ typedLengthInput: state.typedLengthInput.slice(0, -1) })),
  clearTypedLength: () => set({ typedLengthInput: '' }),
}));
