import ReactDOM from "react-dom";
import React, { useEffect, useState, useContext } from "react";
import "./styles.css";

const initialState = {
  nextId: 1,
  notes: {},
  openNoteId: null
};

const ADD_NOTE = "ADD_NOTE";
const CHANGE_NOTE = "CHANGE_NOTE";
const CLOSE_NOTE = "CLOSE_NOTE";
const OPEN_NOTE = "OPEN_NOTE";

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case ADD_NOTE:
      return {
        ...state,
        openNoteId: state.nextId,
        notes: {
          ...state.notes,
          [state.nextId]: {
            id: state.nextId,
            content: ""
          }
        }
      };
    case CHANGE_NOTE:
      return {
        ...state,
        notes: {
          ...state.notes,
          [action.id]: {
            id: action.id,
            content: action.content
          }
        }
      };
    case CLOSE_NOTE:
      return {
        ...state,
        nextId: state.nextId + 1,
        openNoteId: null
      };
    case OPEN_NOTE:
      return {
        ...state,
        openNoteId: action.id
      };
    default:
      return state;
  }
};

const createStore = reducer => {
  let state = reducer(undefined, { type: "@@redux/init" });
  const listeners = [];
  return {
    getState: () => state,
    dispatch: action => {
      state = reducer(state, action);
      listeners.forEach(listener => listener(state));
    },
    subscribe: listener => {
      listeners.push(listener);
      return () => {
        const indexOf = listeners.indexOf(listener);
        listeners.splice(indexOf, 1);
      };
    }
  };
};

///////////////
// Our store //
///////////////

const store = createStore(reducer);

////////////////////
// Our components //
////////////////////

const NoteEditor = ({ note, onChangeNote, onCloseNote }) => (
  <div>
    <div>
      <textarea
        className="editor-content"
        autoFocus
        value={note.content}
        onChange={event => onChangeNote(note.id, event.target.value)}
      />
    </div>
    <button className="editor-button" onClick={onCloseNote}>
      Close
    </button>
  </div>
);

const NoteTitle = ({ note }) => {
  const title = note.content.split("\n")[0].replace(/^\s+|\s+$/g, "");
  if (title === "") {
    return <i>Untitled</i>;
  }
  return <span>{title}</span>;
};

const NoteLink = ({ note, onOpenNote }) => (
  <li className="note-list-item">
    <a href="#" onClick={() => onOpenNote(note.id)}>
      <NoteTitle note={note} />
    </a>
  </li>
);

const NoteList = ({ notes, onOpenNote }) => (
  <ul className="note-list">
    {Object.keys(notes).map(id => (
      <NoteLink key={id} note={notes[id]} onOpenNote={onOpenNote} />
    ))}
  </ul>
);

const NoteApp = ({
  notes,
  openNoteId,
  onAddNote,
  onChangeNote,
  onOpenNote,
  onCloseNote
}) => {
  return (
    <div>
      {openNoteId ? (
        <NoteEditor
          note={notes[openNoteId]}
          onChangeNote={onChangeNote}
          onCloseNote={onCloseNote}
        />
      ) : (
        <div>
          <NoteList notes={notes} onOpenNote={onOpenNote} />
          {
            <button className="editor-button" onClick={onAddNote}>
              New Note
            </button>
          }
        </div>
      )}
    </div>
  );
};

const StoreContext = React.createContext();

const connect = (mapStateToProps, mapDispatchToProps) => Component =>
  function Connected() {
    const store = useContext(StoreContext);
    const [stateProps, setStateProps] = useState(
      mapStateToProps(store.getState())
    );
    const dispatchProps = mapDispatchToProps(store.dispatch);
    const update = state => {
      setStateProps(mapStateToProps(state));
    };
    useEffect(() => {
      return store.subscribe(update);
    }, []);

    return <Component {...stateProps} {...dispatchProps} />;
  };

const mapStateToProps = state => ({
  notes: state.notes,
  openNoteId: state.openNoteId
});

const mapDispatchToProps = dispatch => ({
  onAddNote: () =>
    dispatch({
      type: ADD_NOTE
    }),
  onChangeNote: (id, content) =>
    dispatch({
      type: CHANGE_NOTE,
      id,
      content
    }),
  onOpenNote: id =>
    dispatch({
      type: OPEN_NOTE,
      id
    }),
  onCloseNote: () =>
    dispatch({
      type: CLOSE_NOTE
    })
});

const NoteAppContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(NoteApp);

////////////////////
// Render our app //
////////////////////

ReactDOM.render(
  <StoreContext.Provider value={store}>
    <NoteAppContainer />
  </StoreContext.Provider>,
  document.getElementById("app")
);
