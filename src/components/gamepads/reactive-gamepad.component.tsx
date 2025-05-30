import { useObservable } from "../../hooks/use-observable.hook";
import { Gamepad, GamepadModel } from "../../ts/model/gamepad"
import { DualsenseBlack } from "./dualsense-black.component";
import { DualsenseWhite } from "./dualsense-white.component";
import { Dualshock4Black } from "./dualshock-4-black.component";
import { Dualshock4White } from "./dualshock-4-white.component";
import { XboxOneBlack } from "./xbox-one-black.component";
import { XboxOneWhite } from "./xbox-one-white.component";
import { XboxSeriesXBlack } from "./xbox-series-x-black.component";
import { XboxSeriesXWhite } from "./xbox-series-x-white.component";

type Props = {
    className?: string,
    colorVariant?: "white" | "black",
    gamepad: Gamepad
}

export function ReactiveGamepad({ className, colorVariant = "white", gamepad }: Props) {

    const gamepadModel = useObservable(() => gamepad.$model(), GamepadModel.Unknown, [gamepad]);
    
    return (
        (() => {
            switch(gamepadModel) {
                case GamepadModel.XboxOne:
                    return colorVariant === "black" ? <XboxOneBlack className={className} /> : <XboxOneWhite className={className} gamepad={gamepad} />
                case GamepadModel.XboxSeries:
                    return colorVariant === "black" ? <XboxSeriesXBlack className={className} /> : <XboxSeriesXWhite className={className} />
                case GamepadModel.Dualshock4:
                    return colorVariant === "black" ? <Dualshock4Black className={className} /> : <Dualshock4White className={className} />
                case GamepadModel.Dualsense:
                    return colorVariant === "black" ? <DualsenseBlack className={className} /> : <DualsenseWhite className={className} />
                default:
                    return null;
            }
        })()
    )
}
