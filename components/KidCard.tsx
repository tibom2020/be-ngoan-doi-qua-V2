import React, { useRef } from 'react';
import { Trophy, Gift, Camera } from 'lucide-react';
import { Kid } from '../types';

interface KidCardProps {
  kid: Kid;
  onRedeem: (kid: Kid) => void;
  onUpdateKid: (updatedKid: Kid) => void;
}

const KidCard: React.FC<KidCardProps> = ({ kid, onRedeem, onUpdateKid }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progress = Math.min((kid.currentScore / 100) * 100, 100);
  const canRedeem = kid.currentScore >= 100;

  const colorClasses: Record<string, string> = {
    pink: 'bg-pink-100 border-pink-300 text-pink-800 ring-pink-200',
    blue: 'bg-blue-100 border-blue-300 text-blue-800 ring-blue-200',
  };

  const barColorClasses: Record<string, string> = {
    pink: 'bg-pink-500',
    blue: 'bg-blue-500',
  };

  const theme = colorClasses[kid.themeColor] || colorClasses.blue;
  const barTheme = barColorClasses[kid.themeColor] || barColorClasses.blue;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Xử lý nén ảnh trước khi lưu
          const img = new Image();
          img.src = reader.result;
          
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Giới hạn kích thước tối đa 300x300 (đủ cho avatar)
            const MAX_SIZE = 300;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
              }
            }

            canvas.width = width;
            canvas.height = height;
            
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              // Nén thành JPEG chất lượng 0.7
              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
              onUpdateKid({ ...kid, avatar: compressedBase64 });
            }
          };
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`relative p-6 rounded-3xl border-2 ${theme} shadow-lg transition-transform transform hover:scale-[1.02] flex flex-col items-center text-center w-full`}>
      <div className="absolute top-4 right-4 bg-white/50 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 backdrop-blur-sm">
        <Trophy size={16} className="text-yellow-500" />
        <span>{kid.currentScore} điểm</span>
      </div>
      
      <div className="relative group">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md mb-4 bg-white">
          <img src={kid.avatar} alt={kid.name} className="w-full h-full object-cover" />
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-4 right-0 p-1.5 bg-white rounded-full shadow-md text-gray-600 hover:text-indigo-600 hover:scale-110 transition-all border border-gray-200"
          title="Đổi ảnh đại diện"
        >
          <Camera size={14} />
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={handleFileChange}
          onClick={(e) => (e.currentTarget.value = '')} // Reset để có thể chọn lại cùng 1 file
        />
      </div>

      <h2 className="text-2xl font-extrabold mb-1">{kid.name}</h2>
      
      <div className="w-full bg-white rounded-full h-4 mb-4 overflow-hidden border border-white/50 shadow-inner relative">
        <div 
          className={`h-full ${barTheme} transition-all duration-1000 ease-out flex items-center justify-end pr-1`} 
          style={{ width: `${progress}%` }}
        >
          {progress > 10 && <span className="text-[10px] text-white font-bold">{Math.floor(progress)}%</span>}
        </div>
      </div>

      {canRedeem ? (
        <button 
          onClick={() => onRedeem(kid)}
          className="animate-bounce bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-2 px-6 rounded-full shadow-lg hover:from-yellow-500 hover:to-orange-600 flex items-center gap-2 transform active:scale-95 transition-all"
        >
          <Gift size={20} />
          Đổi Quà Ngay!
        </button>
      ) : (
        <p className="text-sm opacity-70 font-medium">Cố lên! Còn {100 - kid.currentScore} điểm nữa thôi!</p>
      )}
    </div>
  );
};

export default KidCard;