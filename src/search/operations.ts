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

export const searchFilterReferenceOperations = [
  'some',
  'every',
  'none',
  'is',
  'isNot',
] as const;

export type SearchFilterOperation = (typeof searchFilterOperations)[number];

export const ascDescSortOperations: string[] = ['asc', 'desc'];
