import React, { useCallback, useEffect, useState } from 'react';
import useAxios from '../hooks/useAxios';

// Open API commands per device type. Anything not listed gets the generic On/Off pair,
// which most switch-like devices (plugs, relay switches, lights) accept.
const BOT_COMMANDS = [
    { label: 'Press', command: 'press' },
    { label: 'On', command: 'turnOn' },
    { label: 'Off', command: 'turnOff' },
];
const ON_OFF_COMMANDS = [
    { label: 'On', command: 'turnOn' },
    { label: 'Off', command: 'turnOff' },
];

function commandsFor(deviceType = '') {
    if (deviceType === 'WoHand') return BOT_COMMANDS;
    // Sensors (meters, contact/motion, water leak) only report status.
    if (/Meter|Contact|Presence|Sensor|WaterDetector/i.test(deviceType)) return [];
    return ON_OFF_COMMANDS;
}

// Friendly labels/units for Open API status fields (Plug Mini, Bot, meters...).
// Unknown fields are still shown with their raw name.
const STATUS_FIELDS = {
    power: { label: 'Power' },
    voltage: { label: 'Voltage', unit: 'V' },
    weight: { label: 'Power draw', unit: 'W' },
    electricCurrent: { label: 'Current', unit: 'A' },
    electricityOfDay: { label: 'Used today', unit: 'min' },
    battery: { label: 'Battery', unit: '%' },
    temperature: { label: 'Temperature', unit: '°C' },
    humidity: { label: 'Humidity', unit: '%' },
    deviceMode: { label: 'Mode' },
    onlineStatus: { label: 'Online' },
    version: { label: 'Firmware' },
};
const HIDDEN_FIELDS = new Set(['deviceId', 'deviceType', 'hubDeviceId']);

function StatusTable({ status }) {
    const rows = Object.entries(status).filter(
        ([key, value]) => !HIDDEN_FIELDS.has(key) && value !== null && typeof value !== 'object'
    );
    if (rows.length === 0) return null;
    return (
        <table className="text-gray-200 text-base">
            <tbody>
                {rows.map(([key, value]) => {
                    const field = STATUS_FIELDS[key] || { label: key };
                    return (
                        <tr key={key}>
                            <td className="pr-6 py-1 text-gray-400">{field.label}</td>
                            <td className="py-1 font-semibold">{String(value)}{field.unit ? ` ${field.unit}` : ''}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}

// Open API answers HTTP 200 with its own statusCode in the body: 100 means success.
function describeResult(body) {
    if (!body) return 'No response from SwitchBot.';
    if (body.statusCode === 100) return 'Done.';
    return `SwitchBot: ${body.message || 'failed'} (code ${body.statusCode})`;
}

export default function DeviceControls({ device }) {
    const { post } = useAxios();
    const deviceId = device.device_mac;
    const deviceType = device.device_detail?.device_type;
    const [status, setStatus] = useState(null);
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);

    const refreshStatus = useCallback(() => {
        post(`${process.env.REACT_APP_SERVER_URL}/switchbot/getDeviceStatus`, { deviceId })
            .then(res => setStatus(res?.data?.response || null))
            .catch(() => setStatus(null));
    }, [post, deviceId]);

    useEffect(() => {
        refreshStatus();
    }, [refreshStatus]);

    const send = async (command) => {
        setBusy(true);
        setMessage('');
        try {
            const res = await post(`${process.env.REACT_APP_SERVER_URL}/switchbot/controlDevice`, {
                deviceId,
                command,
                parameter: 'default',
                commandType: 'command',
            });
            setMessage(describeResult(res?.data?.response));
            setTimeout(refreshStatus, 1500);
        } catch (err) {
            setMessage('Request failed. Check the terminal running the app for details.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-6">
            <h2 className="text-2xl font-semibold text-white">{device.device_name}</h2>
            <p className="text-gray-400 text-sm">{deviceType} · {deviceId}</p>
            {status && <StatusTable status={status} />}
            <button onClick={refreshStatus} className="text-sm text-gray-400 hover:text-white underline">
                Refresh
            </button>
            <div className="flex gap-6">
                {commandsFor(deviceType).map(({ label, command }) => (
                    <button
                        key={command}
                        disabled={busy}
                        onClick={() => send(command)}
                        className="w-24 h-24 rounded-full bg-gray-800 hover:bg-gray-600 active:bg-blue-500 disabled:opacity-50 text-white text-lg shadow transition"
                    >
                        {label}
                    </button>
                ))}
            </div>
            {message && <p className="text-gray-300 text-center max-w-md">{message}</p>}
        </div>
    );
}
