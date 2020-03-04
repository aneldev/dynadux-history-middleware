import "jest";

import { createStore, } from "dynadux";
import {
  dynaduxHistoryMiddleware,
  EDynaduxHistoryMiddlewareActions,

  ISetRestorePointPayload,
  IActivateRestorePointPayload,
  IGetHistoryPayload,

  IHistoryItem
} from "../../src";

interface ITodoAppState {
  todos: ITodo[];
}

interface ITodo {
  id: string;
  label: string;
  done: boolean;
}

const actions = {
  ADD_TODO: 'ADD_TODO',
  REMOVE_TODO: 'REMOVE_TODO',
};

describe('Dynadux, History middleware', () => {

  test('Travel in time', () => {
    const createTodoAppStore = (onChange?: (state: ITodoAppState) => void) => {
      const store = createStore<ITodoAppState>({
        initialState: {
          todos: [],
        },
        middlewares: [
          dynaduxHistoryMiddleware(),
        ],
        onChange,
        reducers: {
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
        addTodo: (todo: ITodo) => store.dispatch<ITodo>(actions.ADD_TODO, todo),
        removeTodo: (todoId: string) => store.dispatch<string>(actions.REMOVE_TODO, todoId),
        history: {
          prev: () => store.dispatch(EDynaduxHistoryMiddlewareActions.PREV),
          next: () => store.dispatch(EDynaduxHistoryMiddlewareActions.NEXT),
        },
      };
    };

    const appStore = createTodoAppStore();
    const getTodoIds = () => appStore.state.todos.map(todo => todo.id).join();

    appStore.addTodo({id: '301', label: 'Before work beers', done: false});
    appStore.addTodo({id: '302', label: 'After work beers', done: false});
    expect(getTodoIds()).toBe('301,302');

    appStore.addTodo({id: '303', label: 'Evening beers', done: false});
    expect(getTodoIds()).toBe('301,302,303');

    appStore.history.prev();
    expect(getTodoIds()).toBe('301,302');

    appStore.history.next();
    expect(getTodoIds()).toBe('301,302,303');

    appStore.history.prev();
    appStore.history.prev();
    expect(getTodoIds()).toBe('301');

    appStore.history.prev();
    expect(getTodoIds()).toBe('301'); // We reached the first history item

    appStore.history.next();
    appStore.history.next();
    expect(getTodoIds()).toBe('301,302,303');

    appStore.history.next();
    expect(getTodoIds()).toBe('301,302,303'); // We reached the last history item, this is the current

    appStore.history.prev();
    appStore.addTodo({id: '304', label: 'Sleep', done: false});
    expect(getTodoIds()).toBe('301,302,304'); // 303 is deleted because the 304 is pushed when we were back in time

    appStore.history.next();
    expect(getTodoIds()).toBe('301,302,304'); // We reached the last history item, this is the current
  });


  test('History size', async (done) => {
    const createTodoAppStore = (onChange?: (state: ITodoAppState) => void) => {
      const store = createStore<ITodoAppState>({
        initialState: {
          todos: [],
        },
        middlewares: [
          dynaduxHistoryMiddleware({historySize: 2}),
        ],
        onChange,
        reducers: {
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
        addTodo: (todo: ITodo) => store.dispatch<ITodo>(actions.ADD_TODO, todo),
        removeTodo: (todoId: string) => store.dispatch<string>(actions.REMOVE_TODO, todoId),
        history: {
          prev: () => store.dispatch(EDynaduxHistoryMiddlewareActions.PREV),
          next: () => store.dispatch(EDynaduxHistoryMiddlewareActions.NEXT),
          getHistoryItems: (): Promise<IHistoryItem<ITodoAppState>[]> => {
            return new Promise(resolve => {
              store.dispatch<IGetHistoryPayload<ITodoAppState>>(EDynaduxHistoryMiddlewareActions.GET_HISTORY, {resolve});
            });
          },
        },
      };
    };

    const appStore = createTodoAppStore();
    const getTodoIds = () => appStore.state.todos.map(todo => todo.id).join();

    appStore.addTodo({id: '301', label: 'Before work beers', done: false});
    appStore.addTodo({id: '302', label: 'After work beers', done: false});
    expect(getTodoIds()).toBe('301,302');

    appStore.addTodo({id: '303', label: 'Evening beers', done: false});
    expect(getTodoIds()).toBe('301,302,303');

    appStore.history.prev();
    appStore.history.prev();
    appStore.history.prev();
    appStore.history.prev();
    expect(getTodoIds()).toBe('301,302');

    const historyItems = await appStore.history.getHistoryItems();
    const historyItemsCount = historyItems.length;
    expect(historyItemsCount).toBe(2);

    done();
  });

  test('Restore points', () => {
    const createTodoAppStore = (onChange?: (state: ITodoAppState) => void) => {
      const store = createStore<ITodoAppState>({
        initialState: {
          todos: [],
        },
        middlewares: [
          dynaduxHistoryMiddleware(),
        ],
        onChange,
        reducers: {
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
        addTodo: (todo: ITodo) => store.dispatch<ITodo>(actions.ADD_TODO, todo),
        removeTodo: (todoId: string) => store.dispatch<string>(actions.REMOVE_TODO, todoId),
        history: {
          prev: () => store.dispatch(EDynaduxHistoryMiddlewareActions.PREV),
          next: () => store.dispatch(EDynaduxHistoryMiddlewareActions.NEXT),
          setRestorePoint: (name: string) => store.dispatch<ISetRestorePointPayload<ITodoAppState>>(EDynaduxHistoryMiddlewareActions.SET_RESTORE_POINT, {name}),
          activateRestorePoint: (name: string) => store.dispatch<IActivateRestorePointPayload<ITodoAppState>>(EDynaduxHistoryMiddlewareActions.ACTIVATE_RESTORE_POINT, {name}),
        },
      };
    };

    const appStore = createTodoAppStore();
    const getTodoIds = () => appStore.state.todos.map(todo => todo.id).join();

    appStore.addTodo({id: '301', label: 'Before work beers', done: false});
    appStore.addTodo({id: '302', label: 'After work beers', done: false});
    expect(getTodoIds()).toBe('301,302');
    appStore.history.setRestorePoint('basics');

    appStore.addTodo({id: '303', label: 'Evening beers', done: false});
    expect(getTodoIds()).toBe('301,302,303');
    appStore.history.setRestorePoint('evening');

    appStore.history.activateRestorePoint('basics');
    expect(getTodoIds()).toBe('301,302');

    appStore.history.activateRestorePoint('evening');
    expect(getTodoIds()).toBe('301,302,303');

    appStore.history.activateRestorePoint('basics');
    expect(getTodoIds()).toBe('301,302');

    appStore.history.activateRestorePoint('evening');
    expect(getTodoIds()).toBe('301,302,303');

    const ce = console.error;
    console.error = jest.fn();
    appStore.history.activateRestorePoint('basics');
    expect(getTodoIds()).toBe('301,302');
    appStore.addTodo({id: '304', label: 'Sleep', done: false});    // This add will delete the future evening tag
    expect(getTodoIds()).toBe('301,302,304');
    appStore.history.activateRestorePoint('evening');
    expect(getTodoIds()).toBe('301,302,304');                   // Should be the same, since the "evening" doesn't exist anymore
    expect((console.error as any).mock.calls.length).toBe(1);
    console.error = ce;
  });

  test('Restore points with history restriction', () => {
    const createTodoAppStore = (onChange?: (state: ITodoAppState) => void) => {
      const store = createStore<ITodoAppState>({
        initialState: {
          todos: [],
        },
        middlewares: [
          dynaduxHistoryMiddleware({historySize: 3}),
        ],
        onChange,
        reducers: {
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
        addTodo: (todo: ITodo) => store.dispatch<ITodo>(actions.ADD_TODO, todo),
        removeTodo: (todoId: string) => store.dispatch<string>(actions.REMOVE_TODO, todoId),
        history: {
          prev: () => store.dispatch(EDynaduxHistoryMiddlewareActions.PREV),
          next: () => store.dispatch(EDynaduxHistoryMiddlewareActions.NEXT),
          setRestorePoint: (name: string) => store.dispatch(EDynaduxHistoryMiddlewareActions.SET_RESTORE_POINT, {name}),
          activateRestorePoint: (name: string) => store.dispatch(EDynaduxHistoryMiddlewareActions.ACTIVATE_RESTORE_POINT, {name}),
        },
      };
    };

    const appStore = createTodoAppStore();
    const getTodoIds = () => appStore.state.todos.map(todo => todo.id).join();

    appStore.addTodo({id: '301', label: 'Before work beers', done: false});
    appStore.history.setRestorePoint('First');

    appStore.addTodo({id: '302', label: 'After work beers', done: false});
    appStore.addTodo({id: '303', label: 'Evening beers', done: false});
    appStore.history.setRestorePoint('Third');
    expect(getTodoIds()).toBe('301,302,303');

    appStore.addTodo({id: '304', label: 'Night beers', done: false});
    expect(getTodoIds()).toBe('301,302,303,304');

    const ce = console.error;
    console.error = jest.fn();
    appStore.history.activateRestorePoint('First');
    expect(getTodoIds()).toBe('301,302,303,304'); // should be the same since the First doesn't exist
    expect((console.error as any).mock.calls.length).toBe(1);
    console.error = ce;

    appStore.history.activateRestorePoint('Third');
    expect(getTodoIds()).toBe('301,302,303');
  });

});
