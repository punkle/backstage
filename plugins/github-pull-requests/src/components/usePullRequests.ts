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
import { PullRequest } from './PullRequestsTable/PullRequestsTable';
import { githubPullRequestsApiRef } from '../api/GithubPullRequestsApi';
import { useApi, githubAuthApiRef } from '@backstage/core';
import { PullsListResponseData } from '@octokit/types';

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

  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  const { loading, value: prData, retry, error } = useAsyncRetry<
    PullRequest[]
  >(async () => {
    const token = await auth.getAccessToken(['repo']);
    if (!repo) {
      return [];
    }
    return (
      api
        // GitHub API pagination count starts from 1
        .listPullRequests({
          token,
          owner,
          repo,
          pageSize,
          page: page + 1,
          branch,
        })
        .then(
          ({
            maxTotalItems,
            pullRequestsData,
          }: {
            maxTotalItems?: number;
            pullRequestsData: PullsListResponseData;
          }) => {
            if (maxTotalItems) {
              setTotal(maxTotalItems);
            }
            return pullRequestsData.map(({ id, html_url, title, number }) => ({
              url: html_url,
              id,
              number,
              title,
            }));
          },
        )
    );
  }, [page, pageSize, repo, owner]);

  return [
    {
      page,
      pageSize,
      loading,
      prData,
      projectName: `${owner}/${repo}`,
      total,
      error,
    },
    {
      prData,
      setPage,
      setPageSize,
      retry,
    },
  ] as const;
}
