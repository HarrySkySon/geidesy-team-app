import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, writer } from '@nozbe/watermelondb/decorators';

export type SyncOperationType = 'create' | 'update' | 'delete';
export type SyncStatus = 'pending' | 'processing' | 'completed' | 'failed';

export default class SyncQueue extends Model {
  static table = 'sync_queue';

  @field('operation_type') operationType!: SyncOperationType;
  @field('table_name') tableName!: string;
  @field('record_id') recordId!: string;
  @field('data') data!: string; // JSON string
  @field('priority') priority!: number;
  @field('retry_count') retryCount!: number;
  @field('last_error') lastError?: string;
  @field('status') status!: SyncStatus;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Parse data JSON
  get parsedData(): any {
    try {
      return JSON.parse(this.data);
    } catch (error) {
      console.error('Error parsing sync queue data:', error);
      return {};
    }
  }

  // Mark as processing
  @writer async markAsProcessing(): Promise<void> {
    await this.update(item => {
      item.status = 'processing';
    });
  }

  // Mark as completed
  @writer async markAsCompleted(): Promise<void> {
    await this.update(item => {
      item.status = 'completed';
    });
  }

  // Mark as failed with error
  @writer async markAsFailed(error: string): Promise<void> {
    await this.update(item => {
      item.status = 'failed';
      item.lastError = error;
      item.retryCount = item.retryCount + 1;
    });
  }

  // Reset for retry
  @writer async resetForRetry(): Promise<void> {
    await this.update(item => {
      item.status = 'pending';
      item.lastError = undefined;
    });
  }

  // Check if should retry
  get shouldRetry(): boolean {
    return this.status === 'failed' && this.retryCount < 3;
  }

  // Get next retry delay in milliseconds
  get retryDelay(): number {
    // Exponential backoff: 1s, 4s, 9s
    return Math.pow(this.retryCount + 1, 2) * 1000;
  }
}