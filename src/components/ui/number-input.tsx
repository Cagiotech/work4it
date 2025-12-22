import * as React from "react";
import { cn } from "@/lib/utils";

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | string;
  onChange: (value: number | string) => void;
  allowEmpty?: boolean;
  allowDecimals?: boolean;
  decimals?: number;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value, onChange, allowEmpty = true, allowDecimals = true, decimals = 2, disabled, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState<string>('');

    // Sync display value with external value
    React.useEffect(() => {
      if (value === '' || value === null || value === undefined) {
        setDisplayValue('');
      } else {
        const strValue = typeof value === 'number' ? value.toString() : value;
        setDisplayValue(strValue);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value;
      
      // Allow empty input
      if (inputValue === '') {
        setDisplayValue('');
        onChange(allowEmpty ? '' : 0);
        return;
      }

      // Build regex based on options
      let regex: RegExp;
      if (allowDecimals) {
        regex = /^-?\d*\.?\d*$/;
      } else {
        regex = /^-?\d*$/;
      }
      
      if (regex.test(inputValue)) {
        // Limit decimal places
        if (allowDecimals) {
          const parts = inputValue.split('.');
          if (parts.length === 2 && parts[1].length > decimals) {
            inputValue = parts[0] + '.' + parts[1].substring(0, decimals);
          }
        }
        
        setDisplayValue(inputValue);
        
        // Parse and emit
        if (inputValue === '-' || inputValue === '.' || inputValue === '-.') {
          onChange(inputValue);
        } else {
          const numericValue = allowDecimals ? parseFloat(inputValue) : parseInt(inputValue, 10);
          onChange(isNaN(numericValue) ? (allowEmpty ? '' : 0) : numericValue);
        }
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: backspace, delete, tab, escape, enter, arrows, home, end
      if (
        e.key === 'Backspace' ||
        e.key === 'Delete' ||
        e.key === 'Tab' ||
        e.key === 'Escape' ||
        e.key === 'Enter' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight' ||
        e.key === 'Home' ||
        e.key === 'End' ||
        (e.ctrlKey && (e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x'))
      ) {
        return;
      }
      
      // Allow minus sign only at the beginning
      if (e.key === '-') {
        const input = e.currentTarget;
        if (input.selectionStart !== 0 || displayValue.includes('-')) {
          e.preventDefault();
        }
        return;
      }
      
      // Allow decimal point if decimals are allowed
      if (e.key === '.' && allowDecimals) {
        if (displayValue.includes('.')) {
          e.preventDefault();
        }
        return;
      }
      
      // Block non-numeric keys
      if (!/^\d$/.test(e.key)) {
        e.preventDefault();
      }
    };

    return (
      <input
        type="text"
        inputMode={allowDecimals ? "decimal" : "numeric"}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        {...props}
      />
    );
  }
);

NumberInput.displayName = "NumberInput";

export { NumberInput };
