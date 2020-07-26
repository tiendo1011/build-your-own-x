# My journey into building things, and what I've learned

# ![Build your own X](feynman.png)

## [React](https://pomb.us/build-your-own-react/)
#### 1. Remember inside the while loop, make sure the comparison value is changed
#### 2. Remember updates has 3 forms: delete key, add key, update key value

## [Redux](https://zapier.com/engineering/how-to-build-redux/)
#### 1. It's interesting how redux applyMiddleware works:
- Intro:
  - Start w/ 2 fn w/ this form: `const fn = next => action => {};`
  - `const bound = [fn1, fn2, fn3].reduce((a, b) => next => a(b(next)));`
  - `bound(coreDispatch)` returns a function that will take an action and is able to keep calling the next dispatch function until it finally reaches the original dispatch function.

- Explained:
  - The first reduce round, we have `const d = next => fn1(fn2(next));`
  - The second reduce round, we have `const e = next => d(fn3(next));`
  - bound(coreDispatch) <=> e(coreDispatch). Which starts this sequence:
    - fn3 is called w/ coreDispatch, and return a function that take an action, call that fn3Next.
    - d is called with fn3Next, which call fn1(fn2(next));
    - fn2 is called with fn3Next, which return fn2Next;
    - fn1 is called with fn2Next, and return fn1Next, which is a function that take an action, this is what returned to store.dispatch.
  - store.dispatch(action) <=> fn1Next(action), which called fn2Next(action) inside it, which called fn3Next(action) inside it, which called coreDispatch inside it.

- Lesson learned: It's possible to wrap a group of similar fn into a fn, like an onion, when make the call to the innermost one calls each one that wraps it.
