import { Tooltip } from "react-tooltip";
import { cn } from "../helpers/css.helpers";

type Props = {
    className?: string;
    classNameArrow?: string;
    text: string;
    nbMapping: number;
    anchorSelect: string;
    place: Parameters<typeof Tooltip>[0]["place"];
    isOpen?: boolean;
    onClick?: () => void;
}

export function GamepadMappingTooltip({ className, classNameArrow, text, nbMapping, anchorSelect, place, isOpen, onClick }: Props) {
    return (
        <Tooltip anchorSelect={anchorSelect} place={place} className={cn("group !rounded-md cursor-pointer hover:!bg-black hover:!text-teal-300", className)} classNameArrow={cn("!bg-transparent rounded-full outline-2 outline-white md:!size-4 !-rotate-45 group-hover:!bg-teal-300/75", classNameArrow)} isOpen={isOpen != false} opacity={1} clickable>
            <button className="size-full flex flex-col justify-start items-start cursor-pointer text-xs md:text-base" onClick={onClick}>
                <p className="font-bold">{text}</p>
                <p>{nbMapping} Mappings</p>
            </button>
        </Tooltip>
    )
}
