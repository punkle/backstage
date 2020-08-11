import React, { FC } from 'react';
import { InfoCard, StructuredMetadataTable } from '@backstage/core';

const cardContentStyle = { heightX: 200, width: 500 };

export const PullRequestsStats: FC<{}> = () => {
  const metadata = {
    'average time of PR until merge': '6.23 hours',
    'average size of PR': '521 lines',
    'merged to closed ratio': '88%',
  };
  return (
    <InfoCard
      title="Pull requests statistics"
      subheader="Based on last 100 PR's"
    >
      <div style={cardContentStyle}>
        <StructuredMetadataTable metadata={metadata} />
      </div>
    </InfoCard>
  );
};
