import { PrismaClient } from '@prisma/client';
import { registerDecorator, ValidationOptions } from 'class-validator';

export const IsUnique =
  (
    prisma: PrismaClient,
    entity: keyof Omit<PrismaClient, `$${string}`>,
    options?: ValidationOptions,
  ) =>
  (object: Object, propertyName: string) => {
    registerDecorator({
      name: 'IsUnique',
      target: object.constructor,
      propertyName,
      constraints: [],
      options,
      validator: {
        async validate(value: any) {
          const item = await prisma[entity].findFirst({
            where: { [propertyName]: value },
          });

          // Note that the comparison to the specific value below isn't strictly
          // necessary as we obviously already queried by that value above, but
          // it does make integration testing a bit easier.
          return !item || item?.[propertyName] !== value;
        },

        defaultMessage: () => `${propertyName} must be unique`,
      },
    });
  };
