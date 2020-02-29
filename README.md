# dynadux history middleware

Travel in time with [dynadux](https://github.com/aneldev/dynadux).

This middleware is offering the Undo/Redo feature.

It offers a history limit so it won't explode your memory.

Supports restore points so you can travel in time with named restore points.

# Create a store
Let's create a store with [dynadux](https://github.com/aneldev/dynadux).

Our store exposes the `history` with few methods where dispatching events to the dynaduxHistoryMiddleware

_If you unfamiliar with dynadux [learn it here](https://github.com/aneldev/dynadux)._

```
const actions = {
  CLEAR: 'CLEAR',
  ADD_TODO: 'ADD_TODO',
  REMOVE_TODO: 'REMOVE_TODO',
};

const createTodoAppStore = () => {
  const store = createStore<ITodoAppState>({
    initialState: {
      todos: [],
    },
    middlewares: [
      dynaduxHistoryMiddleware(),
    ],
    reducers: {
      [actions.CLEAR]: ({state}) => {
        return {
          ...state,
          todos: [],
        };
      },
      [actions.ADD_TODO]: ({state, payload}) => {
        return {
          ...state,
          todos: state.todos.concat(payload),
        };
      },
      [actions.REMOVE_TODO]: ({state, payload: todoId}) => {
        return {
          ...state,
          todos: state.todos.filter(todo => todo.id !== todoId),
        };
      },
    },
  });

  return {
    get state() {
      return store.state;
    },
    clear: () => store.dispatch(actions.CLEAR),
    addTodo: (todo: ITodo) => store.dispatch(actions.ADD_TODO, todo),
    removeTodo: (todoId: string) => store.dispatch(actions.REMOVE_TODO, todoId),
    history: {
      prev: () => store.dispatch(EDynaduxHistoryMiddlewareActions.PREV),
      next: () => store.dispatch(EDynaduxHistoryMiddlewareActions.NEXT),
      setRestorePoint: (name: string) => store.dispatch(EDynaduxHistoryMiddlewareActions.SET_RESTORE_POINT, {name}),
      activateRestorePoint: (name: string) => store.dispatch(EDynaduxHistoryMiddlewareActions.ACTIVATE_RESTORE_POINT, {name}),
    },
  };
};

// create the store
const appStore = createTodoAppStore();

```
To get the todos at any time you evaluate `appStore.state.todos`.

# History limit

The middleware accepts an object as an argument with the `historySize` property.

This property indicates how many history items will be available to travel in the past.

```
    middlewares: [
      dynaduxHistoryMiddleware({historySize: 100}),
    ],
```

If you don't define it, history is unlimited.

# Travel in time

You can travel in time dispatching actions `EDynaduxHistoryMiddlewareActions.PREV/NEXT`.

Our store above is smart and we can simply use the `appStore.history.prev/next()` accordingly.
```
// Clear the store
appStore.clear();


// Add a couple of todos
appStore.addTodo({id: '301', label: 'Before work beers', done: false});
appStore.addTodo({id: '302', label: 'After work beers', done: false});
appStore.addTodo({id: '303', label: 'Evening beers', done: false});
// The todos now are: 301, 302, 303

// Let's go back in time
appStore.history.prev();
// The todos now are: 301, 302

// Let's go forward
appStore.history.next();
// The todos now are: 301, 302, 303

// Try to go forward
appStore.history.next();
// The todos still are: 301, 302, 303

```

# Restore points


At any time you can set a restore point. To do that you call `appStore.history.setRestorePoint('nice')`.

Nothing is changed in the state,

Later you can call the `setRestorePoint` with the same name and this will override the previous state.

After a time, when you want to go back, you can call  `appStore.history.activateRestorePoint('nice')`.


Restore points feature is extremely useful for apps with progress steps, editor apps, game apps, etc.

**Restore points are introduced for the first time by this dynadux middleware.** This was possible with the flexibility that dynadux offers.

_Restore points feature doesn't duplicate data but it uses indexes. So adding restore points doesn't increate the used memory._

```

// Clear the store
appStore.clear();

// Add a couple of todos
appStore.addTodo({id: '301', label: 'Before work beers', done: false});
appStore.addTodo({id: '302', label: 'After work beers', done: false});
// The todos now are: 301, 302

// Create a restore point with name "basics"
appStore.history.setRestorePoint('basics');

// Add a todo
appStore.addTodo({id: '303', label: 'Evening beers', done: false});
// Now the todos are: 301, 302, 303

// Create a restore point with name evening  
appStore.history.setRestorePoint('evening');

// Acticate the restore point basics
appStore.history.activateRestorePoint('basics');
// The todos now are: 301, 302, as it was at the set store point previously

// Acticate the restore point evening
appStore.history.activateRestorePoint('evening');
// Now the todos are: 301, 302, 303


// Let's go back in time, make a change and try to activate a future restore point

// Go back in time to basics
appStore.history.activateRestorePoint('basics');
// Add a new todo
appStore.addTodo({id: '304', label: 'Sleep', done: false});    // This add deleted the future evening tag
// The todos now are 301, 302, 304
// Try to go to evening
appStore.history.activateRestorePoint('evening');
// The todos still are 301, 302, 304
// A console.error is occured.
    
```

# API

Middleware support the below actions

## EDynaduxHistoryMiddlewareActions.PREV

**Payload**: none

Goes on dispatch back in time,

## EDynaduxHistoryMiddlewareActions.NEXT

**Payload**: none

Goes on dispatch forward in time,

## EDynaduxHistoryMiddlewareActions.SET_RESTORE_POINT

**Payload**: `{name: string}`

Creates a restore point with by name.

If the name is already used it overrides the last one.

## EDynaduxHistoryMiddlewareActions.ACTIVATE_RESTORE_POINT

**Payload**: `{name: string}`

Activates a restore point.

If the restore point doesn't exist a console.error will be occured but not an exception.

## EDynaduxHistoryMiddlewareActions.GET_HISTORY

**Payload**: `{stateTargetPropertyName: string}`

This will create a property in the state of the store with name the value of the payload's `stateTargetPropertyName` property.

In the state will save the collected history items. 
