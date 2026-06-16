'use client';
import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import toast from 'react-hot-toast';
import { Mail, Phone, MapPin, MessageCircle, Send } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Ouvre le client email avec le message pré-rempli
    const mailtoLink = `mailto:contact.trouvetout224@gmail.com?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(`Nom: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`;
    window.location.href = mailtoLink;
    setTimeout(() => {
      toast.success('Votre application email va s\'ouvrir !');
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold text-dark-900 mb-3 flex items-center justify-center gap-3"><Mail size={36} className="text-primary-700" /> Contactez-nous</h1>
          <p className="text-dark-500">Notre équipe vous répond dans les 24 heures</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            <a href="mailto:contact.trouvetout224@gmail.com" className="card p-5 flex items-center gap-4 hover:border-primary-400 border-2 border-transparent transition-colors">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600">
                <Mail size={20} />
              </div>
              <div>
                <p className="font-semibold text-dark-900 text-sm">Email</p>
                <p className="text-dark-500 text-xs">contact.trouvetout224@gmail.com</p>
              </div>
            </a>
            <a href="tel:+224627543486" className="card p-5 flex items-center gap-4 hover:border-primary-400 border-2 border-transparent transition-colors">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-green-100 text-green-600">
                <Phone size={20} />
              </div>
              <div>
                <p className="font-semibold text-dark-900 text-sm">Téléphone</p>
                <p className="text-dark-500 text-sm">+224 627 54 34 86</p>
              </div>
            </a>
            <a href="https://wa.me/224627543486" target="_blank" rel="noopener noreferrer" className="card p-5 flex items-center gap-4 hover:border-primary-400 border-2 border-transparent transition-colors">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-600">
                <MessageCircle size={20} />
              </div>
              <div>
                <p className="font-semibold text-dark-900 text-sm">WhatsApp</p>
                <p className="text-dark-500 text-sm">+224 627 54 34 86</p>
              </div>
            </a>
            <div className="card p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-red-100 text-red-600">
                <MapPin size={20} />
              </div>
              <div>
                <p className="font-semibold text-dark-900 text-sm">Adresse</p>
                <p className="text-dark-500 text-sm">Conakry, Guinée</p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 card p-8">
            <h2 className="font-display font-bold text-dark-900 text-xl mb-6">Envoyer un message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-1.5">Nom complet</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="input" placeholder="Votre nom" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-1.5">Email</label>
                  <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} required type="email" className="input" placeholder="votre@email.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">Sujet</label>
                <input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required className="input" placeholder="Objet de votre message" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">Message</label>
                <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} required rows={5} className="input resize-none" placeholder="Décrivez votre demande..." />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                {loading ? 'Ouverture...' : <><Send size={15} /> Envoyer le message</>}
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}