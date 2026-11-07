// Extraído do App.tsx (mesma ordem de antes: os efeitos rodam na mesma sequência)
import { useState } from 'react';
import { COLLECTION_AVAILABLE_EMOJIS, COLLECTION_AVAILABLE_PALETTES } from '../data/catalog';

export function useCollectionForm() {
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);

  // Formulário de Criação / Edição de Coleção (Tela Cheia)
  const [colFormName, setColFormName] = useState('');
  const [colFormDesc, setColFormDesc] = useState('');
  const [colFormPalette, setColFormPalette] = useState<(typeof COLLECTION_AVAILABLE_PALETTES)[number]>(COLLECTION_AVAILABLE_PALETTES[0]);
  const [colFormEmoji, setColFormEmoji] = useState<string>(COLLECTION_AVAILABLE_EMOJIS[0]);
  const [colSelectedBookIds, setColSelectedBookIds] = useState<string[]>([]);
  const [colSelectedAuthorIds, setColSelectedAuthorIds] = useState<string[]>([]);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  return { colFormDesc, colFormEmoji, colFormName, colFormPalette, colSelectedAuthorIds, colSelectedBookIds, editingCollectionId, selectedCollectionIds, setColFormDesc, setColFormEmoji, setColFormName, setColFormPalette, setColSelectedAuthorIds, setColSelectedBookIds, setEditingCollectionId, setSelectedCollectionIds };
}
