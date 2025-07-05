declare module 'tsparticles' {
  import type { Engine } from 'tsparticles-engine';

  export function loadFull(engine: Engine): Promise<void>;
}

