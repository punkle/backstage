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

import AWS from 'aws-sdk';
import { AwsLambdaApi } from './AWSLambdaApi';
import { LambdaData } from '../types';

export class AwsLambdaClient implements AwsLambdaApi {
  async listLambdas({
    googleIdToken,
    identityPoolId,
    awsRegion,
  }: {
    googleIdToken: string;
    identityPoolId: string;
    awsRegion: string;
  }): Promise<{
    lambdaData: LambdaData[];
  }> {
    AWS.config.region = awsRegion;
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: identityPoolId,
      Logins: {
        'accounts.google.com': googleIdToken,
      },
    });
    const lambdaApi = new AWS.Lambda({});
    const lambdas = await lambdaApi.listFunctions({ MaxItems: 2 }).promise();

    const lambdaData =
      (lambdas.$response.data! as any)?.Functions.map(
        (v: any) =>
          ({
            codeSize: v.CodeSize,
            description: v.Description,
            functionName: v.FunctionName,
            lastModifiedDate: v.LastModified,
            runtime: v.Runtime,
            memory: v.MemorySize,
            region: awsRegion,
          } as LambdaData),
      ) || [];
    return { lambdaData };
  }
}
