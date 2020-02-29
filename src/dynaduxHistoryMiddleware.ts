import { IDynaduxMiddleware } from "dynadux";

export enum EDynaduxHistoryMiddlewareActions {
  PREV = 'dynadux___historyMiddleware--PREV',
  NEXT = 'dynadux___historyMiddleware--NEXT',
  SET_RESTORE_POINT = 'dynadux___historyMiddleware--SET_RESTORE_POINT',              // payload: { name: string }
  ACTIVATE_RESTORE_POINT = 'dynadux___historyMiddleware--ACTIVATE_RESTORE_POINT',    // payload: { name: string }
  GET_HISTORY = 'dynadux___historyMiddleware--GET_HISTORY',                          // payload: { stateTargetPropertyName: string }
}

export interface IHistoryMiddlewareMiddlewareConfig {
  historySize?: number; // -1 unlimited
}

export const dynaduxHistoryMiddleware = <TState>(
  {
    historySize = -1,
  }: IHistoryMiddlewareMiddlewareConfig
    = {}
): IDynaduxMiddleware<TState> => {
  let history: TState[] = [];
  let pointer = -1;
  const restorePoints: { [name: string]: number } = {};

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
          if (pointer > 0) return history[--pointer];
          return state;

        case EDynaduxHistoryMiddlewareActions.NEXT:
          if (pointer + 1 < history.length) return history[++pointer];
          return state;

        case EDynaduxHistoryMiddlewareActions.SET_RESTORE_POINT:
          restorePoints[payload.name] = pointer;
          return state;

        case EDynaduxHistoryMiddlewareActions.ACTIVATE_RESTORE_POINT:
          const historyStatePointer = restorePoints[payload.name];
          if (historyStatePointer !== undefined) {
            pointer = historyStatePointer;
            return history[pointer];
          }
          else {
            console.error(`dynadux/historyMiddlewareMiddleware, ACTIVATE_RESTORE_POINT: restore point [${payload.name}] doesn't exist`);
            return state;
          }

        case EDynaduxHistoryMiddlewareActions.GET_HISTORY:
          return {
            ...state,
            [payload.stateTargetPropertyName]: history.concat(),
          };

        default:
          // Push the state
          // If we travel in past
          if (history.length && pointer + 1 < history.length) {
            // then delete the future from this point and continue
            history = history.slice(0, pointer + 1);
            // delete future restore points
            Object.keys(restorePoints)
              .forEach(name => {
                if (restorePoints[name] > pointer) delete restorePoints[name];
              });
          }

          history.push(state);
          pointer++;

          if (historySize > -1 && history.length > historySize) {
            history = history.splice(-historySize);
          }

          return state;
      }
    },
  };
};

