import { IHistoryItem } from "./dynaduxHistoryMiddleware";

export interface ISetRestorePointPayload<TState> {
  name: string;
}

export interface IActivateRestorePointPayload<TState> {
  name: string;
  resolve?: () => void;
  reject?: (error: {message: string}) => void;
}

export interface IGetHistoryPayload<TState> {
  resolve: (historyItems: IHistoryItem<TState>[]) => void;
}
