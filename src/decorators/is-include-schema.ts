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

/**
 * Convert { include: { thing: { include: { thing: true }}}}
 * to thing and thing.thing etc.
 */
const getEnum = <T extends Record<string, any>>(obj: T) => {
  const nestedValues: string[] = [];

  Object.entries(obj).forEach(([key, value]) => {
    if (key === 'orderBy') {
      return;
    }

    if (typeof value !== 'object') {
      nestedValues.push(key);

      return;
    }

    const { include, ...restProps } = value as Includes<T>;

    if (typeof include === 'object') {
      nestedValues.push(key);

      Object.entries(include).forEach(([includeKey, includeValue]) => {
        nestedValues.push(`${key}.${includeKey}`);

        if (typeof includeValue === 'object') {
          nestedValues.push(
            ...getEnum(includeValue).map(
              (nestedKey) => `${key}.${includeKey}.${nestedKey}`,
            ),
          );
        }
      });

      return;
    }

    nestedValues.push(...getEnum(restProps).map((nestedKey) => nestedKey));
  });

  return nestedValues;
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
              enum: getEnum(value),
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
