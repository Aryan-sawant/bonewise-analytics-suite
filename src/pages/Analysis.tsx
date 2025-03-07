import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AnalysisCard from '@/components/AnalysisCard';
import { useAuthContext } from '@/contexts/AuthContext';

const Analysis = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const task_prompts = {
    "Bone Fracture Detection": (
        "Analyze the X-ray, MRI, or CT scan image for fractures and classify into different fracture types with detailed severity assessment. "
        "For common users: The image will be analyzed to check for fractures, identifying the affected bone and the type of break. "
        "You will receive an easy-to-understand explanation of the fracture, including its severity and possible effects on movement, provide nutrition plan,steps to recover like remedies and exercises if required. "
        "For doctors: Suggest medical treatment options, possible surgeries, immobilization techniques, and follow-up care strategies,provide nutrition plan,steps to recover like remedies and exercises if required. "
    ),

    "Bone Marrow Cell Classification": (
        "Analyze the biopsy or MRI image and classify bone marrow cells into relevant categories, identifying concerning cells. "
        "For common users: The image will be analyzed to check for abnormalities in bone marrow cells. "
        "You will receive a simple explanation of the findings, including whether there are unusual cell changes and what they might indicate,provide nutrition plan,steps to recover like remedies and exercises if required. "
        "For doctors: Provide detailed insights into abnormal cell structures, possible diagnoses, and recommended medical interventions,provide nutrition plan,steps to recover like remedies and exercises if required. "
    ),

    "Knee Joint Osteoarthritis Detection": (
        "Analyze the knee X-ray or MRI and classify osteoarthritis severity based on clinical grading. "
        "For common users: The image will be assessed for signs of knee osteoarthritis, including joint space narrowing and bone changes. "
        "You will get an easy-to-understand report on whether osteoarthritis is present and its severity level, along with its impact on knee function,provide nutrition plan,steps to recover like remedies and exercises if required. "
        "For doctors: Suggest advanced treatments, medications, physiotherapy plans, and surgical options such as knee replacement,provide nutrition plan,steps to recover like remedies and exercises if required."

    ),

    "Osteoporosis Stage Prediction & BMD Score": (
        "Analyze the bone X-ray and determine osteoporosis stage with estimated Bone Mineral Density (BMD) score. "
        "For common users: The scan will be analyzed to determine how strong or weak the bones are and whether osteoporosis is present. "
        "You will receive a simple explanation of the results, including whether bone density is lower than normal and what it means for bone health,provide nutrition plan,steps to recover like remedies and exercises if required. "
        "For doctors: Recommend specific medications, hormone therapy, and advanced treatments to manage and prevent complications,provide nutrition plan,steps to recover like remedies and exercises if required."
    ),

    "Bone Age Detection": (
        "Analyze the X-ray of a child's hand and predict bone age with insights into growth patterns. "
        "For common users: The scan will be assessed to check how well the bones are developing compared to the expected growth pattern for the child’s age. "
        "You will receive an easy-to-understand result explaining whether the bone growth is normal, advanced, or delayed,provide nutrition plan,steps to recover like remedies and exercises if required. "
        "For doctors: Offer insights into growth abnormalities, hormonal imbalances, and necessary medical interventions if delayed growth is detected,provide nutrition plan,steps to recover like remedies and exercises if required."
    ),

    "Cervical Spine Fracture Detection": (
        "Analyze the X-ray, MRI, or CT scan of the cervical spine for fractures and provide a severity assessment. "
        "For common users: The scan will be analyzed for fractures in the neck bones, and you will receive an explanation of the findings. "
        "The report will describe whether a fracture is present, its severity, and how it may affect movement or pain levels,provide nutrition plan,steps to recover like remedies and exercises if required"
        "For doctors: Suggest medical treatment plans, possible surgical options, and rehabilitation strategies for full recovery,provide nutrition plan,steps to recover like remedies and exercises if required"
    ),

    "Bone Tumor/Cancer Detection": (
        "Analyze the X-ray, MRI, CT scan, or biopsy image for possible bone tumors or cancerous growths. "
        "For common users: The image will be checked for any unusual growths or masses in the bone, and you will receive a simple explanation of the findings. "
        "If any suspicious areas are detected, the report will describe their size, location, and whether they appear concerning,provide nutrition plan,steps to recover like remedies and exercises if required."
        "For doctors: Provide detailed insights into tumor classification, possible malignancy assessment, and treatment options,provide nutrition plan,steps to recover like remedies and exercises if required. "
    ),

    "Bone Infection (Osteomyelitis) Detection": (
        "Analyze the X-ray, MRI, CT scan, or biopsy image for signs of bone infection (osteomyelitis). "
        "For common users: The image will be checked for any signs of infection in the bone, such as swelling, bone damage, or abscess formation. "
        "You will receive an easy-to-understand explanation of whether an infection is present and how it may be affecting the bone,provide nutrition plan,steps to recover like remedies and exercises if required."
        "For doctors: Provide insights on infection severity, possible antibiotic treatments, and surgical recommendations if needed,provide nutrition plan,steps to recover like remedies and exercises if required."
    )
}


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
      disabled: false,
      prompt: task_prompts["Bone Fracture Detection"]
    },
    {
      id: 'osteoporosis',
      title: 'Osteoporosis Stage Prediction & BMD Score',
      description: 'Predict osteoporosis stages and calculate BMD score',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 18a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v12Z"></path><path d="M12 6v10"></path><path d="M10 6v1"></path><path d="M14 6v1"></path><path d="M10 15v1"></path><path d="M14 15v1"></path></svg>
      ),
      path: '/analysis/upload?type=osteoporosis',
      color: 'bg-amber-100 text-amber-600',
      disabled: false,
      prompt: task_prompts["Osteoporosis Stage Prediction & BMD Score"]
    },
    {
      id: 'knee',
      title: 'Knee Joint Osteoarthritis Detection',
      description: 'Detect knee joint osteoarthritis from MRI images',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m4.9 4.9 14.2 14.2"></path></svg>
      ),
      path: '/analysis/upload?type=knee',
      color: 'bg-blue-100 text-blue-600',
      disabled: true,
      prompt: task_prompts["Knee Joint Osteoarthritis Detection"]
    },
    {
      id: 'marrow',
      title: 'Bone Marrow Cell Classification',
      description: 'Classify bone marrow cells from microscopic images',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" x2="9.01" y1="9" y2="9"></line><line x1="15" x2="15.01" y1="9" y2="9"></line></svg>
      ),
      path: '/analysis/upload?type=marrow',
      color: 'bg-purple-100 text-purple-600',
      disabled: true,
      prompt: task_prompts["Bone Marrow Cell Classification"]
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
      disabled: true,
      prompt: task_prompts["Bone Age Detection"]
    },
    {
      id: 'spine',
      title: 'Cervical Spine Fracture Detection',
      description: 'Detect cervical spine fractures from CT scans',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg>
      ),
      path: '/analysis/upload?type=spine',
      color: 'bg-indigo-100 text-indigo-600',
      disabled: true,
      prompt: task_prompts["Cervical Spine Fracture Detection"]
    },
    {
      id: 'tumor',
      title: 'Bone Tumor/Cancer Detection',
      description: 'Detect bone tumors from various imaging modalities',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path></svg>
      ),
      path: '/analysis/upload?type=tumor',
      color: 'bg-rose-100 text-rose-600',
      disabled: true,
      prompt: task_prompts["Bone Tumor/Cancer Detection"]
    },
    {
      id: 'infection',
      title: 'Bone Infection (Osteomyelitis) Detection',
      description: 'Detect bone infections from MRI and X-ray images',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 19h8a4 4 0 0 0 4-4v-6a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v6a4 4 0 0 0 4 4Z"></path><path d="M8 15h8"></path><path d="M8 11h8"></path><path d="M8 7h8"></path></svg>
      ),
      path: '/analysis/upload?type=infection',
      color: 'bg-teal-100 text-teal-600',
      disabled: true,
      prompt: task_prompts["Bone Infection (Osteomyelitis) Detection"]
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
            prompt={type.prompt} // You can pass prompt to AnalysisCard if needed in the future
          />
        ))}
      </div>
    </div>
  );
};

export default Analysis;
