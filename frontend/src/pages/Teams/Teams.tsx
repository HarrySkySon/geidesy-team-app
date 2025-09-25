import React, { useState } from 'react';
import { Box, Fab, Tooltip } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '@hooks/useAuth';
import { TeamList } from './TeamList';
import { TeamForm } from './TeamForm';

export const Teams: React.FC = () => {
  const { canManageTeams } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <Box>
      <TeamList
        showCreateDialog={createDialogOpen}
        onCreateDialogClose={() => setCreateDialogOpen(false)}
      />

      {/* Floating Action Button */}
      {canManageTeams() && (
        <Tooltip title="Create New Team">
          <Fab
            color="primary"
            aria-label="create team"
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

      {/* Create Team Dialog */}
      <TeamForm
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        isEdit={false}
      />
    </Box>
  );
};

export default Teams;