import * as React from "react";
import { cn } from "@/lib/utils";
import { formatCurrency, parseCurrency } from "@/lib/formatters";

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | string;
  onChange: (value: number) => void;
  allowEmpty?: boolean;
  decimals?: number;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, allowEmpty = false, decimals = 2, disabled, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState<string>('');
    const [isFocused, setIsFocused] = React.useState(false);

    // Update display value when external value changes and not focused
    React.useEffect(() => {
      if (!isFocused) {
        if (value === '' || value === null || value === undefined) {
          setDisplayValue('');
        } else {
          const numValue = typeof value === 'string' ? parseFloat(value) : value;
          if (!isNaN(numValue) && numValue !== 0) {
            setDisplayValue(formatCurrency(numValue));
          } else if (numValue === 0 && !allowEmpty) {
            setDisplayValue(formatCurrency(0));
          } else {
            setDisplayValue('');
          }
        }
      }
    }, [value, isFocused, allowEmpty]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // Convert formatted value to raw number for editing
      if (displayValue) {
        const rawValue = parseCurrency(displayValue);
        if (rawValue !== 0) {
          setDisplayValue(rawValue.toString().replace('.', ','));
        } else if (!allowEmpty) {
          setDisplayValue('0');
        } else {
          setDisplayValue('');
        }
      }
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      // Format the value on blur
      const rawValue = parseCurrency(displayValue);
      if (rawValue !== 0) {
        setDisplayValue(formatCurrency(rawValue));
      } else if (!allowEmpty) {
        setDisplayValue(formatCurrency(0));
        onChange(0);
      } else {
        setDisplayValue('');
        onChange(0);
      }
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value;
      
      // Allow empty input
      if (inputValue === '') {
        setDisplayValue('');
        onChange(allowEmpty ? 0 : 0);
        return;
      }

      // Replace dot with comma for decimal separator
      inputValue = inputValue.replace('.', ',');
      
      // Only allow digits, comma, and minus sign
      const isValid = /^-?\d*,?\d*$/.test(inputValue);
      
      if (isValid) {
        // Limit decimal places
        const parts = inputValue.split(',');
        if (parts.length === 2 && parts[1].length > decimals) {
          inputValue = parts[0] + ',' + parts[1].substring(0, decimals);
        }
        
        setDisplayValue(inputValue);
        
        // Parse and emit the numeric value
        const numericValue = parseCurrency(inputValue);
        onChange(numericValue);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: backspace, delete, tab, escape, enter, decimal separators
      if (
        e.key === 'Backspace' ||
        e.key === 'Delete' ||
        e.key === 'Tab' ||
        e.key === 'Escape' ||
        e.key === 'Enter' ||
        e.key === ',' ||
        e.key === '.' ||
        e.key === '-' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight' ||
        e.key === 'Home' ||
        e.key === 'End' ||
        (e.ctrlKey && (e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x'))
      ) {
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
        inputMode="decimal"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        {...props}
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
