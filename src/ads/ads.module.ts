import { ContainerModule } from 'inversify';
import { TYPES } from '../inversify.types'; // Make sure this path is correct
import { AdService } from './ads.service';
import { AdController } from './ads.controller';
import { AdRepository } from './ads.repository';

export const AdModule = new ContainerModule(({ bind }) => {
  // Use symbols to match what's being injected in the controllers
  bind(TYPES.AdRepository).to(AdRepository).inSingletonScope();
  bind(TYPES.AdService).to(AdService).inRequestScope();
  
  // Keep the controller binding as-is since we're using container.get(AdController)
  bind(AdController).toSelf().inRequestScope();
});