import { OmitClass } from '@jambff/api';
import { createConnectionHelpers } from '../src/connections';

class Thing {
  fooId: string;

  foo: { id: number; name: string };

  bars: { id: number; name: string }[];
}

class BaseThing extends OmitClass('BaseThing', Thing, ['foo', 'bars']) {
  bars: { id: number; rank: number };
}

const { updateConnections, createConnections } = createConnectionHelpers<
  BaseThing,
  Thing
>({
  fooId: 'foo',
  bars: {
    entity: 'bars',
    relation: 'bar',
  },
});

describe('Connections', () => {
  it('creates connections', () => {
    expect(
      createConnections({
        fooId: 1,
        bars: [
          { id: 2, rank: 3 },
          { id: 3, rank: 4 },
        ],
      }),
    ).toEqual({
      bars: {
        create: [
          {
            rank: 3,
            bar: {
              connect: {
                id: 2,
              },
            },
          },
          {
            rank: 4,
            bar: {
              connect: {
                id: 3,
              },
            },
          },
        ],
      },
      foo: {
        connect: {
          id: 1,
        },
      },
    });
  });

  it('updates connections', () => {
    expect(
      updateConnections({
        fooId: 1,
        bars: [
          { id: 2, rank: 3 },
          { id: 3, rank: 4 },
        ],
      }),
    ).toEqual({
      bars: {
        deleteMany: {},
        create: [
          {
            rank: 3,
            bar: {
              connect: {
                id: 2,
              },
            },
          },
          {
            rank: 4,
            bar: {
              connect: {
                id: 3,
              },
            },
          },
        ],
      },
      foo: {
        connect: {
          id: 1,
        },
      },
    });
  });
});
