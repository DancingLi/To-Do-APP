/**
 * Utility functions for task dependency validation
 */

/**
 * Format dependency validation error for API response
 * @param {String} code - Error code
 * @param {String} message - Error message
 * @param {Object} details - Additional error details
 * @returns {Object} - Formatted error object
 */
const formatDependencyError = (code, message, details = {}) => {
  return {
    error: {
      code,
      message,
      details
    }
  };
};

/**
 * Format dependency cycle for human-readable output
 * @param {Array} cycle - Array of task objects with id and title
 * @returns {String} - Human-readable cycle description
 */
const formatDependencyCycle = (cycle) => {
  if (!cycle || cycle.length === 0) return '';
  
  return cycle.map(task => task.title || task.id).join(' → ') + 
         ` → ${cycle[0].title || cycle[0].id}`;
};

module.exports = {
  formatDependencyError,
  formatDependencyCycle
};
