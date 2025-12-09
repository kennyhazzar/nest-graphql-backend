import { I18nResolver } from 'nestjs-i18n';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';

import { GraphQLContext } from '@/interfaces/graphql-context.interface';
import { defaultLanguage } from './default-language';

@Injectable()
export class UserLanguageResolver implements I18nResolver {
  language: string = defaultLanguage;

  constructor(private readonly configService: ConfigService) {
    this.language = this.configService.getOrThrow<string>('settings.language');
  }

  async resolve(context: ExecutionContext): Promise<string> {
    let language: string = this.language;

    if (context.getType<GqlContextType>() === 'graphql') {
      const ctx = GqlExecutionContext.create(context);
      const { language: gqlLanguage } = ctx.getContext<GraphQLContext>();
      if (gqlLanguage) {
        language = gqlLanguage;
      }
    }

    return language;
  }
}
