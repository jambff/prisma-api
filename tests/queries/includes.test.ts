import { parseIncludeQuery } from '../../src/queries/includes';

const includes = {
  foo: true,
  bar: {
    baz: true,
    qux: true,
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
  `('parses $query as $result', ({ query, result }) => {
    expect(parseIncludeQuery(includes, query)).toEqual(result);
  });
});
