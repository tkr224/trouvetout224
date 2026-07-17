/**
 * EcranCategories — grille de catégories reprenant les vraies catégories
 * du site (voir frontend/src/components/annonces/CategoryGrid.tsx).
 */
import React from 'react';
import { COULEURS } from '../../config';
import { POLICE } from '../../fonts';

type Categorie = { emoji: string; label: string };

type Props = {
  categories: Categorie[];
};

export const EcranCategories: React.FC<Props> = ({ categories }) => {
  return (
    <div style={{ width: '100%', height: '100%', background: '#FFFFFF', fontFamily: POLICE, padding: '110px 20px 20px' }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: COULEURS.noir, marginBottom: 24 }}>
        Toutes les catégories
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {categories.map((c) => (
          <div
            key={c.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              background: '#F4FBF6',
              borderRadius: 18,
              padding: '18px 6px',
              border: `1px solid ${COULEURS.vert}22`,
            }}
          >
            <span style={{ fontSize: 34 }}>{c.emoji}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: COULEURS.noir, textAlign: 'center' }}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
