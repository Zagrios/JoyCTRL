import { useCallback } from "react";
import { useConstant } from "../hooks/use-constant.hook";
import { CloseSmallIcon } from "./icons/close-small-icon.component";
import MinimizeIcon from "./icons/minimize-icon.component";
import { getCurrentWindow } from '@tauri-apps/api/window';

type Props = {
    minimize?: boolean;
    showGrab?: boolean;
    close?: boolean;
}

export function Titlebar({ minimize = true, close = true, showGrab = false }: Props) {

    const currentWindow = useConstant(getCurrentWindow())

    const handleMinimize = useCallback(() => {
        currentWindow.minimize();
    }, []);

    const handleClose = useCallback(() => {
        currentWindow.close();
    }, []);

    return (
        <div data-tauri-drag-region className="absolute w-full h-5 top-0 left-0 flex flex-row justify-end items-center z-50">
            {showGrab && <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-32 h-1.5 bg-gray-400 rounded-full pointer-events-none"/>}
            <div className="h-full flex flex-row gap-2 items-center mr-1">
                {minimize && <button className="text-gray-500 rounded-md h-full w-2 aspect-square hover:text-teal-300" onClick={handleMinimize}><MinimizeIcon className="size-full"/></button>}
                {close && <button className="text-gray-500 rounded-md h-full aspect-square hover:text-teal-300" onClick={handleClose}><CloseSmallIcon className="size-full"/></button>}
            </div>
        </div>
    )
}
