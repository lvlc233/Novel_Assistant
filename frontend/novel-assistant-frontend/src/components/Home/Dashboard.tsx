
// 仪表盘
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, BookOpen, Settings, Plus, ArrowLeft } from 'lucide-react';
import FeatureCard from './FeatureCard';
import SearchBar from '../base/SearchBar';
import QuickCreateMenu from './QuickCreateMenu';

interface DashboardProps {
  onOpenSettings?: () => void;
}
// 仪表盘组件，展示功能卡片、搜索栏和快速创建菜单
const Dashboard: React.FC<DashboardProps> = ({ onOpenSettings }) => {
  const router = useRouter();
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);

  const handleSearch = (query: string) => {
    console.log('Search:', query);
    // TODO: Implement search logic
  };

  const handleCreateSelect = (type: 'blank' | 'template' | 'import') => {
    console.log('Selected create type:', type);
    setIsCreateMenuOpen(false);
    // Navigate to editor regardless for now, or handle differently
    router.push('/editor');
  };

  const cards = [
    {
      title: '作品管理',
      icon: <FileText className="w-8 h-8" />,
      rotation: '-rotate-4',
      color: 'bg-surface-white',
      onClick: () => router.push('/novels'),
    },
    {
      title: '知识库',
      icon: <BookOpen className="w-8 h-8" />,
      rotation: '-rotate-3',
      color: 'bg-surface-white',
    },
    {
      title: '系统配置',
      icon: <Settings className="w-8 h-8" />,
      rotation: 'rotate-3',
      color: 'bg-surface-white',
      onClick: onOpenSettings,
    },
    {
      title: '敬请期待',
      icon: <Plus className="w-8 h-8" />,
      rotation: 'rotate-4',
      color: 'bg-surface-white',
    },
  ];

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto p-8 relative">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-secondary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-primary/5 rounded-full blur-3xl"></div>
      </div>


      {/* 功能卡片*/}
      <div className="flex flex-wrap justify-center gap-10 mb-8 mt-12 perspective-1000">
        {cards.map((card, index) => (
          <div key={index} className={`animate-slide-up`} style={{ animationDelay: `${index * 100}ms` }}>
            <FeatureCard
              title={card.title}
              icon={card.icon}
              rotation={card.rotation}
              color={card.color}
              onClick={card.onClick}
            />
          </div>
        ))}
      </div>
      
      <div>
        
      </div>

    </div>
  );
};

export default Dashboard;
