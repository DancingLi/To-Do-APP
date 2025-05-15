const mongoose = require('mongoose');
const Task = require('../../models/Task');
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

describe('Task Model Tests', () => {
  const userId = new mongoose.Types.ObjectId();
  
  beforeEach(async () => {
    await Task.deleteMany({});
  });

  describe('Task Creation Tests', () => {
    test('should create a task successfully', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        priority: 'Medium',
        status: 'Todo',
        userId
      };

      const task = new Task(taskData);
      const savedTask = await task.save();

      expect(savedTask._id).toBeDefined();
      expect(savedTask.title).toBe(taskData.title);
      expect(savedTask.description).toBe(taskData.description);
      expect(savedTask.priority).toBe(taskData.priority);
      expect(savedTask.status).toBe(taskData.status);
    });

    test('should fail validation when required fields are missing', async () => {
      const taskData = {
        description: 'Test Description',
        priority: 'Medium',
      };

      try {
        const task = new Task(taskData);
        await task.save();
        fail('Should have thrown a validation error');
      } catch (error) {
        expect(error.errors.title).toBeDefined();
        expect(error.errors.userId).toBeDefined();
      }
    });

    test('should set default values correctly', async () => {
      const taskData = {
        title: 'Test Task',
        userId
      };

      const task = new Task(taskData);
      const savedTask = await task.save();

      expect(savedTask.priority).toBe('Medium');
      expect(savedTask.status).toBe('Todo');
      expect(savedTask.recurrence.type).toBe('None');
      expect(savedTask.isDeleted).toBe(false);
    });
  });

  describe('Task Dependencies Tests', () => {
    test('should detect self-dependency', async () => {
      const task = await new Task({
        title: 'Task with self dependency',
        userId
      }).save();

      const result = await task.checkCircularDependencies([task._id.toString()]);
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('self_dependency');
    });

    test('should detect circular dependencies', async () => {
      // Create task A
      const taskA = await new Task({
        title: 'Task A',
        userId
      }).save();

      // Create task B that depends on A
      const taskB = await new Task({
        title: 'Task B',
        userId,
        dependencies: [taskA._id]
      }).save();

      // Now check if A can depend on B (would create a cycle)
      const result = await taskA.checkCircularDependencies([taskB._id.toString()]);
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('circular_dependency');
      expect(result.cycle).toBeDefined();
    });

    test('should allow valid dependencies', async () => {
      // Create task A and task B
      const taskA = await new Task({
        title: 'Task A',
        userId
      }).save();

      const taskB = await new Task({
        title: 'Task B',
        userId
      }).save();

      // Check if B can depend on A (should be valid)
      const result = await taskB.checkCircularDependencies([taskA._id.toString()]);
      
      expect(result.valid).toBe(true);
    });

    test('should prevent task completion when dependencies are not completed', async () => {
      // Create an incomplete dependency
      const dependency = await new Task({
        title: 'Dependency Task',
        status: 'In Progress',
        userId
      }).save();

      // Create task that depends on the above
      const task = await new Task({
        title: 'Main Task',
        userId,
        dependencies: [dependency._id]
      }).save();

      // Check if task can be completed
      const result = await task.canComplete();
      
      expect(result.valid).toBe(false);
      expect(result.dependencies).toHaveLength(1);
      expect(result.dependencies[0].title).toBe('Dependency Task');
    });

    test('should allow task completion when all dependencies are completed', async () => {
      // Create a completed dependency
      const dependency = await new Task({
        title: 'Dependency Task',
        status: 'Completed',
        userId
      }).save();

      // Create task that depends on the above
      const task = await new Task({
        title: 'Main Task',
        userId,
        dependencies: [dependency._id]
      }).save();

      // Check if task can be completed
      const result = await task.canComplete();
      
      expect(result.valid).toBe(true);
    });
  });
});
