/**
 * EventBus - Centralized event system for decoupled module communication
 * Allows modules to publish/subscribe without direct dependencies
 */

export class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name (e.g., 'collision', 'balconyEnter')
   * @param {Function} callback - Callback function with event data
   * @returns {Function} Unsubscribe function
   */
  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    const callbacks = this.listeners.get(event);
    callbacks.push(callback);
    
    return () => {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Publish an event to all subscribers
   * @param {string} event - Event name
   * @param {Object} data - Event data payload
   */
  publish(event, data = {}) {
    if (!this.listeners.has(event)) return;
    
    const callbacksCopy = [...this.listeners.get(event)];
    
    for (const callback of callbacksCopy) {
      try {
        callback(data);
      } catch (error) {
        console.error(`EventBus: Error in ${event} listener:`, error);
      }
    }
  }

  /**
   * Unsubscribe all listeners from an event
   * @param {string} event - Event name
   */
  clear(event) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

export const gameEvents = new EventBus();
