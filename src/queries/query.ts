export const getFullTextSearchQuery = (
  text: string,
  joinWith: '&' | '|' = '&',
) => ({
  search: `${text
    .split(' ')
    .filter((x) => x)
    .join(joinWith)}:*`,
});
