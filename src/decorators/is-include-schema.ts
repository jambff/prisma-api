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

const createIncludeSchema = <T>(includes: Includes<T>): SchemaObject => {
  const initialValue: PropertyDefinitions = {};

  return Object.entries(includes).reduce((acc, [key, value]) => {
    if (!value || typeof value !== 'object') {
      return {
        ...acc,
        [key]: { type: 'boolean' },
      };
    }

    return {
      ...acc,
      [key]: {
        oneOf: [
          { type: 'boolean' },
          {
            type: 'array',
            items: {
              type: 'string',
              enum: Object.keys(value),
            },
          },
        ],
      },
    };
  }, initialValue);
};

export const IsIncludeSchema =
  <T>(includes: Includes<T>, options?: ValidationOptions) =>
  (object: Object, propertyName: string) => {
    const schema = createIncludeSchema(includes);

    IsDeepObject(schema, {
      message:
        'must be in the format include[<key>]=true or include[<key>][]=<child-key> where <key> is one of ' +
        `${Object.values(Object.keys(schema)).join(', ')} `,
      ...options,
    })(object, propertyName);
  };
