import { Model } from '@nozbe/watermelondb';
import { field, date, writer } from '@nozbe/watermelondb/decorators';

export default class AppSettings extends Model {
  static table = 'app_settings';

  @field('key') key!: string;
  @field('value') value!: string;
  @date('updated_at') updatedAt!: Date;

  // Update setting value
  @writer async updateValue(newValue: string): Promise<void> {
    await this.update(setting => {
      setting.value = newValue;
      setting.updatedAt = new Date();
    });
  }

  // Get value as boolean
  get boolValue(): boolean {
    return this.value === 'true';
  }

  // Get value as number
  get numberValue(): number {
    return parseFloat(this.value) || 0;
  }

  // Get value as JSON object
  get jsonValue(): any {
    try {
      return JSON.parse(this.value);
    } catch (error) {
      return null;
    }
  }
}