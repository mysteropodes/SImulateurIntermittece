import { useMemo } from 'react';
import { useIntermittence } from '../context/IntermittenceContext';
import { simulation, type Simulation } from '../lib/simulation';

export function useSimulation(): Simulation {
  const { data } = useIntermittence();
  return useMemo(() => simulation(data), [data]);
}
