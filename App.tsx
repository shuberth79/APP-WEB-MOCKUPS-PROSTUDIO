
import React, { useState, useRef, useEffect } from 'react';
import { MockupType, GeneratedImage, MockupOptions, ChatMessage, MockupQuantity, Resolution, Gender, ManualMontageOptions } from './types';
import { MOCKUP_CATEGORIES, ETHNICITIES, PHYSICAL_TRAITS, STYLES, LOCATIONS, ENVIRONMENTS, GENDERS } from './constants';
import { geminiService } from './services/geminiService';
import { storageService } from './services/storageService';
import { Button } from './components/Button';
import ManualMontagePreview, { ManualMontagePreviewHandles } from './components/ManualMontagePreview';

const RESOLUTIONS: Resolution[] = ['Baja', 'Media', 'HD', 'UHD', '8K Expert'];

interface UploadBoxProps {
  image: string | null;
  onClick: () => void;
  label: string;
  icon: string;
}

const UploadBox: React.FC<UploadBoxProps> = ({ image, onClick, label, icon }) => (
  <div
    onClick={onClick}
    className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center hover:bg-white/5 cursor-pointer transition-all bg-black/40 group shadow-inner active:scale-[0.98]"
  >
    {image ? (
      <div className="relative">
        <img src={image} className="max-h-24 mx-auto rounded shadow-lg transition-transform group-hover:scale-105" alt="Preview" />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded transition-opacity">
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Cambiar</span>
        </div>
      </div>
    ) : (
      <div className="text-gray-600 group-hover:text-gray-400 transition-colors">
        <p className="text-3xl mb-1">{icon}</p>
        <p className="text-[10px] font-black uppercase tracking-widest">{label}</p>
      </div>
    )}
  </div>
);

interface ChatSectionProps {
  history: ChatMessage[];
  input: string;
  setInput: (v: string) => void;
  onSend: (e: React.FormEvent) => void;
  color: string;
  chatEndRef: React.RefObject<HTMLDivElement>;
  placeholder?: string;
}

const ChatSection: React.FC<ChatSectionProps> = ({
  history,
  input,
  setInput,
  onSend,
  color,
  chatEndRef,
  placeholder = "Instrucción de ajuste..."
}) => (
  <div className="bg-black/60 rounded-2xl p-4 border border-white/5 shadow-inner">
    <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3 block">Ajustes MOCKUPS-PROSTUDIO IA</label>
    <div className="h-28 overflow-y-auto space-y-2 mb-3 scrollbar-hide text-[11px] px-1">
      {history.length === 0 && <p className="text-gray-700 italic text-[10px]">{placeholder}</p>}
      {history.map((msg, i) => (
        <div key={i} className={msg.role === 'user' ? `text-${color}-400` : 'text-gray-500'}>
          <span className="font-black uppercase text-[8px] opacity-50 mr-2">[{msg.role}]</span> {msg.content}
        </div>
      ))}
      <div ref={chatEndRef} />
    </div>
    <form onSubmit={onSend} className="flex gap-2">
      <input
        type="text" value={input} onChange={e => setInput(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] focus:border-orange-500 outline-none transition-all"
      />
      <button type="submit" className={`bg-${color}-600/20 text-${color}-500 border border-${color}-600/30 px-4 rounded-xl text-[9px] font-black uppercase hover:bg-${color}-600 hover:text-white transition-all active:scale-95`}>OK</button>
    </form>
  </div>
);

interface SelectProps {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}

const Select: React.FC<SelectProps> = ({ label, options, value, onChange }) => (
  <div className="flex-1">
    <label className="text-[9px] font-black text-gray-600 uppercase mb-2 block tracking-widest">{label}</label>
    <div className="relative group">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-[10px] font-black focus:border-orange-500 outline-none appearance-none cursor-pointer hover:bg-white/10 transition-colors uppercase tracking-tight group-hover:border-white/20 active:brightness-90"
      >
        {options.map(o => <option key={o} value={o} className="bg-[#111]">{o}</option>)}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-gray-500 group-hover:text-white">▼</div>
    </div>
  </div>
);

interface SliderControlProps {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  color: string;
  unit?: string;
  step?: number;
}

const SliderControl: React.FC<SliderControlProps> = ({
  label,
  min,
  max,
  value,
  onChange,
  color,
  unit = "",
  step = 1
}) => (
  <div className="bg-black/30 rounded-lg py-1.5 px-3 border border-white/5 shadow-inner">
    <label className="text-[11px] font-bold text-gray-400 uppercase mb-1.5 block tracking-wider">{label}</label>
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-${color}-500 bg-white/10`}
      />
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => {
          const num = parseFloat(e.target.value);
          if (!isNaN(num) && num >= min && num <= max) onChange(num);
        }}
        className={`w-14 bg-white/5 border border-white/10 rounded-md px-1.5 py-0.5 text-[10px] text-${color}-400 text-right focus:border-orange-500 outline-none`}
      />
      <span className={`block text-[8px] text-${color}-400 font-bold`}>{unit}</span>
    </div>
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generate' | 'gallery' | 'manualMontage' | 'edit'>('generate');

  // Generation State
  const [selectedCategories, setSelectedCategories] = useState<Set<MockupType>>(() => new Set([MOCKUP_CATEGORIES[0].id]));
  const [selectedQuantity, setSelectedQuantity] = useState<MockupQuantity>(MOCKUP_CATEGORIES[0].allowedQuantities[0]);
  const [options, setOptions] = useState<MockupOptions>({
    ethnicity: ETHNICITIES[0],
    physicalTrait: PHYSICAL_TRAITS[0],
    gender: GENDERS[0],
    style: STYLES[0],
    location: LOCATIONS[0],
    environment: ENVIRONMENTS[0],
    city: '',
    quantity: MOCKUP_CATEGORIES[0].allowedQuantities[0]
  });
  const [genChat, setGenChat] = useState<ChatMessage[]>([]);
  const [genInput, setGenInput] = useState<string>('');

  // Editing/IA Montage State
  const [uploadedDesign, setUploadedDesign] = useState<string | null>(null);
  const [editingMockup, setEditingMockup] = useState<GeneratedImage | null>(null);
  const [designSize, setDesignSize] = useState<number>(40);
  const [resolution, setResolution] = useState<Resolution>('HD');
  const [editChat, setEditChat] = useState<ChatMessage[]>([]);
  const [editInput, setEditInput] = useState<string>('');

  // Manual Montage Tab State
  const [manualMontageBase, setManualMontageBase] = useState<string | null>(null);
  const [manualMontageDesign, setManualMontageDesign] = useState<string | null>(null);
  const [manualMontageDesignX, setManualMontageDesignX] = useState<number>(50);
  const [manualMontageDesignY, setManualMontageDesignY] = useState<number>(50);
  const [manualMontageDesignScale, setManualMontageDesignScale] = useState<number>(35);
  const [manualMontageDesignRotation, setManualMontageDesignRotation] = useState<number>(0);
  const [manualMontageDesignOpacity, setManualMontageDesignOpacity] = useState<number>(100);
  const [manualMontageDesignPerspectiveX, setManualMontageDesignPerspectiveX] = useState<number>(0);
  const [manualMontageDesignPerspectiveY, setManualMontageDesignPerspectiveY] = useState<number>(0);
  const [manualMontageChat, setManualMontageChat] = useState<ChatMessage[]>([]);
  const [manualMontageInput, setManualMontageInput] = useState<string>('');
  const [showBaseGalleryPicker, setShowBaseGalleryPicker] = useState<boolean>(false);

  // Gallery & Selection
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);
  const [selectedInGallery, setSelectedInGallery] = useState<Set<string>>(() => new Set<string>());

  // Shared State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Zoom Logic
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [activePreviewImage, setActivePreviewImage] = useState<string | null>(null);

  const designInputRef = useRef<HTMLInputElement>(null);
  const manualMontageBaseInputRef = useRef<HTMLInputElement>(null);
  const manualMontageDesignInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const manualMontagePreviewRef = useRef<ManualMontagePreviewHandles>(null);

  useEffect(() => {
    storageService.getGallery().then(data => {
      setGallery(data);
    }).catch(err => {
      console.error("Error cargando galería:", err);
      setError("No se pudo cargar la galería local.");
    });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [genChat, editChat, manualMontageChat]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'design' | 'manualMontageBase' | 'manualMontageDesign') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'design') setUploadedDesign(reader.result as string);
        else if (type === 'manualMontageBase') setManualMontageBase(reader.result as string);
        else if (type === 'manualMontageDesign') {
          setManualMontageDesign(reader.result as string);
          setManualMontageDesignScale(35);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const formatErrorMessage = (err: any) => {
    const msg = err.message || "";
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
      return "Límite de cuota excedido (Error 429). Por favor, espera un minuto o revisa tu plan en Google AI Studio (ai.google.dev).";
    }
    if (msg.includes('PERMISSION_DENIED')) {
      return "Error de Permiso (403). Tu clave API podría ser inválida o carecer de permisos. Verifica tu configuración en Google AI Studio (ai.google.dev).";
    }
    return msg || "Ocurrió un error inesperado. Inténtalo de nuevo.";
  };

  const handleGenerate = async () => {
    if (selectedCategories.size === 0) {
      setError("Por favor, selecciona al menos una categoría de producto.");
      return;
    }

    const firstSelectedCategory = MOCKUP_CATEGORIES.find(cat => selectedCategories.has(cat.id));
    if (!firstSelectedCategory) return;

    setIsProcessing(true);
    setError(null);
    try {
      const url = await geminiService.generateBaseMockup(firstSelectedCategory.title, { ...options, quantity: selectedQuantity }, genChat, resolution);
      const newImg: GeneratedImage = {
        id: Math.random().toString(36).substr(2, 9),
        url,
        type: firstSelectedCategory.id,
        prompt: `Base mockup for ${firstSelectedCategory.title}`,
        timestamp: Date.now(),
        options: { ...options, quantity: selectedQuantity }
      };
      setHistory(prev => [newImg, ...prev]);
      setEditingMockup(newImg);
      setActivePreviewImage(url);
    } catch (err: any) {
      setError(formatErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveBaseToGallery = async () => {
    if (history.length > 0) {
      const imgToSave = history[0];
      try {
        await storageService.saveImage(imgToSave);
        setGallery(prev => [imgToSave, ...prev]);
        alert("Mockup Base guardado en Galería.");
      } catch (err) {
        console.error(err);
        setError("Error al guardar en la base de datos local.");
      }
    }
  };

  const handleDownloadBase = () => {
    if (history.length > 0) {
      const link = document.createElement('a');
      link.href = history[0].url;
      link.download = `mockup-base-${Date.now()}.png`;
      link.click();
    }
  };

  const handlePreview = async () => {
    const source = editingMockup?.url;
    if (!source || !uploadedDesign) {
      setError("Necesitas una imagen base y un diseño subido.");
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const url = await geminiService.applyAndResizeDesign(source, uploadedDesign, designSize, resolution, editChat);
      if (editingMockup) {
        setEditingMockup({ ...editingMockup, url, isEdited: true });
        setActivePreviewImage(url);
      }
    } catch (err: any) {
      setError(formatErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToGallery = async (type: 'edit' | 'manualMontage') => {
    let imageToSave: GeneratedImage | null = null;
    if (type === 'edit' && editingMockup) {
      imageToSave = editingMockup;
    } else if (type === 'manualMontage' && manualMontageBase && manualMontageDesign) {
      setIsProcessing(true);
      setError(null);
      try {
        const compositeUrl = await manualMontagePreviewRef.current?.getCompositeImage();
        if (compositeUrl) {
          imageToSave = {
            id: 'manual-' + Date.now(),
            url: compositeUrl,
            type: MockupType.IMPORTED,
            prompt: 'Montaje Manual Personalizado',
            timestamp: Date.now(),
            isEdited: true
          };
        }
      } catch (err: any) {
        setError(formatErrorMessage(err));
      } finally {
        setIsProcessing(false);
      }
    }

    if (imageToSave) {
      try {
        await storageService.saveImage(imageToSave);
        setGallery(prev => [imageToSave!, ...prev]);
        alert("Guardado en Galería con éxito.");
      } catch (err) {
        console.error(err);
        setError("Error al guardar en el disco local.");
      }
    }
  };

  const handleDeleteImage = async (id: string) => {
    try {
      await storageService.deleteImage(id);
      setGallery(prev => prev.filter(g => g.id !== id));
      const newSelection = new Set(selectedInGallery);
      newSelection.delete(id);
      setSelectedInGallery(newSelection);
    } catch (err) {
      console.error(err);
      setError("Error al borrar la imagen.");
    }
  };

  const handleBatchDelete = async () => {
    if (selectedInGallery.size === 0) return;
    if (!confirm(`¿Estás seguro de que deseas eliminar ${selectedInGallery.size} imágenes?`)) return;
    
    try {
      for (const id of selectedInGallery) {
        await storageService.deleteImage(id);
      }
      setGallery(prev => prev.filter(g => !selectedInGallery.has(g.id)));
      setSelectedInGallery(new Set());
    } catch (err) {
      console.error(err);
      setError("Error en el borrado masivo.");
    }
  };

  const handleDownloadManualMontage = async () => {
    if (!manualMontageBase || !manualMontageDesign) return;
    setIsProcessing(true);
    try {
      const compositeUrl = await manualMontagePreviewRef.current?.getCompositeImage();
      if (compositeUrl) {
        const link = document.createElement('a');
        link.href = compositeUrl;
        link.download = `mockup-manual-${Date.now()}.png`;
        link.click();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchDownload = () => {
    const toDownload = gallery.filter(img => selectedInGallery.has(img.id));
    toDownload.forEach((img, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = img.url;
        link.download = `mockup-${img.id}.png`;
        link.click();
      }, index * 300);
    });
  };

  const toggleGallerySelection = (id: string, url: string) => {
    setActivePreviewImage(url);
    const newSelection = new Set(selectedInGallery);
    if (newSelection.has(id)) newSelection.delete(id);
    else newSelection.add(id);
    setSelectedInGallery(newSelection);
  };

  const handleChat = (e: React.FormEvent, type: 'gen' | 'edit' | 'manualMontage') => {
    e.preventDefault();
    let val = type === 'gen' ? genInput : type === 'edit' ? editInput : manualMontageInput;
    if (!val.trim()) return;

    const newMsg: ChatMessage = { role: 'user', content: val };
    if (type === 'gen') {
      setGenChat([...genChat, newMsg]);
      setGenInput('');
    } else if (type === 'edit') {
      setEditChat([...editChat, newMsg]);
      setEditInput('');
    } else {
      setManualMontageChat([...manualMontageChat, newMsg]);
      setManualMontageInput('');
    }
  };

  const toggleCategorySelection = (categoryId: MockupType) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) newSet.delete(categoryId);
      else newSet.add(categoryId);
      return newSet;
    });
  };

  const getCurrentDisplayImage = () => {
    if (activeTab === 'manualMontage') return null;
    if (activePreviewImage) return activePreviewImage;
    if (activeTab === 'gallery' && gallery.length > 0) return gallery[0].url;
    if (activeTab === 'generate' && history.length > 0) return history[0].url;
    if (activeTab === 'edit' && editingMockup) return editingMockup.url;
    return null;
  };

  return (
    <div className="min-h-screen bg-[#080808] text-gray-200">
      <nav className="fixed top-0 w-full h-16 bg-[#1a1a1a]/40 backdrop-blur-2xl border-b border-white/5 z-50 flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-600 rounded-xl flex items-center justify-center font-black text-white shadow-xl shadow-orange-900/40">MP</div>
          <h1 className="text-xl font-black tracking-tighter text-white">MOCKUPS-<span className="text-orange-500">PROSTUDIO</span></h1>
        </div>
        <div className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-gray-500 border border-white/5 px-4 py-2 rounded-full bg-white/5">
          Etsy Professional Lab 2025
        </div>
      </nav>

      <div className="pt-24 max-w-7xl mx-auto px-4 pb-20">
        <div className="flex flex-wrap justify-center bg-[#111] p-1.5 rounded-2xl w-fit mx-auto mb-10 border border-white/5 shadow-2xl gap-1">
          {[
            { id: 'generate', label: 'GENERAR MOCKUPS', color: 'orange' },
            { id: 'gallery', label: 'GALERIA MOCKUPS', color: 'green' },
            { id: 'manualMontage', label: 'MONTAJE MANUAL', color: 'pink' },
            { id: 'edit', label: 'MONTAJE IA', color: 'blue' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setZoomLevel(1); }}
              className={`px-6 py-3 rounded-xl font-black text-[10px] transition-all tracking-widest uppercase active:scale-95 ${activeTab === tab.id ? `bg-[#222] text-${tab.color}-500 shadow-xl border border-white/5` : 'text-gray-500 hover:text-gray-300'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 space-y-6">

            {activeTab === 'generate' && (
              <div className="bg-[#111] p-6 rounded-[2rem] border border-white/5 space-y-6 shadow-2xl">
                <div>
                  <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-4 block">1. Categoría de Producto</label>
                  <div className="grid grid-cols-3 gap-2">
                    {MOCKUP_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => toggleCategorySelection(cat.id)}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all active:scale-95 ${selectedCategories.has(cat.id) ? 'bg-orange-600/10 border-orange-500 text-orange-500' : 'bg-white/5 border-transparent text-gray-500'}`}
                      >
                        <span className="text-xl">{cat.icon}</span>
                        <span className="text-[10px] font-bold">{cat.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  {/* CAMBIO: Label actualizado a TIPOLOGÍA */}
                  <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-3 block">2. TIPOLOGÍA</label>
                  <div className="flex flex-wrap gap-2">
                    {MOCKUP_CATEGORIES.find(cat => selectedCategories.has(cat.id))?.allowedQuantities.map(q => (
                      <button
                        key={q}
                        onClick={() => setSelectedQuantity(q)}
                        className={`px-4 py-2 rounded-lg border text-[10px] font-black transition-all uppercase active:scale-95 ${selectedQuantity === q ? 'bg-orange-500 text-white border-orange-500' : 'bg-white/5 border-white/10 text-gray-400'}`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Select label="Etnia" options={ETHNICITIES} value={options.ethnicity} onChange={v => setOptions({...options, ethnicity: v})} />
                  <Select label="Físico" options={PHYSICAL_TRAITS} value={options.physicalTrait} onChange={v => setOptions({...options, physicalTrait: v})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Select label="Género" options={GENDERS} value={options.gender} onChange={v => setOptions({...options, gender: v as Gender})} />
                  <Select label="Estilo" options={STYLES} value={options.style} onChange={v => setOptions({...options, style: v})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Select label="Entorno" options={ENVIRONMENTS} value={options.environment} onChange={v => setOptions({...options, environment: v})} />
                  <Select label="Locación" options={LOCATIONS} value={options.location} onChange={v => setOptions({...options, location: v})} />
                </div>

                <ChatSection
                  history={genChat}
                  input={genInput}
                  setInput={setGenInput}
                  onSend={(e) => handleChat(e, 'gen')}
                  color="orange"
                  chatEndRef={chatEndRef}
                />

                <div className="space-y-3">
                  <Button
                    onClick={handleGenerate}
                    isLoading={isProcessing}
                    className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl shadow-xl uppercase tracking-widest font-black"
                  >
                    GENERAR MODELOS BASE
                  </Button>
                  {history.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={handleSaveBaseToGallery}
                        className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-xl uppercase tracking-widest font-black text-[10px]"
                      >
                        GUARDAR EN GALERÍA ✅
                      </Button>
                      <Button
                        onClick={handleDownloadBase}
                        className="w-full h-12 bg-white/10 hover:bg-white/20 text-white rounded-2xl shadow-xl uppercase tracking-widest font-black text-[10px] border border-white/10"
                      >
                        DESCARGAR RESULTADO 📥
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'gallery' && (
              <div className="bg-[#111] p-6 rounded-[2rem] border border-white/5 space-y-6 shadow-2xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-widest text-green-500">Mi Colección</h3>
                  <span className="text-[9px] font-bold text-gray-500">{gallery.length} Archivos</span>
                </div>

                {gallery.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={handleBatchDownload}
                      disabled={selectedInGallery.size === 0}
                      className="w-full h-12 bg-green-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg"
                    >
                      DESCARGAR ({selectedInGallery.size})
                    </Button>
                    {/* CAMBIO: Botón Borrar ahora es Rosa */}
                    <Button
                      onClick={handleBatchDelete}
                      disabled={selectedInGallery.size === 0}
                      className="w-full h-12 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg"
                    >
                      BORRAR ({selectedInGallery.size})
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
                  {gallery.map(img => (
                    <div
                      key={img.id}
                      onClick={() => toggleGallerySelection(img.id, img.url)}
                      className={`group relative aspect-square bg-black/40 rounded-xl overflow-hidden border-2 cursor-pointer transition-all active:scale-95 ${selectedInGallery.has(img.id) ? 'border-green-500 ring-2 ring-green-500/20 scale-95' : 'border-white/5 hover:border-white/20'}`}
                    >
                      <img src={img.url} className="w-full h-full object-cover" alt="Gallery" />
                      {selectedInGallery.has(img.id) && (
                        <div className="absolute top-2 right-2 bg-green-500 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white shadow-lg">✓</div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-2 gap-1 transition-opacity">
                         <span className="text-[8px] font-black text-white uppercase tracking-widest">Ver Mockup</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'manualMontage' && (
              <div className="bg-[#111] p-6 rounded-[2rem] border border-white/5 space-y-6 shadow-2xl">
                <h3 className="text-xs font-black uppercase tracking-widest text-pink-500">MONTAJE MANUAL</h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Mockup Base</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => manualMontageBaseInputRef.current?.click()}
                        className="bg-white/5 border border-white/10 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
                      >
                        📂 Importar
                      </button>
                      <button 
                        onClick={() => setShowBaseGalleryPicker(!showBaseGalleryPicker)}
                        className={`bg-white/5 border border-white/10 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95 ${showBaseGalleryPicker ? 'border-pink-500 text-pink-500' : ''}`}
                      >
                        🖼️ Galería
                      </button>
                    </div>
                  </div>
                  <input type="file" ref={manualMontageBaseInputRef} onChange={e => handleFileChange(e, 'manualMontageBase')} className="hidden" />

                  {showBaseGalleryPicker && (
                    <div className="bg-black/40 border border-white/10 rounded-xl p-3 grid grid-cols-4 gap-2 max-h-40 overflow-y-auto scrollbar-hide">
                      {gallery.map(img => (
                        <img 
                          key={img.id} src={img.url} 
                          onClick={() => { setManualMontageBase(img.url); setShowBaseGalleryPicker(false); }}
                          className="aspect-square object-cover rounded cursor-pointer hover:ring-2 hover:ring-pink-500 transition-all active:scale-90"
                        />
                      ))}
                    </div>
                  )}

                  <UploadBox image={manualMontageDesign} onClick={() => manualMontageDesignInputRef.current?.click()} label="Carga Diseño (PNG)" icon="🖌️" />
                  <input type="file" ref={manualMontageDesignInputRef} onChange={e => handleFileChange(e, 'manualMontageDesign')} className="hidden" />

                  <div className="flex flex-col gap-1.5">
                    <SliderControl label="Mover X" min={0} max={100} step={0.1} value={manualMontageDesignX} onChange={setManualMontageDesignX} color="pink" unit="%" />
                    <SliderControl label="Mover Y" min={0} max={100} step={0.1} value={manualMontageDesignY} onChange={setManualMontageDesignY} color="pink" unit="%" />
                    <SliderControl label="Escala" min={1} max={100} step={0.1} value={manualMontageDesignScale} onChange={setManualMontageDesignScale} color="pink" unit="%" />
                    <SliderControl label="Rotación" min={-180} max={180} step={0.5} value={manualMontageDesignRotation} onChange={setManualMontageDesignRotation} color="pink" unit="°" />
                    <SliderControl label="Perspectiva X" min={-45} max={45} step={0.1} value={manualMontageDesignPerspectiveX} onChange={setManualMontageDesignPerspectiveX} color="pink" unit="°" />
                    <SliderControl label="Perspectiva Y" min={-45} max={45} step={0.1} value={manualMontageDesignPerspectiveY} onChange={setManualMontageDesignPerspectiveY} color="pink" unit="°" />
                    <SliderControl label="Transparencia" min={0} max={100} step={1} value={manualMontageDesignOpacity} onChange={setManualMontageDesignOpacity} color="pink" unit="%" />
                  </div>

                  <ChatSection
                    history={manualMontageChat}
                    input={manualMontageInput}
                    setInput={setManualMontageInput}
                    onSend={(e) => handleChat(e, 'manualMontage')}
                    color="pink"
                    chatEndRef={chatEndRef}
                  />

                  <div className="space-y-3 pt-4">
                    <Button
                      onClick={() => handleSaveToGallery('manualMontage')}
                      disabled={!manualMontageBase || !manualMontageDesign}
                      className="w-full h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-xl font-black uppercase tracking-widest"
                    >
                      GUARDAR EN GALERÍA ✅
                    </Button>
                    <Button
                      onClick={handleDownloadManualMontage}
                      disabled={!manualMontageBase || !manualMontageDesign}
                      variant="orangeOutline"
                      className="w-full h-14 font-black uppercase tracking-widest"
                    >
                      DESCARGAR RESULTADO
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'edit' && (
              <div className="bg-[#111] p-6 rounded-[2rem] border border-white/5 space-y-6 shadow-2xl">
                <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">MONTAJE IA</h3>
                <UploadBox image={uploadedDesign} onClick={() => designInputRef.current?.click()} label="Diseño PNG (Transparente)" icon="🖼️" />
                <input type="file" ref={designInputRef} onChange={e => handleFileChange(e, 'design')} className="hidden" />

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <label>Tamaño Diseño</label>
                    <span className="text-blue-400 font-mono">{designSize}%</span>
                  </div>
                  <input type="range" min="5" max="95" step={1} value={designSize} onChange={e => setDesignSize(parseInt(e.target.value))} className="w-full accent-blue-500" />
                </div>

                <ChatSection
                  history={editChat}
                  input={editInput}
                  setInput={setEditInput}
                  onSend={(e) => handleChat(e, 'edit')}
                  color="blue"
                  chatEndRef={chatEndRef}
                />

                <div className="space-y-3 pt-4">
                  <Button
                    onClick={handlePreview}
                    isLoading={isProcessing}
                    className="w-full h-14 bg-blue-600 text-white rounded-2xl shadow-xl font-black uppercase tracking-widest"
                  >
                    VISTA PREVIA
                  </Button>
                  <Button
                    onClick={() => handleSaveToGallery('edit')}
                    disabled={!editingMockup}
                    className="w-full h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-xl font-black uppercase tracking-widest"
                  >
                    GUARDAR EN GALERÍA ✅
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl animate-bounce">
                ⚠️ {error}
              </div>
            )}
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="bg-[#111] rounded-[3rem] border border-white/5 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.7)] min-h-[650px] flex flex-col relative">
              <div className="bg-black/40 p-4 border-b border-white/5 flex flex-col gap-4 px-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1 ${isProcessing ? 'bg-orange-500 animate-ping' : 'bg-green-500'}`}></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Engine V3</span>
                  </div>
                  <div className="flex gap-2">
                    {RESOLUTIONS.map(res => (
                      <button
                        key={res}
                        onClick={() => setResolution(res)}
                        className={`px-4 py-1.5 rounded-full text-[9px] font-black border transition-all active:scale-95 ${resolution === res ? 'bg-white text-black border-white shadow-lg' : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/10'}`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Zoom Control Section below Resolution */}
                <div className="flex items-center gap-4 border-t border-white/5 pt-3">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Zoom Preview</label>
                  <input 
                    type="range" min="1" max="4" step="0.01" 
                    value={zoomLevel} 
                    onChange={e => setZoomLevel(parseFloat(e.target.value))}
                    className="flex-1 h-1 bg-white/5 accent-orange-500 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-[9px] font-black text-orange-500 min-w-[30px]">{zoomLevel.toFixed(1)}x</span>
                  <button onClick={() => setZoomLevel(1)} className="text-[8px] font-black uppercase text-gray-500 hover:text-white transition-colors active:scale-95">Reset</button>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center p-8 bg-black/20 relative group overflow-hidden">
                {isProcessing && activeTab !== 'manualMontage' ? (
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 border-4 border-orange-500/10 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500 animate-pulse">Procesando 8K...</p>
                  </div>
                ) : activeTab === 'manualMontage' ? (
                  <div className="w-full h-full" style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease-out', transformOrigin: 'center center' }}>
                    <ManualMontagePreview
                      ref={manualMontagePreviewRef}
                      baseImage={manualMontageBase}
                      designImage={manualMontageDesign}
                      designX={manualMontageDesignX}
                      designY={manualMontageDesignY}
                      designScale={manualMontageDesignScale}
                      designRotation={manualMontageDesignRotation}
                      designOpacity={manualMontageDesignOpacity}
                      designPerspectiveX={manualMontageDesignPerspectiveX}
                      designPerspectiveY={manualMontageDesignPerspectiveY}
                      onUpdateX={setManualMontageDesignX}
                      onUpdateY={setManualMontageDesignY}
                      onUpdateScale={setManualMontageDesignScale}
                    />
                  </div>
                ) : getCurrentDisplayImage() ? (
                  <div 
                    className="w-full h-full flex items-center justify-center overflow-auto scrollbar-hide"
                  >
                    <img
                      src={getCurrentDisplayImage()!}
                      className="max-w-full max-h-full rounded-[2rem] shadow-2xl border border-white/5 object-contain transition-transform duration-200 ease-out"
                      style={{ transform: `scale(${zoomLevel})` }}
                      alt="Mockup"
                    />
                  </div>
                ) : (
                  <div className="text-center space-y-8 opacity-5">
                    <span className="text-[200px] block leading-none select-none">📷</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
