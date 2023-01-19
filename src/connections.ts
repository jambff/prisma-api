export const toIdArray = (arr: ({ id: number } | number)[]) =>
  arr
    .map((item) => (typeof item === 'object' ? item.id : item))
    .filter((id) => id)
    .map((id) => ({ id }));

export const createConnections = <
  T extends Record<string, any>,
  U extends Record<string, any> = T,
>(
  data: { [key in keyof T]: any },
  connectionMap: { [key in keyof Partial<T & U>]: keyof U },
) => {
  const connectedData: { [key in keyof (T | U)]: any } = { ...data } as {
    [key in keyof T]: any;
  };

  Object.entries(connectionMap).forEach(([idKey, mappedProperty]) => {
    delete connectedData[idKey];
    delete connectedData[mappedProperty as keyof (T | U)];

    const value = Array.isArray(data[idKey])
      ? toIdArray(data[idKey])
      : data[idKey];

    if (!value) {
      return;
    }

    connectedData[mappedProperty as keyof (T | U)] = {
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
  connectionMap: { [key in keyof Partial<T & U>]: keyof U },
) => {
  const connectedData: { [key in keyof (T | U)]: any } = { ...data } as {
    [key in keyof T]: any;
  };

  Object.entries(connectionMap).forEach(([idKey, mappedProperty]) => {
    delete connectedData[idKey];
    delete connectedData[mappedProperty as keyof (T | U)];

    const value = Array.isArray(data[idKey])
      ? toIdArray(data[idKey])
      : data[idKey];

    if (!value) {
      return;
    }

    connectedData[mappedProperty as keyof (T | U)] = {
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
>(connectionMap: { [key in keyof Partial<T & U>]: keyof U }) => ({
  createConnections: (data: { [key in keyof T]: any }) =>
    createConnections<T, U>(data, connectionMap),
  updateConnections: (data: { [key in keyof Partial<T>]: any }) =>
    updateConnections<T, U>(data, connectionMap),
});
