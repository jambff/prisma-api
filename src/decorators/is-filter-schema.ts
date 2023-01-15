import { ValidationOptions } from 'class-validator';
import { SchemaObject } from 'openapi3-ts';
import { IsDeepObject } from '@jambff/api';
import {
  searchFilterOperations,
  searchFilterReferenceOperations,
} from '../search/operations';
import { FilterTypes } from '../search/filters';

const propertyDefinition = {
  type: 'string',
  pattern: `^((${searchFilterOperations
    .join('|')
    .replace(/\./g, '\\.')}):[^+]+)`,
};

type PropertyDefinitions = {
  [x in string]: {
    type: string;
    pattern: string;
  };
};

const createSearchFilterSchema = <T extends Record<string, any>>(
  filterTypes: FilterTypes<T>,
): SchemaObject => {
  const initialValue: PropertyDefinitions = {};

  return Object.entries(filterTypes).reduce((acc, [key, value]) => {
    if (typeof value === 'object') {
      Object.keys(value).forEach((childKey) => {
        searchFilterReferenceOperations.forEach(
          (searchFilterReferenceOperation) => {
            acc[`${key}.${searchFilterReferenceOperation}.${childKey}`] =
              propertyDefinition;
          },
        );
      });
    } else {
      acc[key] = propertyDefinition;
    }

    return acc;
  }, initialValue);
};

export const IsFilterSchema =
  <T extends Record<string, any>>(
    filterTypes: T,
    options?: ValidationOptions,
  ) =>
  (object: Object, propertyName: string) => {
    const filterSchema = createSearchFilterSchema(filterTypes);

    IsDeepObject(filterSchema, {
      message:
        'filter must be in the format filter[<key>]=<query> where <key> is one of ' +
        `${Object.values(Object.keys(filterSchema)).join(', ')} ` +
        'and <query> contains one or more items in the format <operation>:<value>, ' +
        `where <operation> is one of ${searchFilterOperations.join(', ')}`,
      ...options,
    })(object, propertyName);
  };
