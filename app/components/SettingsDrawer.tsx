'use client';

import { useMemo, useState, useEffect } from 'react';
import { Drawer, Radio, Checkbox, Select, Flex, Divider, Typography, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { TrainingSettings, Case, Language, Topic, ArticleType, PronounType, Word, DictionaryType, Level } from '../types';
import { builtInDictionaries } from '../dictionaries';

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
    const topicsSet = new Set<Topic>();
    
    // Extract from built-in dictionaries (A1, A2)
    (['A1', 'A2'] as Level[]).forEach((level) => {
      if (builtInDictionaries[level]) {
        builtInDictionaries[level].forEach((word: Word) => {
          if (word.topic) {
            topicsSet.add(word.topic);
          }
        });
      }
    });
    
    // Extract from user dictionaries
    userDictionaries.forEach((dict) => {
      dict.words.forEach((word) => {
        if (word.topic) {
          topicsSet.add(word.topic);
        }
      });
    });
    
    // Convert to sorted array
    return Array.from(topicsSet).sort();
  }, [userDictionaries]);
  
  // Функция для получения количества слов в топике
  const getTopicCount = (topic: Topic): number => {
    let count = 0;
    
    if (settings.dictionaryType === 'default') {
      // Считаем из встроенных словарей по выбранным уровням
      const levels = settings.level.length > 0 ? settings.level : (['A1', 'A2'] as Level[]);
      levels.forEach((level) => {
        if (builtInDictionaries[level]) {
          const wordsInTopic = builtInDictionaries[level].filter((w: Word) => w.topic === topic);
          count += wordsInTopic.length;
        }
      });
    } else {
      // Считаем из пользовательских словарей
      const enabledDictIds = settings.enabledDictionaries.length > 0 
        ? settings.enabledDictionaries 
        : userDictionaries.map(d => d.id);
      
      userDictionaries.forEach((dict) => {
        if (enabledDictIds.includes(dict.id)) {
          const wordsInTopic = dict.words.filter((w) => w.topic === topic);
          count += wordsInTopic.length;
        }
      });
    }
    
    return count;
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
        <div>
          <Title level={5} style={{ marginBottom: '6px', fontSize: '14px', marginTop: 0 }}>{t('settings.dictionary')}</Title>
          <Radio.Group
            value={settings.dictionaryType}
            onChange={(e) => {
              const newType = e.target.value as DictionaryType;
              let newEnabledDictionaries = [...settings.enabledDictionaries];
              
              if (newType === 'user') {
                // При переключении на "мой словарь", добавляем user dictionaries в enabledDictionaries
                if (userDictionaries && userDictionaries.length > 0) {
                  const userDictIds = userDictionaries.map(d => d.id);
                  // Убираем дефолтные словари и добавляем пользовательские
                  newEnabledDictionaries = userDictIds.filter(id => id !== 'A1');
                  if (newEnabledDictionaries.length === 0 && userDictIds.length > 0) {
                    newEnabledDictionaries = [userDictIds[0]];
                  }
                }
              } else {
                // При переключении на "дефолтный", убираем user dictionaries и добавляем дефолтные
                newEnabledDictionaries = settings.enabledDictionaries.filter(id => id === 'A1');
                if (newEnabledDictionaries.length === 0) {
                  newEnabledDictionaries = ['A1'];
                }
              }
              
              setSettings({ 
                ...settings, 
                dictionaryType: newType,
                enabledDictionaries: newEnabledDictionaries
              });
            }}
            style={{ width: '100%' }}
          >
            <Flex orientation="vertical" gap="small">
              <Radio value="default">{t('settings.default')}</Radio>
              <Radio value="user">{t('settings.custom')}</Radio>
            </Flex>
          </Radio.Group>
        </div>

        {/* Level Selector - only for default dictionary */}
        {settings.dictionaryType === 'default' && (
          <>
            <Divider style={{ margin: '4px 0' }} />
            <div>
              <Title level={5} style={{ marginBottom: '6px', fontSize: '14px', marginTop: 0 }}>{t('settings.level')}</Title>
              <Radio.Group
                value={settings.level[0] || 'A1'}
                onChange={(e) => {
                  const newLevel = e.target.value as Level;
                  // Фильтруем выбранные топики - оставляем только те, в которых есть слова для нового уровня
                  const filteredTopics = settings.topics.filter((topic) => {
                    if (builtInDictionaries[newLevel]) {
                      return builtInDictionaries[newLevel].some((w: Word) => w.topic === topic);
                    }
                    return false;
                  });
                  setSettings({
                    ...settings,
                    level: [newLevel],
                    topics: filteredTopics,
                  });
                }}
              >
                <Flex gap="middle">
                  <Radio value="A1">A1</Radio>
                  <Radio value="A2">A2</Radio>
                </Flex>
              </Radio.Group>
            </div>
          </>
        )}

        <Divider style={{ margin: '4px 0' }} />

        <div>
          <Title level={5} style={{ marginBottom: '6px', fontSize: '14px', marginTop: 0 }}>{t('settings.trainingMode')}</Title>
          <Radio.Group
            value={settings.mode}
            onChange={(e) => setSettings({ ...settings, mode: e.target.value })}
            style={{ width: '100%' }}
          >
            <Flex orientation="vertical" gap="small">
              <Radio value="sentence">{t('settings.inSentence')}</Radio>
              <Radio value="noun-only">{t('settings.nounOnly')}</Radio>
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
