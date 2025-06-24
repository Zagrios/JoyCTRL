import "./App.css";
import { Titlebar } from "./components/titlebar.component";
import { KeyboardComponent } from "./components/keyboard/keyboard.component";

export function Keyboard() {

    return (
        <main className="size-full bg-gray-50 flex flex-col overflow-hidden">
            <Titlebar minimize={false}/>
            <div className="grow flex flex-col items-end p-2">
                <div className="h-10 shrink-0">
                </div>
                <KeyboardComponent/>
            </div>
        </main>
    )
}
