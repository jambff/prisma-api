import { ValidationOptions } from 'class-validator';
import { createAscDescSortSchema, IsDeepObject } from '@jambff/api';

export const IsSortSchema =
  <T>(schema: (keyof T)[], options?: ValidationOptions) =>
  (object: Object, propertyName: string) => {
    IsDeepObject(createAscDescSortSchema<T>(schema), options)(
      object,
      propertyName,
    );
  };
