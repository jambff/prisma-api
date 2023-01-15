// https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#filter-conditions-and-operators
const searchFilterBaseOperations = [
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

// https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#scalar-list-filters
const searchFilterScalarListOperations = [
  'has',
  'hasEvery',
  'hasSome',
  'isEmpty',
  'isSet',
  'equals',
] as const;

// https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#relation-filters
export const searchFilterReferenceOperations = [
  'some',
  'every',
  'none',
  'is',
  'isNot',
  'has',
] as const;

export const searchFilterOperations = [
  ...searchFilterBaseOperations,
  ...searchFilterScalarListOperations,
];

export type SearchFilterOperation = (typeof searchFilterOperations)[number];

export const ascDescSortOperations: string[] = ['asc', 'desc'];
