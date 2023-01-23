export const ascDescSortOperations: string[] = ['asc', 'desc'];

export type AscDescSort<Keys extends string> = Partial<
  Record<Keys, (typeof ascDescSortOperations)[number]>
>;
