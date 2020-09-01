/*
 * Copyright 2020 RoadieHQ
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

import { FirebaseFunctionsApi } from './firebaseFunctionsApi';
import { FunctionData } from '../types';
import { AuthMethod } from '../state/types';

class FetchError extends Error {
  get name(): string {
    return this.constructor.name;
  }

  static async forResponse(resp: Response): Promise<FetchError> {
    return new FetchError(
      `Request failed with status code ${
        resp.status
      }.\nReason: ${await resp.text()}`,
    );
  }
}

async function fetch<T = any>(url: string, init?: RequestInit): Promise<T> {
  const resp = await window.fetch(`${url}`, init);
  if (!resp.ok) throw await FetchError.forResponse(resp);
  return await resp.json();
}

export class FirebaseFunctionsClient implements FirebaseFunctionsApi {
  async listFunctions({
    googleIdToken,
    project,
    region,
    authMethod,
  }: {
    googleIdToken: string;
    project: string;
    region: string;
    authMethod: AuthMethod;
  }) {
    if (authMethod === 'API_KEY') {
      return { functionData: [] as FunctionData[] };
    }
    const fetchedData = [] as any[];
    let resp = null;
    do {
      resp = await fetch<{ functions: FunctionData[]; nextPageToken: string }>(
        `https://cloudfunctions.googleapis.com/v1/projects/${project}/locations/-/functions?pageSize=20`,
        {
          method: 'get',
          headers: new Headers({
            Authorization: `Bearer ${googleIdToken}`,
          }),
        },
      );
      fetchedData.push(...resp.functions!);
    } while (resp && resp.nextPageToken);

    const functionData =
      fetchedData.map(
        (r: any) =>
          ({
            name: r.name,
            description: r.description,
            status: r.status,
            updateTime: r.updateTime,
            runtime: r.runtime,
            availableMemoryMb: r.availableMemoryMb,
            project: project,
            region,
          } as FunctionData),
      ) || [];
    return { functionData };
  }
}
