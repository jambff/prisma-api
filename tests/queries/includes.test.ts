import { Includes, parseIncludeQuery } from '../../src/queries/includes';

class Thing {
  foo: string;

  bar: { baz: { id: number }; qux: { id: number } };

  quux: { corge: { id: number }; rank: number };
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
};

describe('Includes', () => {
  it.each`
    query                        | result
    ${{ foo: 1 }}                | ${{ foo: true }}
    ${{ foo: true }}             | ${{ foo: true }}
    ${{ foo: 'true' }}           | ${{ foo: true }}
    ${{ foo: '1' }}              | ${{ foo: true }}
    ${{ foo: 0 }}                | ${{ foo: false }}
    ${{ foo: false }}            | ${{ foo: false }}
    ${{ foo: 'false' }}          | ${{ foo: false }}
    ${{ foo: '0' }}              | ${{ foo: false }}
    ${{ foo: 'something-else' }} | ${{ foo: false }}
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
});
