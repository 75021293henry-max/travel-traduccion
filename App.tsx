
import React, { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  Send, 
  Image as ImageIcon, 
  Settings, 
  CheckCircle2, 
  Copy, 
  Loader2,
  Trash2,
  Zap,
  Sparkles,
  Paperclip,
  FileText,
  File as FileIcon,
  X
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sendMessageToGemini } from './services/geminiService';
import { SYSTEM_PROMPT } from './constants';
import { Message } from './types';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ data: string, mimeType: string, fileName: string } | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFile({
          data: reader.result as string,
          mimeType: file.type || 'application/octet-stream',
          fileName: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1 || items[i].type.indexOf('pdf') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          const reader = new FileReader();
          reader.onloadend = () => {
            setSelectedFile({
              data: reader.result as string,
              mimeType: file.type,
              fileName: file.name || 'pasted-content'
            });
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() && !selectedFile) return;

    const userMessage: Message = {
      role: 'user',
      text: inputText,
      attachment: selectedFile || undefined
    };

    const currentInputText = inputText;
    const currentAttachment = selectedFile;

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setSelectedFile(null);
    setIsTyping(true);

    try {
      const response = await sendMessageToGemini(
        currentInputText, 
        currentAttachment ? { data: currentAttachment.data, mimeType: currentAttachment.mimeType } : undefined, 
        messages.map(m => ({ 
          role: m.role, 
          text: m.text, 
          attachment: m.attachment ? { data: m.attachment.data, mimeType: m.attachment.mimeType } : undefined 
        }))
      );
      setMessages(prev => [...prev, { role: 'model', text: response || '' }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: '### ⚠️ Error Crítico\nNo se pudo procesar el material. Asegúrate de que el archivo sea un formato válido y la API Key esté configurada.' 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const renderAttachment = (attachment: { data: string, mimeType: string, fileName: string }, isModel: boolean = false) => {
    const isImage = attachment.mimeType.startsWith('image/');
    
    if (isImage) {
      return (
        <div className={`${isModel ? 'p-2' : 'mb-4'} rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-100`}>
          <img src={attachment.data} alt="Attached" className="w-full max-h-[400px] object-contain" />
        </div>
      );
    }

    return (
      <div className={`mb-4 flex items-center gap-3 p-3 rounded-xl border ${isModel ? 'bg-slate-50 border-slate-200' : 'bg-white/10 border-white/20 text-white'}`}>
        <div className={`p-2 rounded-lg ${isModel ? 'bg-blue-100 text-blue-600' : 'bg-white text-blue-600'}`}>
          <FileText className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate">{attachment.fileName}</p>
          <p className="text-[9px] uppercase tracking-tighter opacity-70">Document Analysis Ready</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[#F9FAFB] max-w-5xl mx-auto shadow-2xl overflow-hidden md:border-x border-slate-200">
      {/* Executive Header */}
      <header className="bg-white text-slate-900 px-6 py-4 flex justify-between items-center z-30 shadow-sm border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-xl">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
              TRAVELLER <span className="text-blue-600">PRO</span>
            </h1>
            <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-bold">Elite A1 Learning System</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setMessages([])} 
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            title="Limpiar Conversación"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg text-xs font-black text-slate-600 hover:bg-slate-200 transition-all"
          >
            <Settings className="w-3.5 h-3.5" /> 
            <span className="hidden sm:inline">CONFIG</span>
          </button>
        </div>
      </header>

      {/* Main Study Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 relative bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none"></div>
        
        {showConfig ? (
          <div className="relative z-10 bg-white rounded-3xl p-8 border border-slate-200 shadow-xl max-w-xl mx-auto mt-10">
             <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
               <Settings className="text-blue-600 w-6 h-6" /> Arquitectura del Tutor
             </h2>
             <div className="space-y-6 text-sm">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="font-bold text-slate-700 mb-2">Protocolo de Limpieza</p>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Este tutor está programado para generar tablas Markdown automáticas al detectar ejercicios o correcciones, asegurando que cada respuesta sea visualmente impecable.
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">System Instruction (Claude-Style)</label>
                  <div className="bg-slate-900 text-slate-300 p-4 rounded-xl text-[10px] font-mono leading-relaxed max-h-40 overflow-y-auto">
                    {SYSTEM_PROMPT}
                  </div>
                </div>
                <button 
                  onClick={() => setShowConfig(false)}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-blue-700 transition-all shadow-lg"
                >
                  Continuar Estudio
                </button>
             </div>
          </div>
        ) : (
          <>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-20 animate-in fade-in duration-700">
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner">
                  <BookOpen className="w-16 h-16 text-blue-600 opacity-80" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-900">Bienvenido al Nivel Élite</h2>
                  <p className="text-slate-500 font-medium text-sm max-w-xs mx-auto">
                    Adjunta una página de <strong>Traveller A1</strong> o un PDF. Resolveré todo con el máximo orden y limpieza.
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-400`}>
                <div className={`relative max-w-[92%] md:max-w-[85%] rounded-[1.5rem] shadow-sm border transition-all ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none p-4 px-6' 
                    : 'bg-white border-slate-200 text-slate-800 rounded-tl-none overflow-hidden ring-1 ring-slate-100'
                }`}>
                  {msg.attachment && renderAttachment(msg.attachment, msg.role === 'model')}
                  
                  <div className={`${msg.role === 'model' ? 'p-6 md:p-8' : ''} prose prose-slate max-w-none text-sm leading-relaxed`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                  
                  {msg.role === 'model' && (
                    <button 
                      onClick={() => copyToClipboard(msg.text, `msg-${idx}`)}
                      className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-blue-600 transition-colors"
                    >
                      {copied === `msg-${idx}` ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-3">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generando Análisis Limpio...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </main>

      {/* Input Console */}
      {!showConfig && (
        <div className="p-4 md:p-6 bg-white border-t border-slate-100 z-30 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.05)]">
          <div className="max-w-4xl mx-auto">
            {selectedFile && (
              <div className="mb-4 flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 animate-in slide-in-from-bottom-2">
                <div className="flex items-center gap-3">
                  {selectedFile.mimeType.startsWith('image/') ? <ImageIcon className="w-5 h-5 text-blue-600" /> : <FileText className="w-5 h-5 text-blue-600" />}
                  <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{selectedFile.fileName}</span>
                </div>
                <button onClick={() => setSelectedFile(null)} className="p-1 text-slate-400 hover:text-red-600"><X className="w-4 h-4" /></button>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center bg-[#F3F4F6] rounded-2xl border border-transparent focus-within:bg-white focus-within:border-blue-200 focus-within:ring-4 focus-within:ring-blue-50 transition-all p-1">
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => { if(fileInputRef.current) { fileInputRef.current.accept = "image/*"; fileInputRef.current.click(); } }}
                    className="p-3 text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => { if(fileInputRef.current) { fileInputRef.current.accept = ".pdf,.doc,.docx,.txt"; fileInputRef.current.click(); } }}
                    className="p-3 text-slate-400 hover:text-blue-600 transition-colors border-l border-slate-200"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                </div>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onPaste={handlePaste}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Material Traveller A1: Imagen o Archivo..."
                  className="flex-1 bg-transparent border-none py-3 px-2 focus:ring-0 text-sm font-medium placeholder-slate-400 resize-none max-h-32 min-h-[44px]"
                  rows={1}
                />
              </div>

              <button 
                onClick={handleSend}
                disabled={isTyping || (!inputText.trim() && !selectedFile)}
                className={`p-3.5 rounded-2xl transition-all shadow-md ${
                  isTyping || (!inputText.trim() && !selectedFile)
                    ? 'bg-slate-100 text-slate-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200 active:scale-95'
                }`}
              >
                {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
            
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          </div>
        </div>
      )}
    </div>
  );
}
