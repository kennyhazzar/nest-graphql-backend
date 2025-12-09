import { Field, ObjectType, Int } from '@nestjs/graphql';
import { Type } from '@nestjs/common';

export function Paginated<T>(classRef: Type<T>) {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedType {
    @Field(() => [classRef], { nullable: 'items', description: 'Results' })
    nodes!: T[];

    @Field(() => Int, { description: 'Total count of elements' })
    totalCount!: number;
  }

  return PaginatedType;
}
