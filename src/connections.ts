type MappedPropertyObject<T> = {
  key: keyof T;
  entity: string;
  orderKey?: string;
};

type MappedProperty<T> = keyof T | MappedPropertyObject<T>;

type ConnectionMap<
  T extends Record<string, any>,
  U extends Record<string, any>,
> = {
  [key in keyof Partial<T & U>]: MappedProperty<U>;
};

const toIdArray = (arr: ({ id: number } | number)[]) =>
  arr
    .map((item) => (typeof item === 'object' ? item.id : item))
    .filter((id) => id)
    .map((id) => ({ id }));

const isMappedEntity = <T>(
  mappedProperty: MappedProperty<T>,
): mappedProperty is MappedPropertyObject<T> =>
  typeof mappedProperty === 'object' && !!mappedProperty.entity;

const getMappedEntityCreateQuery = (
  data: { id: number }[],
  relation: string,
  orderKey?: string,
) =>
  data.map(({ id, ...restProps }: { id: number }, i) => ({
    ...restProps,
    ...(orderKey ? { [orderKey]: i } : {}),
    [relation]: {
      connect: {
        id,
      },
    },
  }));

export const createConnections = <
  T extends Record<string, any>,
  U extends Record<string, any> = T,
>(
  data: { [key in keyof T]: any },
  connectionMap: ConnectionMap<T, U>,
) => {
  const connectedData: { [key in keyof (T | U)]: any } = { ...data } as {
    [key in keyof T]: any;
  };

  Object.entries(connectionMap).forEach(([idKey, mappedProperty]) => {
    const mappedEntity = isMappedEntity(mappedProperty)
      ? mappedProperty.key
      : mappedProperty;

    delete connectedData[idKey];
    delete connectedData[mappedEntity as keyof (T | U)];

    const value = Array.isArray(data[idKey])
      ? toIdArray(data[idKey])
      : data[idKey];

    if (!value || (Array.isArray(value) && !value.length)) {
      return;
    }

    if (isMappedEntity(mappedProperty)) {
      connectedData[mappedEntity as keyof (T | U)] = {
        create: getMappedEntityCreateQuery(
          data[idKey],
          mappedProperty.entity,
          mappedProperty.orderKey,
        ),
      };

      return;
    }

    connectedData[mappedEntity as keyof (T | U)] = {
      connect: Array.isArray(data[idKey]) ? value : { id: value },
    };
  });

  return connectedData;
};

export const updateConnections = <
  T extends Record<string, any>,
  U extends Record<string, any>,
>(
  data: { [key in keyof Partial<T>]: any },
  connectionMap: ConnectionMap<T, U>,
) => {
  const connectedData: { [key in keyof (T | U)]: any } = { ...data } as {
    [key in keyof T]: any;
  };

  Object.entries(connectionMap).forEach(([idKey, mappedProperty]) => {
    const mappedEntity = isMappedEntity(mappedProperty)
      ? mappedProperty.key
      : mappedProperty;

    delete connectedData[idKey];
    delete connectedData[mappedEntity as keyof (T | U)];

    const value = Array.isArray(data[idKey])
      ? toIdArray(data[idKey])
      : data[idKey];

    if (!value || (Array.isArray(value) && !value.length)) {
      return;
    }

    if (isMappedEntity(mappedProperty)) {
      connectedData[mappedEntity as keyof (T | U)] = {
        deleteMany: {},
        create: getMappedEntityCreateQuery(
          data[idKey],
          mappedProperty.entity,
          mappedProperty.orderKey,
        ),
      };

      return;
    }

    connectedData[mappedEntity as keyof (T | U)] = {
      [Array.isArray(data[idKey]) ? 'set' : 'connect']: Array.isArray(
        data[idKey],
      )
        ? value
        : { id: value },
    };
  });

  return connectedData;
};

export const createConnectionHelpers = <
  T extends Record<string, any>,
  U extends Record<string, any>,
>(
  connectionMap: ConnectionMap<T, U>,
) => ({
  createConnections: (data: { [key in keyof T]: any }) =>
    createConnections<T, U>(data, connectionMap),
  updateConnections: (data: { [key in keyof Partial<T>]: any }) =>
    updateConnections<T, U>(data, connectionMap),
});
