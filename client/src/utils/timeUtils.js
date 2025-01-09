// Convert decimal hours to HH:MM:SS format
export const formatTimeHHMMSS = (decimalHours) => {
  if (!decimalHours && decimalHours !== 0) return 'N/A';
  
  const totalSeconds = Math.round(decimalHours * 3600); // Convert hours to seconds
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}; 