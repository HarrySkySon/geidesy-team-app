import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  Picker,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Get device IP for mobile network access
const getApiBase = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3000';
  }
  // For mobile devices, use your computer's IP address
  // Replace with your actual IP address when testing on real device
  return 'http://192.168.1.100:3000'; // Change this to your computer's IP
};

const API_BASE = getApiBase();

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedTo?: string;
  dueDate?: string;
  teamId?: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  leader: string;
  memberCount: number;
  status?: string;
}

interface TaskForm {
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedTo: string;
  teamId: string;
  dueDate: string;
}

const { width } = Dimensions.get('window');

export default function MobileApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'teams'>('dashboard');
  
  // Task management
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState<TaskForm>({
    title: '',
    description: '',
    status: 'PENDING',
    priority: 'MEDIUM',
    assignedTo: '',
    teamId: '',
    dueDate: ''
  });

  // Team management
  const [isTeamModalVisible, setIsTeamModalVisible] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamForm, setTeamForm] = useState({
    name: '',
    description: '',
    leader: ''
  });

  const [credentials, setCredentials] = useState({
    email: 'admin@geodesy.com',
    password: 'password123'
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const login = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/test-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      if (data.success) {
        setIsAuthenticated(true);
        Alert.alert('Success', 'Login successful!');
      } else {
        setError('Login failed');
      }
    } catch (err: any) {
      setError('Network error: ' + err.message);
      Alert.alert('Network Error', 'Please ensure the backend server is running and accessible from your device.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [tasksRes, teamsRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/tasks`),
        fetch(`${API_BASE}/api/v1/teams`)
      ]);

      const tasksData = await tasksRes.json();
      const teamsData = await teamsRes.json();

      if (tasksData.success) setTasks(tasksData.data.tasks);
      if (teamsData.success) setTeams(teamsData.data.teams);
    } catch (err: any) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();
      if (result.success) {
        await loadData();
        Alert.alert('Success', 'Task status updated!');
      } else {
        Alert.alert('Error', 'Failed to update task status');
      }
    } catch (err: any) {
      Alert.alert('Error', 'Network error: ' + err.message);
    }
  };

  const saveTask = async () => {
    if (!taskForm.title.trim()) {
      Alert.alert('Error', 'Task title is required');
      return;
    }

    setIsLoading(true);
    try {
      const taskData = {
        ...taskForm,
        dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : null
      };

      const url = editingTask 
        ? `${API_BASE}/api/v1/tasks/${editingTask.id}`
        : `${API_BASE}/api/v1/tasks`;
      
      const method = editingTask ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      const result = await response.json();
      if (result.success) {
        await loadData();
        setIsTaskModalVisible(false);
        resetTaskForm();
        Alert.alert('Success', editingTask ? 'Task updated!' : 'Task created!');
      } else {
        Alert.alert('Error', 'Failed to save task');
      }
    } catch (err: any) {
      Alert.alert('Error', 'Network error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE}/api/v1/tasks/${taskId}`, {
                method: 'DELETE',
              });

              const result = await response.json();
              if (result.success) {
                await loadData();
                Alert.alert('Success', 'Task deleted!');
              } else {
                Alert.alert('Error', 'Failed to delete task');
              }
            } catch (err: any) {
              Alert.alert('Error', 'Network error: ' + err.message);
            }
          }
        }
      ]
    );
  };

  const saveTeam = async () => {
    if (!teamForm.name.trim()) {
      Alert.alert('Error', 'Team name is required');
      return;
    }

    setIsLoading(true);
    try {
      const url = editingTeam 
        ? `${API_BASE}/api/v1/teams/${editingTeam.id}`
        : `${API_BASE}/api/v1/teams`;
      
      const method = editingTeam ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamForm),
      });

      const result = await response.json();
      if (result.success) {
        await loadData();
        setIsTeamModalVisible(false);
        resetTeamForm();
        Alert.alert('Success', editingTeam ? 'Team updated!' : 'Team created!');
      } else {
        Alert.alert('Error', 'Failed to save team');
      }
    } catch (err: any) {
      Alert.alert('Error', 'Network error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      status: 'PENDING',
      priority: 'MEDIUM',
      assignedTo: '',
      teamId: '',
      dueDate: ''
    });
    setEditingTask(null);
  };

  const resetTeamForm = () => {
    setTeamForm({
      name: '',
      description: '',
      leader: ''
    });
    setEditingTeam(null);
  };

  const editTask = (task: Task) => {
    setTaskForm({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignedTo || '',
      teamId: task.teamId || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
    });
    setEditingTask(task);
    setIsTaskModalVisible(true);
  };

  const editTeam = (team: Team) => {
    setTeamForm({
      name: team.name,
      description: team.description,
      leader: team.leader
    });
    setEditingTeam(team);
    setIsTeamModalVisible(true);
  };

  const logout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            setIsAuthenticated(false);
            setTasks([]);
            setTeams([]);
            setError(null);
            setActiveTab('dashboard');
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '#4CAF50';
      case 'IN_PROGRESS': return '#FF9800';
      case 'PENDING': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return '#F44336';
      case 'MEDIUM': return '#FF9800';
      case 'LOW': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.loginContainer}>
          <Text style={styles.title}>🌍 Geodesy Mobile</Text>
          <Text style={styles.subtitle}>Professional Surveying Team Management</Text>
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={credentials.email}
            onChangeText={(text) => setCredentials({ ...credentials, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={credentials.password}
            onChangeText={(text) => setCredentials({ ...credentials, password: text })}
            secureTextEntry
          />

          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={login}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Test Account:{'\n'}
              admin@geodesy.com / password123
            </Text>
          </View>

          <View style={styles.networkInfo}>
            <Text style={styles.networkInfoText}>
              API Endpoint: {API_BASE}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const renderDashboard = () => (
    <ScrollView 
      style={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} />}
    >
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{tasks.length}</Text>
          <Text style={styles.statLabel}>Total Tasks</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{teams.length}</Text>
          <Text style={styles.statLabel}>Teams</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
            {tasks.filter(t => t.status === 'COMPLETED').length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Recent Tasks */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📋 Recent Tasks</Text>
          <TouchableOpacity onPress={() => setActiveTab('tasks')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {tasks.slice(0, 3).map((task) => (
          <TouchableOpacity 
            key={task.id} 
            style={styles.taskCard}
            onPress={() => editTask(task)}
          >
            <View style={styles.taskHeader}>
              <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
                <Text style={styles.statusText}>{task.status}</Text>
              </View>
            </View>
            <Text style={styles.taskDescription} numberOfLines={2}>{task.description}</Text>
            <View style={styles.taskFooter}>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
                <Text style={styles.priorityText}>{task.priority}</Text>
              </View>
              {task.assignedTo && (
                <Text style={styles.assignedText} numberOfLines={1}>👤 {task.assignedTo}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Teams Overview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>👥 Teams</Text>
          <TouchableOpacity onPress={() => setActiveTab('teams')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {teams.slice(0, 2).map((team) => (
          <TouchableOpacity 
            key={team.id} 
            style={styles.teamCard}
            onPress={() => editTeam(team)}
          >
            <Text style={styles.teamName}>{team.name}</Text>
            <Text style={styles.teamDescription} numberOfLines={2}>{team.description}</Text>
            <View style={styles.teamFooter}>
              <Text style={styles.teamLeader}>👨‍💼 {team.leader}</Text>
              <Text style={styles.teamMembers}>👥 {team.memberCount}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderTasks = () => (
    <View style={styles.tabContainer}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>📋 Tasks Management</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            resetTaskForm();
            setIsTaskModalVisible(true);
          }}
        >
          <Text style={styles.addButtonText}>+ Add Task</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.tabContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} />}
      >
        {tasks.map((task) => (
          <View key={task.id} style={styles.taskCard}>
            <View style={styles.taskHeader}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <TouchableOpacity
                style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}
                onPress={() => {
                  const nextStatus = task.status === 'PENDING' ? 'IN_PROGRESS' : 
                                   task.status === 'IN_PROGRESS' ? 'COMPLETED' : 'PENDING';
                  updateTaskStatus(task.id, nextStatus);
                }}
              >
                <Text style={styles.statusText}>{task.status}</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.taskDescription}>{task.description}</Text>
            
            <View style={styles.taskFooter}>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
                <Text style={styles.priorityText}>{task.priority}</Text>
              </View>
              {task.assignedTo && (
                <Text style={styles.assignedText}>👤 {task.assignedTo}</Text>
              )}
            </View>
            
            {task.dueDate && (
              <Text style={styles.dueDateText}>
                📅 Due: {new Date(task.dueDate).toLocaleDateString()}
              </Text>
            )}
            
            <View style={styles.taskActions}>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => editTask(task)}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => deleteTask(task.id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        
        {tasks.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No tasks found</Text>
            <Text style={styles.emptyStateSubtext}>Create your first task to get started</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const renderTeams = () => (
    <View style={styles.tabContainer}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>👥 Teams Management</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            resetTeamForm();
            setIsTeamModalVisible(true);
          }}
        >
          <Text style={styles.addButtonText}>+ Add Team</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.tabContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} />}
      >
        {teams.map((team) => (
          <TouchableOpacity 
            key={team.id} 
            style={styles.teamCard}
            onPress={() => editTeam(team)}
          >
            <Text style={styles.teamName}>{team.name}</Text>
            <Text style={styles.teamDescription}>{team.description}</Text>
            <View style={styles.teamFooter}>
              <Text style={styles.teamLeader}>👨‍💼 {team.leader}</Text>
              <Text style={styles.teamMembers}>👥 {team.memberCount} members</Text>
            </View>
          </TouchableOpacity>
        ))}
        
        {teams.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No teams found</Text>
            <Text style={styles.emptyStateSubtext}>Create your first team to get started</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Geodesy Mobile</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'dashboard' && styles.activeTabButton]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'dashboard' && styles.activeTabButtonText]}>
            📊 Dashboard
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'tasks' && styles.activeTabButton]}
          onPress={() => setActiveTab('tasks')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'tasks' && styles.activeTabButtonText]}>
            📋 Tasks
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'teams' && styles.activeTabButton]}
          onPress={() => setActiveTab('teams')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'teams' && styles.activeTabButtonText]}>
            👥 Teams
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'tasks' && renderTasks()}
      {activeTab === 'teams' && renderTeams()}

      {/* Task Modal */}
      <Modal
        visible={isTaskModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setIsTaskModalVisible(false);
          resetTaskForm();
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setIsTaskModalVisible(false);
              resetTaskForm();
            }}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingTask ? 'Edit Task' : 'New Task'}
            </Text>
            <TouchableOpacity onPress={saveTask} disabled={isLoading}>
              <Text style={[styles.modalSaveText, isLoading && styles.disabledText]}>
                {isLoading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Title *</Text>
              <TextInput
                style={styles.formInput}
                value={taskForm.title}
                onChangeText={(text) => setTaskForm({ ...taskForm, title: text })}
                placeholder="Enter task title"
                multiline={false}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={taskForm.description}
                onChangeText={(text) => setTaskForm({ ...taskForm, description: text })}
                placeholder="Enter task description"
                multiline={true}
                numberOfLines={4}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Status</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={taskForm.status}
                  onValueChange={(value) => setTaskForm({ ...taskForm, status: value })}
                  style={styles.picker}
                >
                  <Picker.Item label="Pending" value="PENDING" />
                  <Picker.Item label="In Progress" value="IN_PROGRESS" />
                  <Picker.Item label="Completed" value="COMPLETED" />
                </Picker>
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Priority</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={taskForm.priority}
                  onValueChange={(value) => setTaskForm({ ...taskForm, priority: value })}
                  style={styles.picker}
                >
                  <Picker.Item label="Low" value="LOW" />
                  <Picker.Item label="Medium" value="MEDIUM" />
                  <Picker.Item label="High" value="HIGH" />
                </Picker>
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Assigned To</Text>
              <TextInput
                style={styles.formInput}
                value={taskForm.assignedTo}
                onChangeText={(text) => setTaskForm({ ...taskForm, assignedTo: text })}
                placeholder="Enter assignee name"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Due Date</Text>
              <TextInput
                style={styles.formInput}
                value={taskForm.dueDate}
                onChangeText={(text) => setTaskForm({ ...taskForm, dueDate: text })}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Team Modal */}
      <Modal
        visible={isTeamModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setIsTeamModalVisible(false);
          resetTeamForm();
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setIsTeamModalVisible(false);
              resetTeamForm();
            }}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingTeam ? 'Edit Team' : 'New Team'}
            </Text>
            <TouchableOpacity onPress={saveTeam} disabled={isLoading}>
              <Text style={[styles.modalSaveText, isLoading && styles.disabledText]}>
                {isLoading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Team Name *</Text>
              <TextInput
                style={styles.formInput}
                value={teamForm.name}
                onChangeText={(text) => setTeamForm({ ...teamForm, name: text })}
                placeholder="Enter team name"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={teamForm.description}
                onChangeText={(text) => setTeamForm({ ...teamForm, description: text })}
                placeholder="Enter team description"
                multiline={true}
                numberOfLines={4}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Team Leader</Text>
              <TextInput
                style={styles.formInput}
                value={teamForm.leader}
                onChangeText={(text) => setTeamForm({ ...teamForm, leader: text })}
                placeholder="Enter team leader name"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1976d2',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#1976d2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196f3',
    marginBottom: 16,
  },
  infoText: {
    color: '#1976d2',
    textAlign: 'center',
    fontSize: 14,
  },
  networkInfo: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  networkInfoText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#ffebee',
  },
  logoutText: {
    color: '#f44336',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#1976d2',
    backgroundColor: '#f8f9fa',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabButtonText: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  tabContainer: {
    flex: 1,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  addButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  taskCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  assignedText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    textAlign: 'right',
  },
  dueDateText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  editButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  deleteButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  teamCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  teamDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  teamFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamLeader: {
    fontSize: 12,
    color: '#666',
  },
  teamMembers: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
  },
  modalSaveText: {
    fontSize: 16,
    color: '#1976d2',
    fontWeight: 'bold',
  },
  disabledText: {
    color: '#ccc',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
});