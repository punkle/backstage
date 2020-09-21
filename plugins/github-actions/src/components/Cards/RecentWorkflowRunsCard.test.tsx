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

import React from 'react';
import { act, render, RenderResult, waitFor } from '@testing-library/react';
import { RecentWorkflowRunsCard } from './RecentWorkflowRunsCard';
import { useApi } from '@backstage/core-api';
import { useWorkflowRuns } from '../useWorkflowRuns';
import { wrapInTestApp } from '@backstage/test-utils';
// const useWorkflowRunsMock = jest.fn();
jest.mock('../useWorkflowRuns', () => ({
  useWorkflowRuns: jest.fn(),
}));
jest.mock('@backstage/core-api');

describe('<RecentWorkflowRunsCard />', () => {
  const entity = {
    apiVersion: 'v1',
    kind: 'Component',
    metadata: {
      name: 'software',
      annotations: {
        'github.com/project-slug': 'theorg/the-service',
      },
    },
    spec: {
      owner: 'guest',
      type: 'service',
      lifecycle: 'production',
    },
  };

  const workflowRuns = [1, 2, 3, 4, 5].map(n => ({
    id: `run-id-${n}`,
    message: `Commit message for workflow ${n}`,
    source: { branchName: `branch-${n}` },
    status: 'completed',
  }));
  const mockErrorApi = { post: jest.fn() };

  beforeEach(() => {
    (useWorkflowRuns as jest.Mock).mockReturnValue([{ runs: workflowRuns }]);
    (useApi as jest.Mock).mockReturnValue(mockErrorApi);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders a table with a row for each workflow', async () => {
    let subject: RenderResult;
    await act(async () => {
      subject = render(
        wrapInTestApp(<RecentWorkflowRunsCard entity={entity} />),
      );
    });

    await waitFor(() => {
      workflowRuns.forEach(run => {
        expect(subject.getByText(run.message)).toBeInTheDocument();
      });
    });
  });

  it('renders a workflow row correctly', async () => {
    let subject: RenderResult;
    await act(async () => {
      subject = render(
        wrapInTestApp(<RecentWorkflowRunsCard entity={entity} />),
      );
    });
    const [run] = workflowRuns;
    await waitFor(() => {
      expect(subject.getByText(run.message).closest('a')).toHaveAttribute(
        'href',
        `/ci-cd/${run.id}`,
      );
      expect(subject.getByText(run.source.branchName)).toBeInTheDocument();
    });
  });

  it('requests only the required number of workflow runs', async () => {
    const limit = 3;
    await act(async () => {
      render(
        wrapInTestApp(<RecentWorkflowRunsCard entity={entity} limit={limit} />),
      );
    });
    await waitFor(() => {
      expect(useWorkflowRuns).toHaveBeenCalledWith(
        expect.objectContaining({ initialPageSize: limit }),
      );
    });
  });

  it('uses the github repo and owner from the entity annotation', async () => {
    await act(async () => {
      render(wrapInTestApp(<RecentWorkflowRunsCard entity={entity} />));
    });
    await waitFor(() => {
      expect(useWorkflowRuns).toHaveBeenCalledWith(
        expect.objectContaining({ owner: 'theorg', repo: 'the-service' }),
      );
    });
  });

  it('filters workflows by branch if one is specified', async () => {
    const branch = 'master';
    await act(async () => {
      render(
        wrapInTestApp(
          <RecentWorkflowRunsCard entity={entity} branch={branch} />,
        ),
      );
    });
    await waitFor(() => {
      expect(useWorkflowRuns).toHaveBeenCalledWith(
        expect.objectContaining({ branch }),
      );
    });
  });

  describe('where there is an error fetching workflows', () => {
    const error = 'error getting workflows';
    beforeEach(() => {
      (useWorkflowRuns as jest.Mock).mockReturnValue([{ runs: [], error }]);
    });

    it('sends the error to the errorApi', async () => {
      await act(async () => {
        render(wrapInTestApp(<RecentWorkflowRunsCard entity={entity} />));
      });
      await waitFor(() => {
        expect(mockErrorApi.post).toHaveBeenCalledWith(error);
      });
    });
  });
});
