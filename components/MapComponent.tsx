

import React, { useEffect, useRef, useCallback } from 'react';
import L, { Map as LeafletMap, GeoJSON as LeafletGeoJSON, LatLng, StyleFunction } from 'leaflet';
import type { FeatureCollection } from 'geojson';
import type { MetricId } from '../metrics';
import { getChoroplethColor } from '../utils/colorScale';

const getZipFromFeature = (feature: any): string | null => {
  const props = feature?.properties;
  if (!props) return null;

  return (
    props.ZIP ||        // added by our filtered TS file
    props.BdVal ||      // original Maricopa field
    props.ZCTA5CE20 ||  // common Census ZCTA fields
    props.ZCTA5CE10 ||
    props.ZIP_CODE ||
    props.ZCTA ||
    null
  );
};

interface MapComponentProps {
  geojsonData: FeatureCollection;
  selectedZips: string[];
  onZipChange: (zip: string, isMultiSelect: boolean) => void;
  initialCenter: LatLng;
  initialZoom: number;
  fitInitialBounds: boolean;
  isExpanded: boolean;
  metricId: MetricId | null;
  metricValuesByZip: Record<string, number | null>;
  metricDomain: [number, number] | null;
  fitSelectionSignal: number;
  resetViewSignal: number;
}

const MapComponent: React.FC<MapComponentProps> = ({
  geojsonData,
  selectedZips,
  onZipChange,
  initialCenter,
  initialZoom,
  fitInitialBounds,
  isExpanded,
  metricId,
  metricValuesByZip,
  metricDomain,
  fitSelectionSignal,
  resetViewSignal,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const geoJsonLayerRef = useRef<LeafletGeoJSON | null>(null);
  
  const hoverStyle = {
    weight: 2,
    color: '#1C4953', // westmarc-midnight
    fillOpacity: 0.9,
  };

  const selectedStyle = {
    weight: 3,
    color: '#122426', // westmarc-desert-night
    fillOpacity: 1,
  };

  // One-time map + layer init
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      scrollWheelZoom: isExpanded,
      zoomControl: true, // Always show zoom controls
    });
    mapRef.current = map;

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    ).addTo(map);

    const geoJsonLayer = L.geoJSON(geojsonData as any); // Style is applied dynamically in another effect
    
    geoJsonLayer.addTo(map);
    geoJsonLayerRef.current = geoJsonLayer;

    if (fitInitialBounds) {
      const bounds = geoJsonLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }

    setTimeout(() => {
        map.invalidateSize();
    }, 100);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [isExpanded]); // Re-init if isExpanded changes


  // Consolidated styling and interaction effect
  useEffect(() => {
    const geoJsonLayer = geoJsonLayerRef.current;
    if (!geoJsonLayer) return;

    const styleFunction: StyleFunction = (feature) => {
      if (!feature) return {};
      const zip = getZipFromFeature(feature);
      const value =
        zip != null && metricId != null ? metricValuesByZip[zip] ?? null : null;
    
      const fillColor = getChoroplethColor(value, metricDomain);
    
      const baseStyle = {
        fillColor,
        weight: 1,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.8,
      };
    
      if (zip && selectedZips.includes(zip)) {
        return { ...baseStyle, ...selectedStyle };
      }
    
      return baseStyle;
    };

    geoJsonLayer.setStyle(styleFunction);

    // Update onEachFeature to handle interactions correctly with the new dynamic style
    geoJsonLayer.eachLayer((layer: any) => {
        const feature = layer.feature;
        const zip = getZipFromFeature(feature);
        const city = feature?.properties?.CITY;
        if (!zip) return;

        // Clear existing listeners to avoid duplicates
        layer.off();
        
        layer.on({
          mouseover(e: L.LeafletMouseEvent) {
            // Apply hover style on top of the current style
            const currentStyle = styleFunction(feature) as L.PathOptions;
            layer.setStyle({ ...currentStyle, ...hoverStyle });
            if (layer.bringToFront) layer.bringToFront();
            layer.openTooltip(e.latlng);
          },
          mouseout() {
            // Re-apply the base style, which depends on whether the feature is selected
            layer.setStyle(styleFunction(feature));
            layer.closeTooltip();
            
            // After any hover, re-assert that all selected layers are visually on top.
            // This prevents a previously hovered-but-unselected layer from obscuring
            // the border of a selected layer.
            geoJsonLayerRef.current?.eachLayer((l: any) => {
              if (selectedZips.includes(getZipFromFeature(l.feature))) {
                if (l.bringToFront) {
                  l.bringToFront();
                }
              }
            });
          },
          click(e: L.LeafletMouseEvent) {
            const domEvent = e.originalEvent as MouseEvent;
            const isMultiSelect = domEvent.metaKey || domEvent.ctrlKey;
            onZipChange(zip, isMultiSelect);
          },
        });
        
        const tooltipContent = city ? `${city}: ${zip}` : zip;
        // Ensure tooltip isn't bound multiple times
        if (!layer.getTooltip()) {
          layer.bindTooltip(tooltipContent, {
            permanent: false,
            direction: 'auto',
            sticky: true,
            className:
              'font-figtree font-bold bg-white !text-westmarc-desert-night !border-westmarc-midnight !rounded',
          });
        } else {
            layer.setTooltipContent(tooltipContent);
        }
    });

    // Bring selected layers to the front
    geoJsonLayer.eachLayer((layer: any) => {
        if (selectedZips.includes(getZipFromFeature(layer.feature))) {
            layer.bringToFront();
        }
    });
    
  }, [selectedZips, metricId, metricValuesByZip, metricDomain, onZipChange]);

    const fitMapToSelectedZips = useCallback(() => {
    if (!mapRef.current || !geoJsonLayerRef.current) return;

    const layerGroup = geoJsonLayerRef.current;
    let bounds: any = null;

    layerGroup.eachLayer((layer: any) => {
      const feature = layer.feature;
      const zip = getZipFromFeature(feature);
      if (!zip || !selectedZips.includes(zip)) return;

      if (typeof layer.getBounds === 'function') {
        const layerBounds = layer.getBounds();
        if (layerBounds && layerBounds.isValid()) {
          if (!bounds) {
            bounds = layerBounds;
          } else {
            bounds.extend(layerBounds);
          }
        }
      }
    });

    if (!bounds) {
      // Fallback: if nothing selected has bounds, do nothing
      return;
    }

    mapRef.current.fitBounds(bounds, { padding: [20, 20] });
  }, [selectedZips]);

  // When the parent increments fitSelectionSignal, zoom to the selected ZIPs
  useEffect(() => {
    if (fitSelectionSignal === 0) return; // ignore initial 0
    fitMapToSelectedZips();
  }, [fitSelectionSignal, fitMapToSelectedZips]);
  
  // When the parent increments resetViewSignal, reset the view
  useEffect(() => {
    if (!mapRef.current || resetViewSignal === 0) return;
    mapRef.current.setView(initialCenter, initialZoom);
  }, [resetViewSignal, initialCenter, initialZoom]);


  return (
    <div
      ref={mapContainerRef}
      style={{
        height: '100%',
        width: '100%',
        borderRadius: '0.5rem',
        zIndex: 0,
        outline: 'none',
      }}
    />
  );
};

export default MapComponent;