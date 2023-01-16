import { abort } from '@jambff/api';
import dot from 'dot-object';
import { SearchFilterOperation, searchFilterOperations } from './operations';

export enum FilterType {
  STRING,
  NUMBER,
  BOOLEAN,
  DATE,
}

type FilterTypeOrObject = FilterType | { [key: string]: any };

export type FilterTypes<T extends Record<string, any>> = {
  [key in keyof Required<T>]: FilterTypeOrObject;
};

export type SearchFilters<T> = Partial<Record<keyof T, string>>;

type ParsedFilterQuery = {
  key: string;
  operation?: string;
  term: string;
};

type ParsedQuery = {
  operation?: string;
  term: string;
};

type WhereQueryValue = string | number | boolean | Date;

type WhereQuery = Record<
  string,
  | Record<string, WhereQueryValue>
  | Record<string, Record<string, Record<string, WhereQueryValue>>>
>[];

const isValidDate = (date: Date) => !Number.isNaN(date.getTime());

/**
 * Check if a string is a valid filter operation.
 */
const isValidOperation = (
  filterKeys: string[],
  operation?: string,
): operation is SearchFilterOperation =>
  !!operation
    ?.split('.')
    .every(
      (part) =>
        searchFilterOperations.includes(part as SearchFilterOperation) ||
        filterKeys.includes(part),
    );

/**
 * Extract a filter type path from a query.
 * @example some.categories.some.name.contains > categories.name
 */
const getFilterTypePath = (key: string, operation?: string): string =>
  [
    key,
    operation?.split('.').reduce((acc, part) => {
      if (searchFilterOperations.includes(part as SearchFilterOperation)) {
        return acc;
      }

      if (acc) {
        acc += '.';
      }

      return `${acc}${part}`;
    }, ''),
  ]
    .filter((x) => x)
    .join('.');

/**
 * Convert terms to the types that Prisma expects for each field.
 */
const getConvertedTerm = (filterType: FilterTypeOrObject, term: string) => {
  if (filterType === FilterType.NUMBER) {
    const number = Number(term);

    if (!Number.isFinite(number)) {
      throw new Error();
    }

    return number;
  }

  if (filterType === FilterType.STRING) {
    return String(term);
  }

  if (filterType === FilterType.BOOLEAN) {
    return [1, '1', 'true'].includes(term);
  }

  if (filterType === FilterType.DATE) {
    const date = new Date(term);

    if (!isValidDate(date)) {
      throw new Error();
    }

    return date;
  }

  throw new Error();
};

/**
 * Recursively get all filter keys.
 */
const getFilterKeys = <T extends Record<string, any>>(
  filterTypes: FilterTypes<T>,
): string[] => {
  const keys: string[] = [];

  Object.entries(filterTypes).forEach(([key, value]) => {
    if (typeof value === 'object') {
      keys.push(...getFilterKeys(value));
    }

    keys.push(key);
  });

  return [...new Set(keys)];
};

/**
 * Build the query params used to filter results via Prisma.
 */
const buildPrismaWhereQuery = <T extends Record<string, any>>(
  filterTypes: FilterTypes<T>,
  parsedFilterQueries: ParsedFilterQuery[],
) => {
  const query: WhereQuery = [];

  parsedFilterQueries.forEach(({ operation, term, key }) => {
    const filterTypePath = getFilterTypePath(key, operation);
    const filterType = dot.pick(filterTypePath, filterTypes);
    let convertedTerm;

    try {
      convertedTerm = getConvertedTerm(filterType, term);
    } catch {
      abort(400, `the term "${term}" for key "${key}" is not valid`);
    }

    const dotPath = operation ? `${key}.${operation}` : key;
    const dotObject = { [dotPath]: convertedTerm };

    dot.object(dotObject);

    // @ts-ignore
    query.push(dotObject);
  });

  return query;
};

/**
 * Parse a filter query.
 * @example
 *  match:foo > [{ operation: 'match', term: 'foo' }]
 * @example
 *  gte:1+lt:2 > [{ operation: 'gte', term: '1' }, { operation: 'lt', term: '2' }]
 */
const parseFilterQueryStringItem = (
  filterKeys: string[],
  queryString: string,
): ParsedQuery => {
  const [partOne, ...remainingParts] = queryString.split(':');

  // If there was no colon we're dealing with a raw value
  if (partOne === queryString) {
    return { term: partOne };
  }

  // Rejoin anything after the first colon for things like dates, which
  // themselves contain colons.
  const partTwo = remainingParts.join(':');

  // If this is not an operation then it might mean that the query value
  // contained a plus that we split on, so re-append this to the previous
  // query. If an operation is entirely invalid we still pass that through
  // so we can pick it up later and get a more meaningful validation message.
  if (!isValidOperation(filterKeys, partOne)) {
    return {
      term: `${partOne}:${partTwo}`,
    };
  }

  return {
    operation: partOne,
    term: partTwo,
  };
};

/**
 * Parse a filter query.
 * @example
 *  match:foo > [{ operation: 'match', term: 'foo' }]
 * @example
 *  gte:1+lt:2 > [{ operation: 'gte', term: '1' }, { operation: 'lt', term: '2' }]
 */
const parseFilterQueryString = (
  filterKeys: string[],
  queryStringOrArray: string | string[],
): ParsedQuery[] => {
  const queryStringArray = Array.isArray(queryStringOrArray)
    ? queryStringOrArray
    : [queryStringOrArray];

  const parsedQuery: ParsedQuery[] = [];

  return queryStringArray.reduce(
    (acc, queryString) => [
      ...acc,
      parseFilterQueryStringItem(filterKeys, queryString),
    ],
    parsedQuery,
  );
};

/**
 * Parse filters passed as query params.
 */
export const parseFilterQuery = <T extends Record<string, any>>(
  filterTypes: FilterTypes<T>,
  filterQuery: Record<string, string | string[]>,
): WhereQuery => {
  const initialValue: ParsedFilterQuery[] = [];
  const filterKeys = getFilterKeys(filterTypes);

  const parsedFilterQueries = Object.entries(filterQuery).reduce(
    (acc, [key, queryString]) => {
      const queries = parseFilterQueryString(filterKeys, queryString);

      if (!filterKeys.includes(key)) {
        abort(400, `"${key}" is not a valid filter key`);
      }

      queries.forEach(({ operation, term }) => {
        if (operation && !isValidOperation(filterKeys, operation)) {
          abort(
            400,
            `"${operation}" is not a valid operation for key "${key}"`,
          );
        }

        acc.push({
          key,
          operation,
          term,
        });
      });

      return acc;
    },
    initialValue,
  );

  return buildPrismaWhereQuery(filterTypes, parsedFilterQueries);
};
