import { IDynaduxMiddleware } from "dynadux";
export declare enum EDynaduxHistoryMiddlewareActions {
    PREV = "dynadux___historyMiddleware--PREV",
    NEXT = "dynadux___historyMiddleware--NEXT",
    SET_RESTORE_POINT = "dynadux___historyMiddleware--SET_RESTORE_POINT",
    ACTIVATE_RESTORE_POINT = "dynadux___historyMiddleware--ACTIVATE_RESTORE_POINT",
    GET_HISTORY = "dynadux___historyMiddleware--GET_HISTORY"
}
export interface IHistoryMiddlewareMiddlewareConfig {
    historySize?: number;
}
export interface IHistoryItem<TState> {
    time: Date;
    afterMs: number;
    state: TState;
    restorePoint: string;
}
export declare const dynaduxHistoryMiddleware: <TState>({ historySize, }?: IHistoryMiddlewareMiddlewareConfig) => IDynaduxMiddleware<TState, void>;
