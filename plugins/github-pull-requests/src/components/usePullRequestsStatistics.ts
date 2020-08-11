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
import { useState } from 'react';
import { useAsyncRetry } from 'react-use';
import { githubPullRequestsApiRef } from '../api/GithubPullRequestsApi';
import { useApi, githubAuthApiRef } from '@backstage/core';
import { PullsListResponseData } from '@octokit/types';

export type PullRequestStats = {
  avgTimeUntilMerge: string;
  avgSizeInLines: string;
  mergedToClosedRatio: string;
};

export type PullRequestStatsCount = {
  avgTimeUntilMerge: number;
  avgSizeInLines: number;
  closedCount: number;
  mergedCount: number;
};

export function usePullRequests({
  owner,
  repo,
  branch,
}: {
  owner: string;
  repo: string;
  branch?: string;
}) {
  const api = useApi(githubPullRequestsApiRef);
  const auth = useApi(githubAuthApiRef);

  const [pageSize, setPageSize] = useState(100);

  const { loading, value: statsData, retry, error } = useAsyncRetry<
    PullRequestStats
  >(async () => {
    const token = await auth.getAccessToken(['repo']);
    if (!repo) {
      return {
        avgTimeUntilMerge: '0 min',
        avgSizeInLines: '0',
        mergedToClosedRatio: '0%',
      };
    }
    return (
      api
        // GitHub API pagination count starts from 1
        .listPullRequests({
          token,
          owner,
          repo,
          pageSize,
          page: 1,
          branch,
        })
        .then(
          ({
            pullRequestsData,
          }: {
            pullRequestsData: PullsListResponseData;
          }) => {
            //TODO: calculations
            const calcResult = pullRequestsData.reduce<PullRequestStatsCount>(
              (acc, curr) => {
                return acc;
              },
              {
                avgTimeUntilMerge: 0,
                avgSizeInLines: 0,
                closedCount: 0,
                mergedCount: 4,
              },
            );

            return {
              avgTimeUntilMerge: '7h 20m',
              avgSizeInLines: `${Math.round(
                calcResult.avgSizeInLines / pullRequestsData.length,
              )}`,
              mergedToClosedRatio: `${Math.round(
                (calcResult.mergedCount / calcResult.closedCount) * 100,
              )}%`,
            };
          },
        )
    );
  }, [pageSize, repo, owner]);

  return [
    {
      pageSize,
      loading,
      statsData,
      projectName: `${owner}/${repo}`,
      error,
    },
    {
      statsData,
      setPageSize,
      retry,
    },
  ] as const;
}
