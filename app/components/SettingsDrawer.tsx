'use client';

import { Drawer, Radio, Checkbox, Select, Flex, Divider, Typography, Tag } from 'antd';
import { TrainingSettings, Case, Language, Topic, ArticleType, PronounType, Word, DictionaryType } from '../types';
import topicStats from '../data/dictionaries/topic_stats.json';

const { Title, Text } = Typography;

const allTopics: Topic[] = [
  'Food',
  'Drinks',
  'Tableware / Cutlery',
  'Kitchen',
  'Furniture',
  'Rooms',
  'Clothes',
  'Family',
  'People & Professions',
  'Animals',
  'Nature',
  'City',
  'Transport',
  'School',
  'Work',
  'Countries & Languages',
  'Numbers & Letters',
  'Months and Days of the Week',
  'Time & Dates',
  'Holidays',
];

const allLanguages: Language[] = ['Russian', 'English'];

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
  // Функция для получения количества слов в топике для выбранных уровней
  const getTopicCount = (topic: Topic): number => {
    let count = 0;
    settings.level.forEach((level) => {
      const levelStats = topicStats[level as keyof typeof topicStats] as Record<string, number> | undefined;
      if (levelStats && typeof levelStats === 'object' && topic in levelStats) {
        count += levelStats[topic] || 0;
      }
    });
    return count;
  };
  return (
    <Drawer
      title="Настройки"
      placement="right"
      onClose={onClose}
      open={open}
      size={drawerSize}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <Title level={5} style={{ marginBottom: '6px', fontSize: '14px', marginTop: 0 }}>Словарь</Title>
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
                  newEnabledDictionaries = userDictIds.filter(id => !['A1', 'A2'].includes(id));
                  if (newEnabledDictionaries.length === 0 && userDictIds.length > 0) {
                    newEnabledDictionaries = [userDictIds[0]];
                  }
                }
              } else {
                // При переключении на "дефолтный", убираем user dictionaries и добавляем дефолтные
                newEnabledDictionaries = settings.enabledDictionaries.filter(id => ['A1', 'A2'].includes(id));
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
              <Radio value="user">Свой</Radio>
              <Radio value="default">Дефолтный</Radio>
            </Flex>
          </Radio.Group>
        </div>

        <Divider style={{ margin: '4px 0' }} />

        <div>
          <Title level={5} style={{ marginBottom: '6px', fontSize: '14px', marginTop: 0 }}>Режим тренировки</Title>
          <Radio.Group
            value={settings.mode}
            onChange={(e) => setSettings({ ...settings, mode: e.target.value })}
            style={{ width: '100%' }}
          >
            <Flex orientation="vertical" gap="small">
              <Radio value="sentence">В предложении</Radio>
              <Radio value="noun-only">Только существительное</Radio>
            </Flex>
          </Radio.Group>
        </div>

        {settings.mode === 'sentence' && (
          <>
            <Divider style={{ margin: '4px 0' }} />
            <div>
              <Title level={5} style={{ marginBottom: '6px', fontSize: '14px', marginTop: 0 }}>Падежи</Title>
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
                      {case_.charAt(0).toUpperCase() + case_.slice(1)}
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
                Использовать местоимения
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
            Показывать перевод
          </Checkbox>
        </div>

        <Divider style={{ margin: '4px 0' }} />

        {/* ADD TO THE LESSON Section */}
        <div>
          <Title level={5} style={{ marginBottom: '6px', fontSize: '14px', marginTop: 0 }}>ADD TO THE LESSON</Title>
          
          {/* Language Dropdown */}
          <div style={{ marginBottom: '8px' }}>
            <Text strong className="block mb-1" style={{ fontSize: '12px' }}>Language</Text>
            <Select
              value={settings.language}
              onChange={(value) => setSettings({ ...settings, language: value as Language })}
              style={{ width: '100%' }}
              size="small"
              options={allLanguages.map((lang) => ({ label: lang, value: lang }))}
            />
          </div>

          {/* Topics Dropdown */}
          <div style={{ marginBottom: '8px' }}>
            <Text strong className="block mb-1" style={{ fontSize: '12px' }}>Topic</Text>
            <Select
              placeholder="Select a topic..."
              style={{ width: '100%' }}
              size="small"
              onChange={(value) => {
                const topic = value as Topic;
                if (topic && !settings.topics.includes(topic)) {
                  setSettings({ ...settings, topics: [...settings.topics, topic] });
                }
              }}
              options={allTopics.map((topic) => {
                const count = getTopicCount(topic);
                return { 
                  label: count > 0 ? `${topic} (${count})` : topic, 
                  value: topic 
                };
              })}
            />
            
            {/* Selected Topics */}
            {settings.topics.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {settings.topics.map((topic) => {
                  const count = getTopicCount(topic);
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
                      {topic} {count > 0 && `(${count})`}
                    </Tag>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <Divider style={{ margin: '4px 0' }} />

        {/* Article Type */}
        <div>
          <Title level={5} style={{ marginBottom: '6px', fontSize: '14px', marginTop: 0 }}>Артикль</Title>
          <Radio.Group
            value={settings.articleType}
            onChange={(e) => setSettings({ ...settings, articleType: e.target.value as ArticleType })}
            style={{ width: '100%' }}
          >
            <Flex orientation="vertical" gap="small">
              <Radio value="definite">Определенный (der/die/das)</Radio>
              <Radio value="indefinite">Неопределенный (ein/eine)</Radio>
            </Flex>
          </Radio.Group>
        </div>

        <Divider style={{ margin: '4px 0' }} />

        {/* Cases */}
        <div>
          <Title level={5} style={{ marginBottom: '6px', fontSize: '14px', marginTop: 0 }}>Падежи</Title>
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
              <Checkbox value="nominativ">Nominativ</Checkbox>
              <Checkbox value="akkusativ">Akkusativ</Checkbox>
              <Checkbox value="dativ">Dativ</Checkbox>
              <Checkbox value="genitiv">Genitiv</Checkbox>
            </Flex>
          </Checkbox.Group>
        </div>

        <Divider style={{ margin: '4px 0' }} />

        {/* Pronoun Type */}
        <div>
          <Title level={5} style={{ marginBottom: '6px', fontSize: '14px', marginTop: 0 }}>Местоимения</Title>
          <Radio.Group
            value={settings.pronounType}
            onChange={(e) => setSettings({ ...settings, pronounType: e.target.value, usePronouns: e.target.value !== 'none' })}
            style={{ width: '100%' }}
          >
            <Flex orientation="vertical" gap="small">
              <Radio value="none">Без местоимений</Radio>
              <Radio value="personal">Личные (ich, du, er...)</Radio>
              <Radio value="possessive">Притяжательные (mein, dein...)</Radio>
              <Radio value="demonstrative">Указательные (dieser, jener...)</Radio>
            </Flex>
          </Radio.Group>
        </div>
      </div>
    </Drawer>
  );
}
