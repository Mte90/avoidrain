import { DEBUG } from './Constants.js';

class Logger {
  log(...args) {
    if (DEBUG.CONSOLE_ENABLED) console.log(...args);
  }

  warn(...args) {
    if (DEBUG.CONSOLE_ENABLED) console.warn(...args);
  }

  error(...args) {
    // Errors always logged
    console.error(...args);
  }
}

export const logger = new Logger();