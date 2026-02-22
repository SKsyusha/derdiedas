'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { Drawer, Checkbox, Flex, Divider, Typography, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { TrainingSettings, Topic, Word } from '../types';
import { getAllTopics, getTopicWordCount, hasCustomDictionaryEnabled, filterTopicsWithWords } from '../utils/dataset';
import { BUILT_IN_DICTIONARIES, isBuiltInDictionary, DEFAULT_DICTIONARY_ID } from '../dictionaries';

const { Title } = Typography;

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  settings: TrainingSettings;
  setSettings: (settings: TrainingSettings) => void;
  drawerSize?: number | 'default' | 'large';
  userDictionaries?: Array<{ id: string; name: string; words: Word[]; enabled: boolean }>;
  setUserDictionaries?: (dicts: Array<{ id: string; name: string; words: Word[]; enabled: boolean }>) => void;
}

export default function SettingsDrawer({
  open,
  onClose,
  settings,
  setSettings,
  drawerSize = 378,
  userDictionaries = [],
}: SettingsDrawerProps) {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Extract unique topics from all available dictionaries dynamically
  const allTopics = useMemo(() => {
    return getAllTopics(userDictionaries);
  }, [userDictionaries]);

  // Check if custom dictionary is enabled
  const hasCustomDictEnabled = useMemo(() => {
    return hasCustomDictionaryEnabled(settings.enabledDictionaries);
  }, [settings.enabledDictionaries]);

  // Only "My Dictionary" is selected (no built-in dictionaries) → hide Topics block
  const onlyCustomDictionarySelected = useMemo(() => {
    return (
      settings.enabledDictionaries.length > 0 &&
      settings.enabledDictionaries.every((id) => !isBuiltInDictionary(id))
    );
  }, [settings.enabledDictionaries]);
  
  // Check if user dictionaries are empty (no dictionaries or all dictionaries have no words)
  const areUserDictionariesEmpty = useMemo(() => {
    return userDictionaries.length === 0 || userDictionaries.every(d => d.words.length === 0);
  }, [userDictionaries]);
  
  // Store refs to avoid including objects in dependencies
  const settingsRef = useRef(settings);
  const userDictionariesRef = useRef(userDictionaries);
  
  // Update refs when values change
  useEffect(() => {
    settingsRef.current = settings;
    userDictionariesRef.current = userDictionaries;
  }, [settings, userDictionaries]);
  
  // Auto-disable custom dictionary if it's empty
  useEffect(() => {
    if (areUserDictionariesEmpty && hasCustomDictEnabled) {
      const currentSettings = settingsRef.current;
      const currentUserDictionaries = userDictionariesRef.current;
      
      // Remove all custom dictionary IDs from enabledDictionaries (keep only built-in)
      const newEnabledDictionaries = currentSettings.enabledDictionaries.filter(
        (id: string) => isBuiltInDictionary(id)
      );
      
      // Check if we actually need to update (avoid unnecessary updates)
      const hasCustomDicts = currentSettings.enabledDictionaries.some((id: string) => !isBuiltInDictionary(id));
      if (!hasCustomDicts) {
        return; // Already cleaned up
      }
      
      // Ensure at least one dictionary is selected
      const finalEnabledDictionaries = newEnabledDictionaries.length === 0 
        ? [DEFAULT_DICTIONARY_ID] 
        : newEnabledDictionaries;
      
      // Filter topics to only include those with words in selected dictionaries
      const filteredTopics = filterTopicsWithWords(
        currentSettings.topics,
        finalEnabledDictionaries,
        currentUserDictionaries
      );
      
      setSettings({
        ...currentSettings,
        enabledDictionaries: finalEnabledDictionaries,
        topics: filteredTopics,
      });
    }
  }, [areUserDictionariesEmpty, hasCustomDictEnabled, setSettings]);
  
  // Функция для получения количества слов в топике
  const getTopicCount = (topic: Topic): number => {
    return getTopicWordCount(topic, settings.enabledDictionaries, userDictionaries);
  };
  return (
    <Drawer
      title={t('settings.title')}
      placement="right"
      onClose={onClose}
      open={open}
      size={isMobile ? 'default' : drawerSize}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Show translation & Autoplay at the top */}
        <div>
          <Checkbox
            checked={settings.showTranslation}
            onChange={(e) => setSettings({ ...settings, showTranslation: e.target.checked })}
          >
            {t('settings.showTranslation')}
          </Checkbox>
        </div>

        <div>
          <Checkbox
            checked={settings.playSound}
            onChange={(e) => setSettings({ ...settings, playSound: e.target.checked })}
          >
            {t('settings.playSound')}
          </Checkbox>
        </div>

        <Divider style={{ margin: '4px 0' }} />

        {/* Dictionaries Section - Multi-select */}
        <div>
          <Title level={5} style={{ marginBottom: '6px', fontSize: '14px', marginTop: 0 }}>{t('settings.dictionaries')}</Title>
          <Checkbox.Group
            value={[
              ...settings.enabledDictionaries.filter(id => isBuiltInDictionary(id)),
              ...(hasCustomDictEnabled ? ['custom'] : [])
            ]}
            onChange={(checkedValues) => {
              const checked = checkedValues as string[];
              let newEnabledDictionaries: string[] = [];
              
              // Add all checked built-in dictionaries
              BUILT_IN_DICTIONARIES.forEach(dict => {
                if (checked.includes(dict.id)) {
                  newEnabledDictionaries.push(dict.id);
                }
              });
              
              // If custom is checked and dictionaries are not empty, add all user dictionary IDs
              if (checked.includes('custom') && !areUserDictionariesEmpty) {
                const userDictIds = userDictionaries.map(d => d.id);
                newEnabledDictionaries = [...newEnabledDictionaries, ...userDictIds];
              }
              
              // Ensure at least one dictionary is selected
              if (newEnabledDictionaries.length === 0) {
                newEnabledDictionaries = [DEFAULT_DICTIONARY_ID];
              }
              
              // Filter topics to only include those with words in selected dictionaries
              const filteredTopics = filterTopicsWithWords(
                settings.topics,
                newEnabledDictionaries,
                userDictionaries
              );
              
              setSettings({
                ...settings,
                enabledDictionaries: newEnabledDictionaries,
                topics: filteredTopics,
              });
            }}
          >
            <Flex vertical gap="small">
              {/* Built-in dictionaries */}
              {BUILT_IN_DICTIONARIES.map(dict => (
                <Checkbox key={dict.id} value={dict.id}>{t(dict.translationKey)}</Checkbox>
              ))}
              {/* Custom user dictionaries */}
              <Checkbox 
                value="custom" 
                disabled={areUserDictionariesEmpty}
              >
                {t('settings.custom')} {areUserDictionariesEmpty && `(${t('settings.empty')})`}
              </Checkbox>
            </Flex>
          </Checkbox.Group>
        </div>

        {!onlyCustomDictionarySelected && (
          <>
            <Divider style={{ margin: '4px 0' }} />

            {/* Topics Section - list with multi-select */}
            <div>
              <div className="flex justify-between items-center" style={{ marginBottom: '6px' }}>
                <Title level={5} style={{ marginBottom: 0, fontSize: '14px', marginTop: 0 }}>{t('settings.topic')}</Title>
                <Button
                  type="text"
                  size="small"
                  disabled={settings.topics.length === 0}
                  onClick={() => setSettings({ ...settings, topics: [] })}
                  style={{ color: 'var(--purple-primary)', padding: '0 4px' }}
                >
                  {t('settings.clearTopics')}
                </Button>
              </div>
              <Checkbox.Group
                value={settings.topics}
                onChange={(checkedValues) => {
                  setSettings({
                    ...settings,
                    topics: checkedValues as Topic[],
                  });
                }}
                style={{ width: '100%' }}
              >
                <Flex vertical gap="small">
                  {allTopics
                    .filter((topic) => getTopicCount(topic) > 0)
                    .map((topic) => {
                      const count = getTopicCount(topic);
                      const topicLabel = t(`topics.${topic}`);
                      return (
                        <Checkbox key={topic} value={topic}>
                          {topicLabel} ({count})
                        </Checkbox>
                      );
                    })}
                </Flex>
              </Checkbox.Group>
            </div>
          </>
        )}

      </div>
    </Drawer>
  );
}
