import { abort } from '@jambff/api';

// Allow one level of nesting
export type Includes<T, L extends boolean = false> = Partial<{
  [K in keyof T]: L extends true ? boolean : Includes<T[K], true> | boolean;
}>;

export type IncludesParam<T> = Partial<{
  [K in keyof T]: string | string[];
}>;

export const parseIncludeQuery = <T>(
  includes: Includes<T>,
  query?: IncludesParam<T>,
) => {
  const cleanIncludes: Record<
    string,
    boolean | { include: Record<string, boolean> }
  > = {};

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
      include: value.reduce((acc, part: string) => {
        const child = includes[key as keyof T];

        if (typeof child === 'object' && !(part in child)) {
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

export const createIncludes = <T extends Record<string, any>>(
  includes: Includes<T>,
): Includes<T> => includes;
