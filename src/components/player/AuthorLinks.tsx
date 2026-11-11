import React from 'react';
import { splitAuthorNames } from '../../lib/authorUtils';

// Vários autores ("Ana, Bruno & Carla"): cada nome é tocável sozinho e abre a página daquele autor
export function AuthorLinks({ authors, className, onPick }: {
  authors: string;
  className?: string;
  onPick: (name: string) => void;
}) {
  const names = splitAuthorNames(authors);
  if (names.length === 0) return null;
  return (
    <>
      {names.map((name, i) => (
        <React.Fragment key={name}>
          {i > 0 && <span className="opacity-70">, </span>}
          <span
            role="link"
            title={name}
            className={className}
            onClick={(e) => { e.stopPropagation(); onPick(name); }}
          >
            {name}
          </span>
        </React.Fragment>
      ))}
    </>
  );
}
