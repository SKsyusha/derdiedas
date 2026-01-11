'use client';

import { Drawer, Input, Space, Select, Button, Typography, Empty } from 'antd';
import { useTranslation } from 'react-i18next';
import { Word, Article } from '../types';

const { Text } = Typography;

interface UserDictionaryDrawerProps {
  open: boolean;
  onClose: () => void;
  userDictionaries: Array<{ id: string; name: string; words: Word[]; enabled: boolean }>;
  setUserDictionaries: (dicts: Array<{ id: string; name: string; words: Word[]; enabled: boolean }>) => void;
  newWord: { noun: string; article: Article; translation: string };
  setNewWord: (word: { noun: string; article: Article; translation: string }) => void;
  onDictionaryCreated?: (dictId: string) => void;
}

export default function UserDictionaryDrawer({
  open,
  onClose,
  userDictionaries,
  setUserDictionaries,
  newWord,
  setNewWord,
  onDictionaryCreated,
}: UserDictionaryDrawerProps) {
  const { t } = useTranslation();
  
  const addUserWord = () => {
    if (!newWord.noun || !newWord.article) return;

    const word: Word = {
      noun: newWord.noun,
      article: newWord.article,
      translation: newWord.translation || undefined,
    };

    // Add to first user dictionary or create one
    if (userDictionaries.length === 0) {
      const newDict = {
        id: 'user-1',
        name: t('userDictionary.myDictionaryName'),
        words: [word],
        enabled: true,
      };
      setUserDictionaries([newDict]);
      // Уведомляем о создании словаря
      if (onDictionaryCreated) {
        onDictionaryCreated(newDict.id);
      }
    } else {
      setUserDictionaries((prev) => {
        const updated = [...prev];
        updated[0].words.push(word);
        return updated;
      });
    }

    setNewWord({ noun: '', article: 'der', translation: '' });
  };

  return (
    <Drawer
      title={t('userDictionary.title')}
      placement="right"
      onClose={onClose}
      open={open}
      size={600}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder={t('userDictionary.noun')}
            value={newWord.noun}
            onChange={(e) => setNewWord({ ...newWord, noun: e.target.value })}
            style={{ flex: 1 }}
          />
          <Select
            value={newWord.article}
            onChange={(value) => setNewWord({ ...newWord, article: value as Article })}
            style={{ width: 100 }}
            options={[
              { label: 'der', value: 'der' },
              { label: 'die', value: 'die' },
              { label: 'das', value: 'das' },
            ]}
          />
          <Input
            placeholder={t('userDictionary.translationOptional')}
            value={newWord.translation}
            onChange={(e) => setNewWord({ ...newWord, translation: e.target.value })}
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            onClick={addUserWord}
            style={{ 
              backgroundColor: '#8b5cf6', 
              borderColor: '#8b5cf6',
              color: '#ffffff'
            }}
          >
            {t('userDictionary.add')}
          </Button>
        </Space.Compact>

        {userDictionaries.length === 0 || userDictionaries.every(dict => dict.words.length === 0) ? (
          <Empty
            description={t('userDictionary.empty')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: '40px' }}
          >
            <Text type="secondary" style={{ fontSize: '14px' }}>
              {t('userDictionary.addWordsHint')}
            </Text>
          </Empty>
        ) : (
          userDictionaries.map((dict) => (
            <div key={dict.id}>
              <Text strong className="block mb-2">{dict.name}</Text>
              {dict.words.length === 0 ? (
                <Empty
                  description={t('userDictionary.noWordsInDict')}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ marginTop: '20px' }}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {dict.words.map((word, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <span className="text-gray-900">
                        <strong>{word.article}</strong> {word.noun}
                        {word.translation && ` - ${word.translation}`}
                      </span>
                      <Button
                        type="text"
                        danger
                        size="small"
                        onClick={() => {
                          setUserDictionaries((prev) =>
                            prev.map((d) =>
                              d.id === dict.id
                                ? { ...d, words: d.words.filter((_, i) => i !== idx) }
                                : d
                            )
                          );
                        }}
                      >
                        {t('userDictionary.delete')}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Drawer>
  );
}
