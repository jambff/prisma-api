import { parseIncludeQuery } from '../../src/queries/includes';

const includes = {
  foo: true,
  bar: {
    include: {
      baz: true,
      qux: true,
    },
  },
  baz: {
    include: {
      quz: true,
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
    ${{ baz: true }}             | ${{ baz: true }}
    ${{ baz: ['quz'] }}          | ${{ baz: { include: { quz: true }, orderBy: { rank: 'asc' } } }}
  `('parses $query as $result', ({ query, result }) => {
    expect(parseIncludeQuery(includes, query)).toEqual(result);
  });
});
