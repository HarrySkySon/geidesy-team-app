import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  useTheme,
  Card,
  Button,
  Chip,
  Searchbar,
  FAB,
  Menu,
  Badge,
  IconButton,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';

import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchTasks,
  setFilters,
  clearFilters,
  updateTaskStatus,
} from '../../store/taskSlice';
import { Task, TaskStatus, Priority } from '../../types';
import { COLORS, SIZES } from '../../constants';

interface TasksScreenProps {
  navigation: any;
}

const TasksScreen: React.FC<TasksScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  
  const { tasks, loading, error, filters, totalTasks } = useAppSelector(
    (state) => state.tasks
  );
  
  const [searchQuery, setSearchQuery] = useState(filters.searchQuery || '');
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [priorityMenuVisible, setPriorityMenuVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [filters])
  );

  const loadTasks = async () => {
    try {
      await dispatch(fetchTasks(filters)).unwrap();
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    dispatch(setFilters({ searchQuery: query, page: 1 }));
  };

  const handleFilterByStatus = (status: TaskStatus | undefined) => {
    dispatch(setFilters({ status, page: 1 }));
    setStatusMenuVisible(false);
  };

  const handleFilterByPriority = (priority: Priority | undefined) => {
    dispatch(setFilters({ priority, page: 1 }));
    setPriorityMenuVisible(false);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    dispatch(clearFilters());
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await dispatch(updateTaskStatus({ id: taskId, status: newStatus })).unwrap();
    } catch (error) {
      Alert.alert('Error', 'Failed to update task status');
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return COLORS.warning;
      case 'in_progress':
        return COLORS.info;
      case 'completed':
        return COLORS.success;
      case 'cancelled':
        return COLORS.error;
      default:
        return COLORS.secondary;
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'low':
        return COLORS.success;
      case 'medium':
        return COLORS.warning;
      case 'high':
        return COLORS.error;
      case 'urgent':
        return '#d32f2f';
      default:
        return COLORS.secondary;
    }
  };

  const renderTaskItem = ({ item }: { item: Task }) => (
    <Card
      style={[styles.taskCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => navigation.navigate('TaskDetails', { taskId: item.id })}
    >
      <Card.Content>
        <View style={styles.taskHeader}>
          <Text variant="titleMedium" style={styles.taskTitle}>
            {item.title}
          </Text>
          <View style={styles.badgeContainer}>
            <Badge
              style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}
              size={20}
            />
          </View>
        </View>
        
        <Text
          variant="bodyMedium"
          numberOfLines={2}
          style={[styles.taskDescription, { color: theme.colors.onSurfaceVariant }]}
        >
          {item.description}
        </Text>
        
        <View style={styles.taskMeta}>
          <Chip
            mode="outlined"
            style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
            textStyle={{ color: getStatusColor(item.status) }}
          >
            {item.status.replace('_', ' ').toUpperCase()}
          </Chip>
          
          {item.dueDate && (
            <Text
              variant="bodySmall"
              style={[styles.dueDate, { color: theme.colors.onSurfaceVariant }]}
            >
              Due: {format(new Date(item.dueDate), 'MMM dd, yyyy')}
            </Text>
          )}
        </View>
        
        <View style={styles.taskActions}>
          {item.assignedTo && (
            <Text
              variant="bodySmall"
              style={[styles.assignedTo, { color: theme.colors.primary }]}
            >
              Assigned to: {item.assignedTo.firstName} {item.assignedTo.lastName}
            </Text>
          )}
          
          <View style={styles.actionButtons}>
            {item.status === 'pending' && (
              <IconButton
                icon="play"
                size={20}
                iconColor={COLORS.info}
                onPress={() => handleStatusChange(item.id, 'in_progress')}
              />
            )}
            {item.status === 'in_progress' && (
              <IconButton
                icon="check"
                size={20}
                iconColor={COLORS.success}
                onPress={() => handleStatusChange(item.id, 'completed')}
              />
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        No Tasks Found
      </Text>
      <Text variant="bodyLarge" style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
        {filters.searchQuery || filters.status || filters.priority
          ? 'Try adjusting your filters'
          : 'Create your first task to get started'}
      </Text>
      <Button
        mode="outlined"
        onPress={() => navigation.navigate('TaskForm')}
        style={styles.createButton}
      >
        Create Task
      </Button>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search tasks..."
          value={searchQuery}
          onChangeText={handleSearch}
          style={styles.searchBar}
        />
        
        <View style={styles.filterRow}>
          <Menu
            visible={statusMenuVisible}
            onDismiss={() => setStatusMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setStatusMenuVisible(true)}
                style={styles.filterButton}
              >
                Status: {filters.status || 'All'}
              </Button>
            }
          >
            <Menu.Item title="All" onPress={() => handleFilterByStatus(undefined)} />
            <Menu.Item title="Pending" onPress={() => handleFilterByStatus('pending')} />
            <Menu.Item title="In Progress" onPress={() => handleFilterByStatus('in_progress')} />
            <Menu.Item title="Completed" onPress={() => handleFilterByStatus('completed')} />
            <Menu.Item title="Cancelled" onPress={() => handleFilterByStatus('cancelled')} />
          </Menu>

          <Menu
            visible={priorityMenuVisible}
            onDismiss={() => setPriorityMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setPriorityMenuVisible(true)}
                style={styles.filterButton}
              >
                Priority: {filters.priority || 'All'}
              </Button>
            }
          >
            <Menu.Item title="All" onPress={() => handleFilterByPriority(undefined)} />
            <Menu.Item title="Low" onPress={() => handleFilterByPriority('low')} />
            <Menu.Item title="Medium" onPress={() => handleFilterByPriority('medium')} />
            <Menu.Item title="High" onPress={() => handleFilterByPriority('high')} />
            <Menu.Item title="Urgent" onPress={() => handleFilterByPriority('urgent')} />
          </Menu>

          {(filters.status || filters.priority || filters.searchQuery) && (
            <IconButton
              icon="filter-remove"
              size={20}
              onPress={handleClearFilters}
            />
          )}
        </View>
      </View>

      <FlatList
        data={tasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={!loading ? renderEmptyState : null}
        showsVerticalScrollIndicator={false}
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('TaskForm')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: SIZES.padding,
    paddingBottom: SIZES.padding / 2,
  },
  searchBar: {
    marginBottom: SIZES.padding,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.padding / 2,
  },
  filterButton: {
    minWidth: 100,
  },
  listContainer: {
    flexGrow: 1,
    padding: SIZES.padding,
  },
  taskCard: {
    marginBottom: SIZES.padding,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.padding / 2,
  },
  taskTitle: {
    flex: 1,
    marginRight: SIZES.padding,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityBadge: {
    marginLeft: 4,
  },
  taskDescription: {
    marginBottom: SIZES.padding,
    lineHeight: 20,
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding / 2,
  },
  statusChip: {
    height: 32,
  },
  dueDate: {
    fontSize: 12,
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assignedTo: {
    flex: 1,
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding * 2,
  },
  emptyTitle: {
    marginBottom: SIZES.padding,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginBottom: SIZES.padding * 2,
    textAlign: 'center',
  },
  createButton: {
    marginTop: SIZES.padding,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default TasksScreen;