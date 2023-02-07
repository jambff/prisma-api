import { PrismaClient } from '@prisma/client';
import { registerDecorator, ValidationOptions } from 'class-validator';

export const IsUnique =
  (
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
          const prisma = new PrismaClient();
          const count = await prisma[entity].count({
            where: { [propertyName]: value },
          });

          return count === 0;
        },

        defaultMessage: () => `${propertyName} must be unique`,
      },
    });
  };
