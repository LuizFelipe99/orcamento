import { useState, type ChangeEvent, type FormEvent } from 'react';
import { formatMeters } from '../../formatting/measurementFormatters';
import { parsePositiveNumber } from '../../formatting/measurementParsers';

type StockLengthsEditorProps = {
  stockLengthsInMeters: number[];
  onAddStockLength: (stockLengthInMeters: number) => void;
  onRemoveStockLength: (stockLengthInMeters: number) => void;
};

export const StockLengthsEditor = ({
  stockLengthsInMeters,
  onAddStockLength,
  onRemoveStockLength,
}: StockLengthsEditorProps) => {
  const [rawInput, setRawInput] = useState('');
  const parsedLength = parsePositiveNumber(rawInput);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => setRawInput(event.target.value);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (parsedLength === null) {
      return;
    }

    onAddStockLength(parsedLength);
    setRawInput('');
  };

  return (
    <div className="stock-lengths">
      <form className="stock-lengths__form" onSubmit={handleSubmit}>
        <label htmlFor="stock-length-input">Comprimentos disponíveis (m)</label>
        <input
          id="stock-length-input"
          className="planes-panel__input"
          type="text"
          inputMode="decimal"
          placeholder="ex.: 6"
          value={rawInput}
          onChange={handleInputChange}
        />
        <button type="submit" className="stock-lengths__add" disabled={parsedLength === null}>
          Adicionar
        </button>
      </form>
      {stockLengthsInMeters.length > 0 && (
        <ul className="stock-lengths__chips">
          {stockLengthsInMeters.map((stockLengthInMeters) => (
            <li key={stockLengthInMeters} className="stock-lengths__chip">
              {formatMeters(stockLengthInMeters)}
              <button
                type="button"
                className="stock-lengths__remove"
                aria-label={`Remover ${formatMeters(stockLengthInMeters)}`}
                onClick={() => onRemoveStockLength(stockLengthInMeters)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
