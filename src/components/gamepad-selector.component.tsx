import { Gamepad } from "../ts/model/gamepad"

type Props = {
    className?: string,
    gamepads: Gamepad[] | undefined,
    onChange: (gamepad: Gamepad) => void
}

export function GamepadSelector({ className, gamepads, onChange }: Props) {
    return (
        <select className={className} onChange={(e) => onChange(gamepads![Number(e.target.value)])}>
            {gamepads?.map((gamepad, index) => (
                <option key={gamepad.id()} value={index}>
                    {gamepad.name()}
                </option>
            ))}
        </select>
    )
}
