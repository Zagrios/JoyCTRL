import { useCallback, useRef, useState } from "react";
import KeyboardReact, { SimpleKeyboard } from "react-simple-keyboard";
import { keyboardLayouts, Layout } from "./layouts";
import { useService } from "../../hooks/use-service.hook";
import { IpcService } from "../../services/ipc.service";
import { lastValueFrom } from "rxjs";
import { cn } from "../../helpers/css.helpers";

const keyMustStayPressed = ["{shift}", "{control}", "{meta}", "{alt}", "{altgraph}"];

export function KeyboardComponent() {

    const ipc = useService(IpcService);
    const keyboard = useRef<SimpleKeyboard>(null);

    const [lock, setLock] = useState(false);
    const [currentLayout, setCurrentLayout] = useState<keyof Layout["layout"]>("default");
    const [keyBeingPressed, setKeyBeingPressed] = useState<string[]>([]);

    const sendPressKey = useCallback(async (key: string) => {
        await lastValueFrom(ipc.send("press-key", key));
    }, []);

    const sendReleaseKey = useCallback(async (key: string) => {
        await lastValueFrom(ipc.send("release-key", key));
    }, []);

    const handleOnKeyPress = useCallback((key: string) => {
        if(!key){
            return;
        }

        if(key === "{lock}") {
            setLock(prev => !prev);
        }

        if(key === "{shift}" || key === "{lock}") {
            setCurrentLayout(prev => prev === "shift" ? "default" : "shift");
        } else if (key === "{altgraph}") {
            setCurrentLayout(prev => prev === "altgraph" ? "default" : "altgraph");
        } else if(key === "{fn}") {
            setCurrentLayout(prev => prev === "fn" ? "default" : "fn");
        }

        sendPressKey(key.toLowerCase());
    }, []);

    const handleOnKeyRelease = useCallback((key: string) => {

        if(keyMustStayPressed.includes(key) && !keyBeingPressed.includes(key.toLowerCase())) {
            return setKeyBeingPressed(prev => [...prev, key.toLowerCase()]);
        }

        setKeyBeingPressed(prev => prev.filter(k => k !== key.toLowerCase()));
        console.log("release", key, keyBeingPressed.values());
        sendReleaseKey(key.toLowerCase());
    }, [keyBeingPressed]);

    return (
        <div className={cn("contents", keyBeingPressed.map(k => `key-${k}`), lock && "key-{lock}")}>
            <KeyboardReact
                keyboardRef={r => keyboard.current = r}
                onKeyPress={handleOnKeyPress} 
                onKeyReleased={handleOnKeyRelease}
                layout={keyboardLayouts.french.layout}
                display={keyboardLayouts.french.display}
                layoutName={currentLayout}
            />
        </div>
    )
}
