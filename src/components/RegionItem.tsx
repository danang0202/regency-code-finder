import React from 'react';
import { regionItemStyles, regionItemHoverHandlers } from '@/helper/master-search.helper';

interface RegionItemProps {
  onClick: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function RegionItem({ onClick, children, style }: RegionItemProps) {
  return (
    <div
      style={{ ...regionItemStyles, ...style }}
      onClick={onClick}
      {...regionItemHoverHandlers}
    >
      {children}
    </div>
  );
}

interface RegionTitleProps {
  children: React.ReactNode;
}

export function RegionTitle({ children }: RegionTitleProps) {
  return (
    <div style={{ 
      fontWeight: 700, 
      fontSize: 14, 
      color: '#1976d2', 
      marginBottom: 2 
    }}>
      {children}
    </div>
  );
}

interface RegionSubtitleProps {
  children: React.ReactNode;
}

export function RegionSubtitle({ children }: RegionSubtitleProps) {
  return (
    <div style={{ 
      fontSize: 12, 
      color: '#555', 
      marginTop: 2 
    }}>
      {children}
    </div>
  );
}

interface RegionMetaTextProps {
  label: string;
  value: string;
}

export function RegionMetaText({ label, value }: RegionMetaTextProps) {
  return (
    <>
      <span style={{ color: '#888' }}>{label}:</span>{' '}
      <b style={{ color: '#1976d2' }}>{value}</b>
    </>
  );
}