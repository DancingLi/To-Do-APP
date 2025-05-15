import React, { useState } from 'react';
import CategoryFilter from './CategoryFilter';

const TaskList = ({ tasks, setTasks, updateProgress }) => {
  const [newTask, setNewTask] = useState({ title: '', category: 'Work', priority: 'Medium' });
  const [activeCategory, setActiveCategory] = useState('all');
  const [activePriority, setActivePriority] = useState('all');

  const categories = ['Work', 'Personal', 'Errands', 'Health'];

  const addTask = (e) => {
    e.preventDefault();
    if (newTask.title.trim() === '') return;
    
    const task = {
      id: Date.now().toString(),
      title: newTask.title,
      category: newTask.category,
      priority: newTask.priority,
      completed: false,
      date: new Date().toISOString().split('T')[0],
    };
    
    const updatedTasks = [...tasks, task];
    setTasks(updatedTasks);
    setNewTask({ title: '', category: 'Work', priority: 'Medium' });
    updateProgress(updatedTasks);
  };

  const filterByPriority = (task) => {
    if (activePriority === 'all') return true;
    return task.priority === activePriority;
  };

  const filteredTasks = tasks
    .filter(task => activeCategory === 'all' || task.category === activeCategory)
    .filter(filterByPriority);

  return (
    <div>
      <form onSubmit={addTask} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-2 mb-2">
          <input
            type="text"
            placeholder="Add a new task..."
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            className="flex-grow p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
          <select
            value={newTask.category}
            onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
            className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm mr-2">Priority:</div>
          <div className="flex space-x-4">
            {['Low', 'Medium', 'High'].map((priority) => (
              <label key={priority} className="inline-flex items-center">
                <input
                  type="radio"
                  name="taskPriority"
                  value={priority}
                  checked={newTask.priority === priority}
                  onChange={() => setNewTask({ ...newTask, priority })}
                  className="form-radio h-4 w-4"
                />
                <span 
                  className={`ml-1 text-sm ${
                    priority === 'Low' ? 'text-green-600 dark:text-green-400' : 
                    priority === 'Medium' ? 'text-yellow-600 dark:text-yellow-400' : 
                    'text-red-600 dark:text-red-400'
                  }`}
                >
                  {priority}
                </span>
              </label>
            ))}
          </div>
          <button
            type="submit"
            className="px-4 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Add Task
          </button>
        </div>
      </form>

      <div className="flex flex-wrap mb-4 gap-2">
        <div className="w-full">
          <CategoryFilter
            categories={categories}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />
        </div>
        <div className="w-full mt-2">
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-3 py-1 text-xs rounded-full ${
                activePriority === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
              onClick={() => setActivePriority('all')}
            >
              All Priorities
            </button>
            {['High', 'Medium', 'Low'].map((priority) => (
              <button
                key={priority}
                className={`px-3 py-1 text-xs rounded-full ${
                  activePriority === priority
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
                onClick={() => setActivePriority(priority)}
              >
                {priority}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskList;