import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { CONTESTANTS } from '../data/contestants';
import { Contestant } from '../types';
import { theme } from '../theme';
import { soundManager } from '../utils/audio';

interface JobSelectScreenProps {
  onConfirmJob: (playerContestant: Contestant, opponentContestants: Contestant[]) => void;
  onBack: () => void;
}

export const JobSelectScreen: React.FC<JobSelectScreenProps> = ({
  onConfirmJob,
  onBack,
}) => {
  const [selectedJobId, setSelectedJobId] = useState<string>(CONTESTANTS[0].id);
  const [customJob, setCustomJob] = useState('');
  const [customName, setCustomName] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  const selectedPreset = CONTESTANTS.find((c) => c.id === selectedJobId) || CONTESTANTS[0];

  const handleStart = () => {
    soundManager.playLockIn();

    if (isCustomMode && customJob.trim()) {
      const playerContestant: Contestant = {
        id: 'player_custom',
        name: customName.trim() || 'You',
        job: customJob.trim(),
        emoji: '⭐',
        bio: `Representing ${customJob.trim()} in the 10-player studio arena.`,
        quote: 'Knowledge is universal.',
        specialties: ['General', 'Inventions'],
        weaknesses: ['Entertainment'],
        baseAccuracy: 0.8,
        color: '#FFFFFF',
        isPlayer: true,
      };

      const opponents = CONTESTANTS.slice(0, 9);
      onConfirmJob(playerContestant, opponents);
    } else {
      const playerContestant: Contestant = {
        ...selectedPreset,
        name: `${selectedPreset.name} (You)`,
        isPlayer: true,
      };

      const opponents = CONTESTANTS.filter((c) => c.id !== selectedPreset.id);
      onConfirmJob(playerContestant, opponents);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Nav */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>CAREER SELECT</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBlock}>
          <Text style={styles.headline}>Choose Your Career</Text>
          <Text style={styles.subtitle}>
            Select the profession you will represent in the 10-player studio gauntlet.
          </Text>
        </View>

        {/* Minimal Tab Switch */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, !isCustomMode && styles.activeTab]}
            onPress={() => {
              soundManager.playClick();
              setIsCustomMode(false);
            }}
          >
            <Text style={[styles.tabText, !isCustomMode && styles.activeTabText]}>
              STUDIO ARCHETYPES
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, isCustomMode && styles.activeTab]}
            onPress={() => {
              soundManager.playClick();
              setIsCustomMode(true);
            }}
          >
            <Text style={[styles.tabText, isCustomMode && styles.activeTabText]}>
              CUSTOM PROFESSION
            </Text>
          </TouchableOpacity>
        </View>

        {!isCustomMode ? (
          <View style={styles.list}>
            {CONTESTANTS.map((c) => {
              const isSelected = c.id === selectedJobId;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.rowItem,
                    isSelected && styles.selectedRowItem,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    soundManager.playClick();
                    setSelectedJobId(c.id);
                  }}
                >
                  <Text style={styles.emoji}>{c.emoji}</Text>
                  <View style={styles.infoCol}>
                    <Text style={[styles.jobTitle, isSelected && styles.selectedJobTitle]}>
                      {c.job}
                    </Text>
                    <Text style={styles.metaText}>
                      Domain: {c.specialties.join(', ')}
                    </Text>
                  </View>
                  <View style={[styles.radioCircle, isSelected && styles.radioActive]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.customContainer}>
            <Text style={styles.inputLabel}>YOUR CAREER TITLE</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Freelance Architect, High School Senior"
              placeholderTextColor={theme.colors.textMuted}
              value={customJob}
              onChangeText={setCustomJob}
            />

            <Text style={[styles.inputLabel, { marginTop: 24 }]}>CONTESTANT NAME (OPTIONAL)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Jordan"
              placeholderTextColor={theme.colors.textMuted}
              value={customName}
              onChangeText={setCustomName}
            />
          </View>
        )}
      </ScrollView>

      {/* Clean Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.enterButton} activeOpacity={0.85} onPress={handleStart}>
          <Text style={styles.enterButtonText}>ENTER ARENA ($1,000 PRIZE) →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    paddingVertical: 4,
  },
  backButtonText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  screenTitle: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 110,
  },
  headerBlock: {
    marginBottom: 24,
  },
  headline: {
    fontSize: 32,
    fontWeight: '300',
    color: theme.colors.textPrimary,
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 19,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: 20,
    gap: 24,
  },
  tab: {
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
    letterSpacing: 1,
  },
  activeTabText: {
    color: theme.colors.textPrimary,
  },
  list: {
    gap: 10,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedRowItem: {
    borderColor: theme.colors.textPrimary,
    backgroundColor: theme.colors.surfaceHover,
  },
  emoji: {
    fontSize: 22,
    marginRight: 16,
  },
  infoCol: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  selectedJobTitle: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  metaText: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: theme.colors.textPrimary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.textPrimary,
  },
  customContainer: {
    paddingVertical: 12,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  enterButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 16,
    alignItems: 'center',
  },
  enterButtonText: {
    color: '#070709',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
