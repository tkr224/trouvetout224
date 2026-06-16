import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Shield, Zap } from 'lucide-react';

export default function AProposPage() {
  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-14">
          <div className="w-20 h-20 bg-primary-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-white font-display font-bold text-2xl">TT</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-dark-900 mb-4">
            À propos de <span className="text-primary-700">TrouveTout</span><span className="text-yellow-500">224</span>
          </h1>
          <p className="text-dark-500 text-lg">La plus grande plateforme d'annonces et marketplace de Guinée</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          <div className="card p-6 text-center">
            <div className="text-5xl mb-4">🇬🇳</div>
            <h3 className="font-display font-bold text-dark-900 text-lg mb-2">Made in Guinée</h3>
            <p className="text-dark-500 text-sm">Conçu spécialement pour les Guinéens, par des Guinéens.</p>
          </div>
          <div className="card p-6 text-center">
            <div className="flex justify-center mb-4"><Shield size={44} className="text-primary-700" /></div>
            <h3 className="font-display font-bold text-dark-900 text-lg mb-2">Sécurisé</h3>
            <p className="text-dark-500 text-sm">Vos données sont protégées. Chaque annonce est vérifiée.</p>
          </div>
          <div className="card p-6 text-center">
            <div className="flex justify-center mb-4"><Zap size={44} className="text-primary-700" /></div>
            <h3 className="font-display font-bold text-dark-900 text-lg mb-2">Rapide & Moderne</h3>
            <p className="text-dark-500 text-sm">Interface moderne disponible sur tous vos appareils.</p>
          </div>
        </div>
        <div className="card p-8">
          <h2 className="text-2xl font-display font-bold text-dark-900 mb-4">Notre mission</h2>
          <p className="text-dark-600 leading-relaxed">
            TrouveTout224 connecte des millions de Guinéens à travers les 8 régions du pays. Achetez, vendez, trouvez un emploi, un logement ou n'importe quel service facilement et en toute sécurité.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}