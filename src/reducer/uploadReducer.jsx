export const ADD_FILES = "ADD_FILES";
export const START_UPLOAD = "START_UPLOAD";
export const UPDATE_PROGRESS = "UPDATE_PROGRESS";
export const UPLOAD_DONE = "UPLOAD_DONE";
export const UPLOAD_ERROR = "UPLOAD_ERROR";
export const CANCEL_UPLOAD = "CANCEL_UPLOAD";
export const RETRY_UPLOAD = "RETRY_UPLOAD";
export const CLEAR_FINISHED = "CLEAR_FINISHED";

function patch(state, id, changes) {
    return state.map((task) => (task.id === id ? { ...task, ...changes } : task));
}

function uploadReducer(state, action) {
    switch (action.type) {
        case ADD_FILES:
            return [...state, ...action.payload];

        case START_UPLOAD:
            return patch(state, action.payload, { status: "uploading", progress: 0, error: "" });

        case UPDATE_PROGRESS:
            return patch(state, action.payload.id, { progress: action.payload.progress });

        case UPLOAD_DONE:
            return patch(state, action.payload, { status: "done", progress: 1 });

        case UPLOAD_ERROR:
            return patch(state, action.payload.id, { status: "error", error: action.payload.error });

        case CANCEL_UPLOAD:
            return patch(state, action.payload, { status: "canceled" });

        case RETRY_UPLOAD:
            return patch(state, action.payload, { status: "queued", progress: 0, error: "" });

        case CLEAR_FINISHED:
            return state.filter((task) => task.status === "queued" || task.status === "uploading");

        default:
            return state;
    }
}

export default uploadReducer;
