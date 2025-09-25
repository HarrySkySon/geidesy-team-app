import { Model, Relation } from '@nozbe/watermelondb';
import { field, date, readonly, relation, writer } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

import Task from './Task';
import User from './User';

export default class TaskComment extends Model {
  static table = 'task_comments';
  static associations: Associations = {
    tasks: { type: 'belongs_to', key: 'task_id' },
    users: { type: 'belongs_to', key: 'author_id' },
  };

  @field('server_id') serverId?: string;
  @field('task_id') taskId!: string;
  @field('author_id') authorId!: string;
  @field('text') text!: string;
  @field('is_synced') isSynced!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @relation('tasks', 'task_id') task!: Relation<Task>;
  @relation('users', 'author_id') author!: Relation<User>;

  // Mark comment as synced
  @writer async markAsSynced(serverId: string): Promise<void> {
    await this.update(comment => {
      comment.serverId = serverId;
      comment.isSynced = true;
    });
  }

  // Get sync status
  get syncStatus(): 'synced' | 'pending' {
    return this.isSynced && this.serverId ? 'synced' : 'pending';
  }

  // Convert to API format
  toAPI(): any {
    return {
      id: this.serverId,
      taskId: this.taskId,
      authorId: this.authorId,
      text: this.text,
      createdAt: this.createdAt.toISOString(),
    };
  }

  // Create from API data
  static fromAPI(apiData: any): Partial<TaskComment> {
    return {
      serverId: apiData.id,
      taskId: apiData.taskId,
      authorId: apiData.authorId,
      text: apiData.text,
      isSynced: true,
    };
  }
}