import React, {useEffect, useState} from 'react';
import {Pressable, ScrollView, Text, View} from 'react-native';
import {ModalShell} from '../../components/ModalShell';
import {shared} from '../../styles/shared';
import {Assignments, Leave} from '../../types';
import {shade} from '../../utils/color';
import {fmtDate} from '../../utils/date';
import {AddLeaveForm} from './AddLeaveForm';
import {LeaveDetail} from './LeaveDetail';
import {styles} from './vacation.styles';

type Props = {
  visible: boolean;
  onClose: () => void;
  leaves: Leave[];
  assignments: Assignments;
  usedByLeave: Record<string, number>;
  usedColors: string[];
  onAdd: (leave: Leave) => void;
  onDelete: (leave: Leave, after?: () => void) => void;
  onJump: (key: string) => void;
};

// Vacations popup with three screens: list -> detail, and the add form.
export function VacationModal({
  visible,
  onClose,
  leaves,
  assignments,
  usedByLeave,
  usedColors,
  onAdd,
  onDelete,
  onJump,
}: Props) {
  const [screen, setScreen] = useState<'list' | 'detail' | 'add'>('list');
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setScreen('list');
      setDetailId(null);
    }
  }, [visible]);

  const detail = leaves.find(l => l.id === detailId) ?? null;
  const current = screen === 'detail' && !detail ? 'list' : screen;

  const handleBack = () => {
    if (current === 'list') {
      onClose();
    } else {
      setScreen('list');
    }
  };

  return (
    <ModalShell
      visible={visible}
      onClose={onClose}
      onRequestClose={handleBack}
      maxHeightRatio={0.85}>
      {current === 'list' && (
        <>
          <View style={styles.vacHeader}>
            <Text style={shared.modalTitle}>Vacations 🌴</Text>
            <Pressable
              onPress={() => setScreen('add')}
              style={styles.vacPlus}
              hitSlop={8}>
              <Text style={styles.vacPlusText}>+</Text>
            </Pressable>
          </View>

          <ScrollView style={shared.scroll}>
            {leaves.length === 0 && (
              <Text style={styles.emptyText}>
                No vacation types yet. Tap + to add one, e.g. Casual Leave.
              </Text>
            )}
            {leaves.map(l => (
              <Pressable
                key={l.id}
                onPress={() => {
                  setDetailId(l.id);
                  setScreen('detail');
                }}
                style={styles.vacRow}>
                <View
                  style={[
                    styles.codeChip,
                    {
                      backgroundColor: l.color,
                      borderBottomColor: shade(l.color, -0.28),
                    },
                  ]}>
                  <Text style={styles.codeChipText} numberOfLines={1}>
                    {l.code}
                  </Text>
                </View>
                <View style={{flex: 1}}>
                  <View style={styles.vacRowTop}>
                    <Text style={styles.vacTitle} numberOfLines={1}>
                      {l.title}
                    </Text>
                    <Text style={styles.vacCount}>
                      {usedByLeave[l.id] || 0}/{l.total}
                    </Text>
                  </View>
                  <Text style={styles.vacPeriod}>
                    {fmtDate(l.start)} - {fmtDate(l.end)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>

          <View style={shared.modalActions}>
            <Pressable onPress={onClose} style={shared.modalBtn}>
              <Text style={shared.modalBtnText}>Done</Text>
            </Pressable>
          </View>
        </>
      )}

      {current === 'detail' && detail && (
        <LeaveDetail
          leave={detail}
          used={usedByLeave[detail.id] || 0}
          days={Object.keys(assignments)
            .filter(k => assignments[k] === detail.id)
            .sort()}
          onBack={() => setScreen('list')}
          onJump={onJump}
          onDelete={() => onDelete(detail, () => setScreen('list'))}
        />
      )}

      {current === 'add' && (
        <AddLeaveForm
          existingCodes={leaves.map(l => l.code.toUpperCase())}
          usedColors={usedColors}
          onCancel={() => setScreen('list')}
          onSave={leave => {
            onAdd(leave);
            setScreen('list');
          }}
        />
      )}
    </ModalShell>
  );
}
