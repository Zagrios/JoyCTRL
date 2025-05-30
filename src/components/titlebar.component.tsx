import { useCallback } from "react";
import { useConstant } from "../hooks/use-constant.hook";
import { CloseSmallIcon } from "./icons/close-small-icon.component";
import MinimizeIcon from "./icons/minimize-icon.component";
import { getCurrentWindow } from '@tauri-apps/api/window';

export function Titlebar() {

    const currentWindow = useConstant(getCurrentWindow())

    const handleMinimize = useCallback(() => {
        currentWindow.minimize();
    }, []);

    const handleClose = useCallback(() => {
        currentWindow.close();
    }, []);

    return (
        <div data-tauri-drag-region className="absolute w-full h-5 top-0 left-0 flex flex-row justify-end items-center z-50">
            <div className="h-full flex flex-row gap-2 items-center mr-1">
                <button className="text-gray-500 rounded-md h-full w-2 aspect-square hover:text-teal-300" onClick={handleMinimize}><MinimizeIcon className="size-full"/></button>
                <button className="text-gray-500 rounded-md h-full aspect-square hover:text-teal-300" onClick={handleClose}><CloseSmallIcon className="size-full"/></button>
            </div>
        </div>
    )
}
