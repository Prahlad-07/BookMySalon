/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-14
 */
import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Clock, ChevronRight, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';

export default function SalonList() {
  const navigate = useNavigate();
  const [salons, setSalons] = useState([]);
  const [nameQuery, setNameQuery] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSalons = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get('/api/salons');
      setSalons(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load salons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalons();
  }, []);

  const filteredSalons = useMemo(() => {
    return salons.filter((salon) => {
      const name = salon.name?.toLowerCase() || '';
      const city = salon.city?.toLowerCase() || '';
      return name.includes(nameQuery.toLowerCase()) && city.includes(cityQuery.toLowerCase());
    });
  }, [salons, nameQuery, cityQuery]);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900">Find Salons</h1>
          <p className="text-slate-600 mt-2">Browse verified salons and compare services.</p>
        </div>

        <div className="glass-effect rounded-2xl p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                className="input-field input-with-icon"
                placeholder="Search by salon name"
                value={nameQuery}
                onChange={(e) => setNameQuery(e.target.value)}
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                className="input-field input-with-icon"
                placeholder="Filter by city"
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
              />
            </div>
            <button type="button" onClick={loadSalons} className="btn-secondary flex items-center justify-center gap-2">
              <RefreshCcw size={16} /> Refresh
            </button>
          </div>
        </div>

        {loading && (
          <div className="py-20 flex items-center justify-center">
            <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}

        {error && <div className="rounded-xl border border-red-300 bg-red-50 text-red-700 p-4">{error}</div>}

        {!loading && !error && (
          <>
            <p className="text-slate-600 font-medium">{filteredSalons.length} salon(s) found</p>

            {filteredSalons.length === 0 ? (
              <div className="card-base p-10 text-center text-slate-600">
                No salons match the current filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredSalons.map((salon) => (
                  <motion.div key={salon.id} whileHover={{ y: -4 }} className="card-base p-6 flex flex-col">
                    <h2 className="text-2xl font-bold text-slate-900">{salon.name}</h2>
                    <p className="text-slate-600 mt-3 flex items-start gap-2">
                      <MapPin size={16} className="mt-0.5" />
                      <span>{salon.address}, {salon.city}</span>
                    </p>
                    <p className="text-slate-600 mt-2 flex items-center gap-2">
                      <Clock size={16} /> {salon.openTime || '09:00'} - {salon.closeTime || '18:00'}
                    </p>

                    <button
                      type="button"
                      onClick={() => navigate(`/salon/${salon.id}`)}
                      className="mt-6 btn-primary w-full flex items-center justify-center gap-2"
                    >
                      View Details <ChevronRight size={18} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
