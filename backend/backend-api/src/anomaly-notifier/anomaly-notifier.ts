
export interface AnomalyNotifier {
  notifyAnomaly(msg: string): Promise<void>;
}