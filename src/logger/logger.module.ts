import { ContainerModule } from 'inversify';
import { TYPES } from '../inversify.types';
import { ILogger } from './logger.interface';
import { LoggerService } from './logger.service';
import { LoggerFactory } from './logger.factory';

export const LoggerModule = new ContainerModule(({ bind }) => {
  bind<ILogger>(TYPES.Logger).to(LoggerService).inSingletonScope();
  bind<LoggerFactory>(TYPES.LoggerFactory).to(LoggerFactory).inSingletonScope();
});