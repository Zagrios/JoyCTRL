
const displays = {
    "{alt}": "Alt",
    "{shift}": "🠉",
    "{shiftactivated}": "⇧",
    "{enter}": "⮠",
    "{bksp}": "⌫",
    "{space}": " ",
    "{tab}": "Tab",
    "{back}": "⇦",
    "{control}": "Ctrl",
    "{meta}": "⌘",
    "{fn}": "Fn",
    "{lock}": "Caps ⇪",
    "{escape}": "Esc",
    "{f1}": "F1",
    "{f2}": "F2",
    "{f3}": "F3",
    "{f4}": "F4",
    "{f5}": "F5",
    "{f6}": "F6",
    "{f7}": "F7",
    "{f8}": "F8",
    "{f9}": "F9",
    "{f10}": "F10",
    "{f11}": "F11",
    "{f12}": "F12",
    "{mediaplaypause}": "⏯",
    "{mediatrackprevious}": "⏮",
    "{mediatracknext}": "⏭",
    "{audiovolumemute}": "🔇",
    "{audiovolumedown}": "🔉",
    "{audiovolumeup}": "🔊",
    "{prtscr}": "PrtSc",
    "{altgraph}": "AltGr",
  }

/**
 * Layout: English
 */
export const englishLayout: Layout = {
    shortName: "ENG",
    layout: {
        default: [
            "{escape} 1 2 3 4 5 6 7 8 9 0 - = {bksp}",
            "{tab} q w e r t y u i o p [ ] \\",
            "{lock} a s d f g h j k l ; ' {enter}",
            "{shift} z x c v b n m , . / {shift}",
            "{control} {meta} {alt} {space} {alt} {fn}",
        ],
        shift: [
            "{escape} ! @ # $ % ^ & * ( ) _ + {bksp}",
            "{tab} Q W E R T Y U I O P { } |",
            '{lock} A S D F G H J K L : " {enter}',
            "{shift} Z X C V B N M < > ? {shift}",
            "{control} {meta} {alt} {space} {alt} {fn}",
        ],
        altgraph: [],
        fn: [
            "{escape} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12} {bksp}",
            "{tab} {mediaplaypause} {mediatrackprevious} {mediatracknext} {audiovolumemute} {audiovolumedown} {audiovolumeup}     {prtscr}",
            "{lock}             {enter}",
            "{shift}           ",
            "{control} {meta} {alt} {space} {alt} {fn}"
        ]
    },
    display: displays,
};
  

/**
 * Layout: French
 */
const frenchLayout: Layout = {
    shortName: "FRA",
    layout: {
        default: [
            "{escape} & é \" \' ( - è _ ç à ) = {bksp}",
            "{tab} a z e r t y u i o p ^ $",
            "{lock} q s d f g h j k l m ù * {enter}",
            "{shift} < w x c v b n , ; : ! {shift}",
            "{control} {meta} {alt} {space} {altgraph} {fn}",
        ],
        shift: [
            "{escape} 1 2 3 4 5 6 7 8 9 0 ° + {bksp}",
            "{tab} A Z E R T Y U I O P ¨ £",
            "{lock} Q S D F G H J K L M % µ {enter}",
            "{shift} > W X C V B N ? . / § {shift}",
            "{control} {meta} {alt} {space} {altgraph} {fn}",
        ],
        altgraph: [
            "{escape}  ~ # { [ | ` \\ ^ @ ] } {bksp}",
            "{tab}   €         ¤",
            "{lock}             {enter}",
            "{shift}            ",
            "{control} {meta} {alt} {space} {altgraph} {fn}",
        ],
        fn: [
            "² {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12} {bksp}",
            "{tab} {mediaplaypause} {mediatrackprevious} {mediatracknext} {audiovolumemute} {audiovolumedown} {audiovolumeup}     {prtscr}",
            "{lock}             {enter}",
            "{shift}           ",
            "{control} {meta} {alt} {space} {altgraph} {fn}"
        ]
    },
    display: displays,
};

export type Layout = {
    shortName: string;
    layout: {
        default: string[];
        shift: string[];
        altgraph: string[];
        fn: string[];
    }
    display: {
        [key: string]: string;
    }
} 

export const keyboardLayouts = {
    french: frenchLayout,
    english: englishLayout,
}

export enum FunctionKey {
    Escape = "{escape}",
    Backspace = "{bksp}",
    Enter = "{enter}",
    Tab = "{tab}",
    Shift = "{shift}",
    Control = "{control}",
    Meta = "{meta}",
    Alt = "{alt}",
}