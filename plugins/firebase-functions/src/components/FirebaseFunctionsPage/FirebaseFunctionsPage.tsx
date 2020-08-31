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

import React from 'react';
import { Grid } from '@material-ui/core';
import {
  Header,
  Page,
  pageTheme,
  Content,
  ContentHeader,
  HeaderLabel,
  SupportButton,
} from '@backstage/core';
import { AWSLambdaPageTable } from '../FirebaseFunctionsPageTable';
import { AppStateProvider } from '../../state';

const FirebaseFunctionsPage: React.FC = () => (
  <AppStateProvider>
    <Page theme={pageTheme.tool}>
      <Header
        title="Firebase functions plugin"
        subtitle="manage firebase functions"
      >
        <HeaderLabel label="Owner" value="Roadie" />
        <HeaderLabel label="Lifecycle" value="Alpha" />
      </Header>
      <Content>
        <ContentHeader title="Firebase functions plugin">
          <SupportButton>
            Plugin to show a project's firebase functions
          </SupportButton>
        </ContentHeader>
        <Grid container spacing={3} direction="column">
          <Grid item>
            <AWSLambdaPageTable />
          </Grid>
        </Grid>
      </Content>
    </Page>
  </AppStateProvider>
);

export default FirebaseFunctionsPage;
