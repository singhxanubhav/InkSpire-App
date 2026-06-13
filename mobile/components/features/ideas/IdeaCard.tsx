import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { api } from '../../../services/api';
import ReplyThread from './ReplyThread';
import { ActionModal, ActionOption } from '../../ui/ActionModal';

interface IdeaCardProps {
  idea: any;
  matchId: string;
  isOwn: boolean;
  partnerName: string;
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  CHARACTER: { bg: '#f3e8ff', text: '#9333ea' },
  PLOT: { bg: '#dbeafe', text: '#2563eb' },
  WORLD: { bg: '#dcfce7', text: '#16a34a' },
  DIALOGUE: { bg: '#ffedd5', text: '#ea580c' },
  OTHER: { bg: '#f3f4f6', text: '#4b5563' },
};

export default function IdeaCard({ idea, matchId, isOwn, partnerName }: IdeaCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const colors = TYPE_COLORS[idea.type] || TYPE_COLORS.OTHER;

  const handleTogglePin = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      // Optimistically UI update is handled by the socket, but we trigger the API
      await api.patch(`/matches/${matchId}/ideas/${idea.id}/pin`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLongPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowOptions(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/matches/${matchId}/ideas/${idea.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const options: ActionOption[] = [
    { 
      label: idea.isPinned ? 'Unpin Idea' : 'Pin Idea', 
      icon: idea.isPinned ? 'pin-outline' : 'pin', 
      onPress: handleTogglePin 
    }
  ];

  if (isOwn) {
    options.push({ 
      label: 'Delete Idea', 
      icon: 'trash-outline', 
      destructive: true, 
      onPress: () => setShowDeleteConfirm(true) 
    });
  }

  return (
    <View style={styles.container}>
      {idea.isPinned && (
        <View style={styles.pinnedHeader}>
          <Ionicons name="pin" size={14} color="#f59e0b" />
          <Text style={styles.pinnedText}>Pinned</Text>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.card, idea.isPinned && styles.pinnedCard]} 
        onLongPress={handleLongPress}
        delayLongPress={300}
        activeOpacity={0.9}
      >
        <View style={styles.header}>
          <View style={styles.authorRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {isOwn ? 'Y' : partnerName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.authorName}>{isOwn ? 'You' : partnerName}</Text>
          </View>
          
          <View style={styles.rightActions}>
            <View style={[styles.typeBadge, { backgroundColor: colors.bg }]}>
              <Text style={[styles.typeText, { color: colors.text }]}>
                {idea.type}
              </Text>
            </View>
            <TouchableOpacity onPress={handleTogglePin} hitSlop={10}>
              <Ionicons 
                name={idea.isPinned ? "pin" : "pin-outline"} 
                size={20} 
                color={idea.isPinned ? "#f59e0b" : "#9ca3af"} 
              />
            </TouchableOpacity>
          </View>
        </View>

        <Text 
          style={styles.content} 
          numberOfLines={expanded ? undefined : 3}
        >
          {idea.content}
        </Text>
        
        {idea.content.length > 120 && !expanded && (
          <TouchableOpacity onPress={() => setExpanded(true)}>
            <Text style={styles.readMore}>Read more</Text>
          </TouchableOpacity>
        )}

        {idea.tags && idea.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {idea.tags.map((tag: string, index: number) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.replyButton} 
            onPress={() => setShowReplies(!showReplies)}
          >
            <Ionicons name="chatbubble-outline" size={16} color="#6b7280" />
            <Text style={styles.replyCount}>
              {idea._count?.replies || 0} {(idea._count?.replies === 1) ? 'Reply' : 'Replies'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.timestamp}>
            {new Date(idea.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </TouchableOpacity>

      {showReplies && (
        <View style={styles.replyThreadContainer}>
          <ReplyThread ideaId={idea.id} matchId={matchId} replies={idea.replies} />
        </View>
      )}

      <ActionModal 
        visible={showOptions} 
        onClose={() => setShowOptions(false)} 
        options={options} 
      />

      <ActionModal
        visible={showDeleteConfirm}
        title="Are you sure you want to delete this idea?"
        onClose={() => setShowDeleteConfirm(false)}
        options={[
          { label: 'Delete Idea', icon: 'trash-outline', destructive: true, onPress: handleDelete }
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  pinnedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
    marginLeft: 8,
  },
  pinnedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  pinnedCard: {
    borderColor: '#fcd34d',
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
  },
  readMore: {
    color: '#4f46e5',
    fontWeight: '600',
    marginTop: -8,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#6b7280',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  replyCount: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
  },
  replyThreadContainer: {
    marginTop: 8,
    marginLeft: 16,
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: '#e5e7eb',
  },
});
