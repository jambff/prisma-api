import { Includes, parseIncludeQuery } from '../../src/queries/includes';

class AndYetAnotherThing {
  id: number;
}

class YetAnotherThing {
  thing: AndYetAnotherThing;

  rank: number;
}

class AnotherThing {
  things: YetAnotherThing[];
}

class Thing {
  foo: string;

  bar: { baz: { id: number }; qux: { id: number } };

  quux: { corge: { id: number }; rank: number };

  thing: AnotherThing;
}

const includes: Includes<Thing> = {
  foo: true,
  bar: {
    include: {
      baz: true,
      qux: true,
    },
  },
  quux: {
    include: {
      corge: true,
    },
    orderBy: {
      rank: 'asc',
    },
  },
  thing: {
    include: {
      things: {
        orderBy: {
          rank: 'asc',
        },
        include: {
          thing: true,
        },
      },
    },
  },
};

describe('Includes', () => {
  it.each`
    query                        | result
    ${{ foo: 1 }}                | ${{ foo: true }}
    ${{ foo: true }}             | ${{ foo: true }}
    ${{ foo: 'true' }}           | ${{ foo: true }}
    ${{ foo: '1' }}              | ${{ foo: true }}
    ${{ foo: 0 }}                | ${undefined}
    ${{ foo: false }}            | ${undefined}
    ${{ foo: 'false' }}          | ${undefined}
    ${{ foo: '0' }}              | ${undefined}
    ${{ foo: 'something-else' }} | ${undefined}
    ${{ bar: ['baz'] }}          | ${{ bar: { include: { baz: true } } }}
    ${{ bar: ['baz', 'qux'] }}   | ${{ bar: { include: { baz: true, qux: true } } }}
    ${{ quux: true }}            | ${{ quux: true }}
    ${{ quux: ['corge'] }}       | ${{ quux: { include: { corge: true }, orderBy: { rank: 'asc' } } }}
    ${{}}                        | ${undefined}
    ${undefined}                 | ${undefined}
    ${null}                      | ${undefined}
  `('parses $query as $result', ({ query, result }) => {
    expect(parseIncludeQuery(includes, query)).toEqual(result);
  });

  it('parses a nested query in array form', () => {
    expect(parseIncludeQuery(includes, { thing: ['things.thing'] })).toEqual({
      thing: { include: { things: { include: { thing: true } } } },
    });
  });

  it('includes an orderBy property for a nested query', () => {
    expect(parseIncludeQuery(includes, { thing: ['things'] })).toEqual({
      thing: {
        include: {
          things: {
            orderBy: {
              rank: 'asc',
            },
          },
        },
      },
    });
  });

  it('includes an orderBy property for a nested query with child', () => {
    expect(
      parseIncludeQuery(includes, { thing: ['things', 'things.thing'] }),
    ).toEqual({
      thing: {
        include: {
          things: {
            orderBy: {
              rank: 'asc',
            },
            include: {
              thing: true,
            },
          },
        },
      },
    });
  });
});
