import { DayClosure } from "src/models/day-closure.dto";

export interface DataAccess {
  persistDayClosure(
    userID: string,
    transactions: number[],
    dayClosure: number,
    tableName: string,
    fillUserID?: boolean,
  ): Promise<void>;

  validateClosure(
    userID: string,
    date: string
  ): Promise<string>;

  getAllClosures(
    limit: number,
    next?: string
  ): Promise<DayClosure[]>;

  modifyClosure(
    dc: DayClosure,
  ): Promise<void>;
}