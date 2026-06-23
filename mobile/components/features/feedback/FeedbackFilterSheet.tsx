import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';

const GENRES = ['FANTASY', 'SCI_FI', 'ROMANCE', 'MYSTERY', 'THRILLER', 'HORROR', 'LITERARY_FICTION', 'HISTORICAL_FICTION', 'NON_FICTION', 'POETRY', 'OTHER'];
const FOCUS_AREAS = ['CLARITY', 'PACING', 'DIALOGUE', 'STRUCTURE', 'VOICE', 'CHARACTER'];
const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest First' },
  { id: 'oldest', label: 'Oldest First' },
  { id: 'most_responses', label: 'Most Responses' }
];

interface FeedbackFilterSheetProps {
  isVisible: boolean;
  onClose: () => void;
  selectedGenre: string | null;
  setSelectedGenre: (genre: string | null) => void;
  selectedFocus: string[];
  setSelectedFocus: (focus: string[]) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  onApply: () => void;
}

export function FeedbackFilterSheet({
  isVisible,
  onClose,
  selectedGenre,
  setSelectedGenre,
  selectedFocus,
  setSelectedFocus,
  sortBy,
  setSortBy,
  onApply
}: FeedbackFilterSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['85%'], []);

  useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isVisible]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} onPress={onClose} />
    ),
    [onClose]
  );

  const toggleFocus = (focus: string) => {
    if (selectedFocus.includes(focus)) {
      setSelectedFocus(selectedFocus.filter(f => f !== focus));
    } else {
      setSelectedFocus([...selectedFocus, focus]);
    }
  };

  const handleReset = () => {
    setSelectedGenre(null);
    setSelectedFocus([]);
    setSortBy('newest');
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: '#e2e8f0', width: 40 }}
      backgroundStyle={{ backgroundColor: '#ffffff', borderRadius: 24 }}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Filters</Text>
        <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <BottomSheetScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* SORT BY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sort By</Text>
          <View style={styles.radioGroup}>
            {SORT_OPTIONS.map(opt => (
              <TouchableOpacity 
                key={opt.id} 
                style={[styles.radioItem, sortBy === opt.id && styles.radioItemActive]}
                onPress={() => setSortBy(opt.id)}
              >
                <View style={[styles.radioCircle, sortBy === opt.id && styles.radioCircleActive]}>
                  {sortBy === opt.id && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.radioLabel, sortBy === opt.id && styles.radioLabelActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* GENRE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Genre</Text>
          <View style={styles.chipsContainer}>
            {GENRES.map(genre => (
              <TouchableOpacity
                key={genre}
                style={[styles.chip, selectedGenre === genre && styles.chipActive]}
                onPress={() => setSelectedGenre(selectedGenre === genre ? null : genre)}
              >
                <Text style={[styles.chipText, selectedGenre === genre && styles.chipTextActive]}>
                  {genre.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FOCUS AREA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Focus Areas</Text>
          <Text style={styles.sectionSubtitle}>Select multiple</Text>
          <View style={styles.chipsContainer}>
            {FOCUS_AREAS.map(focus => (
              <TouchableOpacity
                key={focus}
                style={[styles.chip, selectedFocus.includes(focus) && styles.chipActiveFocus]}
                onPress={() => toggleFocus(focus)}
              >
                <Text style={[styles.chipText, selectedFocus.includes(focus) && styles.chipTextActiveFocus]}>
                  {focus}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </BottomSheetScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.applyBtn} onPress={onApply}>
          <Text style={styles.applyBtnText}>Show Results</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  resetBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resetText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: -8,
    marginBottom: 12,
  },
  radioGroup: {
    gap: 12,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  radioItemActive: {
    backgroundColor: '#f0f9ff',
    borderColor: '#0284c7', // Slate/Blue premium look
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioCircleActive: {
    borderColor: '#0284c7',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0284c7',
  },
  radioLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  radioLabelActive: {
    color: '#0f172a',
    fontWeight: '800',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: '#f0f9ff',
    borderColor: '#0284c7',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  chipTextActive: {
    color: '#0369a1',
    fontWeight: '800',
  },
  chipActiveFocus: {
    backgroundColor: '#fdf2f8',
    borderColor: '#db2777',
  },
  chipTextActiveFocus: {
    color: '#be185d',
    fontWeight: '800',
  },
  footer: {
    padding: 20,
    paddingBottom: 34,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  applyBtn: {
    backgroundColor: '#8b5cf6', // Primary Purple
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  }
});
