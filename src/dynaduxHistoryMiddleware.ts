import { IDynaduxMiddleware } from "dynadux";

import {
  IActivateRestorePointPayload,
  ISetRestorePointPayload,
  IGetHistoryPayload
} from "./interfaces";

export enum EDynaduxHistoryMiddlewareActions {
  PREV = 'dynadux___historyMiddleware--PREV',
  NEXT = 'dynadux___historyMiddleware--NEXT',
  SET_RESTORE_POINT = 'dynadux___historyMiddleware--SET_RESTORE_POINT',              // payload: ISetRestorePointPayload
  ACTIVATE_RESTORE_POINT = 'dynadux___historyMiddleware--ACTIVATE_RESTORE_POINT',    // payload: IActivateRestorePointPayload
  GET_HISTORY = 'dynadux___historyMiddleware--GET_HISTORY',                          // payload: IGetHistoryPayload
}

export interface IHistoryMiddlewareMiddlewareConfig {
  historySize?: number; // -1 unlimited
}

export interface IHistoryItem<TState> {
  time: Date;
  afterMs: number;
  state: TState;
  restorePoint: string;
}

export const dynaduxHistoryMiddleware = <TState>(
  {
    historySize = -1,
  }: IHistoryMiddlewareMiddlewareConfig
    = {}
): IDynaduxMiddleware<TState> => {
  let history: IHistoryItem<TState>[] = [];
  let pointer = -1;
  let lastPush = Date.now();

  return {
    after: (
      {
        action,
        payload,
        state,
      }
    ) => {
      switch (action) {
        case EDynaduxHistoryMiddlewareActions.PREV:
          if (pointer > 0) return history[--pointer].state;
          return;

        case EDynaduxHistoryMiddlewareActions.NEXT:
          if (pointer + 1 < history.length) return history[++pointer].state;
          return;

        case EDynaduxHistoryMiddlewareActions.SET_RESTORE_POINT:
          return (() => {
            const {
              name: restorePointName,
            }: ISetRestorePointPayload<TState> = payload;
            if (!history.length) return;
            history[pointer].restorePoint = restorePointName;
          })();

        case EDynaduxHistoryMiddlewareActions.ACTIVATE_RESTORE_POINT:
          return (() => {
            const {
              name: restorePointName,
              resolve,
              reject,
            }: IActivateRestorePointPayload<TState> = payload;

            const historyItem = history.find(hi => hi.restorePoint === restorePointName);
            if (!historyItem) {
              const errorMessage = `dynadux/historyMiddlewareMiddleware, ACTIVATE_RESTORE_POINT: restore point [${restorePointName}] doesn't exist`;
              console.error(errorMessage);
              if (reject) reject({message: errorMessage});
              return;
            }

            pointer = history.indexOf(historyItem);

            if (resolve) resolve();
            return historyItem.state;
          })();

        case EDynaduxHistoryMiddlewareActions.GET_HISTORY:
          return (() => {
            const {
              resolve,
            }: IGetHistoryPayload<TState> = payload;
            resolve(history.concat());
          })();

        default:
          // On any other action, push the state to the history
          // If we travel in past
          if (history.length && pointer + 1 < history.length) {
            // then delete the future from this point
            history = history.slice(0, pointer);
          }

          const now = new Date();
          history.push({
            time: now,
            afterMs: now.valueOf() - lastPush,
            state,
            restorePoint: '',
          });
          pointer++;
          lastPush = now.valueOf();

          // Keep the size the history in limits
          if (historySize > -1 && history.length > historySize) {
            history = history.splice(-historySize);
          }
      }
    },
  };
};

