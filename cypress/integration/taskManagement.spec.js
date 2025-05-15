/// <reference types="cypress" />

// Test constants
const TEST_USER_ID = 'test-user-id';
const API_URL = 'http://localhost:5000/api';

describe('Task Management Tests', () => {
  beforeEach(() => {
    // Visit the app and set test user ID in local storage
    cy.visit('/');
    cy.window().then((win) => {
      win.localStorage.setItem('userId', TEST_USER_ID);
    });
    
    // Mock API responses for categories
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

  it('should create a new task', () => {
    // Mock task creation API request
    cy.intercept('POST', `${API_URL}/tasks`, {
      statusCode: 201,
      body: {
        success: true,
        data: {
          _id: 'new-task-id',
          title: 'Test New Task',
          description: 'This is a test task',
          priority: 'Medium',
          status: 'Todo',
          categoryId: 'cat1',
          createdAt: new Date().toISOString()
        }
      }
    }).as('createTask');

    // Mock tasks list request
    cy.intercept('GET', `${API_URL}/tasks*`, {
      statusCode: 200,
      body: {
        success: true,
        data: []
      }
    }).as('getTasks');

    // Wait for the app to load categories
    cy.wait('@getCategories');
    cy.wait('@getTasks');

    // Fill out the task creation form
    cy.get('[data-testid="task-title-input"]').type('Test New Task');
    cy.get('[data-testid="task-description-input"]').type('This is a test task');
    cy.get('[data-testid="task-priority-select"]').select('Medium');
    cy.get('[data-testid="task-category-select"]').select('Work');
    
    // Submit the form
    cy.get('[data-testid="task-submit-button"]').click();
    
    // Wait for API call to complete
    cy.wait('@createTask');
    
    // Verify the task appears in the UI
    cy.get('[data-testid="task-item"]').should('have.length', 1);
    cy.get('[data-testid="task-item"]').should('contain', 'Test New Task');
  });

  it('should complete a task', () => {
    // Mock initial tasks list with one task
    cy.intercept('GET', `${API_URL}/tasks*`, {
      statusCode: 200,
      body: {
        success: true,
        data: [{
          _id: 'task1',
          title: 'Task to Complete',
          description: 'This task will be completed',
          priority: 'Medium',
          status: 'Todo',
          categoryId: 'cat1'
        }]
      }
    }).as('getTasks');

    // Mock task update API request
    cy.intercept('PUT', `${API_URL}/tasks/task1`, {
      statusCode: 200,
      body: {
        success: true,
        data: {
          _id: 'task1',
          title: 'Task to Complete',
          description: 'This task will be completed',
          priority: 'Medium',
          status: 'Completed',
          categoryId: 'cat1',
          completedAt: new Date().toISOString()
        }
      }
    }).as('updateTask');

    // Wait for the app to load data
    cy.wait('@getCategories');
    cy.wait('@getTasks');

    // Click on the task's checkbox to mark it as completed
    cy.get('[data-testid="task-checkbox-task1"]').click();
    
    // Wait for API call to complete
    cy.wait('@updateTask');
    
    // Verify the task shows as completed in the UI
    cy.get('[data-testid="task-item-task1"]').should('have.class', 'completed');
  });

  it('should delete a task', () => {
    // Mock initial tasks list with one task
    cy.intercept('GET', `${API_URL}/tasks*`, {
      statusCode: 200,
      body: {
        success: true,
        data: [{
          _id: 'task-to-delete',
          title: 'Task to Delete',
          description: 'This task will be deleted',
          priority: 'Low',
          status: 'Todo'
        }]
      }
    }).as('getTasks');

    // Mock task delete API request
    cy.intercept('DELETE', `${API_URL}/tasks/task-to-delete`, {
      statusCode: 200,
      body: {
        success: true,
        message: 'Task deleted successfully'
      }
    }).as('deleteTask');

    // Wait for the app to load data
    cy.wait('@getCategories');
    cy.wait('@getTasks');

    // Click on the task's delete button
    cy.get('[data-testid="delete-task-button-task-to-delete"]').click();
    
    // Confirm deletion in the modal
    cy.get('[data-testid="confirm-delete-button"]').click();
    
    // Wait for API call to complete
    cy.wait('@deleteTask');
    
    // Verify the task is removed from the UI
    cy.get('[data-testid="task-list"]').should('not.contain', 'Task to Delete');
  });
});
