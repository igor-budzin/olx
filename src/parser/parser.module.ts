import { ContainerModule } from 'inversify';
import { TYPES } from '../inversify.types';
import { OlxParserService } from './parser.service';

export const ParserModule = new ContainerModule(({ bind }) => {
  bind<OlxParserService>(TYPES.OlxParserService).to(OlxParserService).inSingletonScope();
});