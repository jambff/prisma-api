import { abort } from '@jambff/api';
import dot from 'dot-object';
import deepMerge from 'deepmerge';

type NestedInclude = {
  include: Record<string, boolean>;
  orderBy?: Record<string, 'asc' | 'desc'>;
};

type Unarray<T> = T extends Array<infer U> ? U : T;

type OrderBy<T extends Record<string, any>> = Partial<{
  [K in keyof T]: 'asc' | 'desc';
}>;

// Allow one level of nesting
export type Includes<T extends Record<string, any>> = Partial<{
  [K in keyof T]:
    | {
        include: Includes<Unarray<T[K]>>;
        orderBy?: OrderBy<Unarray<T[K]>>;
      }
    | boolean;
}>;

export type IncludesParam<T> = Partial<{
  [K in keyof T]: string | string[];
}>;

const parseDotValue = (value: string) =>
  dot.object({
    [value.split('.').join('.include.')]: true,
  });

export const parseIncludeQuery = <T extends Record<string, any>>(
  includes: T,
  query?: IncludesParam<T>,
) => {
  const cleanIncludes: Record<string, boolean | NestedInclude> = {};

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (!(key in includes)) {
      abort(400, `${key} is not a valid key for includes`);
    }

    if (!value) {
      return;
    }

    if (!Array.isArray(value)) {
      if ([true, 1, 'true', '1'].includes(value as string | boolean | number)) {
        cleanIncludes[key] = true;
      }

      return;
    }

    if (!value.length) {
      return;
    }

    cleanIncludes[key] = {
      orderBy: includes[key].orderBy,
      include: value.reduce((acc, part: string) => {
        const { include } = includes[key as keyof T];

        if (!include) {
          return acc;
        }

        const partValue = parseDotValue(part);

        Object.keys(partValue).forEach((partValueKey) => {
          if (typeof include === 'object' && !include[partValueKey]) {
            abort(400, `"${part}" is not a valid value for includes[${key}][]`);
          }
        });

        if (include[part]?.orderBy) {
          return {
            ...acc,
            [part]: {
              orderBy: include[part].orderBy,
            },
          };
        }

        return deepMerge(acc, parseDotValue(part));
      }, {}),
    };
  });

  if (!Object.keys(cleanIncludes).length) {
    return;
  }

  return cleanIncludes;
};
