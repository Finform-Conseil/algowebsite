'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import type { SGO } from '@/types/sgo';
import 'leaflet/dist/leaflet.css';

// Fix pour les icônes Leaflet dans Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

type InteractiveSGOMapProps = {
  sgos: SGO[];
  center: {
    latitude: number;
    longitude: number;
  };
  zoom?: number;
  exchangeColor?: string;
  onBack: () => void;
  exchangeName: string;
  exchangeShortName: string;
};

// Composant pour ajuster la vue de la carte
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
}

const InteractiveSGOMap: React.FC<InteractiveSGOMapProps> = ({
  sgos,
  center,
  zoom = 6,
  exchangeColor = '#10B981',
  onBack,
  exchangeName,
  exchangeShortName,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Créer une icône personnalisée pour les SGO
  const createCustomIcon = (color: string) => {
    return L.divIcon({
      className: 'custom-sgo-marker',
      html: `
        <div style="
          width: 32px;
          height: 32px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  };

  if (!mounted) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--card-background)',
        borderRadius: '1rem',
      }}>
        <div style={{ color: 'var(--text-secondary)' }}>Chargement de la carte...</div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      borderRadius: '1rem',
      overflow: 'hidden',
    }}>
      {/* Bouton de retour */}
      <motion.button
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={onBack}
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          padding: '0.75rem 1.5rem',
          background: exchangeColor,
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        }}
      >
        <span style={{ fontSize: '1.2rem' }}>←</span>
        <span>Retour à l'Afrique</span>
      </motion.button>

      {/* Info de la bourse */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          padding: '0.75rem 1.5rem',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '0.75rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: `2px solid ${exchangeColor}`,
          zIndex: 1000,
        }}
      >
        <div style={{
          fontSize: '0.75rem',
          fontWeight: '600',
          color: exchangeColor,
          marginBottom: '0.25rem',
        }}>
          {exchangeShortName} ({sgos.length} SGO{sgos.length > 1 ? 's' : ''})
        </div>
        <div style={{
          fontSize: '1rem',
          fontWeight: '700',
          color: 'var(--text-color)',
        }}>
          {exchangeName}
        </div> 
      </motion.div>

      {/* Carte Leaflet */}
      <MapContainer
        center={[center.latitude, center.longitude]}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <MapController center={[center.latitude, center.longitude]} zoom={zoom} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {sgos.map((sgo) => (
          <Marker
            key={sgo.id}
            position={[sgo.latitude, sgo.longitude]}
            icon={createCustomIcon(exchangeColor)}
          >
            <Popup>
              <div style={{
                padding: '0.5rem',
                minWidth: '200px',
              }}>
                <h4 style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  color: exchangeColor,
                }}>
                  {sgo.name}
                </h4>
                
                {sgo.city && (
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#666',
                    marginBottom: '0.5rem',
                  }}>
                    📍 {sgo.city}{sgo.country ? `, ${sgo.country}` : ''}
                  </div>
                )}

                <div style={{
                  fontSize: '0.85rem',
                  marginBottom: '0.5rem',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid #e5e7eb',
                }}>
                  <strong>{sgo.opcvmCount}</strong> OPCVM géré{sgo.opcvmCount > 1 ? 's' : ''}
                </div>

                {sgo.opcvmNames.length > 0 && (
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#666',
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                      OPCVM:
                    </div>
                    <ul style={{
                      margin: 0,
                      paddingLeft: '1.2rem',
                      maxHeight: '120px',
                      overflowY: 'auto',
                    }}>
                      {sgo.opcvmNames.map((name, idx) => (
                        <li key={idx} style={{ marginBottom: '0.15rem' }}>
                          {name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default InteractiveSGOMap;
