
import React, { useState, useRef } from 'react';
import { Upload, Camera, Loader2, AlertTriangle, CheckCircle, AlertCircle, LayoutGrid } from 'lucide-react';
import { analyzeSolarImage } from '../services/geminiService';
import { IdentifiedFault, ESP32Device } from '../types';

interface FaultDetectorProps {
  devices?: ESP32Device[];
}

const FaultDetector: React.FC<FaultDetectorProps> = ({ devices = [] }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [faults, setFaults] = useState<IdentifiedFault[] | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'select'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setFaults(null); // Reset previous results
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;

    setIsAnalyzing(true);
    // Extract base64 data part
    const base64Data = image.split(',')[1];
    const mimeType = image.split(';')[0].split(':')[1];

    try {
      const results = await analyzeSolarImage(base64Data, mimeType);
      setFaults(results);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-800">AI Fault Detection</h2>
        <p className="text-slate-500">Upload a photo of your solar panel to detect micro-cracks, hotspots, and more.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100">
          <button 
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'upload' ? 'bg-slate-50 text-primary-600 border-b-2 border-primary-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
          >
            Open Analysis
          </button>
          <button 
            onClick={() => setActiveTab('select')}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'select' ? 'bg-slate-50 text-primary-600 border-b-2 border-primary-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
          >
            Select Picture of Specific Panel
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'select' ? (
             <div className="py-12 text-center animate-fade-in">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <LayoutGrid size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-2">Select from Infrastructure</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-8">Choose a connected device to pull the latest camera feed for analysis.</p>
                
                {/* Device Grid */}
                {devices.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
                    {devices.map(d => (
                      <button 
                        key={d.id} 
                        onClick={() => setActiveTab('upload')} // Placeholder action
                        className="p-4 rounded-xl border border-slate-200 hover:border-primary-500 hover:bg-primary-50 transition-all group bg-white"
                      >
                         <div className="flex items-center justify-between mb-1">
                           <span className="font-bold text-slate-700 group-hover:text-primary-700">{d.name}</span>
                           <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${d.status === 'Online' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{d.status}</span>
                         </div>
                         <div className="text-xs text-slate-400 group-hover:text-primary-500">{d.panels?.length || 0} Panels • {d.location}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm italic">No devices connected.</p>
                )}
             </div>
          ) : (
            /* Upload Area */
            !image ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-2xl h-80 flex flex-col items-center justify-center bg-slate-50 hover:bg-primary-50 hover:border-primary-300 transition-all cursor-pointer group animate-fade-in"
              >
                <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Camera className="w-10 h-10 text-slate-400 group-hover:text-primary-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700">Click to upload or take photo</h3>
                <p className="text-slate-400 text-sm mt-1">Supports JPG, PNG</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                {/* Image Preview */}
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden h-80 bg-black shadow-lg">
                    <img src={image} alt="Preview" className="w-full h-full object-contain" />
                    <button 
                      onClick={() => setImage(null)}
                      className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                    >
                      <AlertCircle size={20} className="rotate-45" /> {/* Using Icon as close button */}
                    </button>
                  </div>
                  
                  {!isAnalyzing && !faults && (
                    <button 
                      onClick={handleAnalyze}
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-primary-200 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Upload size={20} />
                      Analyze Image
                    </button>
                  )}
                  
                  {isAnalyzing && (
                    <div className="w-full bg-slate-100 text-slate-500 font-medium py-3 px-6 rounded-xl flex items-center justify-center gap-2 cursor-wait">
                      <Loader2 size={20} className="animate-spin text-primary-500" />
                      Processing Image...
                    </div>
                  )}
                </div>

                {/* Results Area */}
                <div className="space-y-4">
                  {!faults && !isAnalyzing && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-slate-100 rounded-2xl bg-slate-50">
                      <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                        <AlertTriangle className="text-slate-300" size={32} />
                      </div>
                      <h4 className="text-lg font-semibold text-slate-700">Ready to Analyze</h4>
                      <p className="text-slate-400 text-sm mt-2">
                        Gemini Vision AI will scan for:<br/>
                        Micro-cracks, Hotspots, Soiling, Shading
                      </p>
                    </div>
                  )}

                  {faults && (
                    <div className="h-full overflow-y-auto pr-2 space-y-3 max-h-[500px]">
                      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        Analysis Results
                        <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                          {faults.length} issues found
                        </span>
                      </h3>
                      
                      {faults.length === 0 && (
                        <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-start gap-3">
                          <CheckCircle className="text-green-600 mt-1" />
                          <div>
                            <h4 className="font-bold text-green-800">No Faults Detected</h4>
                            <p className="text-sm text-green-700">The panel appears to be in good condition.</p>
                          </div>
                        </div>
                      )}

                      {faults.map((fault, index) => (
                        <div key={index} className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-bold text-slate-800 capitalize">{fault.type.replace('-', ' ')}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-bold text-slate-400">Confidence:</span>
                                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary-500 rounded-full" 
                                    style={{width: `${fault.confidence}%`}}
                                  ></div>
                                </div>
                                <span className="text-xs font-bold text-slate-600">{fault.confidence}%</span>
                              </div>
                            </div>
                            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getSeverityColor(fault.severity)}`}>
                              {fault.severity}
                            </span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-lg mt-3">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Recommendation</p>
                            <p className="text-sm text-slate-700 leading-relaxed">{fault.recommendation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default FaultDetector;
