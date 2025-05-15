/// <reference types="cypress" />

const API_URL = 'http://localhost:5000/api';
const TEST_USER_ID = 'test-user-id';

describe('Task Filtering and Sorting Tests', () => {
  beforeEach(() => {
    // Visit the app and set test user ID in local storage
    cy.visit('/');
    cy.window().then((win) => {
      win.localStorage.setItem('userId', TEST_USER_ID);
    });
    
    // Mock sample tasks
    const sampleTasks = [
      {
        _id: 'task1',
        title: 'High priority task',
        priority: 'High',
        status: 'Todo',
        categoryId: 'cat1',
        dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        tags: ['important', 'work']
      },
      {
        _id: 'task2',
        title: 'Completed task',
        priority: 'Medium',
        status: 'Completed',
        categoryId: 'cat2',
        tags: ['personal']
      },
      {
        _id: 'task3',
        title: 'Overdue task',
        priority: 'Low',
        status: 'Todo',
        categoryId: 'cat1',
        dueDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        tags: ['work']
      }
    ];

    // Intercept tasks API with our sample data
    cy.intercept('GET', `${API_URL}/tasks*`, (req) => {
      // Handle filtering based on query parameters
      const { priority, status, categoryId, tags } = req.query;
      
      let filteredTasks = [...sampleTasks];
      
      if (priority) {
        filteredTasks = filteredTasks.filter(task => task.priority === priority);
      }
      
      if (status) {
        filteredTasks = filteredTasks.filter(task => task.status === status);
      }
      
      if (categoryId) {
        filteredTasks = filteredTasks.filter(task => task.categoryId === categoryId);
      }
      
      if (tags) {
        const tagArray = tags.split(',');
        filteredTasks = filteredTasks.filter(task => 
          task.tags && task.tags.some(tag => tagArray.includes(tag))
        );
      }
      
      req.reply({
        statusCode: 200,
        body: {
          success: true,
          count: filteredTasks.length,
          data: filteredTasks
        }
      });
    }).as('getTasks');
    
    // Mock categories
    cy.intercept('GET', `${API_URL}/categories`, {
      statusCode: 200,
      body: {
        success: true,
        data: [
          { _id: 'cat1', name: 'Work', color: '#ff0000' },
          { _id: 'cat2', name: 'Personal', color: '#00ff00' }
        ]
      }
    }).as('getCategories');
  });

  it('should filter tasks by priority', () => {
    // Wait for initial data to load
    cy.wait('@getCategories');
    cy.wait('@getTasks');
    
    // Initially should show all 3 tasks
    cy.get('[data-testid="task-item"]').should('have.length', 3);
    
    // Filter by High priority
    cy.get('[data-testid="priority-filter"]').select('High');
    
    // Should show only high priority task
    cy.wait('@getTasks');
    cy.get('[data-testid="task-item"]').should('have.length', 1);
    cy.get('[data-testid="task-item"]').should('contain', 'High priority task');
  });

  it('should filter tasks by status', () => {
    // Wait for initial data to load
    cy.wait('@getCategories');
    cy.wait('@getTasks');
    
    // Filter by Completed status
    cy.get('[data-testid="status-filter"]').select('Completed');
    
    // Should show only completed tasks
    cy.wait('@getTasks');
    cy.get('[data-testid="task-item"]').should('have.length', 1);
    cy.get('[data-testid="task-item"]').should('contain', 'Completed task');
  });

  it('should filter tasks by category', () => {
    // Wait for initial data to load
    cy.wait('@getCategories');
    cy.wait('@getTasks');
    
    // Filter by Personal category
    cy.get('[data-testid="category-filter"]').select('Personal');
    
    // Should show only personal category tasks
    cy.wait('@getTasks');
    cy.get('[data-testid="task-item"]').should('have.length', 1);
    cy.get('[data-testid="task-item"]').should('contain', 'Completed task');
  });

  it('should filter tasks by tag', () => {
    // Wait for initial data to load
    cy.wait('@getCategories');
    cy.wait('@getTasks');
    
    // Filter by 'important' tag
    cy.get('[data-testid="tag-input"]').type('important{enter}');
    
    // Should show only tasks with 'important' tag
    cy.wait('@getTasks');
    cy.get('[data-testid="task-item"]').should('have.length', 1);
    cy.get('[data-testid="task-item"]').should('contain', 'High priority task');
  });

  it('should allow clearing all filters', () => {
    // Wait for initial data to load
    cy.wait('@getCategories');
    cy.wait('@getTasks');
    
    // Apply several filters
    cy.get('[data-testid="priority-filter"]').select('High');
    cy.wait('@getTasks');
    
    // Should show filtered results
    cy.get('[data-testid="task-item"]').should('have.length', 1);
    
    // Clear filters
    cy.get('[data-testid="clear-filters-button"]').click();
    
    // Should show all tasks again
    cy.wait('@getTasks');
    cy.get('[data-testid="task-item"]').should('have.length', 3);
  });
});
