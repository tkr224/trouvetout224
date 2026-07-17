/**
 * EcranRecherche — reconstitue l'écran de recherche du site (barre de
 * recherche + résultats) avec du contenu d'exemple, sans dépendre d'une
 * vraie capture d'écran. Dimensionné pour un MockupTelephone de largeur 520.
 */
import React from 'react';
import { COULEURS } from '../../config';
import { POLICE } from '../../fonts';
import { Resultat } from '../../types';

type Props = {
  requete: string;
  resultats: Resultat[];
};

export const EcranRecherche: React.FC<Props> = ({ requete, resultats }) => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#F4FBF6',
        fontFamily: POLICE,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ padding: '100px 24px 16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: '#FFFFFF',
            borderRadius: 999,
            padding: '16px 20px',
            border: `2px solid ${COULEURS.vert}33`,
          }}
        >
          <span style={{ fontSize: 24 }}>🔍</span>
          <span style={{ fontSize: 26, color: COULEURS.noir, fontWeight: 600 }}>{requete}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '10px 24px' }}>
        {resultats.map((r) => (
          <div
            key={r.titre}
            style={{
              display: 'flex',
              gap: 16,
              background: '#FFFFFF',
              borderRadius: 20,
              padding: 16,
              boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
            }}
          >
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 14,
                flexShrink: 0,
                background: `linear-gradient(135deg, ${COULEURS.vert}, ${COULEURS.or})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 40,
              }}
            >
              {r.emoji}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: COULEURS.noir }}>{r.titre}</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: COULEURS.rouge }}>{r.prix}</span>
              <span style={{ fontSize: 18, color: '#6B7280' }}>📍 {r.lieu}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
