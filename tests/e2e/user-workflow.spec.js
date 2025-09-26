// End-to-End Test: Complete User Workflow
// Tests the entire user journey from login to task completion

const { test, expect } = require('@playwright/test');

test.describe('Complete User Workflow', () => {
  let page;
  
  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/');
  });

  test('should complete full user workflow successfully', async () => {
    // Step 1: User Login
    await test.step('User Authentication', async () => {
      await page.click('[data-testid=login-button]');
      await page.fill('[data-testid=email-input]', 'testuser@example.com');
      await page.fill('[data-testid=password-input]', 'testpassword123');
      await page.click('[data-testid=submit-login]');
      
      // Verify successful login
      await expect(page.locator('[data-testid=user-avatar]')).toBeVisible();
      await expect(page.locator('[data-testid=dashboard]')).toBeVisible();
    });

    // Step 2: Navigate to Tasks
    await test.step('Navigate to Task Management', async () => {
      await page.click('[data-testid=nav-tasks]');
      await expect(page.locator('[data-testid=tasks-page]')).toBeVisible();
      await expect(page.locator('[data-testid=task-list]')).toBeVisible();
    });

    // Step 3: Create New Task
    await test.step('Create New Task', async () => {
      await page.click('[data-testid=create-task-button]');
      
      // Fill task details
      await page.fill('[data-testid=task-title]', 'Test Survey Task');
      await page.fill('[data-testid=task-description]', 'End-to-end test task for surveying');
      await page.selectOption('[data-testid=task-priority]', 'high');
      await page.selectOption('[data-testid=task-team]', 'team-1');
      
      // Set location
      await page.click('[data-testid=location-picker]');
      await page.fill('[data-testid=latitude-input]', '50.4501');
      await page.fill('[data-testid=longitude-input]', '30.5234');
      await page.click('[data-testid=confirm-location]');
      
      // Submit task
      await page.click('[data-testid=submit-task]');
      
      // Verify task creation
      await expect(page.locator('[data-testid=success-message]')).toContainText('Task created successfully');
    });

    // Step 4: View Task Details
    await test.step('View Task Details', async () => {
      // Find and click on the created task
      await page.click('[data-testid=task-item]:has-text("Test Survey Task")');
      
      // Verify task details page
      await expect(page.locator('[data-testid=task-title]')).toContainText('Test Survey Task');
      await expect(page.locator('[data-testid=task-status]')).toContainText('Pending');
      await expect(page.locator('[data-testid=task-priority]')).toContainText('High');
    });

    // Step 5: Update Task Status
    await test.step('Update Task Status', async () => {
      await page.click('[data-testid=status-dropdown]');
      await page.selectOption('[data-testid=status-select]', 'in_progress');
      await page.click('[data-testid=update-status]');
      
      // Verify status update
      await expect(page.locator('[data-testid=task-status]')).toContainText('In Progress');
      await expect(page.locator('[data-testid=success-message]')).toContainText('Status updated');
    });

    // Step 6: Add Comment
    await test.step('Add Task Comment', async () => {
      await page.fill('[data-testid=comment-input]', 'Task started, heading to location');
      await page.click('[data-testid=add-comment]');
      
      // Verify comment added
      await expect(page.locator('[data-testid=comments-list]')).toContainText('Task started, heading to location');
    });

    // Step 7: Upload File
    await test.step('Upload Task File', async () => {
      // Create a test file
      const fileInput = await page.locator('[data-testid=file-upload]');
      await fileInput.setInputFiles({
        name: 'test-document.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Test PDF content')
      });
      
      await page.click('[data-testid=upload-file]');
      
      // Verify file upload
      await expect(page.locator('[data-testid=uploaded-files]')).toContainText('test-document.pdf');
    });

    // Step 8: Test Real-time Updates
    await test.step('Verify Real-time Updates', async () => {
      // Open another tab to simulate another user
      const page2 = await page.context().newPage();
      await page2.goto('/');
      
      // Login as different user
      await page2.click('[data-testid=login-button]');
      await page2.fill('[data-testid=email-input]', 'teamleader@example.com');
      await page2.fill('[data-testid=password-input]', 'password123');
      await page2.click('[data-testid=submit-login]');
      
      // Navigate to same task
      await page2.click('[data-testid=nav-tasks]');
      await page2.click('[data-testid=task-item]:has-text("Test Survey Task")');
      
      // Update status from first page
      await page.click('[data-testid=status-dropdown]');
      await page.selectOption('[data-testid=status-select]', 'completed');
      await page.click('[data-testid=update-status]');
      
      // Verify real-time update on second page
      await expect(page2.locator('[data-testid=task-status]')).toContainText('Completed', { timeout: 5000 });
      
      await page2.close();
    });

    // Step 9: Generate Report
    await test.step('Generate Task Report', async () => {
      await page.click('[data-testid=generate-report]');
      
      // Wait for report generation
      await expect(page.locator('[data-testid=report-modal]')).toBeVisible();
      
      // Download report
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid=download-report]');
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toContain('task-report');
    });

    // Step 10: Logout
    await test.step('User Logout', async () => {
      await page.click('[data-testid=user-menu]');
      await page.click('[data-testid=logout-button]');
      
      // Verify logout
      await expect(page.locator('[data-testid=login-button]')).toBeVisible();
      await expect(page.url()).toContain('/login');
    });
  });

  test('should handle offline scenarios', async () => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid=email-input]', 'testuser@example.com');
    await page.fill('[data-testid=password-input]', 'testpassword123');
    await page.click('[data-testid=submit-login]');
    
    // Go to tasks page
    await page.click('[data-testid=nav-tasks]');
    
    // Simulate offline condition
    await page.context().setOffline(true);
    
    // Try to create task offline
    await page.click('[data-testid=create-task-button]');
    await page.fill('[data-testid=task-title]', 'Offline Task');
    await page.fill('[data-testid=task-description]', 'Task created while offline');
    await page.click('[data-testid=submit-task]');
    
    // Verify offline handling
    await expect(page.locator('[data-testid=offline-indicator]')).toBeVisible();
    await expect(page.locator('[data-testid=sync-pending]')).toContainText('1 pending');
    
    // Go back online
    await page.context().setOffline(false);
    
    // Wait for sync
    await expect(page.locator('[data-testid=sync-complete]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid=sync-pending]')).toContainText('0 pending');
  });

  test('should handle error scenarios gracefully', async () => {
    // Test network errors
    await test.step('Network Error Handling', async () => {
      // Intercept API calls to simulate server errors
      await page.route('/api/tasks', route => {
        route.fulfill({ status: 500, body: 'Server Error' });
      });
      
      await page.goto('/tasks');
      
      // Verify error handling
      await expect(page.locator('[data-testid=error-message]')).toContainText('Unable to load tasks');
      await expect(page.locator('[data-testid=retry-button]')).toBeVisible();
    });

    // Test validation errors
    await test.step('Form Validation Errors', async () => {
      await page.goto('/tasks/create');
      
      // Submit empty form
      await page.click('[data-testid=submit-task]');
      
      // Verify validation errors
      await expect(page.locator('[data-testid=title-error]')).toContainText('Title is required');
      await expect(page.locator('[data-testid=description-error]')).toContainText('Description is required');
    });
  });

  test('should work correctly on mobile devices', async ({ browserName }) => {
    // Skip on desktop browsers
    test.skip(browserName === 'chromium' || browserName === 'firefox', 'Mobile-only test');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Test mobile-specific interactions
    await test.step('Mobile Navigation', async () => {
      await page.goto('/');
      
      // Test hamburger menu
      await page.click('[data-testid=mobile-menu-button]');
      await expect(page.locator('[data-testid=mobile-nav]')).toBeVisible();
      
      // Test swipe gestures (if supported)
      await page.locator('[data-testid=task-list]').swipe({ direction: 'left' });
    });
    
    // Test GPS functionality
    await test.step('Mobile GPS Features', async () => {
      // Mock geolocation
      await page.context().grantPermissions(['geolocation']);
      await page.context().setGeolocation({ latitude: 50.4501, longitude: 30.5234 });
      
      await page.click('[data-testid=get-current-location]');
      
      // Verify GPS coordinates are captured
      await expect(page.locator('[data-testid=latitude-display]')).toContainText('50.4501');
      await expect(page.locator('[data-testid=longitude-display]')).toContainText('30.5234');
    });
  });
});