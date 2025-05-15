import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import TaskCard from './TaskCard';
import CategoryFilter from './CategoryFilter';

const TaskList = ({ tasks, setTasks, updateProgress }) => {
  const [newTask, setNewTask] = useState({ 
    title: '', 
    category: 'Work', 
    priority: 'Medium' // Add default priority
  });
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = ['Work', 'Personal', 'Errands', 'Health'];

  const addTask = (e) => {
    e.preventDefault();
    if (newTask.title.trim() === '') return;
    
    const task = {
      id: Date.now().toString(),
      title: newTask.title,
      category: newTask.category,
      priority: newTask.priority, // Include priority in the new task
      completed: false,
      date: new Date().toISOString().split('T')[0],
    };
    
    const updatedTasks = [...tasks, task];
    setTasks(updatedTasks);
    setNewTask({ title: '', category: 'Work', priority: 'Medium' });
    updateProgress(updatedTasks);
  };

  const toggleComplete = (id) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    updateProgress(updatedTasks);
  };

  const removeTask = (id) => {
    const updatedTasks = tasks.filter((task) => task.id !== id);
    setTasks(updatedTasks);
    updateProgress(updatedTasks);
  };

  const moveTask = (dragIndex, hoverIndex) => {
    const draggedTask = tasks[dragIndex];
    const updatedTasks = [...tasks];
    updatedTasks.splice(dragIndex, 1);
    updatedTasks.splice(hoverIndex, 0, draggedTask);
    setTasks(updatedTasks);
  };

  const filteredTasks = activeCategory === 'all'
    ? tasks
    : tasks.filter((task) => task.category === activeCategory);

  return (
    <div>
      <form onSubmit={addTask} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-2">
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
          <select
            value={newTask.priority}
            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
            className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            aria-label="Task priority"
          >
            <option value="Low">Low Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="High">High Priority</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Add Task
          </button>
        </div>
      </form>

      <CategoryFilter
        categories={categories}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />

      <DndProvider backend={HTML5Backend}>
        <div>
          {filteredTasks.length === 0 ? (
            <p className="text-center p-4 text-gray-500 dark:text-gray-400">
              No tasks found. Add a new task to get started!
            </p>
          ) : (
            filteredTasks.map((task, index) => (
              <TaskCard
                key={task.id}
                id={task.id}
                index={index}
                task={task}
                moveTask={moveTask}
                toggleComplete={toggleComplete}
                removeTask={removeTask}
              />
            ))
          )}
        </div>
      </DndProvider>
    </div>
  );
};

export default TaskList;
