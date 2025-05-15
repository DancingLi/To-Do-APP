/// <reference types="cypress" />

const API_URL = 'http://localhost:5000/api';
const TEST_USER_ID = 'test-user-id';

describe('Drag and Drop Task Reordering', () => {
  beforeEach(() => {
    // Visit the app and set test user ID in local storage
    cy.visit('/');
    cy.window().then((win) => {
      win.localStorage.setItem('userId', TEST_USER_ID);
    });
    
    // Mock sample tasks with order property
    const sampleTasks = [
      {
        _id: 'task1',
        title: 'First Task',
        status: 'Todo',
        order: 1
      },
      {
        _id: 'task2',
        title: 'Second Task',
        status: 'Todo',
        order: 2
      },
      {
        _id: 'task3',
        title: 'Third Task',
        status: 'Todo',
        order: 3
      }
    ];

    // Mock tasks endpoint
    cy.intercept('GET', `${API_URL}/tasks*`, {
      statusCode: 200,
      body: {
        success: true,
        data: sampleTasks
      }
    }).as('getTasks');
    
    // Mock task reordering endpoint
    cy.intercept('PATCH', `${API_URL}/tasks/reorder`, {
      statusCode: 200,
      body: {
        success: true,
        message: 'Tasks reordered successfully'
      }
    }).as('reorderTasks');
    
    // Mock categories
    cy.intercept('GET', `${API_URL}/categories`, {
      statusCode: 200,
      body: {
        success: true,
        data: []
      }
    }).as('getCategories');
  });

  it('should reorder tasks using drag and drop', () => {
    // Wait for initial data to load
    cy.wait('@getCategories');
    cy.wait('@getTasks');
    
    // Verify initial task order
    cy.get('[data-testid="task-item"]').eq(0).should('contain', 'First Task');
    cy.get('[data-testid="task-item"]').eq(1).should('contain', 'Second Task');
    cy.get('[data-testid="task-item"]').eq(2).should('contain', 'Third Task');
    
    // Perform drag and drop (move First Task to be after Second Task)
    const dataTransfer = new DataTransfer();
    
    cy.get('[data-testid="task-item"]').eq(0)
      .trigger('dragstart', { dataTransfer })
      .trigger('drag', { dataTransfer });
      
    cy.get('[data-testid="task-item"]').eq(1)
      .trigger('dragover', { dataTransfer })
      .trigger('drop', { dataTransfer });
    
    cy.get('[data-testid="task-item"]').eq(0)
      .trigger('dragend', { dataTransfer });
    
    // Wait for reorder API call
    cy.wait('@reorderTasks');
    
    // Mock updated tasks response
    cy.intercept('GET', `${API_URL}/tasks*`, {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            _id: 'task2',
            title: 'Second Task',
            status: 'Todo',
            order: 1
          },
          {
            _id: 'task1',
            title: 'First Task',
            status: 'Todo',
            order: 2
          },
          {
            _id: 'task3',
            title: 'Third Task',
            status: 'Todo',
            order: 3
          }
        ]
      }
    }).as('getUpdatedTasks');
    
    // Force a refresh to get the updated order
    cy.get('[data-testid="refresh-button"]').click();
    cy.wait('@getUpdatedTasks');
    
    // Verify the new task order
    cy.get('[data-testid="task-item"]').eq(0).should('contain', 'Second Task');
    cy.get('[data-testid="task-item"]').eq(1).should('contain', 'First Task');
    cy.get('[data-testid="task-item"]').eq(2).should('contain', 'Third Task');
  });
});
