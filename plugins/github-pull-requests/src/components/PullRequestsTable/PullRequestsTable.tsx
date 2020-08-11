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
import React, { FC } from 'react';
import { Typography, Box } from '@material-ui/core';
import GitHubIcon from '@material-ui/icons/GitHub';
import { Table, TableColumn } from '@backstage/core';
import { useEntityCompoundName } from '@backstage/plugin-catalog';
import { useProjectName } from '../useProjectName';
import { usePullRequests } from '../usePullRequests';

export type PullRequest = {
  id: number;
  number: number;
  url: string;
  title: string;
  updatedTime: string;
  createdTime: string;
  creatorNickname: string;
  creatorProfileLink: string;
};

const generatedColumns: TableColumn[] = [
  {
    title: 'ID',
    field: 'number',
    width: '150px',
    render: (row: Partial<PullRequest>) => (
      <Box fontWeight="fontWeightBold">
        <a target="_blank" href={row.url!}>
          #{row.number}
        </a>
      </Box>
    ),
  },
  {
    title: 'Title',
    field: 'title',
    highlight: true,
    render: (row: Partial<PullRequest>) => (
      <Typography variant="body2" noWrap>
        {row.title}
      </Typography>
    ),
  },
  {
    title: 'Creator',
    field: 'creatorNickname',
    width: '250px',
    render: (row: Partial<PullRequest>) => (
      <Box fontWeight="fontWeightBold">
        <a target="_blank" href={row.creatorProfileLink!}>
          {row.creatorNickname}
        </a>
      </Box>
    ),
  },
  {
    title: 'Created',
    field: 'createdTime',
    highlight: true,
    render: (row: Partial<PullRequest>) => (
      <Typography variant="body2" noWrap>
        {row.createdTime}
      </Typography>
    ),
  },
  {
    title: 'Last updated',
    field: 'updatedTime',
    highlight: true,
    render: (row: Partial<PullRequest>) => (
      <Typography variant="body2" noWrap>
        {row.updatedTime}
      </Typography>
    ),
  },
];

type Props = {
  loading: boolean;
  retry: () => void;
  projectName: string;
  page: number;
  prData?: PullRequest[];
  onChangePage: (page: number) => void;
  total: number;
  pageSize: number;
  onChangePageSize: (pageSize: number) => void;
};

export const PullRequestsTableView: FC<Props> = ({
  projectName,
  loading,
  pageSize,
  page,
  prData,
  onChangePage,
  onChangePageSize,
  total,
}) => {
  return (
    <Table
      isLoading={loading}
      options={{ paging: true, pageSize, padding: 'dense' }}
      totalCount={total}
      page={page}
      actions={[]}
      data={prData ?? []}
      onChangePage={onChangePage}
      onChangeRowsPerPage={onChangePageSize}
      title={
        <Box display="flex" alignItems="center">
          <GitHubIcon />
          <Box mr={1} />
          <Typography variant="h6">{projectName}</Typography>
        </Box>
      }
      columns={generatedColumns}
    />
  );
};

export const PullRequestsTable = () => {
  let entityCompoundName = useEntityCompoundName();
  if (!entityCompoundName.name) {
    entityCompoundName = {
      kind: 'Component',
      name: 'backstage',
      namespace: 'default',
    };
  }

  const { value: projectName, loading } = useProjectName(entityCompoundName);
  const [owner, repo] = (projectName ?? '/').split('/');
  const [tableProps, { retry, setPage, setPageSize }] = usePullRequests({
    owner,
    repo,
  });
  return (
    <PullRequestsTableView
      {...tableProps}
      loading={loading || tableProps.loading}
      retry={retry}
      onChangePageSize={setPageSize}
      onChangePage={setPage}
    />
  );
};
