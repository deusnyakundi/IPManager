import React, { useState } from 'react';
import { TextField } from '@mui/material';

const IPInput = ({ value, onChange }) => {
  const [inputValue, setInputValue] = useState(value);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    const formattedValue = formatIP(newValue);
    setInputValue(formattedValue);
    onChange(formattedValue);
  };

  const formatIP = (value) => {
    // Remove non-digit and non-dot characters
    const cleanedValue = value.replace(/[^\d.]/g, '');

    // Split into segments
    const segments = cleanedValue.split('.').map((seg) => seg.slice(0, 3));

    // Join segments with dots, ensuring no more than 4 segments
    return segments.slice(0, 4).join('.');
  };

  return (
    <TextField
      value={inputValue}
      onChange={handleInputChange}
      placeholder="xxx.xxx.xxx.xxx"
      inputProps={{ maxLength: 15 }}
      sx={{ width: 200 }}
    />
  );
};

export default IPInput;