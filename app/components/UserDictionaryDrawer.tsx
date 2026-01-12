'use client';

import { useState, useEffect } from 'react';
import { Drawer, Input, Space, Select, Button, Typography, Empty } from 'antd';
import { useTranslation } from 'react-i18next';
import { Word, Article } from '../types';

const { Text } = Typography;

type UserDictionary = { id: string; name: string; words: Word[]; enabled: boolean };

interface UserDictionaryDrawerProps {
  open: boolean;
  onClose: () => void;
  userDictionaries: UserDictionary[];
  setUserDictionaries: React.Dispatch<React.SetStateAction<UserDictionary[]>>;
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
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
      size={isMobile ? 'default' : 600}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder={t('userDictionary.noun')}
            value={newWord.noun}
            onChange={(e) => setNewWord({ ...newWord, noun: e.target.value })}
            className="flex-1"
          />
          <Select
            value={newWord.article}
            onChange={(value) => setNewWord({ ...newWord, article: value as Article })}
            className="w-full sm:w-24"
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
            className="flex-1"
          />
          <Button
            type="primary"
            onClick={addUserWord}
            className="w-full sm:w-auto"
            style={{ 
              backgroundColor: '#8b5cf6', 
              borderColor: '#8b5cf6',
              color: '#ffffff'
            }}
          >
            {t('userDictionary.add')}
          </Button>
        </div>

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
