import { cn } from "../../helpers/css.helpers";
import { ChevronBackwardIcon } from "../icons/chevron-backward-icon.component";

type Props = {
    className?: string;
    title: string;
    onBack?: () => void;
}

export function ModalTitle({className, title, onBack}: Props) {
  return (
    <div className={cn("text-xl font-bold bg-gray-200 py-6 pl-6 sticky top-0 shrink-0 flex flex-row items-center gap-2", className)}>
        <button className="text-2xl text-gray-500 cursor-pointer size-8" onClick={onBack}><ChevronBackwardIcon className="start-full"/></button>
        <h1 className="text-xl">{title}</h1>
    </div>
  )
}
