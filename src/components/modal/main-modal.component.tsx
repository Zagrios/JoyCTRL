import { AnimatePresence, motion } from "framer-motion"
import { cn } from "../../helpers/css.helpers";
import { useService } from "../../hooks/use-service.hook";
import { ModalExitCode, ModalService } from "../../services/modal.service";
import { useObservable } from "../../hooks/use-observable.hook";
import { useRef } from "react";
import { useOnClickOutside } from "../../hooks/use-on-click-outside.hook";
import { useOnKeyUp } from "../../hooks/use-on-key-up.hook";
 
type Props = {
    className?: string;
}

export function MainModal({ className }: Props) {

    const modal = useService(ModalService);
    const modals = useObservable(() => modal.$getModals(), []);

    const mainModalRef = useRef<HTMLDivElement>(null);

    useOnClickOutside(() => {
        modals?.at(-1)?.resolver({ exitCode: ModalExitCode.NO_CHOICE });
    }, mainModalRef);

    useOnKeyUp("main-modal", () => {
        modals?.at(-1)?.resolver({ exitCode: ModalExitCode.NO_CHOICE });
    }, ["Escape"]);

    return (
        <AnimatePresence>
            {(() => {
                if(!modals.length) {
                    return null;
                }
                return (
                    <motion.div ref={mainModalRef} className={cn("bg-white relative shadow-black/50 shadow-2xl overflow-hidden shrink-0", className)} transition={{ ease: "easeInOut", duration: 0.2 }} initial={{ width: 0 }} animate={{ width: "60%" }} exit={{ width: 0 }}>
                        <AnimatePresence>
                            {modals.map((modal, index) => {
                                return (
                                    <motion.div className="absolute top-0 left-0 size-full bg-white" key={index} transition={{ ease: "easeInOut", duration: 0.2 }} initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}>
                                        <modal.modal resolver={modal.resolver} options={modal.options}/>    
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </motion.div>
                )
            })()}
        </AnimatePresence>
    )
}
