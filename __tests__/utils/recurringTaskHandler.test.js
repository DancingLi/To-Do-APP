const mongoose = require('mongoose');
const moment = require('moment');
const Task = require('../../models/Task');
const { 
  handleRecurringTask,
  calculateNextDueDate,
  generateISOIntervalString,
  parseISOIntervalString
} = require('../../utils/recurringTaskHandler');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Recurring Task Handler Tests', () => {
  const userId = new mongoose.Types.ObjectId();
  
  beforeEach(async () => {
    await Task.deleteMany({});
    jest.clearAllMocks();
  });

  describe('calculateNextDueDate function', () => {
    test('should calculate next date for daily tasks', () => {
      const task = {
        dueDate: new Date('2023-05-10'),
        recurrence: { 
          type: 'Daily',
          interval: 1
        }
      };
      
      const nextDate = calculateNextDueDate(task);
      
      expect(nextDate).toBeInstanceOf(Date);
      expect(moment(nextDate).format('YYYY-MM-DD')).toBe('2023-05-11');
    });
    
    test('should calculate next date for weekly tasks', () => {
      const task = {
        dueDate: new Date('2023-05-10'), // Wednesday
        recurrence: { 
          type: 'Weekly',
          interval: 1
        }
      };
      
      const nextDate = calculateNextDueDate(task);
      
      expect(nextDate).toBeInstanceOf(Date);
      expect(moment(nextDate).format('YYYY-MM-DD')).toBe('2023-05-17'); // Next Wednesday
    });
    
    test('should calculate next date for monthly tasks', () => {
      const task = {
        dueDate: new Date('2023-05-10'),
        recurrence: { 
          type: 'Monthly',
          interval: 1
        }
      };
      
      const nextDate = calculateNextDueDate(task);
      
      expect(nextDate).toBeInstanceOf(Date);
      expect(moment(nextDate).format('YYYY-MM-DD')).toBe('2023-06-10');
    });

    test('should respect intervals for recurring tasks', () => {
      const task = {
        dueDate: new Date('2023-05-10'),
        recurrence: { 
          type: 'Daily',
          interval: 3
        }
      };
      
      const nextDate = calculateNextDueDate(task);
      
      expect(moment(nextDate).format('YYYY-MM-DD')).toBe('2023-05-13');
    });

    test('should return null if recurrence type is None', () => {
      const task = {
        dueDate: new Date('2023-05-10'),
        recurrence: { 
          type: 'None'
        }
      };
      
      const nextDate = calculateNextDueDate(task);
      
      expect(nextDate).toBeNull();
    });
  });

  describe('ISO Interval String Functions', () => {
    test('should generate ISO interval string for daily recurrence', () => {
      const recurrence = { type: 'Daily', interval: 2 };
      const isoString = generateISOIntervalString(recurrence);
      expect(isoString).toBe('R/P2D');
    });
    
    test('should parse ISO interval string correctly', () => {
      const isoString = 'R/P3W';
      const recurrence = parseISOIntervalString(isoString);
      
      expect(recurrence.type).toBe('Weekly');
      expect(recurrence.interval).toBe(3);
    });
  });

  describe('handleRecurringTask function', () => {
    test('should generate new task instance for completed recurring task', async () => {
      // Create mock completed task
      const completedTask = await new Task({
        title: 'Recurring Task',
        status: 'Completed',
        userId,
        dueDate: new Date('2023-05-10'),
        recurrence: {
          type: 'Daily',
          interval: 1
        }
      }).save();
      
      // Process the completed task
      const newTask = await handleRecurringTask(completedTask);
      
      // Verify new task was created
      expect(newTask).toBeDefined();
      expect(newTask.title).toBe('Recurring Task');
      expect(newTask.status).toBe('Todo');
      expect(moment(newTask.dueDate).format('YYYY-MM-DD')).toBe('2023-05-11');
      expect(newTask.parentTaskId.toString()).toBe(completedTask._id.toString());
    });
    
    test('should not generate new task for non-recurring tasks', async () => {
      // Create mock completed non-recurring task
      const completedTask = await new Task({
        title: 'Regular Task',
        status: 'Completed',
        userId,
        dueDate: new Date('2023-05-10')
      }).save();
      
      // Process the completed task
      const newTask = await handleRecurringTask(completedTask);
      
      // Verify no task was created
      expect(newTask).toBeNull();
    });

    test('should not create duplicate recurring tasks', async () => {
      // Create original completed task
      const originalTask = await new Task({
        title: 'Recurring Task',
        status: 'Completed',
        userId,
        dueDate: new Date('2023-05-10'),
        recurrence: {
          type: 'Daily',
          interval: 1
        }
      }).save();

      // Create a task with the same title for the next day (potential duplicate)
      await new Task({
        title: 'Recurring Task',
        status: 'Todo',
        userId,
        dueDate: new Date('2023-05-11')
      }).save();
      
      // Process the completed task - should not create another task
      const newTask = await handleRecurringTask(originalTask);
      
      // Verify no new task was created
      expect(newTask).toBeNull();
    });
  });
});
