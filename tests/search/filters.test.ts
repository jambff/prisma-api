import { FilterTypeEnum, parseFilterQuery } from '../../src/search/filters';

const filterTypes = {
  id: FilterTypeEnum.NUMBER,
  createdAt: FilterTypeEnum.DATE,
  title: FilterTypeEnum.STRING,
  imageId: FilterTypeEnum.NUMBER,
  published: FilterTypeEnum.BOOLEAN,
  image: {
    id: FilterTypeEnum.NUMBER,
    createdAt: FilterTypeEnum.DATE,
    src: FilterTypeEnum.STRING,
  },
  items: {
    id: FilterTypeEnum.NUMBER,
    sets: FilterTypeEnum.NUMBER,
    reps: FilterTypeEnum.NUMBER,
  },
};

describe('Search: Filters', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2020, 3, 1));
  });

  it('parses a complex filter query', () => {
    const filterQuery = {
      id: 'equals:1',
      title: 'contains:my',
      createdAt: 'gte:2022-01-1',
      published: 'equals:true',
      imageId: 'lte:10',
      'image.is.id': 'equals:1',
      'items.some.sets': 'gte:10',
    };

    expect(parseFilterQuery(filterTypes, filterQuery)).toEqual({
      createdAt: { gte: new Date('2022-01-01T00:00:00.000Z') },
      id: { equals: 1 },
      imageId: { lte: 10 },
      image: { is: { id: { equals: 1 } } },
      items: { some: { sets: { gte: 10 } } },
      published: { equals: true },
      title: { contains: 'my' },
    });
  });

  it('rejoins a term containing pluses', () => {
    const filterQuery = {
      title: 'contains:my+title',
    };

    expect(parseFilterQuery(filterTypes, filterQuery)).toEqual({
      title: { contains: 'my+title' },
    });
  });

  it.only('handles multiple queries for the same key', () => {
    const filterQuery = {
      title: ['in:one', 'in:one'],
    };

    expect(parseFilterQuery(filterTypes, filterQuery)).toEqual({
      title: { in: ['one', 'two'] },
    });
  });

  it('aborts for an unknown filter type', () => {
    const filterQuery = {
      unknown: 'equals:some-term',
    };

    expect(() => parseFilterQuery(filterTypes, filterQuery)).toThrow(
      '"some-term" could not be converted for key "unknown"',
    );
  });

  it('aborts for an unknown child filter type', () => {
    const filterQuery = {
      'image.is.nothing': 'equals:some-term',
    };

    expect(() => parseFilterQuery(filterTypes, filterQuery)).toThrow(
      '"some-term" could not be converted for key "image.is.nothing"',
    );
  });

  it('aborts for an invalid numerical term', () => {
    const filterQuery = {
      id: 'equals:not-a-number',
    };

    expect(() => parseFilterQuery(filterTypes, filterQuery)).toThrow(
      '"not-a-number" is not a valid number for key "id"',
    );
  });

  it('aborts for an invalid date term', () => {
    const filterQuery = {
      createdAt: 'equals:not-a-date',
    };

    expect(() => parseFilterQuery(filterTypes, filterQuery)).toThrow(
      '"not-a-date" is not a valid date for key "createdAt"',
    );
  });

  it('aborts for an invalid operation', () => {
    const filterQuery = {
      createdAt: 'not-a-thing:foo',
    };

    expect(() => parseFilterQuery(filterTypes, filterQuery)).toThrow(
      '"not-a-thing" is not a valid operation for key "createdAt"',
    );
  });

  it('aborts for an unknown child reference', () => {
    const filterQuery = {
      'not.a.thing': 'equals:foo',
    };

    expect(() => parseFilterQuery(filterTypes, filterQuery)).toThrow(
      '"not.a.thing" is not a valid filter',
    );
  });
});
