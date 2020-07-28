/*
 * Copyright 2020 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Location } from '@backstage/catalog-model';
import type { Database } from '../database';
import {
  DatabaseLocationUpdateLogEvent,
  DatabaseLocationUpdateLogStatus,
} from '../database/types';
import { LocationResponse, LocationsCatalog } from './types';

export class DatabaseLocationsCatalog implements LocationsCatalog {
  constructor(private readonly database: Database) {}

  async addLocation(location: Location): Promise<Location> {
    const added = await this.database.addLocation('tenant1', location);
    return added;
  }

  async removeLocation(id: string): Promise<void> {
    await this.database.transaction(tx =>
      this.database.removeLocation('tenant1', tx, id),
    );
  }

  async locations(): Promise<LocationResponse[]> {
    const items = await this.database.locations('tenant1');
    return items.map(({ message, status, timestamp, ...data }) => ({
      currentStatus: {
        message,
        status,
        timestamp,
      },
      data,
    }));
  }

  async locationHistory(id: string): Promise<DatabaseLocationUpdateLogEvent[]> {
    return this.database.locationHistory('tenant1', id);
  }

  async location(id: string): Promise<LocationResponse> {
    const {
      message,
      status,
      timestamp,
      ...data
    } = await this.database.location('tenant1', id);
    return {
      currentStatus: {
        message,
        status,
        timestamp,
      },
      data,
    };
  }

  async logUpdateSuccess(
    locationId: string,
    entityName?: string,
  ): Promise<void> {
    await this.database.addLocationUpdateLogEvent(
      'tenant1',
      locationId,
      DatabaseLocationUpdateLogStatus.SUCCESS,
      entityName,
    );
  }

  async logUpdateFailure(
    locationId: string,
    error?: Error,
    entityName?: string,
  ): Promise<void> {
    await this.database.addLocationUpdateLogEvent(
      'tenant1',
      locationId,
      DatabaseLocationUpdateLogStatus.FAIL,
      entityName,
      error?.message,
    );
  }
}
