// Formats the current local time for display in the observation tool.
export function getCurrentTimeFormatted(): string {
    const now = new Date();
  
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
  
    hours = hours % 12 || 12; // Convert 0 => 12
    const paddedMinutes = minutes.toString().padStart(2, '0');
  
    return `${hours}:${paddedMinutes} ${ampm}`;
  }
  
