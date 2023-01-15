// https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#filter-conditions-and-operators
export const searchFilterOperations = [
  'equals',
  'in',
  'notIn',
  'lt',
  'lte',
  'gt',
  'gte',
  'contains',
  'startsWith',
  'endsWith',
  'search',
  'mode',
  'not',
] as const;

// https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#relation-filters
// https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#scalar-list-filters
export const searchFilterReferenceOperations = [
  'some',
  'every',
  'none',
  'is',
  'isNot',
  'has',
  'hasEvery',
  'hasSome',
  'isEmpty',
  'isSet',
  'equals',
] as const;

export type SearchFilterOperation = (typeof searchFilterOperations)[number];

export const ascDescSortOperations: string[] = ['asc', 'desc'];
