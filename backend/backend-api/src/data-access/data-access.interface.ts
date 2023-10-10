
export interface DataAccess {
  persistDayClosure(
    userID: string,
    transactions: number[],
    dayClosure: number,
    tableName: string,
  ): Promise<void>;

  validateClosure(
    userID: string,
    date: string
  ): Promise<string>;
}