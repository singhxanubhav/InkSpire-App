import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSocket } from '../../../hooks/useSocket';

interface IdeaComposerProps {
  matchId: string;
  onSend: (data: any) => void;
}

const IDEA_TYPES = ['CHARACTER', 'PLOT', 'WORLD', 'DIALOGUE', 'OTHER'];

export default function IdeaComposer({ matchId, onSend }: IdeaComposerProps) {
  const [content, setContent] = useState('');
  const [type, setType] = useState('OTHER');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);
  const { emitTyping } = useSocket('/match');

  const handleTextChange = (text: string) => {
    setContent(text);
    // Simple debounced typing indicator logic
    if (text.length > 0) {
      emitTyping(matchId, true);
    } else {
      emitTyping(matchId, false);
    }
  };

  const handleAddTag = () => {
    const newTag = tagInput.trim().toLowerCase();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSend = () => {
    if (!content.trim()) return;

    onSend({
      content: content.trim(),
      type,
      tags,
    });

    // Reset
    setContent('');
    setTags([]);
    setTagInput('');
    setType('OTHER');
    emitTyping(matchId, false);
    inputRef.current?.clear();
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      {/* Type Selector */}
      <View style={styles.typeSelectorWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeSelector}>
          {IDEA_TYPES.map(t => (
            <TouchableOpacity 
              key={t}
              style={[styles.typeChip, type === t && styles.activeTypeChip]}
              onPress={() => setType(t)}
            >
              <Text style={[styles.typeText, type === t && styles.activeTypeText]}>
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input Area */}
      <View style={styles.inputArea}>
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          placeholder="Share an idea..."
          placeholderTextColor="#9ca3af"
          multiline
          maxLength={1000}
          value={content}
          onChangeText={handleTextChange}
        />
        <TouchableOpacity 
          style={[styles.sendButton, !content.trim() && styles.sendButtonDisabled]}
          disabled={!content.trim()}
          onPress={handleSend}
        >
          <Ionicons name="send" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Tags Area */}
      <View style={styles.tagsArea}>
        <TextInput
          style={styles.tagInput}
          placeholder="Add tags (comma to add)"
          placeholderTextColor="#9ca3af"
          value={tagInput}
          onChangeText={text => {
            if (text.endsWith(',') || text.endsWith(' ')) {
              setTagInput(text.slice(0, -1));
              handleAddTag();
            } else {
              setTagInput(text);
            }
          }}
          onSubmitEditing={handleAddTag}
          returnKeyType="done"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsList}>
          {tags.map(t => (
            <TouchableOpacity key={t} style={styles.tag} onPress={() => handleRemoveTag(t)}>
              <Text style={styles.tagText}>#{t}</Text>
              <Ionicons name="close" size={14} color="#6b7280" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingVertical: 12,
  },
  typeSelectorWrapper: {
    marginBottom: 12,
  },
  typeSelector: {
    paddingHorizontal: 16,
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeTypeChip: {
    backgroundColor: '#eef2ff',
    borderColor: '#c7d2fe',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
  },
  activeTypeText: {
    color: '#4f46e5',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 100,
    minHeight: 40,
    fontSize: 15,
    color: '#111827',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  tagsArea: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tagInput: {
    width: 120,
    height: 36,
    backgroundColor: '#f3f4f6',
    borderRadius: 18,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#111827',
  },
  tagsList: {
    flex: 1,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    gap: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#4b5563',
  },
});
