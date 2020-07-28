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

import { errorHandler, InputError } from '@backstage/backend-common';
import type { Entity } from '@backstage/catalog-model';
import express, { NextFunction, Request, Response } from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { EntitiesCatalog, LocationsCatalog } from '../catalog';
import { EntityFilters } from '../database';
import { HigherOrderOperation } from '../ingestion/types';
import { requireRequestBody } from './util';

export interface RouterOptions {
  entitiesCatalog?: EntitiesCatalog;
  locationsCatalog?: LocationsCatalog;
  higherOrderOperation?: HigherOrderOperation;
  logger: Logger;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { entitiesCatalog, locationsCatalog } = options;

  const router = Router();
  router.use(express.json());

  if (entitiesCatalog) {
    router
      .use(checkTenantHeader)
      .get('/entities', async (req, res) => {
        const tenant = tenantHeader(req);
        const filters = translateQueryToEntityFilters(req);
        const entities = await entitiesCatalog.entities(tenant, filters);
        res.status(200).send(entities);
      })
      .post('/entities', async (req, res) => {
        const tenant = tenantHeader(req);
        const body = await requireRequestBody(req);
        const result = await entitiesCatalog.addOrUpdateEntity(
          tenant,
          body as Entity,
        );
        res.status(200).send(result);
      })
      .get('/entities/by-uid/:uid', async (req, res) => {
        const tenant = tenantHeader(req);
        const { uid } = req.params;
        const entity = await entitiesCatalog.entityByUid(tenant, uid);
        if (!entity) {
          res.status(404).send(`No entity with uid ${uid}`);
        }
        res.status(200).send(entity);
      })
      .delete('/entities/by-uid/:uid', async (req, res) => {
        const tenant = tenantHeader(req);
        const { uid } = req.params;
        await entitiesCatalog.removeEntityByUid(tenant, uid);
        res.status(204).send();
      })
      .get('/entities/by-name/:kind/:namespace/:name', async (req, res) => {
        const tenant = tenantHeader(req);
        const { kind, namespace, name } = req.params;
        const entity = await entitiesCatalog.entityByName(
          tenant,
          kind,
          namespace,
          name,
        );
        if (!entity) {
          res
            .status(404)
            .send(
              `No entity with kind ${kind} namespace ${namespace} name ${name}`,
            );
        }
        res.status(200).send(entity);
      });
  }

  if (locationsCatalog) {
    router
      .get('/locations', async (_req, res) => {
        const output = await locationsCatalog.locations();
        res.status(200).send(output);
      })
      .get('/locations/:id/history', async (req, res) => {
        const { id } = req.params;
        const output = await locationsCatalog.locationHistory(id);
        res.status(200).send(output);
      })
      .get('/locations/:id', async (req, res) => {
        const { id } = req.params;
        const output = await locationsCatalog.location(id);
        res.status(200).send(output);
      })
      .delete('/locations/:id', async (req, res) => {
        const { id } = req.params;
        await locationsCatalog.removeLocation(id);
        res.status(204).send();
      });
  }

  router.use(errorHandler());
  return router;
}

function translateQueryToEntityFilters(
  request: express.Request,
): EntityFilters {
  const filters: EntityFilters = [];

  for (const [key, valueOrValues] of Object.entries(request.query)) {
    const values = Array.isArray(valueOrValues)
      ? valueOrValues
      : [valueOrValues];

    if (values.some(v => typeof v !== 'string')) {
      throw new InputError('Complex query parameters are not supported');
    }

    filters.push({
      key,
      values: values.map(v => v || null) as string[],
    });
  }

  return filters;
}

function checkTenantHeader(req: Request, res: Response, next: NextFunction) {
  console.log('Request URL:', req.url);
  const tenant = tenantHeader(req);
  console.log('Tenant id: ');
  if (tenant === '') {
    console.log('undefined tenant id!');
    res.status(400).send();
    return;
  }
  next();
}

function tenantHeader(req: Request): string {
  const tenant = req.headers['x-tenant'];
  if (tenant === undefined) {
    return '';
  }
  if (typeof tenant === 'string') {
    return tenant;
  }
  if (tenant instanceof Array && tenant.length >= 1) {
    return tenant[0];
  }
  return '';
}
