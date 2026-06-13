import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../store/authStore';

interface ReplyThreadProps {
  ideaId: string;
  matchId: string;
  replies: any[];
}

export default function ReplyThread({ ideaId, matchId, replies = [] }: ReplyThreadProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = useAuthStore(state => state.user);

  const handleSend = async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await api.post(`/matches/${matchId}/ideas/${ideaId}/replies`, {
        content: content.trim()
      });
      setContent('');
    } catch (e) {
      console.error('Failed to reply', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (replyId: string) => {
    Alert.alert('Delete Reply', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: async () => {
          try {
            await api.delete(`/matches/${matchId}/ideas/${ideaId}/replies/${replyId}`);
          } catch (e) {
            console.error(e);
          }
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      {replies.map((reply) => {
        const isOwn = reply.authorId === user?.id;
        return (
          <View key={reply.id} style={styles.replyItem}>
            <View style={styles.header}>
              <Text style={styles.author}>{isOwn ? 'You' : reply.author?.displayName}</Text>
              <View style={styles.rightHeader}>
                <Text style={styles.time}>
                  {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                {isOwn && (
                  <TouchableOpacity onPress={() => handleDelete(reply.id)} hitSlop={10}>
                    <Ionicons name="trash-outline" size={14} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <Text style={styles.content}>{reply.content}</Text>
          </View>
        );
      })}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Write a reply..."
          value={content}
          onChangeText={setContent}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, !content.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!content.trim() || isSubmitting}
        >
          <Ionicons name="send" size={16} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  replyItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  author: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  rightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  time: {
    fontSize: 11,
    color: '#9ca3af',
  },
  content: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 80,
    minHeight: 36,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
});
