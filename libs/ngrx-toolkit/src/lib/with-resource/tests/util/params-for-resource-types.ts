import { ErrorHandling } from '../../../with-resource';
import { setupMappedResource } from './setup-mapped-resource';
import { setupNamedResource } from './setup-named-resource';
import { setupUnnamedResource } from './setup-unnamed-resource';

export function paramsForResourceTypes(errorHandling: ErrorHandling) {
  return [
    {
      name: 'unnamed resource',
      setup: () => setupUnnamedResource(errorHandling),
    },
    {
      name: 'mapped named resource',
      setup: () => setupMappedResource(errorHandling),
    },
    {
      name: 'named resource',
      setup: () => setupNamedResource(errorHandling),
    },
  ];
}
