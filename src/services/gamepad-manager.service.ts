import { distinctUntilChanged, Observable } from "rxjs";
import { IpcService } from "./ipc.service";
import { deepEqual } from "fast-equals";
import { Gamepad } from "../ts/model/gamepad";

export class GamepadManagerService {

    private static instance: GamepadManagerService;

    public static getInstance(): GamepadManagerService {
        if (!GamepadManagerService.instance) {
            GamepadManagerService.instance = new GamepadManagerService();
        }
        return GamepadManagerService.instance;
    }

    private gamepadsObs$: Observable<Gamepad[]> | undefined;

    private readonly ipc: IpcService;

    private constructor() {
        this.ipc = IpcService.getInstance();
    }

    private get gamepads$(): Observable<Gamepad[]> {
        return new Observable<Gamepad[]>(obs => {
            let currentGamepads: Gamepad[] = [];

            const sub = this.ipc.send("controllers-states").pipe(distinctUntilChanged(deepEqual)).subscribe(newGamepads => {
                const currentGamepadsCopy = [...currentGamepads];

                const newGamepadsIdSet: Set<number> = new Set(newGamepads.map(gamepad => gamepad.id));
                const currentGamepadsIdSet: Set<number> = new Set(currentGamepads.map(gamepad => gamepad.id()));

                const gamepadIdsToKeep = currentGamepadsIdSet.intersection(newGamepadsIdSet);
                const gamepadIdsToAdd = newGamepadsIdSet.difference(gamepadIdsToKeep);
                const gamepadIdsToRemove = currentGamepadsIdSet.difference(gamepadIdsToKeep);

                const gamepadsToAdd = newGamepads.filter(gamepad => gamepadIdsToAdd.has(gamepad.id));
                const gamepadsToRemove = currentGamepads.filter(gamepad => gamepadIdsToRemove.has(gamepad.id()));

                gamepadsToRemove.forEach(gamepad => {
                    currentGamepads.splice(currentGamepadsCopy.indexOf(gamepad), 1);
                });

                gamepadsToAdd.forEach(gamepad => {
                    currentGamepads.push(Gamepad.fromState(gamepad));
                });

                currentGamepads.forEach(currentGamepad => {
                    if(!gamepadIdsToKeep.has(currentGamepad.id())) {
                        return;
                    }

                    const newState = newGamepads.find(gamepad => gamepad.id === currentGamepad.id());

                    if(!newState) {
                        return;
                    }

                    currentGamepad.setState(newState);
                });

                obs.next([...currentGamepads]);
                currentGamepads = [...currentGamepads];
            });

            return () => {
                sub.unsubscribe();
                this.gamepadsObs$ = undefined;
            }
        }).pipe(distinctUntilChanged(deepEqual));
    }

    public $getGamepads(): Observable<Gamepad[]> {
        return this.gamepadsObs$ ?? (this.gamepadsObs$ = this.gamepads$);
    }

}
