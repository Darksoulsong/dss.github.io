System.register("zustand", ["react"], function (exports) {
  "use strict";
  var useReducer, useRef, useDebugValue, useEffect, useLayoutEffect;
  return {
    setters: [
      function (module) {
        useReducer = module.useReducer;
        useRef = module.useRef;
        useDebugValue = module.useDebugValue;
        useEffect = module.useEffect;
        useLayoutEffect = module.useLayoutEffect;
      },
    ],
    execute: function () {
      exports("default", create);

      function createStore(createState) {
        var state;
        var listeners = new Set();

        var setState = function setState(partial, replace) {
          var nextState =
            typeof partial === "function" ? partial(state) : partial;

          if (nextState !== state) {
            var _previousState = state;
            state = replace ? nextState : Object.assign({}, state, nextState);
            listeners.forEach(function (listener) {
              return listener(state, _previousState);
            });
          }
        };

        var getState = function getState() {
          return state;
        };

        var subscribeWithSelector = function subscribeWithSelector(
          listener,
          selector,
          equalityFn
        ) {
          if (selector === void 0) {
            selector = getState;
          }

          if (equalityFn === void 0) {
            equalityFn = Object.is;
          }

          console.warn(
            "[DEPRECATED] Please use `subscribeWithSelector` middleware"
          );
          var currentSlice = selector(state);

          function listenerToAdd() {
            var nextSlice = selector(state);

            if (!equalityFn(currentSlice, nextSlice)) {
              var _previousSlice = currentSlice;
              listener((currentSlice = nextSlice), _previousSlice);
            }
          }

          listeners.add(listenerToAdd);
          return function () {
            return listeners.delete(listenerToAdd);
          };
        };

        var subscribe = function subscribe(listener, selector, equalityFn) {
          if (selector || equalityFn) {
            return subscribeWithSelector(listener, selector, equalityFn);
          }

          listeners.add(listener);
          return function () {
            return listeners.delete(listener);
          };
        };

        var destroy = function destroy() {
          return listeners.clear();
        };

        var api = {
          setState: setState,
          getState: getState,
          subscribe: subscribe,
          destroy: destroy,
        };
        state = createState(setState, getState, api);
        return api;
      }

      var isSSR =
        typeof window === "undefined" ||
        !window.navigator ||
        /ServerSideRendering|^Deno\//.test(window.navigator.userAgent);
      var useIsomorphicLayoutEffect = isSSR ? useEffect : useLayoutEffect;

      function create(createState) {
        var api =
          typeof createState === "function"
            ? createStore(createState)
            : createState;

        var useStore = function useStore(selector, equalityFn) {
          if (selector === void 0) {
            selector = api.getState;
          }

          if (equalityFn === void 0) {
            equalityFn = Object.is;
          }

          var _ref = useReducer(function (c) {
              return c + 1;
            }, 0),
            forceUpdate = _ref[1];

          var state = api.getState();
          var stateRef = useRef(state);
          var selectorRef = useRef(selector);
          var equalityFnRef = useRef(equalityFn);
          var erroredRef = useRef(false);
          var currentSliceRef = useRef();

          if (currentSliceRef.current === undefined) {
            currentSliceRef.current = selector(state);
          }

          var newStateSlice;
          var hasNewStateSlice = false;

          if (
            stateRef.current !== state ||
            selectorRef.current !== selector ||
            equalityFnRef.current !== equalityFn ||
            erroredRef.current
          ) {
            newStateSlice = selector(state);
            hasNewStateSlice = !equalityFn(
              currentSliceRef.current,
              newStateSlice
            );
          }

          useIsomorphicLayoutEffect(function () {
            if (hasNewStateSlice) {
              currentSliceRef.current = newStateSlice;
            }

            stateRef.current = state;
            selectorRef.current = selector;
            equalityFnRef.current = equalityFn;
            erroredRef.current = false;
          });
          var stateBeforeSubscriptionRef = useRef(state);
          useIsomorphicLayoutEffect(function () {
            var listener = function listener() {
              try {
                var nextState = api.getState();
                var nextStateSlice = selectorRef.current(nextState);

                if (
                  !equalityFnRef.current(
                    currentSliceRef.current,
                    nextStateSlice
                  )
                ) {
                  stateRef.current = nextState;
                  currentSliceRef.current = nextStateSlice;
                  forceUpdate();
                }
              } catch (error) {
                erroredRef.current = true;
                forceUpdate();
              }
            };

            var unsubscribe = api.subscribe(listener);

            if (api.getState() !== stateBeforeSubscriptionRef.current) {
              listener();
            }

            return unsubscribe;
          }, []);
          var sliceToReturn = hasNewStateSlice
            ? newStateSlice
            : currentSliceRef.current;
          useDebugValue(sliceToReturn);
          return sliceToReturn;
        };

        Object.assign(useStore, api);

        useStore[Symbol.iterator] = function () {
          console.warn(
            "[useStore, api] = create() is deprecated and will be removed in v4"
          );
          var items = [useStore, api];
          return {
            next: function next() {
              var done = items.length <= 0;
              return {
                value: items.shift(),
                done: done,
              };
            },
          };
        };

        return useStore;
      }
    },
  };
});
