function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === "object" ? child : createTextElement(child)
      )
    }
  };
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: []
    }
  };
}

function renderDom(element) {
  const node =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);

  const isProperty = property => property !== "children";
  const isEvent = prop => prop.slice(0, 2) === "on";
  Object.keys(element.props)
    .filter(isProperty)
    .forEach(prop => {
      if (isEvent(prop)) {
        node.addEventListener(prop.slice(2).toLowerCase(), element.props[prop]);
      } else {
        node[prop] = element.props[prop];
      }
    });

  return node;
}

function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element]
    },
    alternate: oldRoot
  };
  nextUnitOfWork = wipRoot;
}

function commitRoot() {
  deletions.forEach(oldFiber => commitWork(oldFiber));
  deletions = [];
  commitWork(wipRoot.child);
  oldRoot = wipRoot;
  wipRoot = null;
}

function commitWork(fiber) {
  if (!fiber) {
    return;
  }
  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  let domParent = domParentFiber.dom;
  if (fiber.effectTag === "DELETE") {
    commitDeletion(fiber, domParent);
  } else if (fiber.effectTag === "ADD" && fiber.dom) {
    domParent.appendChild(fiber.dom);
  }
  if (fiber.effectTag === "UPDATE") {
    updateDom(fiber);
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}

function updateDom(fiber) {
  const isProperty = property => property !== "children";
  const isGone = next => key => !(key in next);
  const isNew = (prev, next) => key => prev[key] !== next[key];
  const isEvent = prop => prop.slice(0, 2) === "on";
  Object.keys(fiber.alternate.props)
    .filter(isProperty)
    .filter(isGone(fiber.props))
    .forEach(prop => {
      if (isEvent(prop)) {
        fiber.dom.removeEventListener(
          prop.slice(2).toLowerCase(),
          fiber.alternate.props[prop]
        );
      } else {
        fiber.dom.removeAttribute(prop);
      }
    });
  Object.keys(fiber.props)
    .filter(isProperty)
    .filter(isNew(fiber.alternate.props, fiber.props))
    .forEach(prop => {
      if (isEvent(prop)) {
        fiber.dom.addEventListener(
          prop.slice(2).toLowerCase(),
          fiber.props[prop]
        );
      } else {
        fiber.dom[prop] = fiber.props[prop];
      }
    });
}

let nextUnitOfWork = null;
let wipRoot = null;
let oldRoot = null;
let deletions = [];

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performNextUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }
  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function performNextUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }

    nextFiber = nextFiber.parent;
  }

  return null;
}

let wipFiber = null;
let hookIndex = null;

function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

function useState(initial) {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: []
  };

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach(action => {
    hook.state = action(hook.state);
  });

  const setState = action => {
    hook.queue.push(action);
    wipRoot = {
      dom: oldRoot.dom,
      props: oldRoot.props,
      alternate: oldRoot
    };

    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state, setState];
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = renderDom(fiber);
  }

  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);
}

function reconcileChildren(fiber, elements) {
  let oldFiber = fiber.alternate && fiber.alternate.child;
  const length = elements.length;
  let i = 0;
  let previousFiber = null;
  while (i < length || oldFiber) {
    const element = elements[i];
    const sameType = oldFiber && element && oldFiber.type === element.type;
    let newFiber = null;
    if (sameType) {
      newFiber = {
        dom: oldFiber.dom,
        type: oldFiber.type,
        props: element.props,
        parent: fiber,
        alternate: oldFiber,
        effectTag: "UPDATE"
      };
    }
    if (!sameType && element) {
      newFiber = {
        dom: null,
        type: element.type,
        props: element.props,
        parent: fiber,
        alternate: null,
        effectTag: "ADD"
      };
    }
    if (!sameType && oldFiber) {
      oldFiber.effectTag = "DELETE";
      deletions.push(oldFiber);
    }
    if (i === 0) {
      fiber.child = newFiber;
    } else {
      previousFiber.sibling = newFiber;
    }

    previousFiber = newFiber;
    i++;
    oldFiber = oldFiber && oldFiber.sibling;
  }
}

const Didact = {
  createElement,
  render,
  useState
};

/** @jsx Didact.createElement */
function Counter() {
  const [state, setState] = Didact.useState(1);
  return <h1 onClick={() => setState(c => c + 1)}>Count: {state}</h1>;
}
const element = <Counter />;
const container = document.getElementById("root");
Didact.render(element, container);
