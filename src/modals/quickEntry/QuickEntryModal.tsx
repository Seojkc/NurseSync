import React from 'react';
import {ModalShell} from '../../components/ModalShell';
import {useQuickEntry} from '../../hooks/useQuickEntry';
import {ImportRow, Tile} from '../../types';
import {PasteStep} from './PasteStep';
import {PreviewStep} from './PreviewStep';

type Props = {
  visible: boolean;
  onClose: () => void;
  tiles: Tile[];
  viewMonthKey: string;
  onImport: (rows: ImportRow[]) => void;
};

// Quick entry popup: paste JSON -> map codes -> preview -> add to calendar.
export function QuickEntryModal({
  visible,
  onClose,
  tiles,
  viewMonthKey,
  onImport,
}: Props) {
  const q = useQuickEntry({visible, tiles, viewMonthKey, onImport, onClose});

  return (
    <ModalShell
      visible={visible}
      onClose={onClose}
      onRequestClose={q.handleBack}
      maxHeightRatio={0.88}>
      {q.step === 'paste' && <PasteStep q={q} tiles={tiles} onClose={onClose} />}
      {q.step === 'preview' && <PreviewStep q={q} tiles={tiles} />}
    </ModalShell>
  );
}
