import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft, Calendar, Share2, Bookmark, User } from 'lucide-react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogDetail = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/blogs`);
        if (response.data.success) {
          const foundBlog = response.data.data.find(b => b._id === id);
          if (foundBlog) {
            setBlog(foundBlog);
          } else {
            console.error('Blog not found');
          }
        }
      } catch (error) {
        console.error('Error fetching blog details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="text-slate-400 font-medium">Loading story...</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-black text-white mb-4">Story Not Found</h2>
        <p className="text-slate-400 mb-8 max-w-md">The blog post you're looking for might have been moved or deleted.</p>
        <button 
          onClick={() => navigate('/blogs')}
          className="px-6 py-3 bg-emerald-500 text-slate-950 font-bold rounded-2xl hover:bg-emerald-400 transition"
        >
          Back to Blogs
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white pb-20">
      {/* Header / Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 px-4 h-16 flex items-center justify-between">
        <button 
          onClick={() => navigate('/blogs')}
          className="p-2 -ml-2 text-slate-400 hover:text-white transition"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex gap-2">
          <button className="p-2 text-slate-400 hover:text-white transition">
            <Share2 size={20} />
          </button>
          <button className="p-2 text-slate-400 hover:text-white transition">
            <Bookmark size={20} />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-16">
        <div className="max-w-4xl mx-auto px-4 pt-10 pb-6">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 uppercase tracking-widest shadow-lg shadow-emerald-500/20">
              {blog.badge}
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-black bg-slate-800 text-slate-200 uppercase tracking-widest border border-slate-700">
              {blog.category}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white mb-6 leading-[1.1]">
            {blog.title}
          </h1>

          <div className="flex items-center gap-6 text-xs md:text-sm text-slate-400 mb-10 border-b border-slate-800 pb-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <User size={14} className="text-slate-950" />
              </div>
              <span className="font-bold text-slate-300">Rukkoo Editorial</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-slate-500" />
              <span>{blog.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-slate-500" />
              <span>{blog.readTime}</span>
            </div>
          </div>
        </div>

        {/* Hero Image */}
        <div className="max-w-6xl mx-auto px-4 md:px-0">
          <div className="aspect-16/9 md:rounded-[40px] overflow-hidden border border-slate-800 shadow-2xl">
            <img 
              src={blog.image} 
              alt={blog.title} 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        {/* Excerpt */}
        <p className="text-xl md:text-2xl font-bold text-slate-200 mb-12 leading-relaxed italic border-l-4 border-emerald-500 pl-6">
          {blog.excerpt}
        </p>

        {/* Content Body */}
        <div className="prose prose-invert prose-emerald max-w-none">
          {blog.content ? (
            <div className="whitespace-pre-wrap text-slate-300 text-lg leading-[1.8] tracking-wide">
              {blog.content}
            </div>
          ) : (
            <div className="text-slate-400 italic py-10 text-center border-y border-slate-800/50">
              Full content for this story is currently being curated. Check back soon.
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-20 pt-10 border-t border-slate-800">
          <div className="bg-slate-900/40 rounded-3xl p-8 border border-slate-800">
            <h4 className="text-lg font-bold mb-2">About Rukkoo In</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              We're a team of travellers, techies, and hospitality experts dedicated to making budget travel premium. Every story on Rukkoo Hub is backed by real data and on-ground experiences.
            </p>
            <button 
              onClick={() => navigate('/search')}
              className="mt-6 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-full border border-slate-700 transition"
            >
              Explore our stays
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default BlogDetail;
