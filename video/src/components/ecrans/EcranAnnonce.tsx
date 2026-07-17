/**
 * EcranAnnonce — reconstitue une fiche annonce (photo, titre, prix,
 * vendeur, bouton WhatsApp) avec du contenu d'exemple.
 */
import React from 'react';
import { COULEURS } from '../../config';
import { POLICE } from '../../fonts';

type Props = {
  titre: string;
  prix: string;
  lieu: string;
  vendeur: string;
  emoji: string;
};

export const EcranAnnonce: React.FC<Props> = ({ titre, prix, lieu, vendeur, emoji }) => {
  return (
    <div style={{ width: '100%', height: '100%', background: '#FFFFFF', fontFamily: POLICE, display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          marginTop: 80,
          height: 380,
          background: `linear-gradient(135deg, ${COULEURS.vert}, ${COULEURS.or})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 90,
        }}
      >
        {emoji}
      </div>

      <div style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span style={{ fontSize: 30, fontWeight: 800, color: COULEURS.noir }}>{titre}</span>
        <span style={{ fontSize: 34, fontWeight: 900, color: COULEURS.rouge }}>{prix}</span>
        <span style={{ fontSize: 20, color: '#6B7280' }}>📍 {lieu}</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: '50%',
              background: COULEURS.vert,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 18,
            }}
          >
            {vendeur.charAt(0)}
          </div>
          <span style={{ fontSize: 20, fontWeight: 600, color: COULEURS.noir }}>{vendeur}</span>
        </div>

        <div
          style={{
            marginTop: 20,
            background: '#25D366',
            color: '#fff',
            borderRadius: 16,
            padding: '18px',
            textAlign: 'center',
            fontSize: 24,
            fontWeight: 800,
          }}
        >
          💬 Contacter sur WhatsApp
        </div>
      </div>
    </div>
  );
};
