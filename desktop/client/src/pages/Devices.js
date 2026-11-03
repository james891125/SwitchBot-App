import React, { useEffect, useState } from 'react';
import Overlay from '../components/Overlay';
import MeterIcons from '../components/MeterIcons';
import useAxios from '../hooks/useAxios';
import { getDeviceIconSrc, getRemoteIconSrc, handleIconError } from '../utils/deviceIcons';

function Devices() {
    const [devices, setDevices] = useState([]);
    const [remotes, setRemotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const { post } = useAxios();

    useEffect(() => {
        post(`${process.env.REACT_APP_SERVER_URL}/switchbot/getall`)
            .then(res => {
                setDevices(res.data.devices);
                setRemotes(res.data.remotes);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [post]);

    const handleDeviceClick = (device) => {
        setSelectedItem({ type: 'device', data: device });
    };

    const handleRemoteClick = (remote) => {
        setSelectedItem({ type: 'remote', data: remote });
    };

    const handleOverlayBack = () => {
        setSelectedItem(null);
    };

    if (loading) return <div className="text-center py-8 text-lg text-gray-300">Loading...</div>;

    return (
        <>
            <div className="p-8 space-y-8">
                <Section title="Devices" count={devices.length}>
                    {devices.map(device => (
                        <Card
                            key={device.device_mac}
                            onClick={() => handleDeviceClick(device)}
                            name={device.device_name}
                            subtitle={deviceTypeLabel(device.device_detail?.device_type)}
                            tooltip={device.device_mac}
                        >
                            {device.device_detail?.device_type?.toLowerCase().includes('meter')
                                ? <MeterIcons deviceId={device.device_mac} />
                                : <CardIcon src={getDeviceIconSrc(device)} />}
                        </Card>
                    ))}
                </Section>
                {remotes.length > 0 && (
                    <Section title="IR Remotes" count={remotes.length}>
                        {remotes.map(remote => (
                            <Card
                                key={remote.remoteID}
                                onClick={() => handleRemoteClick(remote)}
                                name={remote.remoteName}
                                subtitle="IR remote"
                                tooltip={remote.remoteID}
                            >
                                <CardIcon src={getRemoteIconSrc(remote)} />
                            </Card>
                        ))}
                    </Section>
                )}
            </div>
            {selectedItem && (
                <Overlay onBack={handleOverlayBack} item={selectedItem.data} type={selectedItem.type} />
            )}
        </>
    );
}

// Readable names for common device types; anything else shows the raw type.
const DEVICE_TYPE_LABELS = {
    WoHand: 'Bot',
    WoPlug: 'Plug',
    WoPlugUS: 'Plug Mini',
    WoPlugJP: 'Plug Mini',
    WoMeter: 'Meter',
    WoMeterPlus: 'Meter Plus',
    WoHub2: 'Hub 2',
    WoLinkMini: 'Hub Mini',
    WoLinkPlus: 'Hub Plus',
    WoContact: 'Contact Sensor',
    WoPresence: 'Motion Sensor',
    WoCurtain: 'Curtain',
    WoCurtain3: 'Curtain 3',
    WoLock: 'Lock',
    WoLockPro: 'Lock Pro',
};

function deviceTypeLabel(type) {
    return DEVICE_TYPE_LABELS[type] || type || 'Device';
}

function Section({ title, count, children }) {
    return (
        <section>
            <h2 className="mb-3 text-left text-sm font-semibold uppercase tracking-wider text-gray-400">
                {title} <span className="text-gray-500">· {count}</span>
            </h2>
            <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(190px,1fr))]">
                {children}
            </div>
        </section>
    );
}

function Card({ name, subtitle, tooltip, onClick, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={tooltip}
            className="flex h-36 flex-col justify-between rounded-2xl border border-white/5 bg-[#1e2836] p-4 text-left shadow-sm transition-colors hover:border-white/15 hover:bg-[#283547] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
            <div className="flex items-center">{children}</div>
            <div className="min-w-0 w-full">
                <div className="truncate text-base font-medium text-white">{name}</div>
                <div className="mt-0.5 truncate text-xs text-gray-400">{subtitle}</div>
            </div>
        </button>
    );
}

function CardIcon({ src }) {
    return (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
            <img src={src} onError={handleIconError} alt="" className="h-9 w-9 object-contain" />
        </div>
    );
}

export default Devices;