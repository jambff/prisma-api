import { ValidationOptions } from 'class-validator';
import { SchemaObject } from 'openapi3-ts';
import { IsDeepObject } from '@jambff/api';
import { FilterTypes } from '../search/filters';

const propertyDefinition = {
  type: 'string',
};

type PropertyDefinitions = {
  [x in string]: {
    type: string;
  };
};

const createSearchFilterSchema = <T extends Record<string, any>>(
  filterTypes: FilterTypes<T>,
): SchemaObject => {
  const initialValue: PropertyDefinitions = {};

  return Object.keys(filterTypes).reduce((acc, key) => {
    acc[key] = propertyDefinition;

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
        `${Object.values(Object.keys(filterSchema)).join(', ')} `,
      ...options,
    })(object, propertyName);
  };
