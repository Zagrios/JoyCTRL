import { createSvgIcon } from "./svg-icon.type";

export const ChevronForwardIcon = createSvgIcon((props, ref) => {
    return (
        <svg ref={ref} {...props} viewBox="0 -960 960 960" fill="currentColor">
            <path d="M496.35-480 344.17-632.17Q331.5-644.85 331.5-664t12.67-31.83Q356.85-708.5 376-708.5t31.83 12.67l183.76 183.76q6.71 6.72 9.81 14.92 3.1 8.19 3.1 17.15 0 8.96-3.1 17.15-3.1 8.2-9.81 14.92L407.83-264.17Q395.15-251.5 376-251.5t-31.83-12.67Q331.5-276.85 331.5-296t12.67-31.83L496.35-480Z" />
        </svg>
    )   
})