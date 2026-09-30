import { useState, type ChangeEvent } from 'react';

type DecimalFieldProps = {
  inputId: string;
  label: string;
  value: number | null;
  placeholder: string;
  acceptsEmptyValue: boolean;
  parseValue: (rawInput: string) => number | null;
  onValueChange: (value: number | null) => void;
};

const formatDecimalInput = (value: number | null): string => (value === null ? '' : String(value).replace('.', ','));

export const DecimalField = ({
  inputId,
  label,
  value,
  placeholder,
  acceptsEmptyValue,
  parseValue,
  onValueChange,
}: DecimalFieldProps) => {
  const [rawInput, setRawInput] = useState(() => formatDecimalInput(value));
  const [lastSyncedValue, setLastSyncedValue] = useState(value);

  if (value !== lastSyncedValue) {
    setLastSyncedValue(value);
    setRawInput(formatDecimalInput(value));
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const parsedValue = parseValue(event.target.value);

    setRawInput(event.target.value);

    if (parsedValue === null && !acceptsEmptyValue) {
      return;
    }

    setLastSyncedValue(parsedValue);
    onValueChange(parsedValue);
  };

  return (
    <div className="planes-panel__field">
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        className="planes-panel__input"
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        value={rawInput}
        onChange={handleInputChange}
      />
    </div>
  );
};
