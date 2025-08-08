import { ContainerModule } from 'inversify';
import { TYPES } from '../inversify.types';
import { UserRepository } from './user.repository';

export const UserModule = new ContainerModule(({ bind }) => {
  bind(TYPES.UserRepository).to(UserRepository).inSingletonScope();
});