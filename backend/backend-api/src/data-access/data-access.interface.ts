
export interface DataAccess {
  persistDayClosure(
    userID: string,
    transactions: number[],
    dayClosure: number,
  ): Promise<void>;
}