import { AppData, LogEntry } from '../types';
import { v4 as uuidv4 } from 'uuid';

const MAX_LOGS = 500; // To prevent the database from growing indefinitely

/**
 * Creates a new log entry and prepends it to the logs array in AppData.
 * Also handles log rotation to keep the array size manageable.
 * @param currentData The current state of the application data.
 * @param action A string identifier for the action being logged.
 * @param details Optional additional data about the action.
 * @returns A new AppData object with the updated logs.
 */
export const createLogEntry = (
  currentData: AppData,
  action: string,
  details?: string | Record<string, any>
): AppData => {
  const newLog: LogEntry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    action,
    details,
  };

  // Ensure logs array exists, even if it's from an older data structure
  const existingLogs = currentData.logs || [];
  const updatedLogs = [newLog, ...existingLogs];
  
  // Keep the log array from growing too large
  if (updatedLogs.length > MAX_LOGS) {
    updatedLogs.splice(MAX_LOGS);
  }

  return {
    ...currentData,
    logs: updatedLogs,
  };
};
