import React, { useState } from 'react';
import { Box, Fab, Tooltip } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '@hooks/useAuth';
import { TaskList } from './TaskList';
import { TaskForm } from './TaskForm';

export const Tasks: React.FC = () => {
  const { canCreateTasks } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <Box>
      <TaskList
        showCreateDialog={createDialogOpen}
        onCreateDialogClose={() => setCreateDialogOpen(false)}
      />

      {/* Floating Action Button */}
      {canCreateTasks() && (
        <Tooltip title="Create New Task">
          <Fab
            color="primary"
            aria-label="create task"
            onClick={() => setCreateDialogOpen(true)}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
            }}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      )}

      {/* Create Task Dialog */}
      <TaskForm
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        isEdit={false}
      />
    </Box>
  );
};

export default Tasks;