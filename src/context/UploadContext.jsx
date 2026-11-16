import { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState } from "react";
import uploadReducer, {
    ADD_FILES,
    CANCEL_UPLOAD,
    CLEAR_FINISHED,
    RETRY_UPLOAD,
    START_UPLOAD,
    UPDATE_PROGRESS,
    UPLOAD_DONE,
    UPLOAD_ERROR,
} from "../reducer/uploadReducer";
import albumService from "../services/albumService";
import { getErrorMessage } from "../services/api";
import mediaService from "../services/mediaService";

const UploadContext = createContext();

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/tiff"];
const MAX_BYTES = 50 * 1024 * 1024;
const CONCURRENCY = 3;

function validate(file) {
    if (!ACCEPTED.includes(file.type)) return "Định dạng không được hỗ trợ";
    if (file.size > MAX_BYTES) return "Tệp lớn hơn 50 MB";
    if (file.size === 0) return "Tệp rỗng";
    return "";
}

export function UploadProvider({ children }) {
    const [tasks, dispatch] = useReducer(uploadReducer, []);
    const [version, setVersion] = useState(0);
    const controllers = useRef(new Map());
    const inputRef = useRef(null);
    const pickerAlbum = useRef(null);

    const run = useCallback(async (task) => {
        const controller = new AbortController();
        controllers.current.set(task.id, controller);
        dispatch({ type: START_UPLOAD, payload: task.id });
        try {
            const res = await mediaService.uploadMedia(task.file, {
                signal: controller.signal,
                onProgress: (progress) => dispatch({ type: UPDATE_PROGRESS, payload: { id: task.id, progress } }),
            });
            if (task.albumId) await albumService.addItems(task.albumId, [res.data.id]);
            dispatch({ type: UPLOAD_DONE, payload: task.id });
            setVersion((v) => v + 1);
        } catch (err) {
            if (err.name === "CanceledError") dispatch({ type: CANCEL_UPLOAD, payload: task.id });
            else dispatch({ type: UPLOAD_ERROR, payload: { id: task.id, error: getErrorMessage(err, "Tải lên thất bại") } });
        } finally {
            controllers.current.delete(task.id);
        }
    }, []);

    useEffect(() => {
        const active = tasks.filter((t) => t.status === "uploading").length;
        const queued = tasks.filter((t) => t.status === "queued" && !controllers.current.has(t.id));
        queued.slice(0, Math.max(0, CONCURRENCY - active)).forEach((task) => {
            controllers.current.set(task.id, null);
            run(task);
        });
    }, [tasks, run]);

    const busy = tasks.some((t) => t.status === "queued" || t.status === "uploading");
    useEffect(() => {
        if (!busy) return;
        const handler = (e) => e.preventDefault();
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [busy]);

    const addFiles = useCallback((files, albumId = null) => {
        const list = Array.from(files).map((file) => {
            const error = validate(file);
            return {
                id: crypto.randomUUID(),
                file,
                albumId,
                status: error ? "error" : "queued",
                progress: 0,
                error,
            };
        });
        dispatch({ type: ADD_FILES, payload: list });
    }, []);

    const openPicker = useCallback((albumId = null) => {
        pickerAlbum.current = albumId;
        inputRef.current?.click();
    }, []);

    const value = {
        tasks,
        version,
        addFiles,
        openPicker,
        cancel: (id) => {
            controllers.current.get(id)?.abort();
            dispatch({ type: CANCEL_UPLOAD, payload: id });
        },
        retry: (id) => dispatch({ type: RETRY_UPLOAD, payload: id }),
        clearFinished: () => dispatch({ type: CLEAR_FINISHED }),
    };

    return (
        <UploadContext.Provider value={value}>
            {children}
            <input
                ref={inputRef}
                type="file"
                multiple
                accept={ACCEPTED.join(",")}
                hidden
                onChange={(e) => {
                    if (e.target.files?.length) addFiles(e.target.files, pickerAlbum.current);
                    e.target.value = "";
                }}
            />
        </UploadContext.Provider>
    );
}

export function useUpload() {
    return useContext(UploadContext);
}
