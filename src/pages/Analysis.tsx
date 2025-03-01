
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AnalysisCard from '@/components/AnalysisCard';
import { useAuthContext } from '@/contexts/AuthContext';

const Analysis = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  
  const [analysisTypes] = useState([
    {
      id: 'fracture',
      title: 'Bone Fracture Detection',
      description: 'Detect and analyze bone fractures from X-ray images',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"></path><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"></path><circle cx="20" cy="10" r="2"></circle></svg>
      ),
      path: '/analysis/upload?type=fracture',
      color: 'bg-red-100 text-red-600',
      disabled: false
    },
    {
      id: 'osteoporosis',
      title: 'Osteoporosis Prediction',
      description: 'Predict osteoporosis stages and calculate BMD score',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 18a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v12Z"></path><path d="M12 6v10"></path><path d="M10 6v1"></path><path d="M14 6v1"></path><path d="M10 15v1"></path><path d="M14 15v1"></path></svg>
      ),
      path: '/analysis/upload?type=osteoporosis',
      color: 'bg-amber-100 text-amber-600',
      disabled: false
    },
    {
      id: 'knee',
      title: 'Knee Joint Osteoarthritis',
      description: 'Detect knee joint osteoarthritis from MRI images',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m4.9 4.9 14.2 14.2"></path></svg>
      ),
      path: '/analysis/upload?type=knee',
      color: 'bg-blue-100 text-blue-600',
      disabled: true
    },
    {
      id: 'marrow',
      title: 'Bone Marrow Classification',
      description: 'Classify bone marrow cells from microscopic images',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" x2="9.01" y1="9" y2="9"></line><line x1="15" x2="15.01" y1="9" y2="9"></line></svg>
      ),
      path: '/analysis/upload?type=marrow',
      color: 'bg-purple-100 text-purple-600',
      disabled: true
    },
    {
      id: 'age',
      title: 'Bone Age Detection',
      description: 'Determine bone age from hand X-ray images',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
      ),
      path: '/analysis/upload?type=age',
      color: 'bg-green-100 text-green-600',
      disabled: true
    },
    {
      id: 'spine',
      title: 'Cervical Spine Fracture',
      description: 'Detect cervical spine fractures from CT scans',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg>
      ),
      path: '/analysis/upload?type=spine',
      color: 'bg-indigo-100 text-indigo-600',
      disabled: true
    },
    {
      id: 'tumor',
      title: 'Bone Tumor Detection',
      description: 'Detect bone tumors from various imaging modalities',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path></svg>
      ),
      path: '/analysis/upload?type=tumor',
      color: 'bg-rose-100 text-rose-600',
      disabled: true
    },
    {
      id: 'infection',
      title: 'Osteomyelitis Detection',
      description: 'Detect bone infections from MRI and X-ray images',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 19h8a4 4 0 0 0 4-4v-6a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v6a4 4 0 0 0 4 4Z"></path><path d="M8 15h8"></path><path d="M8 11h8"></path><path d="M8 7h8"></path></svg>
      ),
      path: '/analysis/upload?type=infection',
      color: 'bg-teal-100 text-teal-600',
      disabled: true
    }
  ]);
  
  return (
    <div className="container page-transition max-w-6xl py-16 px-4 md:px-6">
      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight">Select Analysis Type</h1>
        <p className="text-muted-foreground mt-1">
          Choose the type of bone health analysis you want to perform
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {analysisTypes.map((type) => (
          <AnalysisCard
            key={type.id}
            title={type.title}
            description={type.description}
            icon={type.icon}
            path={type.path}
            color={type.color}
            disabled={type.disabled}
          />
        ))}
      </div>
    </div>
  );
};

export default Analysis;
