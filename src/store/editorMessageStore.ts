import { create } from 'zustand';

const MESSAGE_DURATION_IN_MILLISECONDS = 5000;

export type EditorMessageTone = 'info' | 'warning';

export type EditorMessage = {
  text: string;
  tone: EditorMessageTone;
};

type EditorMessageState = {
  editorMessage: EditorMessage | null;
  showEditorMessage: (text: string, tone?: EditorMessageTone) => void;
};

export const useEditorMessageStore = create<EditorMessageState>()((set) => {
  let dismissTimeoutId: ReturnType<typeof setTimeout> | undefined;

  return {
    editorMessage: null,
    showEditorMessage: (text, tone = 'warning') => {
      clearTimeout(dismissTimeoutId);
      set({ editorMessage: { text, tone } });
      dismissTimeoutId = setTimeout(() => set({ editorMessage: null }), MESSAGE_DURATION_IN_MILLISECONDS);
    },
  };
});
