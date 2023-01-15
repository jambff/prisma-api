export const getFullTextSearchQuery = (text: string) => ({
  search: `${text.split(' ').join('|')}:*`,
});
