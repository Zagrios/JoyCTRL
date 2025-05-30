import { createSvgIcon } from "./svg-icon.type";

const MinimizeIcon = createSvgIcon((props, ref) => (
    <svg ref={ref} {...props} aria-hidden="false" viewBox="0 0 10 2" fill="currentColor">
        <rect fill="currentColor" width="10" height="2" />
    </svg>
));

export default MinimizeIcon;