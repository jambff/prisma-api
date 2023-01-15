import { abort } from '@jambff/api';
import { SearchFilterOperation, searchFilterOperations } from './operations';

export enum FilterTypeEnum {
  STRING,
  NUMBER,
  BOOLEAN,
  DATE,
}

type FilterTypeReference = { [key: string]: any };

type FilterType = FilterTypeEnum | FilterTypeReference;

export type FilterTypes<T extends Record<string, any>> = {
  [key in keyof Required<T>]: FilterType;
};

export type SearchFilters<T> = Partial<Record<keyof T, string>>;

type ParsedFilterQuery = {
  key: string;
  operation: SearchFilterOperation;
  term: string;
};

type ParsedQuery = {
  operation: string;
  term: string;
};

type WhereQueryValue = string | number | boolean | Date;

type WhereQuery = Record<
  string,
  | Record<string, WhereQueryValue>
  | Record<string, Record<string, Record<string, WhereQueryValue>>>
>[];

const isValidDate = (date: Date) => !Number.isNaN(date.getTime());

const isFilterTypeReference = (
  filterType: FilterType,
): filterType is FilterTypeReference => typeof filterType === 'object';

/**
 * Check if a string is a valid filter operation.
 */
const isOperation = (operation: string): operation is SearchFilterOperation =>
  searchFilterOperations.includes(operation as SearchFilterOperation);

/**
 * Convert terms to the types that Prisma expects for each field.
 */
const getConvertedTerm = (
  key: string,
  filterType: FilterType,
  term: string,
) => {
  if (filterType === FilterTypeEnum.NUMBER) {
    const number = Number(term);

    if (!Number.isFinite(number)) {
      abort(400, `"${term}" is not a valid number for key "${key}"`);
    }

    return number;
  }

  if (filterType === FilterTypeEnum.STRING) {
    return String(term);
  }

  if (filterType === FilterTypeEnum.BOOLEAN) {
    return Boolean(term);
  }

  if (filterType === FilterTypeEnum.DATE) {
    const date = new Date(term);

    if (!isValidDate(date)) {
      abort(400, `"${term}" is not a valid date for key "${key}"`);
    }

    return date;
  }

  abort(400, `"${term}" could not be converted for key "${key}"`);
};

/**
 * Build the query params used to filter results via Prisma.
 */
const buildPrismaWhereQuery = <T extends Record<string, any>>(
  filterTypes: FilterTypes<T>,
  parsedFilterQueries: ParsedFilterQuery[],
) => {
  const initialValue: WhereQuery = [];

  return parsedFilterQueries.reduce((acc, { operation, term, key }) => {
    if (key.includes('.')) {
      const [actualKey, referenceOperation, childKey] = key.split('.');
      const filterType = filterTypes[actualKey];

      if (!isFilterTypeReference(filterType)) {
        abort(400, `"${key}" is not a valid filter`);
      }

      return {
        ...acc,
        [actualKey]: {
          [referenceOperation]: {
            [childKey]: {
              [operation]: getConvertedTerm(key, filterType[childKey], term),
            },
          },
        },
      };
    }

    return {
      ...acc,
      [key]: { [operation]: getConvertedTerm(key, filterTypes[key], term) },
    };
  }, initialValue);
};

/**
 * Parse a filter query.
 * @example
 *  match:foo > [{ operation: 'match', term: 'foo' }]
 * @example
 *  gte:1+lt:2 > [{ operation: 'gte', term: '1' }, { operation: 'lt', term: '2' }]
 */
const parseFilterQueryString = (
  queryStringOrArray: string | string[],
): ParsedQuery[] => {
  const queryString = Array.isArray(queryStringOrArray)
    ? queryStringOrArray.join('+')
    : queryStringOrArray;

  const queries = queryString.split(/\+|%2B/g);

  return queries.reduce((acc, query, index) => {
    const [partOne, ...remainingParts] = query.split(':');

    // Rejoin anything after the first colon for things like dates, which
    // themselves contain colons.
    const partTwo = remainingParts.join(':');

    // If this is not an operation then it might mean that the query value
    // contained a plus that we split on, so re-append this to the previous
    // query. If an operation is entirely invalid we still pass that through
    // so we can pick it up later and get a more meaningful validation message.
    if (!isOperation(partOne) && index > 0) {
      acc[index - 1].term += `+${partOne}`;

      return acc;
    }

    return [
      ...acc,
      {
        operation: partOne,
        term: partTwo,
      },
    ];
  }, [] as ParsedQuery[]);
};

/**
 * Parse filters passed as query params.
 */
export const parseFilterQuery = <T extends Record<string, any>>(
  filterTypes: FilterTypes<T>,
  filterQuery: Record<string, string | string[]>,
): WhereQuery => {
  const initialValue: ParsedFilterQuery[] = [];
  const parsedFilterQueries = Object.entries(filterQuery).reduce(
    (acc, [key, queryString]) => {
      const queries = parseFilterQueryString(queryString);

      queries.forEach(({ operation, term }) => {
        if (!isOperation(operation)) {
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
