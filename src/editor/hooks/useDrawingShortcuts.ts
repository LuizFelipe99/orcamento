import { useEffect } from 'react';
import { requestProjectDeletion } from '../commands/baseOutlineCommands';
import {
  cancelCurrentInput,
  setAngleLockActive,
  toggleGridSnap,
  typeLengthCharacter,
  undoLastDraftInput,
} from '../commands/draftCommands';
import { commitTypedLength } from '../commands/editorCommands';
import { undoLastRoofChange } from '../commands/splitCommands';

const SHIFT_KEY = 'Shift';
const UNDO_KEY = 'z';
const TYPED_LENGTH_CHARACTER_PATTERN = /^[0-9.,]$/;
const FORM_FIELD_TAG_NAMES = ['INPUT', 'TEXTAREA', 'SELECT'];

const shortcutCommandsByKey: Record<string, () => void> = {
  Enter: commitTypedLength,
  Escape: cancelCurrentInput,
  Backspace: undoLastDraftInput,
  Delete: requestProjectDeletion,
  g: toggleGridSnap,
  G: toggleGridSnap,
};

const isEditingFormField = (event: KeyboardEvent): boolean => {
  const eventTarget = event.target;

  if (!(eventTarget instanceof HTMLElement)) {
    return false;
  }

  return eventTarget.isContentEditable || FORM_FIELD_TAG_NAMES.includes(eventTarget.tagName);
};

const isUndoShortcut = (event: KeyboardEvent): boolean =>
  (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === UNDO_KEY;

export const useDrawingShortcuts = () => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditingFormField(event)) {
        return;
      }

      if (event.key === SHIFT_KEY) {
        setAngleLockActive(true);
        return;
      }

      if (isUndoShortcut(event)) {
        event.preventDefault();
        undoLastRoofChange();
        return;
      }

      if (TYPED_LENGTH_CHARACTER_PATTERN.test(event.key)) {
        event.preventDefault();
        typeLengthCharacter(event.key);
        return;
      }

      const shortcutCommand = shortcutCommandsByKey[event.key];

      if (!shortcutCommand) {
        return;
      }

      event.preventDefault();
      shortcutCommand();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key !== SHIFT_KEY) {
        return;
      }

      setAngleLockActive(false);
    };

    const releaseAngleLock = () => setAngleLockActive(false);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', releaseAngleLock);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', releaseAngleLock);
    };
  }, []);
};
