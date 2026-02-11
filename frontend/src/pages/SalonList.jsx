import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Star, Clock, Tag, ChevronRight, Sparkles, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';

export default function SalonList() {
  const [salons, setSalons] = useState([]);
  const [filteredSalons, setFilteredSalons] = useState([]);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllSalons();
  }, []);

  const fetchAllSalons = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/salons');
      setSalons(response.data);
      setFilteredSalons(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch salons:', err);
      setError('Failed to load salons. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearch(query);
    filterSalons(query, city);
  };

  const handleCitySearch = async (e) => {
    const cityName = e.target.value;
    setCity(cityName);

    if (cityName.trim()) {
      try {
        const response = await api.get('/api/salons/search', {
          params: { city: cityName },
        });
        setFilteredSalons(response.data);
      } catch (err) {
        console.error('Failed to search by city:', err);
      }
    } else {
      setFilteredSalons(salons);
    }
  };

  const filterSalons = (query, selectedCity) => {
    let filtered = salons;

    if (selectedCity) {
      filtered = filtered.filter((salon) =>
        salon.city?.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }

    if (query) {
      filtered = filtered.filter((salon) =>
        salon.name?.toLowerCase().includes(query)
      );
    }

    setFilteredSalons(filtered);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background */}
      <motion.div
        animate={{ y: [0, 30, 0] }}
        transition={{ duration: 15, repeat: Infinity }}
        className="fixed top-20 left-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl -z-10"
      />
      <motion.div
        animate={{ y: [0, -30, 0] }}
        transition={{ duration: 20, repeat: Infinity }}
        className="fixed bottom-20 right-10 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl -z-10"
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="text-center mb-16"
        >
          <motion.span className="inline-block px-5 py-2 bg-gradient-to-r from-violet-500/20 to-pink-500/20 text-violet-300 rounded-full text-sm font-semibold mb-4 border border-violet-500/30">
            ✨ Browse Premium Salons
          </motion.span>
          <h1 className="text-5xl sm:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Find Your Perfect Salon
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Discover the best salons near you and book appointments instantly
          </p>
        </motion.div>

        {/* Search Filters */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="glass-effect rounded-2xl p-8 mb-12 border border-white/10 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <Filter className="text-violet-400" size={24} />
            <h2 className="text-xl font-semibold text-white">Search & Filter</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search by Name */}
            <motion.div whileHover={{ scale: 1.02 }} className="group">
              <label className="block text-sm font-semibold text-slate-200 mb-3">
                Salon Name
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-400 transition" size={20} />
                <input
                  type="text"
                  value={search}
                  onChange={handleSearch}
                  placeholder="Search salons..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-400 focus:bg-white/15 focus:border-violet-500/50 focus:outline-none transition-all"
                />
              </div>
            </motion.div>

            {/* Search by City */}
            <motion.div whileHover={{ scale: 1.02 }} className="group">
              <label className="block text-sm font-semibold text-slate-200 mb-3">
                City
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-400 transition" size={20} />
                <input
                  type="text"
                  value={city}
                  onChange={handleCitySearch}
                  placeholder="Enter city..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-400 focus:bg-white/15 focus:border-violet-500/50 focus:outline-none transition-all"
                />
              </div>
            </motion.div>

            {/* Filter Button */}
            <div className="flex items-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchAllSalons}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-violet-500/50 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles size={18} />
                Clear Filters
              </motion.button>
            </div>
          </div>

          {/* Results Count */}
          <motion.p className="text-slate-300 mt-6 flex items-center gap-2">
            <span className="px-3 py-1 bg-violet-500/20 border border-violet-500/50 rounded-full text-sm font-semibold text-violet-300">
              {filteredSalons.length}
            </span>
            salon{filteredSalons.length !== 1 ? 's' : ''} found
          </motion.p>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 border-4 border-violet-200/30 border-t-violet-600 rounded-full mx-auto mb-6"
            />
            <motion.p 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-slate-300 text-lg"
            >
              Loading premium salons...
            </motion.p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-500/50 rounded-xl p-6 text-red-200 text-center backdrop-blur-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Salons Grid */}
        {!loading && !error && (
          <>
            {filteredSalons.length > 0 ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {filteredSalons.map((salon, index) => (
                  <motion.div
                    key={salon.id}
                    custom={index}
                    variants={itemVariants}
                    whileHover={{ y: -15, scale: 1.02 }}
                    onClick={() => navigate(`/salon/${salon.id}`)}
                    className="group relative cursor-pointer"
                  >
                    <div className="glass-effect rounded-2xl overflow-hidden border border-white/10 backdrop-blur-sm hover:border-white/30 transition-all h-full flex flex-col">
                      {/* Image */}
                      <div className="relative h-52 bg-gradient-to-br from-violet-600/30 via-purple-600/30 to-pink-600/30 flex items-center justify-center overflow-hidden">
                        <motion.div
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className="text-7xl group-hover:scale-110 transition-transform duration-300"
                        >
                          💇‍♀️
                        </motion.div>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                          className="absolute top-3 right-3 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-lg shadow-lg"
                        >
                          ⭐
                        </motion.div>
                      </div>

                      {/* Content */}
                      <div className="p-6 flex flex-col flex-grow">
                        <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-violet-300 transition">
                          {salon.name}
                        </h3>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <motion.div
                                key={i}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                              >
                                <Star size={16} className="fill-yellow-400 text-yellow-400" />
                              </motion.div>
                            ))}
                          </div>
                          <span className="text-slate-300 text-sm font-semibold">(4.8)</span>
                        </div>

                        {/* Location */}
                        <div className="flex items-start gap-2 mb-4 text-slate-300 text-sm">
                          <MapPin size={16} className="mt-0.5 flex-shrink-0 text-violet-400" />
                          <p>{salon.address}, {salon.city}, {salon.state}</p>
                        </div>

                        {/* Hours */}
                        <div className="flex items-center gap-2 text-slate-300 text-sm mb-4">
                          <Clock size={16} className="text-violet-400" />
                          <span>{salon.openingTime} - {salon.closingTime}</span>
                        </div>

                        {/* Description */}
                        <p className="text-slate-400 text-sm mb-6 line-clamp-2 flex-grow">
                          {salon.description || 'Premium salon services'}
                        </p>

                        {/* CTA */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full py-3 bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-violet-500/50 transition-all flex items-center justify-center gap-2"
                        >
                          View Services
                          <ChevronRight size={18} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <p className="text-3xl text-slate-300 mb-2">No salons found</p>
                <p className="text-slate-400">Try adjusting your search filters</p>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
