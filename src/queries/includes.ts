import { abort } from '@jambff/api';

type NestedInclude = {
  include: Record<string, boolean>;
  orderBy?: Record<string, 'asc' | 'desc'>;
};

// Allow one level of nesting
export type Includes<T, L extends boolean = false> = Partial<{
  [K in keyof T]: L extends true
    ? boolean
    :
        | {
            include: Includes<T[K], true>;
            orderBy?: Partial<Record<keyof T[K], 'asc' | 'desc'>>;
          }
        | boolean;
}>;

export type IncludesParam<T> = Partial<{
  [K in keyof T]: string | string[];
}>;

export const parseIncludeQuery = <T extends Record<string, any>>(
  includes: T,
  query?: IncludesParam<T>,
) => {
  const cleanIncludes: Record<string, boolean | NestedInclude> = {};

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (!(key in includes)) {
      abort(400, `${key} is not a valid key for includes`);
    }

    if (!Array.isArray(value)) {
      cleanIncludes[key] = [true, 1, 'true', '1'].includes(
        value as string | boolean | number,
      );

      return;
    }

    if (!value.length) {
      return;
    }

    cleanIncludes[key] = {
      orderBy: includes[key].orderBy,
      include: value.reduce((acc, part: string) => {
        const { include } = includes[key as keyof T];

        if (include && typeof include === 'object' && !include[part]) {
          abort(400, `"${part}" is not a valid value for includes[${key}][]`);
        }

        return {
          ...acc,
          [part]: true,
        };
      }, {}),
    };
  });

  if (!Object.keys(cleanIncludes).length) {
    return;
  }

  return cleanIncludes;
};
