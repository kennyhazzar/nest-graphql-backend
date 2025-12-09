import { Scalar } from '@nestjs/graphql';
import { Kind, ValueNode, GraphQLScalarType } from 'graphql';

export type Timestamp = Date;

/**
 * Custom Timestamp scalar that handles both Date objects and ISO strings
 * Compatible with timestamptz from PostgreSQL
 */
@Scalar('Timestamp', () => Date)
export class TimestampScalar extends GraphQLScalarType {
  constructor() {
    super({
      name: 'Timestamp',
      description: 'Timestamp custom scalar type - handles Date objects and ISO strings',

      /**
       * Serializes value for sending to client
       */
      serialize(value: unknown): number | null {
        if (value === null || value === undefined) {
          return null;
        }
        if (value instanceof Date) {
          return value.getTime();
        }
        if (typeof value === 'string') {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return date.getTime();
          }
        }
        if (typeof value === 'number') {
          return value;
        }
        return null;
      },

      /**
       * Parses value from client request (variables)
       */
      parseValue(value: unknown): Date {
        if (value instanceof Date) {
          return value;
        }
        if (typeof value === 'number') {
          return new Date(value);
        }
        if (typeof value === 'string') {
          return new Date(value);
        }
        throw new Error(`Timestamp cannot parse value: ${value}`);
      },

      /**
       * Parses literal value from GraphQL query
       */
      parseLiteral(ast: ValueNode): Date | null {
        if (ast.kind === Kind.INT) {
          return new Date(parseInt(ast.value, 10));
        }
        if (ast.kind === Kind.STRING) {
          return new Date(ast.value);
        }
        return null;
      },
    });
  }
}
