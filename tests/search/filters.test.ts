import { FilterType, parseFilterQuery } from '../../src/search/filters';

const filterTypes = {
  id: FilterType.NUMBER,
  createdAt: FilterType.DATE,
  title: FilterType.STRING,
  imageId: FilterType.NUMBER,
  published: FilterType.BOOLEAN,
  image: {
    id: FilterType.NUMBER,
    createdAt: FilterType.DATE,
    src: FilterType.STRING,
  },
  items: {
    id: FilterType.NUMBER,
    sets: FilterType.NUMBER,
    reps: FilterType.NUMBER,
    categories: {
      id: FilterType.NUMBER,
      name: FilterType.STRING,
    },
  },
  notAllowed: null,
};

describe('Search: Filters', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2020, 3, 1));
  });

  it.each`
    filterQuery                       | result
    ${{ id: 'equals:1' }}             | ${{ id: { equals: 1 } }}
    ${{ title: 'contains:my' }}       | ${{ title: { contains: 'my' } }}
    ${{ createdAt: 'gte:2022-01-1' }} | ${{ createdAt: { gte: new Date('2022-01-01T00:00:00.000Z') } }}
    ${{ published: 'true' }}          | ${{ published: true }}
    ${{ imageId: 'lte:10' }}          | ${{ imageId: { lte: 10 } }}
    ${{ image: 'is.id:100' }}         | ${{ image: { is: { id: 100 } } }}
  `('parses $filterQuery as a $result', ({ filterQuery, result }) => {
    expect(parseFilterQuery(filterTypes, filterQuery)).toEqual([result]);
  });

  it('parses a complex filter query given as an array', () => {
    const filterQuery = {
      items: [
        'every.sets.gte:10',
        'some.categories.some.name.contains:dumbell',
      ],
    };

    expect(parseFilterQuery(filterTypes, filterQuery)).toEqual([
      { items: { every: { sets: { gte: 10 } } } },
      {
        items: {
          some: { categories: { some: { name: { contains: 'dumbell' } } } },
        },
      },
    ]);
  });

  it('rejoins a term containing pluses', () => {
    const filterQuery = {
      title: 'contains:my+title',
    };

    expect(parseFilterQuery(filterTypes, filterQuery)).toEqual([
      { title: { contains: 'my+title' } },
    ]);
  });

  it('rejoins a term containing colons', () => {
    const filterQuery = {
      createdAt: '2022-01-01T00:00:00.000Z',
    };

    expect(parseFilterQuery(filterTypes, filterQuery)).toEqual([
      { createdAt: new Date('2022-01-01T00:00:00.000Z') },
    ]);
  });

  it('aborts for an unknown filter key', () => {
    const filterQuery = {
      unknown: 'equals:some-term',
    };

    expect(() => parseFilterQuery(filterTypes, filterQuery)).toThrow(
      '"unknown" is not a valid filter key',
    );
  });

  it('aborts for an unknown operation', () => {
    const filterQuery = {
      image: 'not-a-thing:foo',
    };

    expect(() => parseFilterQuery(filterTypes, filterQuery)).toThrow(
      'the term "not-a-thing:foo" for key "image" is not valid',
    );
  });

  it('aborts for an unknown nested operation', () => {
    const filterQuery = {
      image: 'is.nothing.equals:some-term',
    };

    expect(() => parseFilterQuery(filterTypes, filterQuery)).toThrow(
      'the term "is.nothing.equals:some-term" for key "image" is not valid',
    );
  });

  it('aborts for an invalid numerical term', () => {
    const filterQuery = {
      id: 'equals:not-a-number',
    };

    expect(() => parseFilterQuery(filterTypes, filterQuery)).toThrow(
      'the term "not-a-number" for key "id" is not valid',
    );
  });

  it('aborts for an invalid date term', () => {
    const filterQuery = {
      createdAt: 'equals:not-a-date',
    };

    expect(() => parseFilterQuery(filterTypes, filterQuery)).toThrow(
      'the term "not-a-date" for key "createdAt" is not valid',
    );
  });

  it('aborts for an invalid operation', () => {
    const filterQuery = {
      createdAt: 'not-a-thing:foo',
    };

    expect(() => parseFilterQuery(filterTypes, filterQuery)).toThrow(
      'the term "not-a-thing:foo" for key "createdAt" is not valid',
    );
  });

  it('aborts for a null filter key', () => {
    const filterQuery = {
      notAllowed: 'hello',
    };

    expect(() => parseFilterQuery(filterTypes, filterQuery)).toThrow(
      'the term "hello" for key "notAllowed" is not valid',
    );
  });
});
