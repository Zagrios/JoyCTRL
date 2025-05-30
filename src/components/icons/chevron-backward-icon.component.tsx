import { createSvgIcon } from "./svg-icon.type";

export const ChevronBackwardIcon = createSvgIcon((props, ref) => {
    return (
        <svg ref={ref} {...props} viewBox="0 -960 960 960" fill="currentColor">
            <path d="m439.65-480 152.18 152.17Q604.5-315.15 604.5-296t-12.67 31.83Q579.15-251.5 560-251.5t-31.83-12.67L344.41-447.93q-6.71-6.72-9.81-14.92-3.1-8.19-3.1-17.15t3.1-17.15q3.1-8.2 9.81-14.92l183.76-183.76Q540.85-708.5 560-708.5t31.83 12.67Q604.5-683.15 604.5-664t-12.67 31.83z" />
        </svg>
    )
})