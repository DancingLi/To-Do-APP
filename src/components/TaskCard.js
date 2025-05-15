import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';

const TaskCard = ({ id, index, task, moveTask, toggleComplete, removeTask }) => {
  const ref = useRef(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'TASK',
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'TASK',
    hover: (item, monitor) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      moveTask(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  // Add a function to determine the priority class
  const getPriorityClass = (priority) => {
    switch(priority) {
      case 'Low':
        return 'bg-green-100 border-green-400 dark:bg-green-900 dark:border-green-700';
      case 'High':
        return 'bg-red-100 border-red-400 dark:bg-red-900 dark:border-red-700';
      default: // Medium
        return 'bg-yellow-100 border-yellow-400 dark:bg-yellow-900 dark:border-yellow-700';
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
      } ${
        task.priority && !task.completed ? `border-l-4 ${getPriorityClass(task.priority)}` : ''
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
            <div className="flex items-center mt-1 space-x-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {task.category}
              </span>
              
              {/* Add priority badge */}
              {task.priority && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  task.priority === 'Low' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : task.priority === 'High'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {task.priority}
                </span>
              )}
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
