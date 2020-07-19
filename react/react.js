// TODO 1. Remember inside the while loop, make sure the comparison value is changed
// TODO 2. Remember updates has 3 forms: delete key, add key, update key value
//
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
  if (fiber.parent) {
    if (fiber.effectTag === "DELETE") {
      fiber.parent.dom.removeChild(fiber.dom);
    } else if (fiber.effectTag === "ADD") {
      fiber.parent.dom.appendChild(fiber.dom);
    }
  }
  if (fiber.effectTag === "UPDATE") {
    updateDom(fiber);
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function updateDom(fiber) {
  const isProperty = property => property !== "children";
  const isGone = next => key => !(key in next);
  // TODO Remember updates has 3 forms: delete key, add key, update key value
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
  if (!fiber.dom) {
    fiber.dom = renderDom(fiber);
  }

  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);

  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  // TODO comparison value: nextFiber
  // Remember inside the while loop, make sure the comparison value is changed
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }

    // TODO Mistake here, use fiber.parent instead of nextFiber.parent
    // fiber.parent is static => infinite loop
    nextFiber = nextFiber.parent;
  }

  return null;
}

function reconcileChildren(fiber, elements) {
  let oldFiber = fiber.alternate && fiber.alternate.child;
  const length = elements.length;
  let i = 0;
  let previousFiber = null;
  // TODO Comparison values: i & oldFiber
  // Make sure they're changed inside the loop
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
}

/** @jsx Didact.createElement */
const container = document.getElementById("root")

const updateValue = e => {
  rerender(e.target.value)
}

const rerender = value => {
  const element = (
    <div>
      <input onInput={updateValue} value={value} />
      <h2>Hello {value}</h2>
    </div>
  )
  Didact.render(element, container)
}

rerender("World")
