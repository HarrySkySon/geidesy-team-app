import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Text,
  useTheme,
  Card,
  Button,
  Chip,
  IconButton,
  Divider,
  Avatar,
  List,
  TextInput,
  Menu,
  FAB,
} from 'react-native-paper';
import { format } from 'date-fns';

import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchTaskById,
  updateTaskStatus,
  setCurrentTask,
} from '../../store/taskSlice';
import { Task, TaskStatus, Priority } from '../../types';
import { COLORS, SIZES } from '../../constants';

interface TaskDetailsScreenProps {
  route: {
    params: {
      taskId: string;
    };
  };
  navigation: any;
}

const TaskDetailsScreen: React.FC<TaskDetailsScreenProps> = ({
  route,
  navigation,
}) => {
  const { taskId } = route.params;
  const theme = useTheme();
  const dispatch = useAppDispatch();

  const { currentTask: task, loading } = useAppSelector((state) => state.tasks);

  const [refreshing, setRefreshing] = useState(false);
  const [comment, setComment] = useState('');
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);

  useEffect(() => {
    loadTask();
    return () => {
      dispatch(setCurrentTask(null));
    };
  }, [taskId]);

  const loadTask = async () => {
    try {
      await dispatch(fetchTaskById(taskId)).unwrap();
    } catch (error) {
      Alert.alert('Error', 'Failed to load task details');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTask();
    setRefreshing(false);
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    try {
      await dispatch(updateTaskStatus({ id: taskId, status: newStatus })).unwrap();
      setStatusMenuVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update task status');
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    
    try {
      // TODO: Implement add comment API call
      setComment('');
      Alert.alert('Success', 'Comment added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add comment');
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

  if (!task) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text>Loading task details...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Task Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.taskHeader}>
              <View style={styles.titleSection}>
                <Text variant="headlineSmall" style={styles.taskTitle}>
                  {task.title}
                </Text>
                <View style={styles.statusRow}>
                  <Chip
                    mode="flat"
                    style={[
                      styles.statusChip,
                      { backgroundColor: getStatusColor(task.status) + '20' },
                    ]}
                    textStyle={{ color: getStatusColor(task.status) }}
                  >
                    {task.status.replace('_', ' ').toUpperCase()}
                  </Chip>
                  <Chip
                    mode="flat"
                    style={[
                      styles.priorityChip,
                      { backgroundColor: getPriorityColor(task.priority) + '20' },
                    ]}
                    textStyle={{ color: getPriorityColor(task.priority) }}
                  >
                    {task.priority.toUpperCase()}
                  </Chip>
                </View>
              </View>
              <Menu
                visible={statusMenuVisible}
                onDismiss={() => setStatusMenuVisible(false)}
                anchor={
                  <IconButton
                    icon="dots-vertical"
                    size={24}
                    onPress={() => setStatusMenuVisible(true)}
                  />
                }
              >
                <Menu.Item
                  title="Edit Task"
                  onPress={() => {
                    setStatusMenuVisible(false);
                    navigation.navigate('TaskForm', { task });
                  }}
                />
                <Menu.Item
                  title="Mark as Pending"
                  onPress={() => handleStatusChange('pending')}
                />
                <Menu.Item
                  title="Mark as In Progress"
                  onPress={() => handleStatusChange('in_progress')}
                />
                <Menu.Item
                  title="Mark as Completed"
                  onPress={() => handleStatusChange('completed')}
                />
                <Menu.Item
                  title="Cancel Task"
                  onPress={() => handleStatusChange('cancelled')}
                />
              </Menu>
            </View>

            <Text
              variant="bodyLarge"
              style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
            >
              {task.description}
            </Text>
          </Card.Content>
        </Card>

        {/* Task Info */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Task Information
            </Text>
            <List.Item
              title="Assigned To"
              description={
                task.assignedTo
                  ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                  : 'Unassigned'
              }
              left={(props) => <List.Icon {...props} icon="account" />}
            />
            <List.Item
              title="Site"
              description={task.site?.name || 'No site assigned'}
              left={(props) => <List.Icon {...props} icon="map-marker" />}
            />
            <List.Item
              title="Created"
              description={format(new Date(task.createdAt), 'MMM dd, yyyy HH:mm')}
              left={(props) => <List.Icon {...props} icon="calendar-plus" />}
            />
            {task.dueDate && (
              <List.Item
                title="Due Date"
                description={format(new Date(task.dueDate), 'MMM dd, yyyy HH:mm')}
                left={(props) => <List.Icon {...props} icon="calendar-clock" />}
              />
            )}
            {task.completedAt && (
              <List.Item
                title="Completed"
                description={format(new Date(task.completedAt), 'MMM dd, yyyy HH:mm')}
                left={(props) => <List.Icon {...props} icon="calendar-check" />}
              />
            )}
          </Card.Content>
        </Card>

        {/* Files */}
        {task.files && task.files.length > 0 && (
          <Card style={styles.filesCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Attachments ({task.files.length})
              </Text>
              {task.files.map((file, index) => (
                <List.Item
                  key={index}
                  title={file.originalName}
                  description={`${file.size} bytes • ${file.fileType}`}
                  left={(props) => <List.Icon {...props} icon="file" />}
                  right={(props) => (
                    <IconButton {...props} icon="download" size={20} />
                  )}
                />
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Location */}
        {task.location && (
          <Card style={styles.locationCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Location
              </Text>
              <List.Item
                title="Coordinates"
                description={`${task.location.latitude.toFixed(6)}, ${task.location.longitude.toFixed(6)}`}
                left={(props) => <List.Icon {...props} icon="crosshairs-gps" />}
              />
              {task.location.address && (
                <List.Item
                  title="Address"
                  description={task.location.address}
                  left={(props) => <List.Icon {...props} icon="map-marker" />}
                />
              )}
            </Card.Content>
          </Card>
        )}

        {/* Comments */}
        <Card style={styles.commentsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Comments
            </Text>
            
            {/* Add Comment */}
            <View style={styles.addCommentSection}>
              <TextInput
                label="Add a comment"
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={3}
                style={styles.commentInput}
              />
              <Button
                mode="contained"
                onPress={handleAddComment}
                disabled={!comment.trim()}
                style={styles.addCommentButton}
              >
                Add Comment
              </Button>
            </View>

            <Divider style={styles.commentsDivider} />

            {/* Comments List */}
            {task.comments && task.comments.length > 0 ? (
              task.comments.map((comment, index) => (
                <View key={index} style={styles.commentItem}>
                  <View style={styles.commentHeader}>
                    <Avatar.Text
                      size={32}
                      label={comment.author.firstName.charAt(0)}
                      style={styles.commentAvatar}
                    />
                    <View style={styles.commentInfo}>
                      <Text variant="labelMedium">
                        {comment.author.firstName} {comment.author.lastName}
                      </Text>
                      <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.onSurfaceVariant }}
                      >
                        {format(new Date(comment.createdAt), 'MMM dd, yyyy HH:mm')}
                      </Text>
                    </View>
                  </View>
                  <Text variant="bodyMedium" style={styles.commentText}>
                    {comment.text}
                  </Text>
                </View>
              ))
            ) : (
              <Text
                variant="bodyMedium"
                style={[styles.noComments, { color: theme.colors.onSurfaceVariant }]}
              >
                No comments yet
              </Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        {task.status !== 'completed' && task.status !== 'cancelled' && (
          <>
            {task.status === 'pending' && (
              <FAB
                icon="play"
                style={[styles.fab, { backgroundColor: COLORS.info }]}
                onPress={() => handleStatusChange('in_progress')}
                label="Start"
              />
            )}
            {task.status === 'in_progress' && (
              <FAB
                icon="check"
                style={[styles.fab, { backgroundColor: COLORS.success }]}
                onPress={() => handleStatusChange('completed')}
                label="Complete"
              />
            )}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: SIZES.padding,
  },
  headerCard: {
    marginBottom: SIZES.padding,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.padding,
  },
  titleSection: {
    flex: 1,
  },
  taskTitle: {
    marginBottom: SIZES.padding / 2,
  },
  statusRow: {
    flexDirection: 'row',
    gap: SIZES.padding / 2,
  },
  statusChip: {
    height: 32,
  },
  priorityChip: {
    height: 32,
  },
  description: {
    lineHeight: 22,
  },
  infoCard: {
    marginBottom: SIZES.padding,
    elevation: 2,
  },
  filesCard: {
    marginBottom: SIZES.padding,
    elevation: 2,
  },
  locationCard: {
    marginBottom: SIZES.padding,
    elevation: 2,
  },
  commentsCard: {
    marginBottom: SIZES.padding * 4,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: SIZES.padding,
  },
  addCommentSection: {
    marginBottom: SIZES.padding,
  },
  commentInput: {
    marginBottom: SIZES.padding / 2,
  },
  addCommentButton: {
    alignSelf: 'flex-end',
  },
  commentsDivider: {
    marginVertical: SIZES.padding,
  },
  commentItem: {
    marginBottom: SIZES.padding,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding / 2,
  },
  commentAvatar: {
    marginRight: SIZES.padding / 2,
  },
  commentInfo: {
    flex: 1,
  },
  commentText: {
    marginLeft: 40,
    lineHeight: 20,
  },
  noComments: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: SIZES.padding,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  fab: {
    marginBottom: 16,
  },
});

export default TaskDetailsScreen;