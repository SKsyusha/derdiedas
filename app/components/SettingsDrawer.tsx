'use client';

import { useMemo, useState, useEffect } from 'react';
import { Drawer, Radio, Checkbox, Select, Flex, Divider, Typography, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { TrainingSettings, Case, Topic, ArticleType, PronounType, Word } from '../types';
import { getAllTopics, getTopicWordCount, hasCustomDictionaryEnabled, filterTopicsWithWords } from '../utils/dataset';

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
        {/* Dictionaries Section - Multi-select */}
        <div>
          <Title level={5} style={{ marginBottom: '6px', fontSize: '14px', marginTop: 0 }}>{t('settings.dictionaries')}</Title>
          <Checkbox.Group
            value={settings.enabledDictionaries}
            onChange={(checkedValues) => {
              const newEnabledDictionaries = checkedValues as string[];
              // Ensure at least one dictionary is selected
              if (newEnabledDictionaries.length === 0) {
                return;
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
              <Checkbox value="A1">{t('settings.a1Goethe')}</Checkbox>
              <Checkbox value="A2">{t('settings.a2Goethe')}</Checkbox>
              <Checkbox 
                value="custom" 
                disabled={userDictionaries.length === 0}
                checked={hasCustomDictEnabled}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  let newEnabledDicts: string[] = settings.enabledDictionaries.filter(id => id === 'A1' || id === 'A2');
                  
                  if (isChecked && userDictionaries.length > 0) {
                    // Add all user dictionaries
                    const userDictIds = userDictionaries.map(d => d.id);
                    newEnabledDicts = [...newEnabledDicts, ...userDictIds];
                  }
                  
                  // Ensure at least one dictionary is selected
                  if (newEnabledDicts.length === 0) {
                    newEnabledDicts = ['A1'];
                  }
                  
                  setSettings({
                    ...settings,
                    enabledDictionaries: newEnabledDicts,
                  });
                }}
              >
                {t('settings.custom')} {userDictionaries.length === 0 && `(${t('settings.noCustomDicts')})`}
              </Checkbox>
            </Flex>
          </Checkbox.Group>
        </div>

        <Divider style={{ margin: '4px 0' }} />

        <div>
          <Title level={5} style={{ marginBottom: '6px', fontSize: '14px', marginTop: 0 }}>{t('settings.trainingMode')}</Title>
          <Radio.Group
            value={settings.mode}
            onChange={(e) => setSettings({ ...settings, mode: e.target.value })}
            style={{ width: '100%' }}
          >
            <Flex orientation="vertical" gap="small">
            <Radio value="noun-only">{t('settings.nounOnly')}</Radio>
              <Radio value="sentence">{t('settings.inSentence')}</Radio>
            </Flex>
          </Radio.Group>
        </div>

        {settings.mode === 'sentence' && (
          <>
            <Divider style={{ margin: '4px 0' }} />
            <div>
              <Title level={5} style={{ marginBottom: '6px', fontSize: '14px', marginTop: 0 }}>{t('settings.cases')}</Title>
              <Checkbox.Group
                value={settings.cases}
                onChange={(checkedValues) => {
                  setSettings({
                    ...settings,
                    cases: checkedValues as Case[],
                  });
                }}
              >
                <Flex orientation="vertical" gap="small">
                  {(['nominativ', 'akkusativ', 'dativ', 'genitiv'] as Case[]).map((case_) => (
                    <Checkbox key={case_} value={case_}>
                      {t(`cases.${case_}`)}
                    </Checkbox>
                  ))}
                </Flex>
              </Checkbox.Group>
            </div>

            <div>
              <Checkbox
                checked={settings.usePronouns}
                onChange={(e) => setSettings({ ...settings, usePronouns: e.target.checked })}
              >
                {t('settings.usePronouns')}
              </Checkbox>
            </div>
          </>
        )}

        <Divider style={{ margin: '4px 0' }} />

        <div>
          <Checkbox
            checked={settings.showTranslation}
            onChange={(e) => setSettings({ ...settings, showTranslation: e.target.checked })}
          >
            {t('settings.showTranslation')}
          </Checkbox>
        </div>

        <Divider style={{ margin: '4px 0' }} />

        {/* Topics Section */}
        <div>
          <Title level={5} style={{ marginBottom: '6px', fontSize: '14px', marginTop: 0 }}>{t('settings.topic')}</Title>
          <Select
            key={`topic-select-${settings.topics.join(',')}`}
            placeholder={t('settings.selectTopic')}
            style={{ width: '100%' }}
            size="middle"
            value={null as unknown as string}
            onChange={(value) => {
              const topic = value as Topic;
              if (topic) {
                if (settings.topics.includes(topic)) {
                  // Убираем топик если он уже выбран
                  setSettings({ ...settings, topics: settings.topics.filter(t => t !== topic) });
                } else {
                  // Добавляем топик если он не выбран
                  setSettings({ ...settings, topics: [...settings.topics, topic] });
                }
              }
            }}
            options={allTopics
              .filter((topic) => getTopicCount(topic) > 0)
              .map((topic) => {
                const count = getTopicCount(topic);
                const topicLabel = t(`topics.${topic}`);
                const isSelected = settings.topics.includes(topic);
                return { 
                  label: (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{topicLabel} ({count})</span>
                      {isSelected && <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>✓</span>}
                    </div>
                  ), 
                  value: topic 
                };
              })}
          />
          
          {/* Selected Topics */}
          {settings.topics.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {settings.topics.map((topic) => {
                const count = getTopicCount(topic);
                const topicLabel = t(`topics.${topic}`);
                return (
                  <Tag
                    key={topic}
                    closable
                    onClose={() => {
                      setSettings({
                        ...settings,
                        topics: settings.topics.filter((t) => t !== topic),
                      });
                    }}
                    color="purple"
                    style={{ 
                      margin: 0,
                      fontSize: '11px',
                      padding: '2px 6px',
                      lineHeight: '1.4'
                    }}
                  >
                    {topicLabel} {count > 0 && `(${count})`}
                  </Tag>
                );
              })}
            </div>
          )}
        </div>

        <Divider style={{ margin: '4px 0' }} />

        {/* Article Type */}
        <div>
          <Title level={5} style={{ marginBottom: '6px', fontSize: '14px', marginTop: 0 }}>{t('settings.article')}</Title>
          <Radio.Group
            value={settings.articleType}
            onChange={(e) => setSettings({ ...settings, articleType: e.target.value as ArticleType })}
            style={{ width: '100%' }}
          >
            <Flex orientation="vertical" gap="small">
              <Radio value="definite">{t('settings.definite')}</Radio>
              <Radio value="indefinite">{t('settings.indefinite')}</Radio>
            </Flex>
          </Radio.Group>
        </div>

        <Divider style={{ margin: '4px 0' }} />

        {/* Cases */}
        <div>
          <Title level={5} style={{ marginBottom: '6px', fontSize: '14px', marginTop: 0 }}>{t('settings.cases')}</Title>
          {settings.mode === 'noun-only' ? (
            <Radio.Group
              value={settings.cases[0] || 'nominativ'}
              onChange={(e) => {
                setSettings({
                  ...settings,
                  cases: [e.target.value as Case],
                });
              }}
              style={{ width: '100%' }}
            >
              <Flex orientation="vertical" gap="small">
                <Radio value="nominativ">{t('cases.nominativ')}</Radio>
                <Radio value="akkusativ">{t('cases.akkusativ')}</Radio>
                <Radio value="dativ">{t('cases.dativ')}</Radio>
                <Radio value="genitiv">{t('cases.genitiv')}</Radio>
              </Flex>
            </Radio.Group>
          ) : (
            <Checkbox.Group
              value={settings.cases}
              onChange={(checkedValues) => {
                setSettings({
                  ...settings,
                  cases: checkedValues as Case[],
                });
              }}
            >
              <Flex orientation="vertical" gap="small">
                <Checkbox value="nominativ">{t('cases.nominativ')}</Checkbox>
                <Checkbox value="akkusativ">{t('cases.akkusativ')}</Checkbox>
                <Checkbox value="dativ">{t('cases.dativ')}</Checkbox>
                <Checkbox value="genitiv">{t('cases.genitiv')}</Checkbox>
              </Flex>
            </Checkbox.Group>
          )}
        </div>

        <Divider style={{ margin: '4px 0' }} />

        {/* Pronoun Type */}
        <div>
          <Title level={5} style={{ marginBottom: '6px', fontSize: '14px', marginTop: 0 }}>{t('settings.pronouns')}</Title>
          <Radio.Group
            value={settings.pronounType}
            onChange={(e) => setSettings({ ...settings, pronounType: e.target.value, usePronouns: e.target.value !== 'none' })}
            style={{ width: '100%' }}
          >
            <Flex orientation="vertical" gap="small">
              <Radio value="none">{t('settings.noPronouns')}</Radio>
              <Radio value="personal">{t('settings.personal')}</Radio>
              <Radio value="possessive">{t('settings.possessive')}</Radio>
              <Radio value="demonstrative">{t('settings.demonstrative')}</Radio>
            </Flex>
          </Radio.Group>
        </div>
      </div>
    </Drawer>
  );
}
