"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var EDynaduxHistoryMiddlewareActions;
(function (EDynaduxHistoryMiddlewareActions) {
    EDynaduxHistoryMiddlewareActions["PREV"] = "dynadux___historyMiddleware--PREV";
    EDynaduxHistoryMiddlewareActions["NEXT"] = "dynadux___historyMiddleware--NEXT";
    EDynaduxHistoryMiddlewareActions["SET_RESTORE_POINT"] = "dynadux___historyMiddleware--SET_RESTORE_POINT";
    EDynaduxHistoryMiddlewareActions["ACTIVATE_RESTORE_POINT"] = "dynadux___historyMiddleware--ACTIVATE_RESTORE_POINT";
    EDynaduxHistoryMiddlewareActions["GET_HISTORY"] = "dynadux___historyMiddleware--GET_HISTORY";
})(EDynaduxHistoryMiddlewareActions = exports.EDynaduxHistoryMiddlewareActions || (exports.EDynaduxHistoryMiddlewareActions = {}));
exports.dynaduxHistoryMiddleware = function (_a) {
    var _b = (_a === void 0 ? {} : _a).historySize, historySize = _b === void 0 ? -1 : _b;
    var history = [];
    var pointer = -1;
    var lastPush = Date.now();
    return {
        after: function (_a) {
            var action = _a.action, payload = _a.payload, state = _a.state;
            switch (action) {
                case EDynaduxHistoryMiddlewareActions.PREV:
                    if (pointer > 0)
                        return history[--pointer].state;
                    return;
                case EDynaduxHistoryMiddlewareActions.NEXT:
                    if (pointer + 1 < history.length)
                        return history[++pointer].state;
                    return;
                case EDynaduxHistoryMiddlewareActions.SET_RESTORE_POINT:
                    return (function () {
                        var restorePointName = payload.name;
                        if (!history.length)
                            return;
                        history[pointer].restorePoint = restorePointName;
                    })();
                case EDynaduxHistoryMiddlewareActions.ACTIVATE_RESTORE_POINT:
                    return (function () {
                        var restorePointName = payload.name, resolve = payload.resolve, reject = payload.reject;
                        var historyItem = history.find(function (hi) { return hi.restorePoint === restorePointName; });
                        if (!historyItem) {
                            var errorMessage = "dynadux/historyMiddlewareMiddleware, ACTIVATE_RESTORE_POINT: restore point [" + restorePointName + "] doesn't exist";
                            console.error(errorMessage);
                            if (reject)
                                reject({ message: errorMessage });
                            return;
                        }
                        pointer = history.indexOf(historyItem);
                        if (resolve)
                            resolve();
                        return historyItem.state;
                    })();
                case EDynaduxHistoryMiddlewareActions.GET_HISTORY:
                    return (function () {
                        var resolve = payload.resolve;
                        resolve(history.concat());
                    })();
                default:
                    // On any other action, push the state to the history
                    // If we travel in past
                    if (history.length && pointer + 1 < history.length) {
                        // then delete the future from this point
                        history = history.slice(0, pointer);
                    }
                    var now = new Date();
                    history.push({
                        time: now,
                        afterMs: now.valueOf() - lastPush,
                        state: state,
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
//# sourceMappingURL=dynaduxHistoryMiddleware.js.map