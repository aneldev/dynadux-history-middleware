export var EDynaduxHistoryMiddlewareActions;
(function (EDynaduxHistoryMiddlewareActions) {
    EDynaduxHistoryMiddlewareActions["PREV"] = "dynadux___historyMiddleware--PREV";
    EDynaduxHistoryMiddlewareActions["NEXT"] = "dynadux___historyMiddleware--NEXT";
    EDynaduxHistoryMiddlewareActions["SET_RESTORE_POINT"] = "dynadux___historyMiddleware--SET_RESTORE_POINT";
    EDynaduxHistoryMiddlewareActions["ACTIVATE_RESTORE_POINT"] = "dynadux___historyMiddleware--ACTIVATE_RESTORE_POINT";
    EDynaduxHistoryMiddlewareActions["GET_HISTORY"] = "dynadux___historyMiddleware--GET_HISTORY";
})(EDynaduxHistoryMiddlewareActions || (EDynaduxHistoryMiddlewareActions = {}));
export var dynaduxHistoryMiddleware = function (_a) {
    var _b = (_a === void 0 ? {} : _a).historySize, historySize = _b === void 0 ? -1 : _b;
    var history = [];
    var pointer = -1;
    var restorePoints = {};
    return {
        after: function (_a) {
            var _b;
            var action = _a.action, payload = _a.payload, state = _a.state;
            switch (action) {
                case EDynaduxHistoryMiddlewareActions.PREV:
                    if (pointer > 0)
                        return history[--pointer];
                    break;
                case EDynaduxHistoryMiddlewareActions.NEXT:
                    if (pointer + 1 < history.length)
                        return history[++pointer];
                    break;
                case EDynaduxHistoryMiddlewareActions.SET_RESTORE_POINT:
                    restorePoints[payload.name] = pointer;
                    break;
                case EDynaduxHistoryMiddlewareActions.ACTIVATE_RESTORE_POINT:
                    var historyStatePointer = restorePoints[payload.name];
                    if (historyStatePointer !== undefined) {
                        pointer = historyStatePointer;
                        return history[pointer];
                    }
                    else {
                        console.error("dynadux/historyMiddlewareMiddleware, ACTIVATE_RESTORE_POINT: restore point [" + payload.name + "] doesn't exist");
                    }
                    break;
                case EDynaduxHistoryMiddlewareActions.GET_HISTORY:
                    return _b = {},
                        _b[payload.stateTargetPropertyName] = history.concat(),
                        _b;
                default:
                    // On any other action, push the state to the history
                    // If we travel in past
                    if (history.length && pointer + 1 < history.length) {
                        // then delete the future from this point
                        history = history.slice(0, pointer + 1);
                        // and delete future restore points
                        Object.keys(restorePoints)
                            .forEach(function (name) {
                            if (restorePoints[name] > pointer)
                                delete restorePoints[name];
                        });
                    }
                    history.push(state);
                    pointer++;
                    // Keet the size the history in limits
                    if (historySize > -1 && history.length > historySize) {
                        history = history.splice(-historySize);
                    }
            }
        },
    };
};
//# sourceMappingURL=dynaduxHistoryMiddleware.js.map