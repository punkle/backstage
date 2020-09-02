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
import { useAsyncRetry } from 'react-use';
import { useApi, googleAuthApiRef, errorApiRef } from '@backstage/core';
import { LambdaData } from '../types';
import { awsLambdaApiRef } from '../api';

export function useLambda({
  region,
  identityPoolId,
  awsAccessKeyId,
  awsAccessKeySecret,
  authMethod,
}: {
  region: string;
  identityPoolId: string;
  awsAccessKeyId: string;
  awsAccessKeySecret: string;
  authMethod: string;
}) {
  const googleAuth = useApi(googleAuthApiRef);
  const lambdaApi = useApi(awsLambdaApiRef);
  const errorApi = useApi(errorApiRef);
  const { loading, value: lambdaData, error, retry } = useAsyncRetry<
    LambdaData[]
  >(async () => {
    if (!region) {
      errorApi.post(
        new Error('Please use settings button to set credentials and region'),
      );
      return [];
    }

    const googleIdToken =
      authMethod === 'google' ? await googleAuth.getIdToken() : '';
    try {
      const lambdaFunctions = await lambdaApi.listLambdas({
        googleIdToken,
        awsRegion: region,
        identityPoolId,
        awsAccessKeyId,
        awsAccessKeySecret,
        authMethod,
      });
      return lambdaFunctions.lambdaData;
    } catch (err) {
      errorApi.post(err);
      return [];
    }
  }, [region, identityPoolId]);

  return [
    {
      loading,
      lambdaData,
      error,
      retry,
    },
  ] as const;
}
