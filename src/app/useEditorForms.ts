// Extraído do App.tsx (mesma ordem de antes: os efeitos rodam na mesma sequência)
import { useState } from 'react';
import { Chapter, TranscriptLine } from '../data/catalog';
import { GENERIC_COVER_COLORS } from '../lib/coverArt';

export function useEditorForms() {
  const [isEditingBook, setIsEditingBook] = useState(false);
  const [editBookTitle, setEditBookTitle] = useState('');
  const [editBookAuthor, setEditBookAuthor] = useState('');
  const [editBookCategory, setEditBookCategory] = useState('');
  const [editBookSubgenre, setEditBookSubgenre] = useState('');
  const [editBookCover, setEditBookCover] = useState('');
  const [editBookDescription, setEditBookDescription] = useState('');
  const [editBookNarrator, setEditBookNarrator] = useState('');
  const [editBookLanguage, setEditBookLanguage] = useState('');
  const [editBookChapters, setEditBookChapters] = useState<Chapter[]>([]);
  const [editBookTranscript, setEditBookTranscript] = useState<TranscriptLine[]>([]);
  const [editBookTranscriptSource, setEditBookTranscriptSource] = useState<'metadata' | 'upload' | undefined>(undefined);
  const [editBookTranscriptFileName, setEditBookTranscriptFileName] = useState<string | undefined>(undefined);
  const [bookCropImage, setBookCropImage] = useState<string | null>(null);
  const [editCoverColor, setEditCoverColor] = useState<string>(GENERIC_COVER_COLORS[0].hex);

  // Estados de edição de Autor
  const [isEditingAuthor, setIsEditingAuthor] = useState(false);
  const [editAuthorName, setEditAuthorName] = useState('');
  const [editAuthorNationality, setEditAuthorNationality] = useState('');
  const [editAuthorPicture, setEditAuthorPicture] = useState('');
  const [editAuthorBio, setEditAuthorBio] = useState('');
  const [authorCropImage, setAuthorCropImage] = useState<string | null>(null);
  const [editAuthorColor, setEditAuthorColor] = useState<string>(GENERIC_COVER_COLORS[0].hex);
  return { authorCropImage, bookCropImage, editAuthorBio, editAuthorColor, editAuthorName, editAuthorNationality, editAuthorPicture, editBookAuthor, editBookCategory, editBookChapters, editBookCover, editBookDescription, editBookLanguage, editBookNarrator, editBookSubgenre, editBookTitle, editBookTranscript, editBookTranscriptFileName, editBookTranscriptSource, editCoverColor, isEditingAuthor, isEditingBook, setAuthorCropImage, setBookCropImage, setEditAuthorBio, setEditAuthorColor, setEditAuthorName, setEditAuthorNationality, setEditAuthorPicture, setEditBookAuthor, setEditBookCategory, setEditBookChapters, setEditBookCover, setEditBookDescription, setEditBookLanguage, setEditBookNarrator, setEditBookSubgenre, setEditBookTitle, setEditBookTranscript, setEditBookTranscriptFileName, setEditBookTranscriptSource, setEditCoverColor, setIsEditingAuthor, setIsEditingBook };
}
