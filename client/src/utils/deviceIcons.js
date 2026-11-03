import shapeIcons from './deviceShapeIcons.json';

// Local icons live in public/icons; newer devices that are not bundled
// fall back to SwitchBot's own icon CDN (same source as public/icons/icons.cmd).
const LOCAL_BASE = '/icons/';
const CDN_BASE = 'https://d2qg3tx5cpup36.cloudfront.net/dark/';

export const UNKNOWN_ICON = `${LOCAL_BASE}unknown_default.png`;

// Index of "<deviceType>" -> icon file, generated from
// https://prod-switchbot-icons.s3.amazonaws.com/wo_device_icon.json
export function getDeviceIconSrc(device) {
    const type = device?.device_detail?.device_type;
    if (!type) return UNKNOWN_ICON;

    const entry = shapeIcons[type];
    if (!entry) return UNKNOWN_ICON;

    return entry.local ? `${LOCAL_BASE}${entry.file}` : `${CDN_BASE}${entry.file}`;
}

export function getRemoteIconSrc(remote) {
    if (!remote || remote.type === undefined || remote.type === null) {
        return UNKNOWN_ICON;
    }

    const typePart = Number(remote.type) < 15 ? Number(remote.type) : String(remote.type)[0];
    return `${LOCAL_BASE}ir_type_${typePart}.png`;
}

// Use as <img onError={handleIconError} />, so a missing file never shows a broken image.
export function handleIconError(event) {
    const img = event.currentTarget;
    if (!img.src.endsWith('unknown_default.png')) {
        img.src = UNKNOWN_ICON;
    }
}
