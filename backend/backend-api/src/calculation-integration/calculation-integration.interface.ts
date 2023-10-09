
export interface CalculationIntegration {
  calculateDayClosure(
    transactions: number[],
  ): Promise<number>;

  enableAllCompute(): Promise<void>;
}