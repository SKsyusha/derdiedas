'use client';

import { Drawer, Radio, Checkbox, Select, Space, Divider, Typography, Tag } from 'antd';
import { TrainingSettings, Case, Level, Language, Topic, ArticleType, PronounType, Word } from '../types';

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
  drawerSize: number;
  setDrawerSize: (size: number) => void;
  userDictionaries: Array<{ id: string; name: string; words: Word[]; enabled: boolean }>;
  setUserDictionaries: (dicts: Array<{ id: string; name: string; words: Word[]; enabled: boolean }>) => void;
}

export default function SettingsDrawer({
  open,
  onClose,
  settings,
  setSettings,
  drawerSize,
  setDrawerSize,
}: SettingsDrawerProps) {
  return (
    <Drawer
      title="Настройки"
      placement="right"
      onClose={onClose}
      open={open}
      size={drawerSize}
      resizable={{
        onResize: (newSize: number) => {
          setDrawerSize(newSize);
        },
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <Title level={5} style={{ marginBottom: '6px', fontSize: '14px', marginTop: 0 }}>Режим тренировки</Title>
          <Radio.Group
            value={settings.mode}
            onChange={(e) => setSettings({ ...settings, mode: e.target.value })}
            style={{ width: '100%' }}
          >
            <Space orientation="vertical" size="small">
              <Radio value="noun-only">Только существительное</Radio>
              <Radio value="sentence">В предложении</Radio>
            </Space>
          </Radio.Group>
        </div>

        <Divider style={{ margin: '4px 0' }} />

        <div>
          <Title level={5} style={{ marginBottom: '6px', fontSize: '14px', marginTop: 0 }}>Уровень</Title>
          <Checkbox.Group
            value={settings.level}
            onChange={(checkedValues) => {
              const levels = checkedValues as Level[];
              setSettings({
                ...settings,
                level: levels,
                enabledDictionaries: [
                  ...settings.enabledDictionaries.filter((d) => !['A1', 'A2', 'B1'].includes(d)),
                  ...levels,
                ],
              });
            }}
          >
            <Space orientation="vertical" size="small">
              {(['A1', 'A2', 'B1'] as Level[]).map((level) => (
                <Checkbox key={level} value={level}>
                  {level}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
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
                <Space orientation="vertical" size="small">
                  {(['nominativ', 'akkusativ', 'dativ', 'genitiv'] as Case[]).map((case_) => (
                    <Checkbox key={case_} value={case_}>
                      {case_.charAt(0).toUpperCase() + case_.slice(1)}
                    </Checkbox>
                  ))}
                </Space>
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
              options={allTopics.map((topic) => ({ label: topic, value: topic }))}
            />
            
            {/* Selected Topics */}
            {settings.topics.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {settings.topics.map((topic) => (
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
                    {topic}
                  </Tag>
                ))}
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
            onChange={(e) => setSettings({ ...settings, articleType: e.target.value })}
            style={{ width: '100%' }}
          >
            <Space orientation="vertical" size="small">
              <Radio value="definite">Определенный (der/die/das)</Radio>
              <Radio value="indefinite">Неопределенный (ein/eine)</Radio>
            </Space>
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
            <Space orientation="vertical" size="small">
              <Checkbox value="nominativ">Nominativ</Checkbox>
              <Checkbox value="akkusativ">Akkusativ</Checkbox>
              <Checkbox value="dativ">Dativ</Checkbox>
              <Checkbox value="genitiv">Genitiv</Checkbox>
            </Space>
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
            <Space orientation="vertical" size="small">
              <Radio value="none">Без местоимений</Radio>
              <Radio value="personal">Личные (ich, du, er...)</Radio>
              <Radio value="possessive">Притяжательные (mein, dein...)</Radio>
              <Radio value="demonstrative">Указательные (dieser, jener...)</Radio>
            </Space>
          </Radio.Group>
        </div>
      </div>
    </Drawer>
  );
}
