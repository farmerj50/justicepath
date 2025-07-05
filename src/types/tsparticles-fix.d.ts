declare module 'tsparticles' {
  import { ISourceOptions, Engine } from 'tsparticles-engine';
  export function loadFull(engine: Engine): Promise<void>;
  export type { ISourceOptions };
}
