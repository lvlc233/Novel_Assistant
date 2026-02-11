import React, { useState } from 'react';
import { X, Upload, Save } from 'lucide-react';
import { Work } from '@/types/work';

interface EditWorkModalProps {
  work: Work;
  onClose: () => void;
  onSave: (updatedWork: Work) => void;
}

const EditWorkModal: React.FC<EditWorkModalProps> = ({ work, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: work.title,
    status: work.status,
    cover: work.cover
  });

  const handleSave = () => {
    onSave({
      ...work,
      ...formData,
      status: formData.status as '连载中' | '完结' | '断更',
      updatedAt: new Date().toISOString()
    });
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // For demo, we create a local object URL
      const url = URL.createObjectURL(e.target.files[0]);
      setFormData({ ...formData, cover: url });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-[500px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-14 border-b border-gray-100 flex items-center justify-between px-6 bg-gray-50">
          <span className="font-serif text-lg text-gray-800">编辑作品</span>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 flex gap-8">
          {/* Cover Section */}
          <div className="w-1/3 flex flex-col gap-3">
             <div className="
                w-full aspect-[2/3] rounded-lg border-2 border-dashed border-gray-300 
                flex flex-col items-center justify-center cursor-pointer 
                hover:border-yellow-400 hover:bg-yellow-50 transition-all relative overflow-hidden group
             ">
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleFileChange} />
                {formData.cover ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={formData.cover} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <Upload className="w-6 h-6 mb-2" />
                    <span className="text-xs">更换封面</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs z-0 pointer-events-none">
                  点击更换
                </div>
             </div>
          </div>

          {/* Form Section */}
          <div className="flex-1 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
               <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">作品名</label>
               <input 
                 type="text" 
                 value={formData.title} 
                 onChange={(e) => setFormData({...formData, title: e.target.value})}
                 className="w-full border-b border-gray-300 py-2 font-serif text-xl text-gray-800 focus:border-yellow-500 outline-none bg-transparent"
               />
            </div>

            <div className="flex flex-col gap-2">
               <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">状态</label>
               <div className="flex gap-2">
                  {['连载中', '完结', '断更'].map(status => (
                    <button
                      key={status}
                      onClick={() => setFormData({...formData, status: status as '连载中' | '完结' | '断更'})}
                      className={`
                        px-3 py-1.5 rounded-full text-xs transition-colors border
                        ${formData.status === status 
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-200 font-medium' 
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}
                      `}
                    >
                      {status}
                    </button>
                  ))}
               </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex justify-end">
          <button 
            onClick={handleSave}
            className="
              flex items-center gap-2 px-6 py-2.5 bg-yellow-400 text-yellow-900 rounded-xl font-medium 
              hover:bg-yellow-500 hover:shadow-lg hover:-translate-y-0.5 transition-all
            "
          >
            <Save className="w-4 h-4" />
            <span>保存更改</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditWorkModal;
