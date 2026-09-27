import React from 'react';
import { PipelineStepper } from '../components/dashboard/PipelineStepper';
import { TelemetryStatsStrip } from '../components/dashboard/TelemetryStatsStrip';
import { TacticalSensorMatrix } from '../components/dashboard/TacticalSensorMatrix';
import { TacticalGisMap } from '../components/dashboard/TacticalGisMap';
import { IncidentActionCard } from '../components/dashboard/IncidentActionCard';
import { EventProvenanceLedger } from '../components/dashboard/EventProvenanceLedger';
import { CryptographicProofDrawer } from '../components/dashboard/CryptographicProofDrawer';
import { EscalationCascade } from '../components/dashboard/EscalationCascade';

interface OverviewProps {
  onNavigate: (path: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col w-full">
      {/* TOP BANNER: ARCHITECTURAL PIPELINE STEPPER */}
      <PipelineStepper />

      {/* 6-CARD TELEMETRY STATS STRIP */}
      <TelemetryStatsStrip />

      {/* MAIN OPERATIONAL WORKSPACE (Split Matrix & Ledger) */}
      <div className="w-full px-6 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT COLUMN: SURVEILLANCE MATRIX & TACTICAL GIS MAP (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4 min-w-0">
          <TacticalSensorMatrix />
          <TacticalGisMap />
        </div>

        {/* RIGHT COLUMN: INTELLIGENCE & ACTIONS (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4 min-w-0">
          <IncidentActionCard onViewEvidence={() => onNavigate('evidence')} />
          <EventProvenanceLedger />
          <CryptographicProofDrawer />
          <EscalationCascade />
        </div>
      </div>
    </div>
  );
};
