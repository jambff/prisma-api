import { ValidationOptions } from 'class-validator';
import { SchemaObject } from 'openapi3-ts';
import { IsDeepObject } from '@jambff/api';
import { Includes } from '../queries/includes';

type PropertyDefinitions = {
  [x in string]:
    | { type: string }
    | {
        oneOf: {
          type: string;
          items?: {
            type: string;
            enum: string[];
          };
        }[];
      };
};

const createIncludeSchema = <T extends Record<string, any>>(
  includes: Includes<T>,
): SchemaObject => {
  const initialValue: PropertyDefinitions = {};
  const baseOneOf = [{ type: 'boolean' }, { type: 'string' }];

  return Object.entries(includes).reduce((acc, [key, value]) => {
    if (!value || typeof value !== 'object') {
      return {
        ...acc,
        [key]: { oneOf: baseOneOf },
      };
    }

    return {
      ...acc,
      [key]: {
        oneOf: [
          ...baseOneOf,
          {
            type: 'array',
            items: {
              type: 'string',
              enum: Object.keys(value.include),
            },
          },
        ],
      },
    };
  }, initialValue);
};

export const IsIncludeSchema =
  <T extends Record<string, any>>(includes: T, options?: ValidationOptions) =>
  (object: Object, propertyName: string) => {
    const schema = createIncludeSchema(includes);

    IsDeepObject(schema, {
      message:
        'must be in the format include[<key>]=true or include[<key>][]=<child-key> where <key> is one of ' +
        `${Object.values(Object.keys(schema)).join(', ')} `,
      ...options,
    })(object, propertyName);
  };
