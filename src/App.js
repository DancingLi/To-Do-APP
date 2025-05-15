import React, { useEffect } from 'react';
import TaskList from './components/TaskList';
import ProgressChart from './components/ProgressChart';
import ThemeToggle from './components/ThemeToggle';
import useLocalStorage from './hooks/useLocalStorage';

function App() {
  const [tasks, setTasks] = useLocalStorage('tasks', []);
  const [progressData, setProgressData] = useLocalStorage('progressData', []);

  const updateProgress = (currentTasks) => {
    const today = new Date().toISOString().split('T')[0];
    
    if (currentTasks.length === 0) {
      // No tasks for today
      return;
    }
    
    const todaysTasks = currentTasks.filter(task => task.date === today);
    const completedTasks = todaysTasks.filter(task => task.completed);
    const completionRate = todaysTasks.length > 0 
      ? Math.round((completedTasks.length / todaysTasks.length) * 100)
      : 0;
    
    // Add or update today's entry
    const existingEntryIndex = progressData.findIndex(entry => entry.date === today);
    
    if (existingEntryIndex !== -1) {
      // Update existing entry
      const updatedProgressData = [...progressData];
      updatedProgressData[existingEntryIndex] = {
        date: today,
        completionRate,
      };
      setProgressData(updatedProgressData);
    } else {
      // Add new entry
      setProgressData([...progressData, { date: today, completionRate }]);
    }
  };

  // Initialize progress data on first load
  useEffect(() => {
    if (tasks.length > 0 && progressData.length === 0) {
      updateProgress(tasks);
    }
  }, [tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Daily To-Do Checklist</h1>
          <ThemeToggle />
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <TaskList 
            tasks={tasks} 
            setTasks={setTasks} 
            updateProgress={updateProgress} 
          />
        </div>
        
        {progressData.length > 0 && (
          <ProgressChart progressData={progressData} />
        )}
      </div>
    </div>
  );
}

export default App;
