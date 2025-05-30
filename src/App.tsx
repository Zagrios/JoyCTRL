import "./App.css";
import { useService } from "./hooks/use-service.hook";
import { useObservable } from "./hooks/use-observable.hook";
import { GamepadManagerService } from "./services/gamepad-manager.service";
import { GamepadSelector } from "./components/gamepad-selector.component";
import { useCallback, useEffect, useState } from "react";
import { Gamepad } from "./ts/model/gamepad";
import { ReactiveGamepad } from "./components/gamepads/reactive-gamepad.component";
import { MainModal } from "./components/modal/main-modal.component";
import { Titlebar } from "./components/titlebar.component";
import { ModalService } from "./services/modal.service";
import { ChooseGamepadControl } from "./components/modal/choose-gamepad-control.component";
import { IpcService } from "./services/ipc.service";
import { PauseFillIcon } from "./components/icons/pause-fill-icon.component";
import { PlayFillIcon } from "./components/icons/play-fill-icon.component";
import { KeyboardFillIcon } from "./components/icons/kayboard-fill-icon.component";
import { Tooltip } from "react-tooltip";
import { lastValueFrom } from "rxjs";

export default function App() {
    const ipc = useService(IpcService);
	const gamepadManager = useService(GamepadManagerService);
    const modal = useService(ModalService);
	const gamepads = useObservable(() => gamepadManager.$getGamepads());
    const [selectedGamepad, setSelectedGamepad] = useState<Gamepad | undefined>(undefined);

    const mappingActive = useObservable(() => ipc.send("is-mapping-active"));

    useEffect(() => {
        const currentGamepads = gamepads ?? [];
        if(!selectedGamepad){
            return setSelectedGamepad(() => currentGamepads[0]);
        }
        if(!currentGamepads.find(gamepad => gamepad.id() === selectedGamepad?.id())){
            return setSelectedGamepad(() => currentGamepads[0]);
        }
    }, [gamepads]);

    const openChooseGamepadControl = useCallback((selectedGamepad: Gamepad) => {
        if(!selectedGamepad){
            return;
        }

        modal.openModal(ChooseGamepadControl, {data: selectedGamepad});
    }, []);

    const handleToogleMappingActive = useCallback(async () => {
        await lastValueFrom(ipc.send("toogle-mapping-active"));
    }, []);

    const handleOpenKeyboard = useCallback(() => {
        // TODO: Open virtual keyboard
    }, []);

  	return (
            <main className="size-full bg-gray-50 flex flex-col overflow-hidden">
                <Titlebar/>
                <div className="grow flex flex-row">
                    <div className="grow flex flex-col justify-center items-center size-full pt-5">
                        <div className="py-2">
                            <GamepadSelector className="grow" gamepads={gamepads} onChange={(gamepad) => setSelectedGamepad(gamepad)} />
                        </div>
                        <div className="grow shrink min-h-0 min-w-0 p-15 flex flex-col justify-center items-center gap-4">
                            {(() => {
                                    if(!selectedGamepad) {
                                        return null;
                                    }
                                    return <ReactiveGamepad className="grow size-full min-h-0 min-w-0" gamepad={selectedGamepad}/>
                            })()}
                            <div className="flex flex-row gap-4">
                                <button className="size-14 rounded-full bg-gray-300 aspect-square shadow-sm shadow-black/50 text-gray-600 p-3 cursor-pointer" data-tooltip-id="keyboard-tooltip" onClick={handleOpenKeyboard}><KeyboardFillIcon className="size-full"/></button>
                                <button className="size-14 rounded-full bg-gray-300 aspect-square shadow-sm shadow-black/50 text-gray-600 p-2 cursor-pointer" data-tooltip-id="mapping-active-tooltip" onClick={handleToogleMappingActive}>
                                    {mappingActive ? (
                                        <PauseFillIcon className="size-full"/>
                                    ) : (
                                        <PlayFillIcon className="size-full"/>
                                    )}
                                </button>
                                <Tooltip id="mapping-active-tooltip" content="Pause / Resume gamepad control" opacity={1}/>
                                <Tooltip id="keyboard-tooltip" content="Open virtual keyboard" opacity={1}/>
                            </div>
                            <button className="px-6 bg-neutral-800 text-sm text-white p-2 rounded-md font-bold shadow-black/50 shadow-sm cursor-pointer hover:bg-black hover:text-teal-300" onClick={() => openChooseGamepadControl(selectedGamepad!)}>Edit mappings</button>
                        </div>
                    </div>
                    <MainModal className="grow"/>
                </div>
            </main>
	);
}
