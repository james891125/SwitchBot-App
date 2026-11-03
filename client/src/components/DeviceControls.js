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
            {status && status.power !== undefined && (
                <p className="text-gray-200">Power: <span className="font-semibold">{status.power}</span></p>
            )}
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
