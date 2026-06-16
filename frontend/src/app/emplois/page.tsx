'use client';
import { useState } from 'react';
import { useQuery } from 'react-query';
import { Briefcase, MapPin, Clock, Search, Calendar, Mail, Send } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const JOB_TYPES: Record<string,string> = { FULL_TIME:'Temps plein', PART_TIME:'Temps partiel', FREELANCE:'Freelance', INTERNSHIP:'Stage', VOLUNTEER:'Bénévolat' };
const CITIES = ['Conakry','Labé','Kindia','Kankan','Mamou','Boké','Faranah','Nzérékoré'];

export default function EmploisPage() {
  const [q,setQ] = useState('');
  const [cityFilter,setCityFilter] = useState('');
  const [typeFilter,setTypeFilter] = useState('');
  const [selectedJob,setSelectedJob] = useState<any>(null);

  const { data, isLoading } = useQuery(['jobs',q,cityFilter,typeFilter],
    () => api.get('/jobs',{params:{q,cityId:cityFilter,type:typeFilter}}).then(r=>r.data),
    { keepPreviousData: true });

  const apply = async (jobId: string) => {
    try { await api.post(`/jobs/${jobId}/apply`,{}); toast.success('Candidature envoyée !'); }
    catch(e:any) { toast.error(e.response?.data?.error||'Connectez-vous pour postuler'); }
  };

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <section className="bg-gradient-to-br from-sky-700 to-sky-900 py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-display font-bold text-white mb-3 flex items-center justify-center gap-3"><Briefcase size={34} /> Offres d'emploi en Guinée</h1>
          <p className="text-sky-200 mb-8">Des centaines d'opportunités vous attendent</p>
          <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-lg">
            <Search size={18} className="text-dark-400 ml-2 self-center shrink-0"/>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Titre, entreprise..." className="flex-1 outline-none text-dark-900 text-sm py-2"/>
            <select value={cityFilter} onChange={e=>setCityFilter(e.target.value)} className="border-l border-dark-200 pl-3 text-sm text-dark-600 outline-none bg-transparent">
              <option value="">Toutes les villes</option>
              {CITIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {[['','Tous'],...Object.entries(JOB_TYPES)].map(([val,label])=>(
            <button key={val} onClick={()=>setTypeFilter(val)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all ${typeFilter===val?'bg-sky-700 text-white':'bg-white text-dark-600 hover:bg-sky-50 shadow-sm'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {isLoading?Array.from({length:5}).map((_,i)=>(
              <div key={i} className="card p-5 space-y-3"><div className="skeleton h-5 w-2/3"/><div className="skeleton h-4 w-1/2"/></div>
            )):data?.data?.length===0?(
              <div className="card p-10 text-center"><Search size={36} className="text-dark-300 mx-auto mb-3"/><p className="text-dark-500">Aucune offre trouvée</p></div>
            ):data?.data?.map((job:any)=>(
              <button key={job.id} onClick={()=>setSelectedJob(job)} className={`card p-5 w-full text-left border-2 transition-all ${selectedJob?.id===job.id?'border-sky-600':'border-transparent'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 bg-sky-100 rounded-xl flex items-center justify-center shrink-0"><Briefcase size={18} className="text-sky-700"/></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-dark-900 text-sm truncate">{job.title}</h3>
                    <p className="text-dark-500 text-xs">{job.company}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs text-dark-500 flex items-center gap-1"><MapPin size={10}/>{job.city?.name}</span>
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700">{JOB_TYPES[job.type]}</span>
                      {job.salary&&<span className="text-sky-700 text-xs font-semibold">{job.salary.toLocaleString()} GNF</span>}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="lg:col-span-3">
            {selectedJob?(
              <div className="card p-7 sticky top-24">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 bg-sky-100 rounded-2xl flex items-center justify-center"><Briefcase size={26} className="text-sky-700"/></div>
                  <div>
                    <h2 className="text-xl font-display font-bold text-dark-900">{selectedJob.title}</h2>
                    <p className="text-dark-600 font-medium">{selectedJob.company}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-dark-500">
                      <span className="flex items-center gap-1"><MapPin size={13}/>{selectedJob.city?.name}</span>
                      {selectedJob.schedule&&<span className="flex items-center gap-1"><Clock size={13}/>{selectedJob.schedule}</span>}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-sky-50 rounded-xl p-3 text-center"><p className="text-xs text-dark-500">Type</p><p className="font-semibold text-sky-700 text-sm">{JOB_TYPES[selectedJob.type]}</p></div>
                  {selectedJob.salary&&<div className="bg-green-50 rounded-xl p-3 text-center"><p className="text-xs text-dark-500">Salaire</p><p className="font-semibold text-green-700 text-sm">{selectedJob.salary.toLocaleString()} GNF</p></div>}
                  {selectedJob.experience&&<div className="bg-purple-50 rounded-xl p-3 text-center"><p className="text-xs text-dark-500">Expérience</p><p className="font-semibold text-purple-700 text-sm">{selectedJob.experience}</p></div>}
                </div>
                <div className="mb-6">
                  <h3 className="font-semibold text-dark-900 mb-3">Description</h3>
                  <p className="text-dark-600 text-sm leading-relaxed whitespace-pre-wrap">{selectedJob.description}</p>
                </div>
                {selectedJob.deadline&&<p className="text-sm text-dark-500 mb-4 flex items-center gap-1.5"><Calendar size={13}/> Date limite : <strong>{new Date(selectedJob.deadline).toLocaleDateString('fr-FR')}</strong></p>}
                <button onClick={()=>apply(selectedJob.id)} className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"><Send size={15}/> Postuler maintenant</button>
                {selectedJob.email&&<a href={`mailto:${selectedJob.email}`} className="btn-outline w-full py-3 mt-2 flex items-center justify-center gap-2 text-sm"><Mail size={14}/> {selectedJob.email}</a>}
              </div>
            ):(
              <div className="card p-12 text-center"><Briefcase size={60} className="text-dark-200 mx-auto mb-4"/><p className="text-dark-500">Sélectionnez une offre</p></div>
            )}
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
}
