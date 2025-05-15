import React from 'react';

const TaskCard = ({ id, index, task, moveTask, toggleComplete, removeTask }) => {
  // Function to determine priority badge color
  const getPriorityBadge = (priority) => {
    switch(priority) {
      case 'Low':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Low</span>;
      case 'High':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">High</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Medium</span>;
    }
  };
  
  return (
    <div 
      ref={ref}
      className={`p-4 mb-2 rounded-lg shadow-sm task-transition ${
        isDragging ? 'opacity-50' : 'opacity-100'
      } ${
        task.completed ? 
        'bg-green-100 dark:bg-green-900' : 
        'bg-white dark:bg-gray-800'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => toggleComplete(task.id)}
            className="w-5 h-5 mr-3 rounded form-checkbox text-blue-600"
          />
          <div>
            <p className={`font-medium text-gray-800 dark:text-gray-100 ${
              task.completed ? 'line-through' : ''
            }`}>
              {task.title}
            </p>
            <div className="flex items-center mt-1 gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {task.category}
              </span>
              {getPriorityBadge(task.priority)}
            </div>
          </div>
        </div>
        <button 
          onClick={() => removeTask(task.id)}
          className="text-red-500 hover:text-red-700 dark:text-red-400"
          aria-label="Delete task"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default TaskCard;