/**
 * Task Priority Implementation
 * 
 * This file demonstrates how to implement task priority in your To-Do Checklist app.
 * Your Task model already includes priority as 'Low', 'Medium', or 'High'.
 */

// 1. Update your Task controller to handle priority when creating/updating tasks
function createTask(req, res) {
  const { title, description, dueDate, priority = 'Medium' } = req.body;
  
  // Create new task with priority
  const newTask = new Task({
    title,
    description,
    dueDate,
    priority, // Can be 'Low', 'Medium', or 'High'
    userId: req.user.id,
    // other fields...
  });
  
  // Save and respond...
}

// 2. Frontend component for selecting task priority
function PrioritySelector({ value, onChange }) {
  return (
    <div className="priority-selector">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Priority
      </label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      >
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>
    </div>
  );
}

// 3. Example of implementing in TaskForm component
function TaskForm({ onSubmit, initialData = {} }) {
  const [title, setTitle] = useState(initialData.title || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [dueDate, setDueDate] = useState(initialData.dueDate || '');
  const [priority, setPriority] = useState(initialData.priority || 'Medium');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      dueDate,
      priority
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Title and other fields */}
      <PrioritySelector value={priority} onChange={setPriority} />
      <button type="submit">Save Task</button>
    </form>
  );
}

// 4. Visual indication of priority in TaskCard component
function TaskCard({ task }) {
  // Determine color based on priority
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'High': return 'bg-red-100 dark:bg-red-900';
      case 'Low': return 'bg-green-100 dark:bg-green-900';
      default: return 'bg-yellow-100 dark:bg-yellow-900';
    }
  };

  return (
    <div className={`task-card ${task.completed ? 'completed' : ''}`}>
      <div className="flex items-center">
        <span 
          className={`inline-block w-2 h-2 rounded-full mr-2 ${getPriorityColor(task.priority)}`}
          title={`Priority: ${task.priority}`}
        ></span>
        <h3>{task.title}</h3>
      </div>
      {/* Other task details */}
    </div>
  );
}

// 5. Add a priority filter to your task list
function PriorityFilter({ activePriority, onFilterChange }) {
  const priorities = ['All', 'High', 'Medium', 'Low'];
  
  return (
    <div className="priority-filter flex space-x-2 mb-4">
      {priorities.map(priority => (
        <button
          key={priority}
          className={`px-3 py-1 rounded-full ${
            activePriority === priority 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700'
          }`}
          onClick={() => onFilterChange(priority)}
        >
          {priority}
        </button>
      ))}
    </div>
  );
}
