import { OmitClass } from '@jambff/api';
import { createConnectionHelpers } from '../src/connections';

class Thing {
  fooId: string;

  foo: { id: number; name: string };

  bars: { id: number; name: string }[];

  bazs: { id: number; name: string }[];

  quxs: { id: number; name: string }[];
}

class BaseThing extends OmitClass('BaseThing', Thing, [
  'foo',
  'bars',
  'bazs',
  'quxs',
]) {
  bars: { id: number; duration: number };

  bazs: { id: number; rank: number };

  quxs: { relatedId: number; name: string }[];
}

const { updateConnections, createConnections } = createConnectionHelpers<
  BaseThing,
  Thing
>({
  fooId: 'foo',
  bars: {
    key: 'bars',
    entity: 'bar',
  },
  bazs: {
    key: 'bazs',
    entity: 'baz',
    orderKey: 'rank',
  },
  quxs: {
    key: 'quxs',
    entity: 'qux',
    idKey: 'relatedId',
  },
});

describe('Connections', () => {
  describe('create', () => {
    it('creates connections', () => {
      expect(
        createConnections({
          fooId: 1,
          bars: [
            { id: 2, duration: 3 },
            { id: 3, duration: 4 },
          ],
          bazs: [],
          quxs: [],
        }),
      ).toEqual({
        bars: {
          create: [
            {
              duration: 3,
              bar: {
                connect: {
                  id: 2,
                },
              },
            },
            {
              duration: 4,
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

    it('creates connections with a rank', () => {
      expect(
        createConnections({
          fooId: 1,
          bars: [],
          bazs: [
            { id: 2, duration: 3 },
            { id: 3, duration: 4 },
          ],
          quxs: [],
        }),
      ).toEqual({
        bazs: {
          create: [
            {
              duration: 3,
              rank: 0,
              baz: {
                connect: {
                  id: 2,
                },
              },
            },
            {
              duration: 4,
              rank: 1,
              baz: {
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

    it('creates connections with a custom ID key', () => {
      expect(
        createConnections({
          fooId: 1,
          bars: [],
          bazs: [],
          quxs: [{ relatedId: 2, duration: 3 }],
        }),
      ).toEqual({
        quxs: {
          create: [
            {
              duration: 3,
              qux: {
                connect: {
                  id: 2,
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

  describe('update', () => {
    it('updates connections', () => {
      expect(
        updateConnections({
          fooId: 1,
          bars: [
            { id: 2, duration: 3 },
            { id: 3, duration: 4 },
          ],
        }),
      ).toEqual({
        bars: {
          deleteMany: {},
          create: [
            {
              duration: 3,
              bar: {
                connect: {
                  id: 2,
                },
              },
            },
            {
              duration: 4,
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

    it('updates connections with a rank', () => {
      expect(
        updateConnections({
          bazs: [
            { id: 2, duration: 3 },
            { id: 3, duration: 4 },
          ],
        }),
      ).toEqual({
        bazs: {
          deleteMany: {},
          create: [
            {
              duration: 3,
              rank: 0,
              baz: {
                connect: {
                  id: 2,
                },
              },
            },
            {
              duration: 4,
              rank: 1,
              baz: {
                connect: {
                  id: 3,
                },
              },
            },
          ],
        },
      });
    });

    it('updates connections with a custom ID key', () => {
      expect(
        updateConnections({
          quxs: [{ relatedId: 2, duration: 3 }],
        }),
      ).toEqual({
        quxs: {
          deleteMany: {},
          create: [
            {
              duration: 3,
              qux: {
                connect: {
                  id: 2,
                },
              },
            },
          ],
        },
      });
    });
  });
});
