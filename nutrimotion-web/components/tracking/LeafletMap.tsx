'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box } from '@mui/material';
import { useEffect } from 'react';

// Fix for default Leaflet icon not showing up in Next.js
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom icons for brand alignment
const driverIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const deliveryIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

function RecenterAutomatically({ lat, lng }: { lat: number, lng: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng]);
    }, [lat, lng, map]);
    return null;
}

interface LeafletMapProps {
    driverLocation?: { lat: number; lng: number };
    destination?: { lat: number; lng: number };
}

export default function LeafletMap({ driverLocation, destination }: LeafletMapProps) {
    // Jamaica center as default
    const defaultCenter: [number, number] = [18.1096, -77.2975];
    const center = driverLocation ? [driverLocation.lat, driverLocation.lng] : (destination ? [destination.lat, destination.lng] : defaultCenter);

    // Manual cleanup for Leaflet in dev mode/HMR
    useEffect(() => {
        return () => {
            const container = L.DomUtil.get('delivery-tracking-map');
            if (container) {
                // @ts-ignore
                container._leaflet_id = null;
            }
        };
    }, []);

    return (
        <Box sx={{ width: '100%', height: '100%', borderRadius: 2, overflow: 'hidden' }}>
            <MapContainer
                id="delivery-tracking-map"
                center={center as [number, number]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {driverLocation && (
                    <>
                        <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
                            <Popup>Driver's Current Location</Popup>
                        </Marker>
                        <RecenterAutomatically lat={driverLocation.lat} lng={driverLocation.lng} />
                    </>
                )}

                {destination && (
                    <Marker position={[destination.lat, destination.lng]} icon={deliveryIcon}>
                        <Popup>Delivery Destination</Popup>
                    </Marker>
                )}
            </MapContainer>
        </Box>
    );
}
