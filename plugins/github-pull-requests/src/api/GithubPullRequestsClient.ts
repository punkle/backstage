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

import { GithubPullRequestsApi } from './GithubPullRequestsApi';
import { Octokit } from '@octokit/rest';
import { PullsListResponseData } from '@octokit/types';

export class GithubPullRequestsClient implements GithubPullRequestsApi {
  async listPullRequests({
    token,
    owner,
    repo,
    pageSize,
    page,
    branch = 'master',
  }: {
    token: string;
    owner: string;
    repo: string;
    pageSize?: number;
    page?: number;
    branch?: string;
  }): Promise<PullsListResponseData> {
    const pullRequestResponse = await new Octokit({ auth: token }).pulls.list({
      repo,
      pageSize,
      page,
      branch: branch,
      owner,
    });
    return pullRequestResponse.data;
  }
}
