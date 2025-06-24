import { BehaviorSubject, distinctUntilChanged, map, Observable } from "rxjs";
import { deepEqual } from "fast-equals";
import { GamepadAxis, GamepadButton, GamepadState } from "../bindings/gamepad";

export class Gamepad {

    public static fromState(state: GamepadState): Gamepad {
      return new Gamepad(state);
    }
  
    private readonly state$: BehaviorSubject<GamepadState>;
  
    public constructor(state: GamepadState) {
      this.state$ = new BehaviorSubject(state);
    }

    public setState(state: GamepadState) {
      this.state$.next(state);
    }
  
    public id(): number {
      return this.state$.value.id;
    }
  
    public name(): string {
      return this.state$.value.name;
    }
  
    public buttons(): Record<GamepadButton, boolean> {
      return this.state$.value.buttons;
    }

    public model(): GamepadModel {
        if(this.state$.value.name.toLowerCase().includes("xbox") && this.state$.value.name.toLowerCase().includes("one")) {
            return GamepadModel.XboxOne;
        } else if (this.state$.value.name.toLowerCase().includes("xbox") && this.state$.value.name.toLowerCase().includes("series")) {
            return GamepadModel.XboxSeries;
        } else if (this.state$.value.name.toLowerCase().includes("dualsense")) {
            return GamepadModel.Dualsense;
        } else if (this.state$.value.name.toLowerCase().includes("dualshock")) {
            return GamepadModel.Dualshock4;
        }
        return GamepadModel.Unknown;
    }

    public $model(): Observable<GamepadModel> {
        return this.state$.asObservable().pipe(map(() => this.model()), distinctUntilChanged());
    }

    public brand(): GamepadBrand {
        const name = this.state$.value.name.toLowerCase();

        if(name.includes("xbox")) {
            return GamepadBrand.Xbox;
        } else if (name.includes("dualsense") || name.includes("ps4") || name.includes("ps5") || name.includes("sony")) {
            return GamepadBrand.Sony;
        }
        return GamepadBrand.Unknown;
    }
    
    public $buttons(): Observable<Record<GamepadButton, boolean>> {
      return this.state$.asObservable().pipe(map(state => state.buttons), distinctUntilChanged(deepEqual));
    }
  
    public axis(): Record<GamepadAxis, number> {
      return this.state$.value.axis;
    }

    public $axis(): Observable<Record<GamepadAxis, number>> {
      return this.state$.asObservable().pipe(map(state => state.axis), distinctUntilChanged(deepEqual));
    }
  
    public isButtonPressed(button: GamepadButton): boolean {
      return this.state$.value.buttons[button] || false;
    }

    public $isButtonPressed(button: GamepadButton): Observable<boolean> {
      return this.state$.asObservable().pipe(map(() => this.isButtonPressed(button)), distinctUntilChanged());
    }
  
    public getNormalizedAxisValue (axis: GamepadAxis): number {
      const value = this.state$.value.axis[axis] || 0;
      return Math.max(-1, Math.min(1, value / 32767));
    }

    public $getNormalizedAxisValue(axis: GamepadAxis): Observable<number> {
      return this.state$.asObservable().pipe(map(() => this.getNormalizedAxisValue(axis)), distinctUntilChanged());
    }

    public getButtonMask(): GamepadButton[] {
        switch(this.model()) {
            case GamepadModel.XboxOne:
            case GamepadModel.XboxSeries:
                return ["touchpad", 'paddle1', 'paddle2', 'paddle3', 'paddle4'];
            case GamepadModel.Dualshock4:
            case GamepadModel.Dualsense:
                return ['paddle1', 'paddle2', 'paddle3', 'paddle4'];
            default:
                return [];
        }
    }
}

export enum GamepadModel {
    XboxOne,
    XboxSeries,
    Dualshock4,
    Dualsense,
    Unknown
}

export enum GamepadBrand {
    Xbox = "xbox",
    Sony = "sony",
    Unknown = "unknown"
}