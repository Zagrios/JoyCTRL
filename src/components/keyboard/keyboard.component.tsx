import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import KeyboardReact, { SimpleKeyboard } from "react-simple-keyboard";
import { keyboardLayouts, Layout } from "./layouts";
import { useService } from "../../hooks/use-service.hook";
import { IpcService } from "../../services/ipc.service";
import { first, lastValueFrom } from "rxjs";
import { cn } from "../../helpers/css.helpers";
import { useConstant } from "../../hooks/use-constant.hook";
import { ConfigService } from "../../services/config.service";

const keyMustStayPressed = ["{shift}", "{control}", "{meta}", "{alt}"];

export function KeyboardComponent() {

    const ipc = useService(IpcService);
    const config = useService(ConfigService);
    const keyboard = useRef<SimpleKeyboard>(null);

    const [lock, setLock] = useState(false);
    const [altgraph, setAltgraph] = useState(false);
    const [fn, setFn] = useState(false);
    const [keyBeingPressed, setKeyBeingPressed] = useState<string[]>([]);
    const [keyboardLayout, setKeyboardLayout] = useState<keyof typeof keyboardLayouts>("english");

    useEffect(() => {
        config.$get("keyboardLayout").pipe(first()).subscribe((layout) => {
            if(layout && keyboardLayouts[layout as keyof typeof keyboardLayouts]){
                return setKeyboardLayout(() => layout as keyof typeof keyboardLayouts);
            }

            const lang = window.navigator.language.split("-")[0];

            switch(lang){
                case "fr":
                    return setKeyboardLayout(() => "french");
                default:
                    return setKeyboardLayout(() => "english");
            }
        });
    }, []);

    const isFunctionKey = useCallback((key: string) => {
        return /{\w+}/.test(key);
    }, []);

    const currentLayout = useMemo<keyof Layout["layout"]>(() => {
        const lastFunctionKey = keyBeingPressed.findLast(k => isFunctionKey(k));
        
        const layout = (() => {
            switch(lastFunctionKey){
                case "{shift}":
                case "{lock}":
                    return "shift";
                case "{fn}":
                    return "fn";
                default:
                    return "default";
            }
        })();

        if(layout !== "default"){
            return layout;
        }

        if(lock){
            return "shift";
        }

        if(fn){
            return "fn";
        }

        if(altgraph){
            return "altgraph";
        }

        return "default";
    }, [keyBeingPressed, lock, fn, altgraph]);

    useEffect(() => {
        localStorage.setItem("vk-current-layout", currentLayout);
    }, [currentLayout]);

    const sendPressKeys = useCallback(async (keys: string[]) => {
        if(!keys.some(k => isFunctionKey(k)) && currentLayout === "altgraph"){
            return lastValueFrom(ipc.send("write-text", keys.join("")));
        }
        return lastValueFrom(ipc.send("press-keys", keys));
    }, [currentLayout]);

    const sendReleaseKeys = useCallback(async (keys: string[]) => {
        return lastValueFrom(ipc.send("release-keys", keys));
    }, []);

    const handleOnKeyPress = useCallback((key: string, event?: MouseEvent) => {
        event?.preventDefault();

        if(!key){
            return;
        }

        if(key === "{lock}") {
            setLock(prev => !prev);
        } else if(key === "{fn}") {
            setAltgraph(() => false);
            return setFn(prev => !prev);
        } else if(key === "{altgraph}") {
            setFn(() => false);
            return setAltgraph(prev => !prev);
        }

        sendPressKeys([key.toLowerCase()]);
    }, [sendPressKeys]);

    const handleOnKeyRelease = useCallback((key: string) => {

        if(keyMustStayPressed.includes(key) && !keyBeingPressed.includes(key.toLowerCase())) {
            return setKeyBeingPressed(prev => [...prev, key.toLowerCase()]);
        }

        sendReleaseKeys([...keyBeingPressed, key.toLowerCase()]).then(() => setKeyBeingPressed(() => []));
    }, [keyBeingPressed]);

    return (
        <div className={cn("contents", keyBeingPressed.map(k => `key-${k}`), lock && "key-{lock}")}>
            <KeyboardReact
                keyboardRef={r => keyboard.current = r}
                onKeyPress={handleOnKeyPress} 
                onKeyReleased={handleOnKeyRelease}
                layout={keyboardLayouts[keyboardLayout].layout}
                display={keyboardLayouts[keyboardLayout].display}
                layoutName={currentLayout}
                disableButtonHold
            />
        </div>
    )
}
