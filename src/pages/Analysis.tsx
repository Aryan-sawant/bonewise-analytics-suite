import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AnalysisCard from '@/components/AnalysisCard';
import { useAuthContext } from '@/contexts/AuthContext';

const Analysis = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const task_prompts = {
    'fracture': {
        common: "Analyze the X-ray, MRI, or CT scan image to assess for fractures. Identify the affected bone and classify the fracture exclusively according to the AO/OTA Fracture and Dislocation Classification system. Provide a simplified explanation of the AO/OTA classification assigned. Determine the severity of the fracture based on the AO/OTA classification and imaging findings. Provide an easy-to-understand explanation of the fracture, including its potential effects on movement and expected recovery timeline, considering the AO/OTA classification. Please also suggest a basic nutrition plan and recovery steps, including remedies, exercises and when can the person drive or work if appropriate, in the context of the AO/OTA classified fracture. If a user uploads any irrelevant image which is not in context of bone just reply the user gracefully to upload the relevant image and don't mention or describe anything what is there in that irrelevant image.",
        doctor: "Analyze the X-ray, MRI, or CT scan image to assess for fractures. Identify the affected bone and classify the fracture exclusively according to the AO/OTA Fracture and Dislocation Classification system. Provide a detailed and comprehensive explanation of the specific AO/OTA classification assigned, including the relevant alphanumeric codes and their precise meaning in terms of fracture morphology, anatomical location, and severity. Based solely on the AO/OTA classification and imaging findings, suggest appropriate medical treatment options, including potential surgical interventions, immobilization techniques, and follow-up care strategies. Also, provide a relevant nutrition plan and recommend specific rehabilitation exercises, remedies and when can the person drive or work as needed, directly informed by the AO/OTA fracture classification and its severity. If a user uploads any irrelevant image which is not in context of bone just reply the user gracefully to upload the relevant image and don't mention or describe anything what is there in that irrelevant image."
      },
      'marrow': {
        common: "Analyze the microscopic biopsy or MRI image of bone marrow cells. Classify the bone marrow cells into relevant categories like Abnormal eosinophil, Artefact, Basophil, Blast, Erythroblast, Eosinophil, Faggott cell, Hairy cell, Smudge cell, Immature lymphocyte, Lymphocyte, Metamyelocyte, Monocyte, Myelocyte, Band neutrophil, Segmented neutrophil, Not identifiable, Other cell, Proerythroblast, Plasma cell, Promyelocyte and identify any concerning or abnormal cells. Explain your findings in simple terms, indicating any unusual cell changes and their potential implications. Provide a nutrition plan and steps to recover, including remedies, exercises and when can the person drive or work if required. If a user uploads any irrelevant image which is not in context of bone just reply the user gracefully to upload the relevant image and don't mention or describe anything what is there in that irrelevant image.",
        doctor: "Analyze the microscopic biopsy or MRI image of bone marrow cells. Classify bone marrow cells into detailed categories like Abnormal eosinophil, Artefact, Basophil, Blast, Erythroblast, Eosinophil, Faggott cell, Hairy cell, Smudge cell, Immature lymphocyte, Lymphocyte, Metamyelocyte, Monocyte, Myelocyte, Band neutrophil, Segmented neutrophil, Not identifiable, Other cell, Proerythroblast, Plasma cell, Promyelocyte, identifying and describing any abnormal cell structures. Provide insights into possible diagnoses and recommend medical interventions, nutrition plans, and recovery steps, including remedies, exercises and when can the person drive or work if required. If a user uploads any irrelevant image which is not in context of bone just reply the user gracefully to upload the relevant image and don't mention or describe anything what is there in that irrelevant image."
      },
      'knee': {
        common: "Analyze the knee X-ray or MRI and classify osteoarthritis severity based on Kellgren-Lawrence (K-L) clinical grading like Grade 0: Healthy knee image, Grade 1 (Doubtful): Doubtful joint narrowing with possible osteophytic lipping, Grade 2 (Minimal): Definite presence of osteophytes and possible joint space narrowing, Grade 3 (Moderate): Multiple osteophytes, definite joint space narrowing, with mild sclerosis, Grade 4 (Severe): Large osteophytes, significant joint narrowing, and severe sclerosis. The image will be assessed for signs of knee osteoarthritis, including joint space narrowing and bone changes. You will get an easy-to-understand report on whether osteoarthritis is present and its severity level, along with its impact on knee function, provide nutrition plan, steps to recover like remedies, exercises and when can the person drive or work if required. If a user uploads any irrelevant image which is not in context of bone just reply the user gracefully to upload the relevant image and don't mention or describe anything what is there in that irrelevant image.",
        doctor: "Analyze the knee X-ray or MRI and classify osteoarthritis severity based on Kellgren-Lawrence (K-L) clinical grading like Grade 0: Healthy knee image, Grade 1 (Doubtful): Doubtful joint narrowing with possible osteophytic lipping, Grade 2 (Minimal): Definite presence of osteophytes and possible joint space narrowing, Grade 3 (Moderate): Multiple osteophytes, definite joint space narrowing, with mild sclerosis, Grade 4 (Severe): Large osteophytes, significant joint narrowing, and severe sclerosis. Suggest advanced treatments, medications, physiotherapy plans, and surgical options such as knee replacement, provide nutrition plan, steps to recover like remedies, exercises and when can the person drive or work if required. If a user uploads any irrelevant image which is not in context of bone just reply the user gracefully to upload the relevant image and don't mention or describe anything what is there in that irrelevant image."
      },
      'osteoporosis': {
        common: "Analyze the bone X-ray and determine osteoporosis stage categorized into normal, osteopenia and osteoporosis with estimated Bone Mineral Density (BMD) score. The scan will be analyzed to determine how strong or weak the bones are and whether osteoporosis is present. You will receive a simple explanation of the results, including whether bone density is lower than normal and what it means for bone health, provide nutrition plan, steps to recover like remedies, exercises and when can the person drive or work if required. If a user uploads any irrelevant image which is not in context of bone just reply the user gracefully to upload the relevant image and don't mention or describe anything what is there in that irrelevant image.",
        doctor: "Analyze the bone X-ray and determine osteoporosis stage categorized into normal, osteopenia and osteoporosis with estimated Bone Mineral Density (BMD) score. Recommend specific medications, hormone therapy, and advanced treatments to manage and prevent complications, provide nutrition plan, steps to recover like remedies, exercises and when can the person drive or work if required. If a user uploads any irrelevant image which is not in context of bone just reply the user gracefully to upload the relevant image and don't mention or describe anything what is there in that irrelevant image."
      },
      'age': {
        common: "Analyze the X-ray of a child's hand and predict bone age with insights into growth patterns and offering exact age number or range based on Greulich-Pyle (GP) Atlas and	Tanner-Whitehouse (TW) Method. The scan will be assessed to check how well the bones are developing compared to the expected growth pattern for the child's age. You will receive an easy-to-understand result with exact age number or range explaining whether the bone growth is normal, advanced, or delayed, provide nutrition plan, steps to recover like remedies, exercises if required. If a user uploads any irrelevant image which is not in context of bone just reply the user gracefully to upload the relevant image and don't mention or describe anything what is there in that irrelevant image.",
        doctor: "Analyze the X-ray of a child's hand and predict bone age with insights into growth patterns and offering exact age number or range based on Greulich-Pyle (GP) Atlas and	Tanner-Whitehouse (TW) Method. Offer insights into growth abnormalities, hormonal imbalances, and necessary medical interventions if delayed growth is detected, provide nutrition plan, steps to recover like remedies, exercises if required. If a user uploads any irrelevant image which is not in context of bone just reply the user gracefully to upload the relevant image and don't mention or describe anything what is there in that irrelevant image."
      },
      'spine': {
        common: "Analyze the X-ray, MRI, or CT scan of the cervical spine for fractures based on the AO/OTA Fracture and Dislocation Classification system. The scan will be analyzed for fractures in the neck bones, and you will receive an explanation of the findings. The report will describe whether a fracture is present, its severity, and how it may affect movement or pain levels, provide nutrition plan, steps to recover like remedies, exercises and when can the person drive or work if required. If a user uploads any irrelevant image which is not in context of bone just reply the user gracefully to upload the relevant image and don't mention or describe anything what is there in that irrelevant image.",
        doctor: "Analyze the X-ray, MRI, or CT scan of the cervical spine for fractures based on the AO/OTA Fracture and Dislocation Classification system. Suggest medical treatment plans, possible surgical options, and rehabilitation strategies for full recovery, provide nutrition plan, steps to recover like remedies, exercises and when can the person drive or work if required. If a user uploads any irrelevant image which is not in context of bone just reply the user gracefully to upload the relevant image and don't mention or describe anything what is there in that irrelevant image."
      },
      'tumor': {
        common: "Analyze the X-ray, MRI, CT scan, or biopsy image for possible bone tumors or cancerous growths. The image will be checked for any unusual growths or masses in the bone, and you will receive a simple explanation of the findings. If any suspicious areas are detected, the report will describe their size, location, and whether they appear concerning, provide nutrition plan, steps to recover like remedies, exercises and when can the person drive or work if required. If a user uploads any irrelevant image which is not in context of bone just reply the user gracefully to upload the relevant image and don't mention or describe anything what is there in that irrelevant image.",
        doctor: "Analyze the X-ray, MRI, CT scan, or biopsy image for possible bone tumors or cancerous growths. Provide detailed insights into tumor classification, possible malignancy assessment, and treatment options, provide nutrition plan, steps to recover like remedies, exercises and when can the person drive or work if required. If a user uploads any irrelevant image which is not in context of bone just reply the user gracefully to upload the relevant image and don't mention or describe anything what is there in that irrelevant image."
      },
      'infection': {
        common: "Analyze the X-ray, MRI, CT scan, or biopsy image for signs of bone infection (osteomyelitis). The image will be checked for any signs of infection in the bone, such as swelling, bone damage, or abscess formation. You will receive an easy-to-understand explanation of whether an infection is present and how it may be affecting the bone, provide nutrition plan, steps to recover like remedies, exercises and when can the person drive or work if required. If a user uploads any irrelevant image which is not in context of bone just reply the user gracefully to upload the relevant image and don't mention or describe anything what is there in that irrelevant image.",
        doctor: "Analyze the X-ray, MRI, CT scan, or biopsy image for signs of bone infection (osteomyelitis). Provide insights on infection severity, possible antibiotic treatments, and surgical recommendations if needed, provide nutrition plan, steps to recover like remedies, exercises and when can the person drive or work if required. If a user uploads any irrelevant image which is not in context of bone just reply the user gracefully to upload the relevant image and don't mention or describe anything what is there in that irrelevant image."
      }
    };


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
      prompt: user?.isDoctor ? task_prompts['fracture'].doctor : task_prompts['fracture'].common
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
      prompt: user?.isDoctor ? task_prompts['osteoporosis'].doctor : task_prompts['osteoporosis'].common
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
      prompt: user?.isDoctor ? task_prompts['knee'].doctor : task_prompts['knee'].common
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
      prompt: user?.isDoctor ? task_prompts['marrow'].doctor : task_prompts['marrow'].common
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
      prompt: user?.isDoctor ? task_prompts['age'].doctor : task_prompts['age'].common
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
      prompt: user?.isDoctor ? task_prompts['spine'].doctor : task_prompts['spine'].common
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
      prompt: user?.isDoctor ? task_prompts['tumor'].doctor : task_prompts['tumor'].common
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
      prompt: user?.isDoctor ? task_prompts['infection'].doctor : task_prompts['infection'].common
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
            prompt={user?.isDoctor ? task_prompts[type.id].doctor : task_prompts[type.id].common}
          />
        ))}
      </div>
    </div>
  );
};

export default Analysis;
