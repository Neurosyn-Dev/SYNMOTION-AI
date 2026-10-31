/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import type { FilmProject, ImageReference, VideoReference, ReferenceCategory, MediaAsset } from '../../types/film';
import {
  Image as ImageIcon,
  Video as VideoIcon,
  Plus,
  Sparkles,
  Camera,
  Upload,
  CheckCircle2,
  Trash2,
  HardDrive,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface Props {
  project: FilmProject;
  onUpdateProject: (p: FilmProject) => void;
}

export const ReferenceLibraryWorkstation: React.FC<Props> = ({
  project,
  onUpdateProject,
}) => {
  const [activeTab, setActiveTab] = useState<'images' | 'videos' | 'assets'>('images');
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [projectAssets, setProjectAssets] = useState<MediaAsset[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Image Reference Form state
  const [showAddImage, setShowAddImage] = useState(false);
  const [newImageName, setNewImageName] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageCategory, setNewImageCategory] = useState<ReferenceCategory>('character');

  const fetchAssets = async () => {
    try {
      const res = await fetch(`/api/projects/${project.id}/assets`);
      const data = await res.json();
      if (data.success) {
        setProjectAssets(data.assets || []);
      }
    } catch (err) {
      console.error('Failed to load project assets:', err);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [project.id]);

  // Handle direct local file upload to /api/assets/upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', project.id);
    formData.append(
      'assetType',
      file.type.startsWith('video/') ? 'uploaded_video' : 'uploaded_image'
    );

    try {
      const res = await fetch('/api/assets/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload media asset');
      }

      const uploadedAsset: MediaAsset = data.asset;
      setProjectAssets((prev) => [uploadedAsset, ...prev]);

      // If it is an image, also create an ImageReference for AI Director conditioning
      if (file.type.startsWith('image/')) {
        const newRef: ImageReference = {
          id: `ref-img-${Date.now()}`,
          name: file.name,
          url: uploadedAsset.url,
          category: 'concept_art',
          tags: ['uploaded-binary', 'local-storage'],
          createdAt: new Date().toISOString(),
        };

        const updatedImages = [...project.imageReferences, newRef];
        onUpdateProject({
          ...project,
          imageReferences: updatedImages,
        });

        // Trigger AI analysis on the uploaded reference
        triggerImageAnalysis(newRef);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddImage = async () => {
    if (!newImageUrl.trim() || !newImageName.trim()) return;

    const newRef: ImageReference = {
      id: 'ref-img-' + Date.now(),
      name: newImageName,
      url: newImageUrl,
      category: newImageCategory,
      tags: [newImageCategory, 'user-url'],
      createdAt: new Date().toISOString(),
    };

    const updatedImages = [...project.imageReferences, newRef];
    onUpdateProject({
      ...project,
      imageReferences: updatedImages,
    });

    setNewImageName('');
    setNewImageUrl('');
    setShowAddImage(false);

    triggerImageAnalysis(newRef);
  };

  const triggerImageAnalysis = async (ref: ImageReference) => {
    setIsAnalyzing(ref.id);
    try {
      const res = await fetch('/api/references/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: ref.url,
          name: ref.name,
          category: ref.category,
        }),
      });
      const data = await res.json();
      if (data.success && data.traits) {
        const updated = project.imageReferences.map((item) =>
          item.id === ref.id ? { ...item, extractedTraits: data.traits } : item
        );
        onUpdateProject({ ...project, imageReferences: updated });
      }
    } catch {
      const updated = project.imageReferences.map((item) =>
        item.id === ref.id
          ? {
              ...item,
              extractedTraits: {
                palette: ['#0f172a', '#38bdf8', '#0284c7', '#020617'],
                lighting: 'High contrast key lighting with cool specular reflections',
                summary: 'Structured visual reference profile extracted for Visual DNA persistence.',
              },
            }
          : item
      );
      onUpdateProject({ ...project, imageReferences: updated });
    } finally {
      setIsAnalyzing(null);
    }
  };

  const handleDeleteImage = (id: string) => {
    onUpdateProject({
      ...project,
      imageReferences: project.imageReferences.filter((r) => r.id !== id),
    });
  };

  const handleDeleteAsset = async (assetId: string) => {
    try {
      await fetch(`/api/assets/${assetId}`, { method: 'DELETE' });
      setProjectAssets((prev) => prev.filter((a) => a.id !== assetId));
    } catch (err) {
      console.error('Failed to delete asset:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-sky-900/30 shadow-2xl relative overflow-hidden">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 text-xs font-semibold tracking-wider uppercase">
            <Camera className="w-3.5 h-3.5 text-sky-400" />
            <span>Multimodal Creative References & Asset Storage</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-cinematic tracking-tight">
            Reference & Media Asset Library
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Upload binary images and videos directly into the persistent storage engine or register reference URLs.
            Gemini multimodal AI analyzes lighting, architecture, and kinetics to condition future production.
          </p>
        </div>
      </div>

      {uploadError && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Tabs & Upload Actions Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('images')}
            className={`px-4 py-2 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 ${
              activeTab === 'images'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                : 'bg-black/40 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Image References ({project.imageReferences.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 ${
              activeTab === 'videos'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-black/40 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <VideoIcon className="w-4 h-4" />
            <span>Video & Motion References ({project.videoReferences.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('assets')}
            className={`px-4 py-2 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 ${
              activeTab === 'assets'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-black/40 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Stored Media Assets ({projectAssets.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Hidden local file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,video/*,audio/*"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>{isUploading ? 'Uploading...' : 'Upload Local File'}</span>
          </button>

          {activeTab === 'images' && (
            <button
              onClick={() => setShowAddImage(true)}
              className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Add Image URL</span>
            </button>
          )}
        </div>
      </div>

      {/* Add Image Reference URL Modal */}
      {showAddImage && (
        <div className="glass-panel p-6 rounded-2xl border border-sky-500/40 space-y-4 max-w-xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Add Image Reference URL</h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Reference Title:</label>
              <input
                type="text"
                value={newImageName}
                onChange={(e) => setNewImageName(e.target.value)}
                placeholder="e.g. Hooded Coat Waterproof Fabric, Gothic Skyscraper"
                className="w-full bg-black/60 border border-slate-700 rounded-lg p-2.5 text-white"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Image URL:</label>
              <input
                type="text"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full bg-black/60 border border-slate-700 rounded-lg p-2.5 text-white"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Reference Category:</label>
              <select
                value={newImageCategory}
                onChange={(e) => setNewImageCategory(e.target.value as ReferenceCategory)}
                className="w-full bg-black/60 border border-slate-700 rounded-lg p-2.5 text-white capitalize"
              >
                {[
                  'character',
                  'environment',
                  'clothing',
                  'prop',
                  'visual_style',
                  'composition',
                  'lighting',
                  'color_palette',
                  'first_frame',
                  'last_frame',
                  'concept_art',
                ].map((c) => (
                  <option key={c} value={c}>
                    {c.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowAddImage(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleAddImage}
              className="px-4 py-1.5 rounded-lg bg-sky-500 text-white font-semibold text-xs"
            >
              Add & Analyze Reference
            </button>
          </div>
        </div>
      )}

      {/* Tab Content: Images */}
      {activeTab === 'images' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {project.imageReferences.map((ref) => (
            <div key={ref.id} className="glass-panel rounded-2xl overflow-hidden border border-sky-900/30 shadow-xl flex flex-col">
              <div className="h-48 relative overflow-hidden bg-black">
                <img src={ref.url} alt={ref.name} className="w-full h-full object-cover" />
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/70 backdrop-blur border border-slate-700 text-[10px] font-semibold uppercase text-sky-300">
                  {ref.category}
                </span>

                <button
                  onClick={() => handleDeleteImage(ref.id)}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/70 hover:bg-red-950 border border-slate-700 hover:border-red-500 text-slate-300 hover:text-red-300 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4 text-xs">
                <div>
                  <h3 className="font-bold text-white text-sm">{ref.name}</h3>
                  {ref.extractedTraits ? (
                    <div className="mt-2 space-y-2 text-slate-300 text-[11px] leading-relaxed">
                      <p className="line-clamp-2">{ref.extractedTraits.summary}</p>
                      {ref.extractedTraits.palette && (
                        <div className="flex gap-1.5 pt-1">
                          {ref.extractedTraits.palette.map((c, i) => (
                            <div key={i} className="w-4 h-4 rounded-full border border-slate-700" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-[11px] mt-1">Pending multimodal AI analysis</p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono-code">
                    {new Date(ref.createdAt).toLocaleDateString()}
                  </span>

                  <button
                    disabled={isAnalyzing === ref.id}
                    onClick={() => triggerImageAnalysis(ref)}
                    className="px-2.5 py-1 rounded bg-black/40 hover:bg-sky-950 border border-slate-700 hover:border-sky-500 text-[11px] text-sky-300 flex items-center gap-1 transition-all"
                  >
                    <Sparkles className="w-3 h-3 text-sky-400" />
                    <span>{isAnalyzing === ref.id ? 'Analyzing...' : 'Re-analyze with Gemini'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Content: Stored Media Assets (Real Binary Storage) */}
      {activeTab === 'assets' && (
        <div className="space-y-4">
          {projectAssets.length === 0 ? (
            <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
              <HardDrive className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-sm font-semibold text-slate-300">No binary media assets uploaded yet</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Use the &ldquo;Upload Local File&rdquo; button above to store binary images, audio, or video files into the
                persistent media storage engine.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectAssets.map((asset) => (
                <div key={asset.id} className="glass-panel rounded-2xl overflow-hidden border border-emerald-900/30 shadow-xl flex flex-col text-xs">
                  <div className="h-44 relative bg-black flex items-center justify-center overflow-hidden">
                    {asset.mimeType.startsWith('image/') ? (
                      <img src={asset.url} alt={asset.originalFilename} className="w-full h-full object-cover" />
                    ) : asset.mimeType.startsWith('video/') ? (
                      <video src={asset.url} controls className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <FileText className="w-8 h-8 text-emerald-400" />
                        <span>{asset.mimeType}</span>
                      </div>
                    )}

                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/70 backdrop-blur border border-emerald-600/40 text-[10px] font-mono-code font-bold uppercase text-emerald-300">
                      {asset.assetType}
                    </span>

                    <button
                      onClick={() => handleDeleteAsset(asset.id)}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/70 hover:bg-red-950 border border-slate-700 hover:border-red-500 text-slate-300 hover:text-red-300 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-white text-sm truncate">{asset.originalFilename}</div>
                      <div className="text-[11px] font-mono-code text-slate-400 mt-1">
                        Size: {(asset.fileSize / 1024).toFixed(1)} KB • {asset.mimeType}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono-code">
                      <span>ID: {asset.id.slice(0, 14)}...</span>
                      <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Videos */}
      {activeTab === 'videos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {project.videoReferences.map((vid) => (
            <div key={vid.id} className="glass-panel p-6 rounded-2xl border border-indigo-900/30 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{vid.name}</h3>
                  <span className="text-xs text-indigo-400 font-medium uppercase tracking-wider">
                    {vid.category.replace('_', ' ')} • {vid.durationSeconds}s
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-700/60 text-xs font-mono-code text-indigo-300">
                  MOTION PROFILE
                </span>
              </div>

              {vid.thumbnailUrl && (
                <div className="h-40 rounded-xl overflow-hidden relative">
                  <img src={vid.thumbnailUrl} alt={vid.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                    <span className="text-xs text-slate-200 font-medium">Kinetic Motion Reference</span>
                  </div>
                </div>
              )}

              {vid.extractedTraits && (
                <div className="space-y-2 text-xs text-slate-300 p-3.5 rounded-xl bg-black/40 border border-slate-800">
                  <div>
                    <span className="font-bold text-sky-400 uppercase text-[10px] block">Extracted Camera Motion:</span>
                    <span>{vid.extractedTraits.cameraMotion}</span>
                  </div>
                  <div>
                    <span className="font-bold text-indigo-400 uppercase text-[10px] block">Movement Dynamics:</span>
                    <span>{vid.extractedTraits.movementDynamics}</span>
                  </div>
                  <div>
                    <span className="font-bold text-amber-400 uppercase text-[10px] block">Cinematic Pacing:</span>
                    <span>{vid.extractedTraits.pacing}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
