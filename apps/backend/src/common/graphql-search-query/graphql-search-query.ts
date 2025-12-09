import { Injectable, Logger } from '@nestjs/common';
import { Field, InputType, Int } from '@nestjs/graphql';
import { GraphQLResolveInfo } from 'graphql';
import { parseResolveInfo, ResolveTree, simplifyParsedResolveInfoFragmentWithType } from 'graphql-parse-resolve-info';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Max, Min } from 'class-validator';
import {
  Between,
  EntityManager,
  EntityTarget,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ILike,
  In,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { RelationMetadata } from 'typeorm/metadata/RelationMetadata';

import { SearchQueryOrderDirection } from '@/enums/search-query-order-direction.enum';

const columnsDontShow = [
  'password',
  'emailConfirmKey',
  'forgotConfirmKey',
  'deletedAt',
  'path',
  'role',
  'avatarId',
  'fileId',
];
const columnsInt = ['fixed', 'decimal', 'float', 'double', 'int', 'integer', 'smallint', 'bigint', 'numeric'];

@InputType({ description: 'Date filter' })
abstract class SearchWhereDateInput {
  @Field(() => Date, { nullable: true, description: 'Start date' })
  from?: Date;

  @Field(() => Date, { nullable: true, description: 'End date' })
  to?: Date;
}

@InputType({ description: 'Integer filter' })
abstract class SearchWhereIntInput {
  @Field(() => Int, { nullable: true, description: 'Minimum value' })
  min?: number;

  @Field(() => Int, { nullable: true, description: 'Maximum value' })
  max?: number;
}

abstract class SearchWhereAndOrInput {}

abstract class SearchWhereInput {
  // Define where input fields based on the entity
  and?: SearchWhereAndOrInput;
  or?: SearchWhereAndOrInput;
}

abstract class SearchOrderInput {
  // Define order input fields based on the entity
}

@InputType({ description: 'Pagination' })
abstract class PaginationInput {
  // Define pagination input fields based on the entity
  @Field(() => Int, {
    nullable: true,
    description: 'Limit (paginated) - max number of entities should be taken',
    defaultValue: 5,
  })
  @Max(1000, { message: 'Page number cannot exceed 1000' })
  @Min(0, { message: 'Page number must be at least 0' })
  take?: number = 5;

  @Field(() => Int, {
    nullable: true,
    description: 'Offset (paginated) where from entities should be taken',
    defaultValue: 0,
  })
  @Max(100, { message: 'Limit cannot exceed 100' })
  @Min(0, { message: 'Limit must be at least 0' })
  skip?: number = 0;
}

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
export abstract class SearchQuery<Entity extends ObjectLiteral = ObjectLiteral> {
  abstract order?: SearchOrderInput;
  abstract where?: SearchWhereInput;
  abstract pagination?: PaginationInput;
}

@Injectable()
export class GraphqlSearchQuery {
  private readonly logger = new Logger(GraphqlSearchQuery.name);

  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  private searchWhere<Entity extends ObjectLiteral>(
    decoratorEntityName: string,
    repository: Repository<Entity>,
  ): SearchWhereInput {
    const searchWhereAnd = class extends SearchWhereAndOrInput {};
    const searchWhereOr = class extends SearchWhereAndOrInput {};

    const { ownColumns: metadataColumns, eagerRelations } = repository.metadata;
    for (const column of metadataColumns) {
      if (column.isSelect === false || columnsDontShow.includes(column.propertyName)) {
        // Skip columns that should not be shown in the search query order
        continue;
      }

      Object.defineProperty(searchWhereAnd, column.propertyName, {
        enumerable: true,
        writable: true,
      });

      if (column.type === 'boolean') {
        Reflect.decorate(
          [
            Field(() => Boolean, {
              nullable: true,
              description: `Filter by ${column.comment || column.propertyName}`,
            }),
          ],
          searchWhereAnd.prototype,
          column.propertyName,
        );
        Reflect.decorate(
          [
            Field(() => Boolean, {
              nullable: true,
              description: `Filter by ${column.comment || column.propertyName}`,
            }),
          ],
          searchWhereOr.prototype,
          column.propertyName,
        );
      } else if (column.type === 'timestamp' || column.type === 'timestamptz') {
        Reflect.decorate(
          [
            Field(() => SearchWhereDateInput, {
              nullable: true,
              description: `Filter by ${column.comment || column.propertyName}`,
            }),
          ],
          searchWhereAnd.prototype,
          column.propertyName,
        );
        Reflect.decorate(
          [
            Field(() => SearchWhereDateInput, {
              nullable: true,
              description: `Filter by ${column.comment || column.propertyName}`,
            }),
          ],
          searchWhereOr.prototype,
          column.propertyName,
        );
      } else if (columnsInt.includes(column.type as string)) {
        Reflect.decorate(
          [
            Field(() => SearchWhereIntInput, {
              nullable: true,
              description: `Filter by ${column.comment || column.propertyName}`,
            }),
          ],
          searchWhereAnd.prototype,
          column.propertyName,
        );
        Reflect.decorate(
          [
            Field(() => SearchWhereIntInput, {
              nullable: true,
              description: `Filter by ${column.comment || column.propertyName}`,
            }),
          ],
          searchWhereOr.prototype,
          column.propertyName,
        );
      } else if (column.type === 'enum') {
        const enumName = column.enumName;
        if (enumName) {
          try {
            Reflect.decorate(
              [
                Field(() => [eval(`require('../../enums').${enumName}`)], {
                  nullable: true,
                  description: `Filter by ${column.comment || column.propertyName}`,
                }),
              ],
              searchWhereAnd.prototype,
              column.propertyName,
            );
          } catch (error: any) {
            this.logger.error(`Error decorating ${column.propertyName} in ${decoratorEntityName}: ${error}`);
            Reflect.decorate(
              [
                Field(() => String, {
                  nullable: true,
                  description: `Filter by ${column.comment || column.propertyName}`,
                }),
              ],
              searchWhereAnd.prototype,
              column.propertyName,
            );
          }

          try {
            Reflect.decorate(
              [
                Field(() => [eval(`require('../../enums').${enumName}`)], {
                  nullable: true,
                  description: `Filter by ${column.comment || column.propertyName}`,
                }),
              ],
              searchWhereOr.prototype,
              column.propertyName,
            );
          } catch (error: any) {
            this.logger.error(`Error decorating ${column.propertyName}: ${error}`);
            Reflect.decorate(
              [
                Field(() => String, {
                  nullable: true,
                  description: `Filter by ${column.comment || column.propertyName}`,
                }),
              ],
              searchWhereOr.prototype,
              column.propertyName,
            );
          }
        }
      } else {
        let description: string;
        if (column.propertyName === 'id' || column.propertyName.match(/Id$/)) {
          description = `Filter by exact match ${column.comment || column.propertyName}`;
        } else {
          description = `Filter by ILike %${column.comment || column.propertyName}%`;
        }
        // For other types, use a String field
        Reflect.decorate(
          [
            Field(() => String, {
              nullable: true,
              description,
            }),
          ],
          searchWhereAnd.prototype, // Define the property on the class prototype
          column.propertyName, // The property name
        );
        Reflect.decorate(
          [
            Field(() => String, {
              nullable: true,
              description,
            }),
          ],
          searchWhereOr.prototype, // Define the property on the class prototype
          column.propertyName, // The property name
        );
      }
    }

    // Fill eagerRelations
    for (const relation of eagerRelations) {
      if (columnsDontShow.includes(relation.propertyName)) {
        // Skip columns that should not be shown in the search query order
        continue;
      }

      const comment = relation.joinColumns[0]?.comment;
      const propertyName = relation.propertyName;
      const propertyNameUpper = GraphqlSearchQuery.firstLetterUpperCase(propertyName);
      const subordinateEntity = this.entityManager.getRepository(relation.type);
      if (!subordinateEntity) {
        this.logger.warn(`Relation type for ${propertyName} is not a function`);
        continue;
      }
      const subordinateEntityName = `${decoratorEntityName}${propertyNameUpper}`;

      Object.defineProperty(searchWhereAnd, relation.propertyName, {
        enumerable: true,
        writable: true,
      });

      const subordinateSearchWhere = this.searchWhere(subordinateEntityName, subordinateEntity);

      Reflect.decorate(
        [
          Field(() => subordinateSearchWhere, {
            nullable: true,
            description: `Filter by ${comment || propertyName}`,
          }),
        ],
        searchWhereAnd.prototype, // Define the property on the class prototype
        propertyName, // The property name
      );
      Reflect.decorate(
        [
          Field(() => subordinateSearchWhere, {
            nullable: true,
            description: `Filter by ${comment || propertyName}`,
          }),
        ],
        searchWhereOr.prototype, // Define the property on the class prototype
        propertyName, // The property name
      );
    }

    const searchWhereInput = class extends SearchWhereInput {};

    Reflect.decorate(
      [
        Field(() => searchWhereAnd, {
          nullable: true,
          description: `Filter AND`,
        }),
      ],
      searchWhereInput.prototype, // Define the property on the class prototype
      'and', // The property name
    );

    Reflect.decorate(
      [
        Field(() => searchWhereOr, {
          nullable: true,
          description: `Filter OR`,
        }),
      ],
      searchWhereInput.prototype, // Define the property on the class prototype
      'or', // The property name
    );

    Reflect.decorate([InputType(`${decoratorEntityName}WhereAnd`)], searchWhereAnd);
    Reflect.decorate([InputType(`${decoratorEntityName}WhereOr`)], searchWhereOr);
    Reflect.decorate([InputType(`${decoratorEntityName}Where`)], searchWhereInput);
    return searchWhereInput as SearchWhereInput;
  }

  private searchOrder<Entity extends ObjectLiteral>(decoratorEntityName: string, repository: Repository<Entity>) {
    const searchOrderInput = class extends SearchOrderInput {};

    const metadataColumns = repository.metadata.ownColumns;
    for (const column of metadataColumns) {
      if (column.isSelect === false || columnsDontShow.includes(column.propertyName)) {
        // Skip columns that should not be shown in the search query order
        continue;
      }

      Object.defineProperty(searchOrderInput.prototype, column.propertyName, {
        enumerable: true,
        configurable: true,
        writable: true,
      });
      Reflect.decorate(
        [
          Field(() => SearchQueryOrderDirection, {
            nullable: true,
            description: `Sort by ${column.comment || column.propertyName}`,
          }),
        ],
        searchOrderInput.prototype,
        column.propertyName,
      );
    }

    Reflect.decorate([InputType(`${decoratorEntityName}Order`)], searchOrderInput);
    return searchOrderInput;
  }

  create<Entity extends ObjectLiteral>(entity: EntityTarget<Entity>) {
    const repository = this.entityManager.getRepository(entity);
    if (!repository) {
      throw new Error(`Repository for ${JSON.stringify(entity)} not found`);
    }
    const entityName = repository?.metadata?.name.replace(/Entity/i, '');
    if (!entityName) {
      throw new Error(`Entity name for ${JSON.stringify(entity)} not found`);
    }

    const orderInput = this.searchOrder<Entity>(entityName, repository);
    const whereInput = this.searchWhere<Entity>(entityName, repository);

    const searchQuery = class extends SearchQuery<Entity> {
      order = orderInput;
      where = whereInput;
      pagination?: PaginationInput;
    };

    Reflect.decorate(
      [
        Field(() => orderInput, {
          nullable: true,
          description: 'Order for GraphQL search queries',
        }),
      ],
      searchQuery.prototype,
      'order',
    );

    Reflect.decorate(
      [
        Field(() => whereInput, {
          nullable: true,
          description: 'Filters applied to search',
        }),
      ],
      searchQuery.prototype,
      'where',
    );

    Reflect.decorate(
      [
        Field(() => PaginationInput, {
          nullable: true,
          description: 'Pagination for GraphQL search queries',
        }),
      ],
      searchQuery.prototype,
      'pagination',
    );

    Reflect.decorate([InputType(`${entityName}Search`)], searchQuery);

    return searchQuery as SearchQuery<Entity>;
  }

  /**
   * Convert first letter to uppercase
   */
  static firstLetterUpperCase(string: string): string {
    if (!string) {
      return '';
    }
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  /**
   * Check if condition is a date
   */
  static isQueryDate(condition: object): boolean {
    if ('from' in condition || 'to' in condition) {
      return true;
    }
    return false;
  }

  /**
   * Check if condition is an integer
   */
  static isQueryInt(condition: object): boolean {
    if ('max' in condition || 'min' in condition) {
      return true;
    }
    return false;
  }

  /**
   * Check if condition is an enum
   */
  static isQueryEnum(condition: object): boolean {
    if (Array.isArray(condition)) {
      return true;
    }
    return false;
  }

  /**
   * Check if condition is a subquery
   * @param condition - Condition to check
   * @returns {boolean} - Returns true if condition is a subquery, otherwise false
   */
  static isSubquery(condition: object): boolean {
    return 'and' in condition || 'or' in condition;
  }

  /**
   * Find columns
   *
   * @param columns - Array of columns to check
   * @param aliasOrName - Alias or name of the column
   * @returns {boolean} - Returns true if column is found, otherwise false
   */
  static findColumns(columns: Array<Record<string, any>>, aliasOrName: string): boolean {
    for (const [index, column] of columns.entries()) {
      if (column[aliasOrName]) {
        return true;
      }
      if (Array.isArray(column)) {
        return GraphqlSearchQuery.findColumns(column[index], aliasOrName);
      }
    }
    return false;
  }

  /**
   * Generate SQL query from field info
   * @param columns - Array of columns to check
   * @param fields - Field information
   * @param select - Field selection for SQL query
   */
  static generateSQLqueryFromInfo(
    columns: Array<Record<string, any>>,
    fields: ResolveTree,
    select: Record<string, boolean | object>,
  ) {
    const aliasOrName = fields.alias || fields.name;

    const filter = GraphqlSearchQuery.findColumns(columns, aliasOrName);
    if (!filter) {
      return;
    }

    if (fields.fieldsByTypeName === undefined || Object.keys(fields.fieldsByTypeName).length === 0) {
      // If no nested fields, just add alias or name
      select[aliasOrName] = true;
      return;
    }

    select[aliasOrName] = {};
    for (const graphQlField of Object.values(fields.fieldsByTypeName)) {
      for (const [, fieldValue] of Object.entries(graphQlField)) {
        GraphqlSearchQuery.generateSQLqueryFromInfo(
          columns,
          fieldValue,
          select[aliasOrName] as Record<string, boolean | object>,
        );
      }
    }
  }

  /**
   * Load eager relations
   * @param eager - Array of relation metadata to load
   * @returns {Record<string, any>[]} - Returns array of objects with loaded relations
   */
  loadEagerRelations(eager: RelationMetadata[]): Record<string, any>[] {
    const relations: Record<string, any>[] = [];
    eager.forEach((relation) => {
      relations.push({ [relation.propertyName]: true });
      relations.push({
        ...relation.inverseEntityMetadata.columns.reduce(
          (acc, column) => {
            if (column.isSelect && !columnsDontShow.includes(column.propertyName)) {
              acc.push({ [column.propertyName]: true });
            }
            return acc;
          },
          [] as Record<string, any>[],
        ),
      });
    });
    return relations;
  }

  /**
   * Generate WHERE condition for query
   * @param name - Field name
   * @param value - Field value, can be null, string, number, date or enum
   * @returns WHERE condition
   */
  static whereCondition<Entity = ObjectLiteral>(name: string, value: any): FindOptionsWhere<Entity> {
    const where: Record<string, any> = {};
    if (value === undefined) {
      where[name] = undefined;
    } else if (value === null) {
      where[name] = IsNull();
    } else if (typeof value === 'boolean') {
      where[name] = value;
    } else if (typeof value === 'number') {
      where[name] = value;
    } else if (typeof value === 'string') {
      if (name.match(/Id$/i) || name === 'id') {
        where[name] = value;
      } else {
        where[name] = ILike(`%${value}%`);
      }
    } else if (typeof value === 'object' && GraphqlSearchQuery.isQueryDate(value)) {
      if (value.from && value.to) {
        where[name] = Between(value.from, value.to);
      } else if (value.from) {
        where[name] = MoreThanOrEqual(value.from);
      } else if (value.to) {
        where[name] = LessThanOrEqual(value.to);
      }
    } else if (typeof value === 'object' && GraphqlSearchQuery.isQueryInt(value)) {
      if (value.max && value.min) {
        where[name] = Between(value.min, value.max);
      } else if (value.min) {
        where[name] = MoreThanOrEqual(value.min);
      } else if (value.max) {
        where[name] = LessThanOrEqual(value.max);
      }
    } else if (GraphqlSearchQuery.isQueryEnum(value)) {
      where[name] = In(value);
    } else if (typeof value === 'object' && GraphqlSearchQuery.isSubquery(value)) {
      if (value.or) {
        where[name] = GraphqlSearchQuery.whereOrCondition<Entity>(value.or, value.and);
      } else if (value.and) {
        where[name] = GraphqlSearchQuery.whereAndCondition<Entity>(value.and);
      }
    } else {
      throw new Error(`Unsupported where condition for ${name}`);
    }
    return where;
  }

  /**
   * Generate WHERE condition for query
   * @param orCondition - OR conditions
   * @param andCondition - AND conditions, optional
   * @returns WHERE conditions
   */
  static whereOrCondition<Entity = ObjectLiteral>(
    orCondition: SearchWhereAndOrInput,
    andCondition?: SearchWhereAndOrInput,
  ): FindOptionsWhere<Entity>[] {
    let whereAnd: Record<string, any> = {};
    if (andCondition && Object.keys(andCondition).length > 0) {
      whereAnd = GraphqlSearchQuery.whereAndCondition<Entity>(andCondition);
    }

    const where: FindOptionsWhere<Entity>[] = [];

    Object.entries(orCondition).forEach(([name, value]) => {
      where.push({ ...whereAnd, ...GraphqlSearchQuery.whereCondition<Entity>(name, value) });
    });

    return where;
  }

  /**
   * Generate WHERE condition for query
   * @param andCondition - AND conditions
   * @returns WHERE conditions
   */
  static whereAndCondition<Entity = ObjectLiteral>(andCondition: SearchWhereAndOrInput): FindOptionsWhere<Entity> {
    let where: Record<string, any> = {};
    Object.entries(andCondition).forEach(([name, value]) => {
      where = { ...where, ...GraphqlSearchQuery.whereCondition<Entity>(name, value) };
    });
    return where;
  }

  /**
   * Normalize search input data
   *
   * @param entity - Target entity
   * @param payload - Payload (SearchQuery)
   * @param info - GraphQLResolveInfo
   * @param fields - ResolveTree
   * @param options - FindManyOptions
   * @returns {FindManyOptions<Entity> | FindOneOptions<Entity>} - Returns normalized query
   */
  normalize<Entity extends ObjectLiteral>(
    entity: EntityTarget<Entity>,
    {
      payload,
      info,
      fields,
      options,
    }: {
      payload?: SearchQuery<Entity>;
      info?: GraphQLResolveInfo;
      fields?: ResolveTree;
      options?: FindManyOptions<Entity>;
    },
  ): FindManyOptions<Entity> | FindOneOptions<Entity> {
    const select: Record<string, boolean | object> = {};

    // If we are passed GraphQL query info about fields or columns
    if (info || fields) {
      const repository = this.entityManager.getRepository(entity);
      if (info) {
        const parsedResolveInfoFragment = parseResolveInfo(info);
        if (!parsedResolveInfoFragment) {
          throw new Error('Failed to parse GraphQL resolve info');
        }

        const { fields: parsedFields } = simplifyParsedResolveInfoFragmentWithType(
          parsedResolveInfoFragment as ResolveTree,
          info.returnType,
        );
        fields = parsedFields as ResolveTree;
      }

      if (fields) {
        const ownColumns = [
          ...repository.metadata.ownColumns.map((column) => ({ [column.propertyName]: true })),
          ...this.loadEagerRelations(repository.metadata.relations),
        ];

        Object.values(fields).forEach((field) => {
          GraphqlSearchQuery.generateSQLqueryFromInfo(ownColumns, field as ResolveTree, select);
        });
        if (Object.keys(select).length > 0 && !select['id']) {
          select['id'] = true;
        }
      }

      // Add sort order
      if (payload?.order && Object.keys(select).length > 0) {
        Object.keys(payload.order).forEach((order) => {
          select[order] = true;
        });
      }
    }

    // Form search conditions
    const where: FindOptionsWhere<Entity>[] = [];
    if (options?.where) {
      if (Array.isArray(options.where)) {
        where.push(...options.where);
      } else {
        where.push(options.where);
      }
    }
    if (payload?.where) {
      if (payload.where.or && Object.keys(payload.where.or).length > 0) {
        where.push(...GraphqlSearchQuery.whereOrCondition<Entity>(payload.where.or, payload.where.and));
      } else if (payload.where.and && Object.keys(payload.where.and).length > 0) {
        where.push(GraphqlSearchQuery.whereAndCondition<Entity>(payload.where.and));
      }
    }

    // Apply default pagination values if not passed
    const finalTake = payload?.pagination?.take ?? options?.take ?? 5;
    const finalSkip = payload?.pagination?.skip ?? options?.skip ?? 0;

    return {
      ...options,
      take: finalTake,
      skip: finalSkip,
      where,
      order: payload?.order,
      select,
    } as FindManyOptions<Entity>;
  }
}
