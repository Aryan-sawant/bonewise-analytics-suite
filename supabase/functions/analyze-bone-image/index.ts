// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { image, taskId, userType, userId } = await req.json()

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!taskId) {
      return new Response(
        JSON.stringify({ error: 'No task ID provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Task information lookup (Task Titles - for descriptions in DB and UI)
    const taskTitles: Record<string, string> = {
      'fracture-detection': 'Bone Fracture Detection',
      'bone-marrow': 'Bone Marrow Cell Classification',
      'osteoarthritis': 'Knee Joint Osteoarthritis Detection',
      'osteoporosis': 'Osteoporosis Stage & BMD Score',
      'bone-age': 'Bone Age Detection',
      'spine-fracture': 'Cervical Spine Fracture Detection',
      'bone-tumor': 'Bone Tumor/Cancer Detection',
      'bone-infection': 'Bone Infection (Osteomyelitis) Detection'
    }

    const taskTitle = taskTitles[taskId] || 'Unknown Analysis Type'

    // Detailed task prompts - EXACTLY as provided by the user - with stronger directives to avoid HTML descriptions
    const taskPrompts: Record<string, Record<string, string>> = {
      'fracture-detection': {
        common: `**Objective:** Analyze the provided medical image (X-ray, MRI, or CT scan) to detect and characterize bone fractures.

**Desired Output:**  A clear and concise analysis report detailing the findings regarding bone fractures.  **Crucially, the response MUST be the ANALYSIS RESULTS themselves, NOT a description of how to perform the analysis or HTML code templates.**

**Steps:**

1.  Carefully examine the medical image for any indications of bone fracture.
2.  Determine if a fracture is present. Answer with a clear "Yes" or "No".
3.  If a fracture IS detected:
    *   Classify the fracture type (e.g., longitudinal, spiral, comminuted, hairline, etc.). Be specific.
    *   Identify the exact bone that is fractured and the location on the bone (e.g., distal radius, tibial shaft).
    *   Assess the severity of the fracture (e.g., mild, moderate, severe, stable, unstable).
    *   Briefly explain the implications of the fracture in layman's terms, including potential effects on movement and function.
    *   Recommend a basic nutrition plan to support bone healing.
    *   Suggest simple, general recovery steps, including home remedies and exercises (if appropriate and safe for general advice).

4.  If NO fracture is detected:
    *   State very clearly:  "**No fracture detected in the provided image.**"
    *   Optionally, you may add a brief comment on the normal appearance of the bone if discernible.

**Formatting:** Format the analysis report as plain text, using HTML \`<b>\` tags to highlight KEY FINDINGS such as fracture presence, type, bone affected, and severity.

**Example of DESIRED output (Fracture Found):**

\`\`\`html
<p><b>Fracture Detected:</b> Yes</p>
<p><b>Fracture Type:</b> Spiral fracture</p>
<p><b>Affected Bone:</b> Tibial shaft</p>
<p><b>Severity:</b> Moderate, non-displaced</p>
<p><b>Analysis:</b> A spiral fracture is evident in the tibial shaft... (further explanation of implications and recommendations)</p>
\`\`\`

**Example of UNDESIRED output (Avoid this type of response COMPLETELY):**

\`\`\`html
<p>This HTML code provides a detailed analysis of the X-ray image, classifies the fracture...</p>
<p>... (HTML code that describes the analysis process instead of the results) ...</p>
\`\`\`

**Important:  Your response MUST be the HTML code containing the ANALYSIS RESULTS as shown in the 'DESIRED output' example above.  Do NOT provide HTML code that describes how to perform the analysis, is a template, or is a general explanation of fracture analysis.**  Focus SOLELY on the findings for THIS SPECIFIC IMAGE.`,
        doctor: `**Objective:** Perform a professional-level analysis of the medical image (X-ray, MRI, or CT scan) for bone fractures, suitable for clinical evaluation.

**Desired Output:** A comprehensive and clinically relevant analysis report detailing bone fracture findings. **The output MUST be the ANALYSIS RESULTS, not a description of your analysis process or an HTML template.**

**Steps:**

1.  Conduct a thorough examination of the medical image to identify any bone fractures.
2.  Confirm the presence or absence of fracture. State "Fracture Present: Yes" or "Fracture Present: No".
3.  If a fracture IS present:
    *   Provide a precise classification of the fracture type, using medical terminology where appropriate (e.g., Salter-Harris fracture, Bennett's fracture, etc., if applicable and identifiable).
    *   Specify the anatomical location of the fracture, including the bone and specific region (e.g., proximal humerus, distal femoral epiphysis).
    *   Assess fracture severity, displacement, angulation, and comminution.
    *   Discuss potential complications associated with this type of fracture and its location.
    *   Suggest a range of medical treatment options, including both conservative and surgical approaches, with brief rationales for each.
    *   Outline key aspects of post-fracture care and rehabilitation strategies.

4.  If NO fracture is detected:
    *   Clearly state: "**Fracture Present: No. No evidence of fracture is observed in the provided image.**"
    *   Provide a brief radiological description of the bone's appearance, noting any normal or unremarkable findings.

**Formatting:**  Structure the analysis report in HTML format, using \`<b>\` tags to emphasize key clinical findings, diagnoses, and recommendations.

**Example of DESIRED output (Fracture Found - Doctor Level):**

\`\`\`html
<p><b>Fracture Present:</b> Yes</p>
<p><b>Fracture Type:</b>  Comminuted fracture of the distal radius, intra-articular</p>
<p><b>Anatomical Location:</b> Distal radius, involving the radiocarpal joint</p>
<p><b>Severity and Characteristics:</b>  Severe comminution is noted... (detailed radiological description, displacement, angulation, etc.)</p>
<p><b>Potential Complications:</b>  Risk of malunion, wrist instability, post-traumatic arthritis...</p>
<p><b>Treatment Options:</b> Surgical intervention with open reduction and internal fixation (ORIF) is recommended... (discussion of surgical vs. conservative options)</p>
<p><b>Rehabilitation:</b>  Early mobilization post-operatively is crucial... (outline of rehab plan)</p>
\`\`\`

**Example of UNDESIRED output (Avoid this type of response COMPLETELY):**

\`\`\`html
<p>This HTML template can be used to analyze X-ray images for fractures...</p>
<p>... (HTML code that explains how to create fracture analysis reports, not the report itself) ...</p>
\`\`\`

**Important:  Your response MUST be a clinically focused ANALYSIS REPORT in HTML format as shown in the 'DESIRED output' example. Do NOT provide HTML code that is a template, describes report generation, or explains fracture analysis in general.  The output should be the specific, image-based clinical analysis.**`
      },
      'bone-marrow': {
        common: `**Objective:** Analyze the microscopic biopsy or MRI image of bone marrow cells to classify cell types and identify abnormalities.

**Desired Output:** A concise report analyzing the bone marrow cell image. **Crucially, provide ANALYSIS RESULTS, not process descriptions or HTML templates.**

**Steps:**

1. Examine the image to identify and classify bone marrow cells into categories (e.g., Erythroid, Myeloid, Lymphoid, Megakaryocytic, etc., and specific cell types within them).
2. Identify and note the presence of any abnormal or concerning cells. List specific abnormal cell types if found (e.g., blasts, atypical lymphocytes, tumor cells).
3. Assess the overall cellularity and composition of the bone marrow sample based on the image.
4. Provide a brief, easy-to-understand summary of the findings, indicating if the bone marrow appears normal or if abnormalities are detected.
5. If abnormalities are found, explain their potential implications in simple terms.
6. Recommend a basic nutrition plan to support overall health.
7. Suggest general steps for well-being and recovery, including lifestyle advice and exercises (if generally applicable and safe).

**Formatting:**  Format the analysis as plain text, using HTML \`<b>\` tags to highlight key findings, cell types, and abnormalities detected.

**Example of DESIRED output (Abnormality Found):**

\`\`\`html
<p><b>Bone Marrow Analysis Summary:</b> Abnormal findings detected.</p>
<p><b>Abnormal Cell Types Identified:</b> Increased Blasts (approximately 25% of cells), presence of Atypical Lymphocytes.</p>
<p><b>Cellularity:</b> Hypercellular.</p>
<p><b>Analysis:</b> The bone marrow sample shows evidence of increased blast cells... (further explanation of findings and potential implications)</p>
\`\`\`

**Example of UNDESIRED output (Avoid this type):**

\`\`\`html
<p>This HTML code can be used to create a bone marrow analysis report...</p>
<p>... (HTML code describing report generation, not the report itself) ...</p>
\`\`\`

**Important: Your response MUST be the HTML code containing the ANALYSIS RESULTS as shown in the 'DESIRED output' example. Do NOT provide HTML code that describes how to perform the analysis, is a template, or is a general explanation of bone marrow analysis.** Focus SOLELY on the findings for THIS SPECIFIC IMAGE.`,
        doctor: `**Objective:** Conduct a professional analysis of the microscopic bone marrow image for clinical interpretation and diagnosis.

**Desired Output:** A detailed, clinically oriented report analyzing the bone marrow cytology or histology. **The output MUST be the ANALYSIS RESULTS, not a description of the process or an HTML template.**

**Steps:**

1. Perform a comprehensive cytological or histological evaluation of the bone marrow image.
2. Classify and quantify all bone marrow cell lineages:
    * Erythroid series (maturation stages, dysplasia)
    * Myeloid series (granulopoiesis, myeloblasts, promyelocytes, myelocytes, metamyelocytes, bands, segmented neutrophils, eosinophils, basophils, dysplasia)
    * Megakaryocytic series (megakaryocytes, micromegakaryocytes, platelet production)
    * Lymphoid series (lymphocytes, plasma cells, blasts, atypical forms)
    * Other cells (monocytes, histiocytes, mast cells, abnormal cells)
3. Assess bone marrow cellularity (hypercellular, normocellular, hypocellular) and the myeloid:erythroid (M:E) ratio.
4. Identify and describe any morphological abnormalities, dysplastic features, or pathological cell populations.
5. Provide a differential diagnosis based on the cytological/histological findings, suggesting possible hematologic conditions or diseases.
6. Recommend further diagnostic studies or clinical correlation needed for definitive diagnosis and management.

**Formatting:** Structure the detailed analysis in HTML, using \`<b>\` tags to emphasize key diagnostic findings, cell counts, and differential diagnoses.

**Example of DESIRED output (Doctor Level Analysis):**

\`\`\`html
<p><b>Bone Marrow Aspirate Analysis:</b> Abnormal, suggestive of Myelodysplastic Syndrome (MDS).</p>
<p><b>Cellularity:</b> Hypercellular (estimated at 80-90% cellularity).</p>
<p><b>Myeloid:Erythroid (M:E) Ratio:</b> Increased, approximately 6:1.</p>
<p><b>Myeloid Series:</b> Dysgranulopoiesis noted... (detailed description of myeloid lineage findings, blast percentage, maturation abnormalities)</p>
<p><b>Erythroid Series:</b> Erythroid hyperplasia with dyserythropoiesis... (detailed description of erythroid lineage findings, maturation abnormalities, nuclear changes)</p>
<p><b>Megakaryocytes:</b> Increased number, some micromegakaryocytes present.</p>
<p><b>Lymphoid Series:</b>  Within normal limits, no excess blasts or atypical lymphocytes seen.</p>
<p><b>Differential Diagnosis:</b>  1. Myelodysplastic Syndrome (MDS), specifically RAEB-1 or RAEB-2... 2. ... (other differential considerations)</p>
<p><b>Recommendations:</b> Correlate with peripheral blood counts, cytogenetic analysis, and consider bone marrow biopsy for assessment of marrow architecture and fibrosis.</p>
\`\`\`

**Example of UNDESIRED output (Avoid this type):**

\`\`\`html
<p>This is an HTML template for generating bone marrow analysis reports...</p>
<p>... (HTML code describing how to create reports, not the report itself) ...</p>
\`\`\`

**Important: Your response MUST be a clinically detailed ANALYSIS REPORT in HTML format as shown in the 'DESIRED output' example. Do NOT provide HTML code that is a template, describes report generation, or explains bone marrow analysis in general. The output should be a specific, image-based clinical analysis.**`,
      },
      'osteoarthritis': {
        common: `**Objective:** Analyze the knee X-ray or MRI image to detect and classify the severity of osteoarthritis.

**Desired Output:** A user-friendly report on knee osteoarthritis. **Crucially, provide ANALYSIS RESULTS, not process descriptions or HTML templates.**

**Steps:**

1. Examine the knee joint image for signs of osteoarthritis, focusing on:
    * Joint space narrowing (medial, lateral, patellofemoral compartments)
    * Osteophyte formation (location, size)
    * Subchondral sclerosis
    * Subchondral cysts
    * Bone changes and alignment
2. Classify osteoarthritis severity using a clinical grading scale (e.g., Kellgren-Lawrence if applicable, or similar descriptive grading):
    * Grade 0: Healthy knee (no OA signs)
    * Grade 1 (Doubtful): Minimal features, possible osteophytic lipping.
    * Grade 2 (Minimal): Definite osteophytes, possible joint space narrowing.
    * Grade 3 (Moderate): Multiple osteophytes, definite joint space narrowing, some sclerosis.
    * Grade 4 (Severe): Large osteophytes, significant joint narrowing, severe sclerosis, possible bone deformity.
3. Describe the identified features of osteoarthritis in simple terms.
4. Provide an overall assessment of whether osteoarthritis is present and its severity level.
5. Explain the potential impact of the osteoarthritis grade on knee function and daily activities in easy-to-understand language.
6. Recommend general, non-medical advice for managing knee health and comfort, such as low-impact exercises and weight management.

**Formatting:** Format the report as plain text, using HTML \`<b>\` tags to highlight the osteoarthritis grade, key features, and severity assessment.

**Example of DESIRED output (Moderate Osteoarthritis):**

\`\`\`html
<p><b>Osteoarthritis Assessment:</b> Osteoarthritis is present.</p>
<p><b>Severity Grade:</b> Moderate (Grade 3).</p>
<p><b>Key Features Observed:</b> Multiple osteophytes are noted around the knee joint. Definite joint space narrowing is present, particularly in the medial compartment. Mild subchondral sclerosis is also observed.</p>
<p><b>Impact on Knee Function:</b> These findings suggest moderate osteoarthritis, which may cause noticeable knee pain, stiffness, and limitations in activities such as walking and stair climbing.</p>
\`\`\`

**Example of UNDESIRED output (Avoid this type):**

\`\`\`html
<p>This HTML code can be used to generate reports for knee osteoarthritis analysis...</p>
<p>... (HTML code describing report generation, not the report itself) ...</p>
\`\`\`

**Important: Your response MUST be the HTML code containing the ANALYSIS RESULTS as shown in the 'DESIRED output' example. Do NOT provide HTML code that describes how to perform the analysis, is a template, or is a general explanation of osteoarthritis analysis.** Focus SOLELY on the findings for THIS SPECIFIC IMAGE.`,
        doctor: `**Objective:**  Provide a professional radiological assessment of knee osteoarthritis severity from X-ray or MRI, suitable for clinical decision-making.

**Desired Output:** A detailed radiological report on knee osteoarthritis, including grading and clinical implications. **The output MUST be the ANALYSIS RESULTS, not a description of the process or an HTML template.**

**Steps:**

1.  Perform a detailed radiological evaluation of the knee joint, assessing:
    *   Joint space width in all compartments (medial, lateral, patellofemoral), quantify narrowing if possible.
    *   Osteophyte characteristics (size, location, morphology), grade osteophyte severity.
    *   Subchondral bone changes (sclerosis, cysts, erosions), grade sclerosis severity.
    *   Assess for malalignment, deformity, or other secondary signs of OA.
    *   Evaluate soft tissues if MRI is provided (menisci, ligaments, cartilage, synovium) for contributions to OA pathology.
2.  Grade the severity of osteoarthritis using a validated radiological grading system (e.g., Kellgren-Lawrence, OARSI grading, if applicable and data allows). Specify the grading system used.
3.  Provide a detailed radiological description of the findings, compartment by compartment.
4.  Summarize the overall grade of osteoarthritis and its radiological characteristics.
5.  Discuss the clinical significance of the findings, considering potential symptom correlation and functional impact.
6.  Recommend further imaging (if needed for better characterization or treatment planning), and suggest relevant clinical management strategies (conservative vs. surgical options to consider).

**Formatting:** Structure the radiological report in HTML, using \`<b>\` tags to highlight key radiological findings, OA grade, and clinical recommendations.

**Example of DESIRED output (Doctor Level Report):**

\`\`\`html
<p><b>Radiological Report: Knee Osteoarthritis Assessment</b></p>
<p><b>Osteoarthritis Grade (Kellgren-Lawrence):</b> Grade 3.</p>
<p><b>Radiological Findings:</b></p>
<p><b>Joint Space Narrowing:</b> Moderate narrowing in the medial tibiofemoral compartment, mild narrowing in the patellofemoral compartment. Lateral compartment space is relatively preserved.</p>
<p><b>Osteophytes:</b>  Numerous moderate-sized osteophytes are present at the medial and lateral joint margins of the femur and tibia, as well as around the patella.</p>
<p><b>Subchondral Sclerosis:</b>  Definite subchondral sclerosis is noted in the medial tibial plateau and femoral condyle.</p>
<p><b>Subchondral Cysts:</b>  Small subchondral cysts are present in the medial tibial plateau.</p>
<p><b>Clinical Significance:</b>  The findings are consistent with moderate knee osteoarthritis (Kellgren-Lawrence Grade 3), likely contributing to patient's reported symptoms.  Correlation with clinical examination is recommended.</p>
<p><b>Recommendations:</b>  Consider weight-bearing radiographs for alignment assessment if not already performed.  Clinical management options include... (discussion of conservative and surgical options).</p>
\`\`\`

**Example of UNDESIRED output (Avoid this type):**

\`\`\`html
<p>This is an HTML template for generating radiological reports on knee osteoarthritis...</p>
<p>... (HTML code describing report template, not the report itself) ...</p>
\`\`\`

**Important: Your response MUST be a clinically detailed RADIOLOGICAL REPORT in HTML format as shown in the 'DESIRED output' example. Do NOT provide HTML code that is a template, describes report generation, or explains osteoarthritis radiology in general. The output should be a specific, image-based radiological analysis.**`,
      },
      'osteoporosis': {
        common: `**Objective:** Analyze the bone X-ray image to assess bone density and determine the stage of osteoporosis.

**Desired Output:** A simple report on osteoporosis risk assessment. **Crucially, provide ANALYSIS RESULTS, not process descriptions or HTML templates.**

**Steps:**

1. Examine the bone X-ray image, looking for signs indicative of decreased bone density, such as:
    * Cortical thinning
    * Increased radiolucency (bones appearing more transparent)
    * Trabecular pattern changes (if discernible)
2. Determine if the bone density appears within the normal range, or if there are indications of reduced bone density.
3. Categorize the likely osteoporosis stage based on the visual assessment:
    * Normal Bone Density: Bone density appears normal for age.
    * Osteopenia: Reduced bone density, but not yet osteoporosis.
    * Osteoporosis: Significantly reduced bone density, indicating osteoporosis.
4. Estimate a qualitative Bone Mineral Density (BMD) assessment based on the image if possible (e.g., relatively normal, mildly reduced, moderately reduced, severely reduced). Note: This is a visual estimate, not a precise BMD score.
5. Provide a simple explanation of the findings in terms of bone strength and osteoporosis risk.
6. Recommend general lifestyle advice to support bone health, such as calcium and vitamin D intake and weight-bearing exercise.

**Formatting:**  Format the report as plain text, using HTML \`<b>\` tags to highlight the osteoporosis stage and BMD assessment.

**Example of DESIRED output (Osteoporosis Detected):**

\`\`\`html
<p><b>Osteoporosis Risk Assessment:</b>  Likely Osteoporosis.</p>
<p><b>Osteoporosis Stage:</b> Osteoporosis.</p>
<p><b>Bone Mineral Density (BMD) Assessment (Qualitative):</b>  Moderately reduced bone density is visually estimated.</p>
<p><b>Analysis:</b> The X-ray image shows signs consistent with osteoporosis, including cortical thinning and increased radiolucency.  This suggests reduced bone strength and increased risk of fracture.</p>
\`\`\`

**Example of UNDESIRED output (Avoid this type):**

\`\`\`html
<p>This HTML code is designed to create osteoporosis risk assessment reports...</p>
<p>... (HTML code describing report generation, not the report itself) ...</p>
\`\`\`

**Important: Your response MUST be the HTML code containing the ANALYSIS RESULTS as shown in the 'DESIRED output' example. Do NOT provide HTML code that describes how to perform the analysis, is a template, or is a general explanation of osteoporosis analysis.** Focus SOLELY on the findings for THIS SPECIFIC IMAGE.`,
        doctor: `**Objective:**  Provide a clinical assessment of osteoporosis stage and estimated Bone Mineral Density (BMD) from bone X-ray for patient management.

**Desired Output:** A clinically relevant report on osteoporosis assessment, including staging and BMD estimation. **The output MUST be the ANALYSIS RESULTS, not a description of the process or an HTML template.**

**Steps:**

1.  Radiographically evaluate the bone image (X-ray, DEXA if provided) for osteoporosis indicators:
    *   Assess cortical thickness (compare to age-matched normals if possible).
    *   Evaluate trabecular bone pattern and density (Singh Index if applicable to hip X-ray).
    *   Look for vertebral body deformities (wedge fractures, compression fractures) on spine X-rays.
    *   If DEXA scan is provided, directly interpret the T-score and Z-score at relevant sites (spine, hip, femoral neck).
2.  Determine the osteoporosis stage based on radiological findings and/or DEXA scores:
    *   Normal Bone Density (T-score -1.0 and above if DEXA).
    *   Osteopenia (T-score between -1.0 and -2.5 if DEXA, or radiological evidence of mild density reduction).
    *   Osteoporosis (T-score -2.5 or below if DEXA, or clear radiological evidence of significant density reduction and/or fragility fractures).
    *   Severe Osteoporosis (T-score -2.5 or below AND presence of fragility fractures if DEXA, or radiological evidence of severe density loss and multiple fractures).
3.  Estimate BMD qualitatively based on visual assessment if DEXA not available (e.g., relatively normal, mildly reduced, moderately reduced, severely reduced). If DEXA is available, report the T-score and BMD value at the measured site(s).
4.  Summarize the osteoporosis stage and BMD assessment.
5.  Discuss the clinical implications of the osteoporosis stage and BMD, including fracture risk.
6.  Recommend appropriate medical management strategies, including lifestyle modifications, calcium/vitamin D supplementation, and pharmacological interventions (bisphosphonates, etc.) based on osteoporosis stage and risk factors.

**Formatting:** Structure the clinical report in HTML, using \`<b>\` tags to emphasize the osteoporosis stage, BMD assessment, and clinical recommendations.

**Example of DESIRED output (Doctor Level Report):**

\`\`\`html
<p><b>Clinical Report: Osteoporosis Assessment</b></p>
<p><b>Osteoporosis Stage:</b> Osteoporosis.</p>
<p><b>Bone Mineral Density (BMD) Assessment:</b></p>
<p><b>DEXA Scan (Lumbar Spine L1-L4):</b> T-score = -2.8, BMD = 0.750 g/cm².</p>
<p><b>DEXA Scan (Femoral Neck):</b> T-score = -2.6, BMD = 0.680 g/cm².</p>
<p><b>Radiological Findings (X-ray):</b> Cortical thinning is evident in the lumbar spine. Vertebral body height reduction suggestive of compression fracture at L3.</p>
<p><b>Clinical Significance:</b>  The DEXA scan and X-ray findings confirm osteoporosis with low BMD and evidence of a vertebral compression fracture, indicating a high fracture risk.</p>
<p><b>Recommendations:</b>  Initiate pharmacological treatment for osteoporosis... (recommend specific medications, calcium/vitamin D, fall prevention strategies, further investigations if needed).</p>
\`\`\`

**Example of UNDESIRED output (Avoid this type):**

\`\`\`html
<p>This is an HTML template for generating clinical reports on osteoporosis assessment...</p>
<p>... (HTML code describing report template, not the report itself) ...</p>
\`\`\`

**Important: Your response MUST be a clinically detailed REPORT in HTML format as shown in the 'DESIRED output' example. Do NOT provide HTML code that is a template, describes report generation, or explains osteoporosis assessment in general. The output should be a specific, image-based clinical analysis.**`,
      },
      'bone-age': {
        common: `**Objective:** Analyze the X-ray image of a child's hand to predict bone age.

**Desired Output:** A simple bone age assessment report. **Crucially, provide ANALYSIS RESULTS, not process descriptions or HTML templates.**

**Steps:**

1. Examine the X-ray image of the hand and wrist.
2. Identify and assess the ossification status (appearance and fusion of ossification centers) of key bones in the hand and wrist, including:
    * Carpals (e.g., capitate, hamate, triquetral, lunate, scaphoid, trapezium, trapezoid, pisiform)
    * Metacarpals (1st to 5th)
    * Phalanges (proximal, middle, distal of each finger)
    * Radius and Ulna (distal epiphyses)
3. Compare the observed ossification patterns to standard bone age atlases or references (Greulich and Pyle, Tanner-Whitehouse, if internal data is available).
4. Predict the bone age based on the assessment. Provide the bone age as a single age in years and months, or as an age range (e.g., "Bone age is approximately 7 years and 6 months," or "Bone age is between 7 to 8 years").
5. Comment on whether the bone age appears to be:
    * Consistent with chronological age (normal bone age)
    * Advanced for chronological age (advanced bone age)
    * Delayed compared to chronological age (delayed bone age)
6. Provide a brief, easy-to-understand summary of the bone age assessment.

**Formatting:** Format the report as plain text, using HTML \`<b>\` tags to highlight the predicted bone age and whether it's normal, advanced, or delayed.

**Example of DESIRED output (Delayed Bone Age):**

\`\`\`html
<p><b>Bone Age Assessment:</b> Delayed bone age.</p>
<p><b>Predicted Bone Age:</b> Approximately 5 years and 0 months (5 years).</p>
<p><b>Chronological Age:</b> 7 years.</p>
<p><b>Analysis:</b> The bone age is estimated to be approximately 5 years, which is delayed compared to the chronological age of 7 years.  This suggests a possible delay in skeletal maturation.</p>
\`\`\`

**Example of UNDESIRED output (Avoid this type):**

\`\`\`html
<p>This HTML code can be used to generate bone age assessment reports...</p>
<p>... (HTML code describing report generation, not the report itself) ...</p>
\`\`\`

**Important: Your response MUST be the HTML code containing the ANALYSIS RESULTS as shown in the 'DESIRED output' example. Do NOT provide HTML code that describes how to perform the analysis, is a template, or is a general explanation of bone age assessment.** Focus SOLELY on the findings for THIS SPECIFIC IMAGE.`,
        doctor: `**Objective:** Provide a professional bone age determination from a hand and wrist X-ray, suitable for pediatric endocrinology or growth assessment.

**Desired Output:** A detailed bone age report with predicted age and clinical interpretation. **The output MUST be the ANALYSIS RESULTS, not a description of the process or an HTML template.**

**Steps:**

1.  Perform a detailed radiographic assessment of hand and wrist ossification.
2.  Evaluate ossification centers of all relevant bones in the hand and wrist according to a recognized bone age atlas method (state method used, e.g., Greulich-Pyle, Tanner-Whitehouse):
    *   Carpal bones (stage each carpal if using Tanner-Whitehouse)
    *   Epiphyses and metaphyses of radius and ulna (stage distal radius and ulna epiphyses)
    *   Metacarpals and phalanges (stage each phalanx and metacarpal epiphysis and physis)
3.  Assign bone age based on atlas matching (Greulich-Pyle) or scoring and atlas lookup (Tanner-Whitehouse). Report bone age in years and months.
4.  Compare bone age to chronological age. Calculate the bone age-chronological age difference.
5.  Interpret bone age in the context of chronological age:
    *   Bone age consistent with chronological age (within +/- 1 year is often considered normal variation).
    *   Advanced bone age (bone age significantly greater than chronological age, >1 year advanced).
    *   Delayed bone age (bone age significantly less than chronological age, >1 year delayed).
6.  Provide a clinical interpretation of the bone age finding, considering potential implications for growth, puberty, and endocrine disorders.
7.  Recommend further evaluation or clinical correlation if bone age is significantly advanced or delayed, or if clinically indicated.

**Formatting:** Structure the comprehensive bone age report in HTML, using \`<b>\` tags to emphasize the predicted bone age, age difference, and clinical interpretation.

**Example of DESIRED output (Doctor Level Report - Advanced Bone Age using Greulich-Pyle Atlas):**

\`\`\`html
<p><b>Bone Age Report (Greulich-Pyle Method)</b></p>
<p><b>Chronological Age:</b> 10 years and 3 months.</p>
<p><b>Predicted Bone Age (Greulich-Pyle Atlas):</b> 12 years and 6 months.</p>
<p><b>Bone Age-Chronological Age Difference:</b> +2 years and 3 months (Advanced Bone Age).</p>
<p><b>Radiographic Findings:</b>  Skeletal maturation is advanced for chronological age.  Carpal bone ossification and epiphyseal fusion at the distal radius and ulna are consistent with a bone age of 12.5 years based on Greulich-Pyle atlas standards (Atlas plate for 12.5-year-old male used for matching).</p>
<p><b>Clinical Interpretation:</b>  Advanced bone age is present, with a bone age exceeding chronological age by over 2 years. This finding may be indicative of... (potential endocrine causes, precocious puberty, growth disorders, etc.).</p>
<p><b>Recommendations:</b>  Clinical correlation with pubertal staging and growth parameters is recommended.  Consider endocrine evaluation to assess for potential underlying causes of advanced maturation, especially if pubertal precocity is suspected.</p>
\`\`\`

**Example of UNDESIRED output (Avoid this type):**

\`\`\`html
<p>This is an HTML template for generating bone age reports using the Greulich-Pyle method...</p>
<p>... (HTML code describing report template, not the report itself) ...</p>
\`\`\`

**Important: Your response MUST be a clinically detailed BONE AGE REPORT in HTML format as shown in the 'DESIRED output' example. Do NOT provide HTML code that is a template, describes report generation, or explains bone age assessment in general. The output should be a specific, image-based clinical analysis.**`,
      },
      'spine-fracture': {
        common: `**Objective:** Analyze the X-ray, MRI, or CT scan of the cervical spine to detect fractures.

**Desired Output:** A simple report on cervical spine fracture assessment. **Crucially, provide ANALYSIS RESULTS, not process descriptions or HTML templates.**

**Steps:**

1. Carefully examine the cervical spine image (X-ray, MRI, or CT scan).
2. Assess each cervical vertebra (C1-C7) for signs of fracture, including:
    * Breaks in the bony cortex
    * Step-offs or malalignment of vertebral bodies
    * Changes in vertebral height or shape (compression, wedge deformity)
    * Soft tissue swelling (if MRI or CT) suggestive of injury
3. Determine if a fracture is present in any of the cervical vertebrae. Answer "Yes" or "No" for fracture detection.
4. If a fracture IS detected:
    * Identify the specific vertebra(e) fractured (e.g., C5, C2, etc.).
    * Describe the type of fracture if possible to classify visually (e.g., compression fracture, burst fracture, etc. - if clear from the image type).
    * Provide a basic severity assessment (e.g., stable vs. potentially unstable - if possible to assess from image type).
    * Explain the potential implications of a cervical spine fracture in simple terms, including potential pain, movement restriction, and neurological concerns.
    * Recommend seeking immediate medical evaluation and care.

5. If NO fracture is detected:
    * State clearly: "**No fracture detected in the cervical spine in the provided image.**"
    * Optionally, comment on the normal appearance of the cervical spine if discernible.

**Formatting:** Format the report as plain text, using HTML \`<b>\` tags to highlight fracture presence, location, and severity.

**Example of DESIRED output (Fracture Detected):**

\`\`\`html
<p><b>Cervical Spine Fracture Assessment:</b> Fracture Detected.</p>
<p><b>Fractured Vertebra:</b> C5 vertebra.</p>
<p><b>Fracture Type (Visual Assessment):</b> Compression fracture.</p>
<p><b>Severity (Visual Assessment):</b> Potentially stable, but requires further evaluation.</p>
<p><b>Analysis:</b> A compression fracture is identified in the C5 vertebra of the cervical spine.  Cervical spine fractures can be serious... (explain potential implications and need for medical attention).</p>
\`\`\`

**Example of UNDESIRED output (Avoid this type):**

\`\`\`html
<p>This HTML code can be used to generate reports on cervical spine fracture analysis...</p>
<p>... (HTML code describing report generation, not the report itself) ...</p>
\`\`\`

**Important: Your response MUST be the HTML code containing the ANALYSIS RESULTS as shown in the 'DESIRED output' example. Do NOT provide HTML code that describes how to perform the analysis, is a template, or is a general explanation of spine fracture analysis.** Focus SOLELY on the findings for THIS SPECIFIC IMAGE.`,
        doctor: `**Objective:** Provide a clinical radiological report on cervical spine fracture analysis from X-ray, MRI, or CT, for diagnostic and treatment planning.

**Desired Output:** A comprehensive radiological report on cervical spine fracture findings. **The output MUST be the ANALYSIS RESULTS, not a description of the process or an HTML template.**

**Steps:**

1.  Perform a systematic radiological review of the cervical spine imaging (X-ray, MRI, or CT).
2.  Evaluate each cervical vertebra (C1-C7) and associated structures for fracture:
    *   Assess vertebral body, pedicles, laminae, spinous processes, transverse processes, and facets for fractures (describe fracture morphology, e.g., burst, teardrop, Jefferson, Hangman's, etc., if classifiable).
    *   Evaluate vertebral alignment (anterolisthesis, retrolisthesis, subluxation).
    *   Assess for ligamentous injury (prevertebral soft tissue swelling, widening of interspinous or interpedicular distances, facet joint widening - especially on MRI or CT).
    *   Evaluate spinal canal compromise and neural element compression (if MRI or CT).
3.  Identify all fractures and describe them in detail, including:
    *   Vertebra(e) involved (C1-C7) and specific part of vertebra fractured.
    *   Fracture type (classification if possible, e.g., AO classification, Denis classification for burst fractures).
    *   Displacement, angulation, and stability assessment (stable vs. unstable based on radiological criteria).
4.  Assess for associated injuries (e.g., spinal cord injury, nerve root compression, vascular injury - if MRI or CT findings suggest).
5.  Summarize the findings, provide a radiological diagnosis (e.g., "C5 burst fracture, unstable"), and assess overall cervical spine stability.
6.  Recommend further imaging (if needed for better characterization, e.g., CT if X-ray was initial study, MRI to assess soft tissues and cord if fracture detected) and suggest appropriate clinical management (conservative vs. surgical options, immobilization, neurosurgical consultation if cord compression).

**Formatting:** Structure the detailed radiological report in HTML, using \`<b>\` tags to emphasize key fracture findings, stability assessment, and clinical recommendations.

**Example of DESIRED output (Doctor Level Report - Cervical Spine Fracture):**

\`\`\`html
<p><b>Radiological Report: Cervical Spine Fracture Analysis</b></p>
<p><b>Findings:</b></p>
<p><b>Vertebral Fracture:</b>  Burst fracture of the C5 vertebral body.</p>
<p><b>Fracture Morphology:</b> Comminuted fracture with involvement of the anterior and posterior vertebral body elements.  Retropulsion of posterior vertebral body fragment into the spinal canal.</p>
<p><b>Vertebral Alignment:</b>  Anterolisthesis of C5 on C6 is present, with approximately 3mm anterior displacement.</p>
<p><b>Spinal Canal:</b>  Approximately 30% spinal canal compromise is noted at the C5 level due to retropulsion of bone fragment and posterior ligamentous complex buckling.</p>
<p><b>Soft Tissues (MRI findings if applicable):</b>  Prevertebral soft tissue edema is present.  Evidence of posterior ligamentous complex injury is suggested by... (MRI findings of ligament disruption/edema).</p>
<p><b>Stability Assessment:</b>  Radiologically unstable cervical spine injury due to burst fracture morphology, retropulsion, and anterolisthesis, concerning for injury to middle and posterior columns.</p>
<p><b>Neurological Assessment (if applicable):</b>  Spinal cord compression is present at C5 level, based on canal compromise and... (MRI findings of cord signal change if available).</p>
<p><b>Recommendations:</b>  Neurosurgical consultation is urgently recommended for surgical stabilization and decompression.  Recommend neurological examination to assess for cord injury.  Consider flexion-extension radiographs after stabilization to further assess ligamentous stability if appropriate.</p>
\`\`\`

**Example of UNDESIRED output (Avoid this type):**

\`\`\`html
<p>This is an HTML template for generating radiological reports on cervical spine fracture analysis...</p>
<p>... (HTML code describing report template, not the report itself) ...</p>
\`\`\`

**Important: Your response MUST be a clinically detailed RADIOLOGICAL REPORT in HTML format as shown in the 'DESIRED output' example. Do NOT provide HTML code that is a template, describes report generation, or explains cervical spine fracture radiology in general. The output should be a specific, image-based clinical analysis.**`,
      },
      'bone-tumor': {
        common: `**Objective:** Analyze the X-ray, MRI, CT scan, or biopsy image for potential bone tumors or cancerous growths.

**Desired Output:** A simple report on bone tumor assessment. **Crucially, provide ANALYSIS RESULTS, not process descriptions or HTML templates.**

**Steps:**

1. Examine the provided image for any signs of a bone tumor or unusual growth. Look for:
    * Abnormal masses or lesions within the bone
    * Bone destruction or erosion
    * Periosteal reaction (new bone formation around the tumor)
    * Soft tissue extension (if visible on image type)
2. Determine if there are suspicious findings suggestive of a bone tumor. Answer "Yes" or "No" for suspicion of tumor.
3. If a tumor is suspected:
    * Describe the location of the suspicious area in the bone.
    * Note the size and characteristics of the lesion (e.g., lytic, sclerotic, mixed, aggressive features - if visually assessable).
    * Indicate if it appears potentially concerning or benign-appearing based on visual characteristics (recognizing limitations of visual assessment).
    * Explain in simple terms that suspicious findings are present and require further medical investigation to determine the nature of the lesion (benign vs. malignant, type of tumor).
    * Recommend seeking medical consultation for further evaluation, including possible biopsy or advanced imaging.

4. If NO tumor is suspected:
    * State clearly: "**No evidence of bone tumor or suspicious mass is detected in the provided image.**"
    * Optionally, comment on the normal appearance of the bone if discernible.

**Formatting:** Format the report as plain text, using HTML \`<b>\` tags to highlight tumor suspicion, location, and key features.

**Example of DESIRED output (Tumor Suspected):**

\`\`\`html
<p><b>Bone Tumor Assessment:</b> Suspicious for Bone Tumor.</p>
<p><b>Location of Suspicion:</b> Distal femur, metaphysis region.</p>
<p><b>Lesion Characteristics (Visual Assessment):</b> Lytic lesion with cortical destruction and periosteal reaction, suggestive of aggressive lesion.</p>
<p><b>Analysis:</b> A suspicious lesion is identified in the distal femur... (explain that findings are concerning and require medical follow-up).</p>
\`\`\`

**Example of UNDESIRED output (Avoid this type):**

\`\`\`html
<p>This HTML code can be used to generate bone tumor assessment reports...</p>
<p>... (HTML code describing report generation, not the report itself) ...</p>
\`\`\`

**Important: Your response MUST be the HTML code containing the ANALYSIS RESULTS as shown in the 'DESIRED output' example. Do NOT provide HTML code that describes how to perform the analysis, is a template, or is a general explanation of bone tumor analysis.** Focus SOLELY on the findings for THIS SPECIFIC IMAGE.`,
        doctor: `**Objective:** Provide a clinical radiological report on bone tumor detection and characterization from X-ray, MRI, CT, or biopsy image, for differential diagnosis and management.

**Desired Output:** A comprehensive radiological report on bone tumor findings, including characterization and differential considerations. **The output MUST be the ANALYSIS RESULTS, not a description of the process or an HTML template.**

**Steps:**

1.  Perform a detailed radiological evaluation of the bone lesion (X-ray, MRI, CT, or review biopsy images if provided):
    *   Assess lesion location within the bone (epiphysis, metaphysis, diaphysis, medullary, cortical, intra-articular).
    *   Describe lesion morphology (size, shape, margins - well-defined vs. ill-defined, zone of transition).
    *   Evaluate matrix characteristics (lytic, sclerotic, mixed, ground glass, chondroid, osteoid).
    *   Assess cortical involvement (destruction, thinning, expansion, periosteal reaction type - solid, lamellated, spiculated, Codman triangle).
    *   Evaluate soft tissue extension (if MRI or CT), neurovascular involvement.
    *   If biopsy image provided, review histopathology for cell type, grade, and immunohistochemical markers.
2.  Characterize the lesion based on radiological features and biopsy (if available):
    *   Suggest likely diagnostic category (benign, malignant, indeterminate).
    *   If malignant, consider possible primary bone tumors (osteosarcoma, chondrosarcoma, Ewing sarcoma, fibrosarcoma, etc.) and metastatic disease.
    *   If benign, consider common benign bone lesions in the location and age group (e.g., enchondroma, osteochondroma, fibrous dysplasia, bone cyst, etc.).
3.  Provide a radiological differential diagnosis, listing the most likely diagnostic possibilities based on the imaging findings and clinical context.
4.  Assess the aggressiveness of the lesion based on radiological criteria (aggressive vs. non-aggressive features).
5.  Recommend further imaging (e.g., bone scan, PET-CT for staging if malignancy suspected, or biopsy if needed for diagnosis) and suggest appropriate clinical management pathways (referral to orthopedic oncology, surgical planning, medical oncology if malignant).

**Formatting:** Structure the detailed radiological report in HTML, using \`<b>\` tags to emphasize key lesion characteristics, differential diagnoses, and clinical recommendations.

**Example of DESIRED output (Doctor Level Report - Bone Tumor):**

\`\`\`html
<p><b>Radiological Report: Bone Tumor Analysis</b></p>
<p><b>Findings:</b></p>
<p><b>Lesion Location:</b>  Proximal tibia, metaphysis.</p>
<p><b>Lesion Morphology:</b>  Large, expansile lytic lesion with ill-defined margins and wide zone of transition.  Cortical destruction is evident with soft tissue extension.</p>
<p><b>Matrix:</b>  Predominantly lytic matrix with some areas of faint sclerosis. No obvious chondroid or osteoid matrix mineralization seen on radiographs (CT may be needed for better matrix characterization).</p>
<p><b>Periosteal Reaction:</b>  Aggressive periosteal reaction is present, with a speculated (sunburst) pattern.</p>
<p><b>Soft Tissue Mass:</b>  Large associated soft tissue mass is noted, extending into the anterior compartment of the leg.</p>
<p><b>Radiological Impression:</b>  Aggressive bone-destroying lesion in the proximal tibia metaphysis with aggressive radiological features.</p>
<p><b>Differential Diagnosis:</b></p>
<p>1.  Osteosarcoma (most concerning given age, location, and aggressive features)</p>
<p>2.  Ewing Sarcoma (consider in differential, though less typical matrix)</p>
<p>3.  Less likely:  Aggressive Fibrosarcoma/Undifferentiated Pleomorphic Sarcoma</p>
<p>4.  Benign lesions are less likely given the aggressive features, but consider... (uncommon benign aggressive lesions for completeness).</p>
<p><b>Recommendations:</b>  Urgent biopsy is required for definitive diagnosis and histological evaluation.  Staging studies (chest CT, bone scan, MRI of entire involved bone and adjacent joints) are recommended if malignancy is confirmed.  Referral to orthopedic oncology is essential for management planning.</p>
\`\`\`

**Example of UNDESIRED output (Avoid this type):**

\`\`\`html
<p>This is an HTML template for generating radiological reports on bone tumor analysis...</p>
<p>... (HTML code describing report template, not the report itself) ...</p>
\`\`\`

**Important: Your response MUST be a clinically detailed RADIOLOGICAL REPORT in HTML format as shown in the 'DESIRED output' example. Do NOT provide HTML code that is a template, describes report generation, or explains bone tumor radiology in general. The output should be a specific, image-based clinical analysis.**`,
      },
      'bone-infection': {
        common: `**Objective:** Analyze the X-ray, MRI, CT scan, or biopsy image for signs of bone infection (osteomyelitis).

**Desired Output:** A simple report on bone infection assessment. **Crucially, provide ANALYSIS RESULTS, not process descriptions or HTML templates.**

**Steps:**

1. Examine the provided image for signs of bone infection (osteomyelitis). Look for:
    * Bone destruction or lysis
    * Periosteal reaction (new bone formation, often irregular or thick)
    * Soft tissue swelling or abscess (if visible on image type)
    * Sequestrum (dead bone fragment) or involucrum (new bone surrounding sequestrum) - more typical of chronic osteomyelitis.
2. Determine if there are findings suggestive of bone infection. Answer "Yes" or "No" for suspicion of infection.
3. If bone infection is suspected:
    * Describe the location of suspected infection in the bone.
    * Note the characteristics of the findings (e.g., bone destruction, periosteal reaction, soft tissue swelling).
    * Indicate if it appears potentially acute or chronic based on visual characteristics (recognizing limitations of visual assessment).
    * Explain in simple terms that suspicious findings are present and require further medical investigation to confirm bone infection and determine appropriate treatment.
    * Recommend seeking medical consultation for evaluation, including possible blood tests, further imaging, or bone biopsy/aspiration.

4. If NO bone infection is suspected:
    * State clearly: "**No evidence of bone infection (osteomyelitis) is detected in the provided image.**"
    * Optionally, comment on the normal appearance of the bone if discernible.

**Formatting:** Format the report as plain text, using HTML \`<b>\` tags to highlight infection suspicion, location, and key features.

**Example of DESIRED output (Infection Suspected):**

\`\`\`html
<p><b>Bone Infection (Osteomyelitis) Assessment:</b> Suspicious for Bone Infection.</p>
<p><b>Location of Suspicion:</b> Tibial shaft, diaphysis.</p>
<p><b>Findings (Visual Assessment):</b>  Bone destruction (lysis) in the tibial shaft with irregular periosteal reaction and adjacent soft tissue swelling.</p>
<p><b>Analysis:</b> Findings are suspicious for osteomyelitis (bone infection) in the tibial shaft... (explain that findings require medical follow-up to confirm infection).</p>
\`\`\`

**Example of UNDESIRED output (Avoid this type):**

\`\`\`html
<p>This HTML code can be used to generate bone infection (osteomyelitis) assessment reports...</p>
<p>... (HTML code describing report generation, not the report itself) ...</p>
\`\`\`

**Important: Your response MUST be the HTML code containing the ANALYSIS RESULTS as shown in the 'DESIRED output' example. Do NOT provide HTML code that describes how to perform the analysis, is a template, or is a general explanation of bone infection analysis.** Focus SOLELY on the findings for THIS SPECIFIC IMAGE.`,
        doctor: `**Objective:** Provide a clinical radiological report on bone infection (osteomyelitis) detection and characterization from X-ray, MRI, CT scan, or biopsy image, for diagnosis and management.

**Desired Output:** A comprehensive radiological report on bone infection findings, including characterization and diagnostic considerations. **The output MUST be the ANALYSIS RESULTS, not a description of the process or an HTML template.**

**Steps:**

1.  Perform a detailed radiological evaluation for osteomyelitis (X-ray, MRI, CT scan, or review biopsy images if provided):
    *   Assess for bone destruction (lytic lesions, cortical erosion, intraosseous abscess).
    *   Evaluate periosteal reaction (type, location, extent - solid, lamellated, irregular).
    *   Assess for sequestrum formation (dead bone fragment) and involucrum (new bone surrounding sequestrum) - indicators of chronic osteomyelitis.
    *   Evaluate soft tissue involvement (swelling, cellulitis, abscess formation, sinus tracts - especially on MRI or CT).
    *   If nuclear medicine scans are provided (bone scan, WBC scan), interpret for areas of increased radiotracer uptake consistent with infection.
    *   If biopsy image provided, review histopathology for inflammatory infiltrate, bacterial or fungal organisms, bone necrosis.
2.  Characterize the osteomyelitis based on imaging features and biopsy (if available):
    *   Determine likely chronicity (acute, subacute, chronic) based on radiological features.
    *   Assess extent and location of infection within the bone and soft tissues.
    *   Consider possible causative organisms based on clinical context (e.g., Staphylococcus aureus in acute hematogenous osteomyelitis, Pseudomonas in puncture wounds, etc. - though imaging is not specific for organism).
3.  Provide a radiological differential diagnosis, considering osteomyelitis vs. other conditions that can mimic infection (e.g., bone tumor, fracture with secondary callus formation, inflammatory arthropathy).
4.  Assess severity and complications of osteomyelitis (e.g., presence of abscess, sinus tract, joint involvement, septic arthritis).
5.  Recommend further imaging (if needed for better delineation of infection extent, e.g., MRI if X-ray was initial study, or to guide biopsy), suggest appropriate diagnostic studies (blood cultures, bone biopsy/aspiration for culture and sensitivity), and recommend clinical management strategies (antibiotic therapy, surgical debridement if abscess or sequestrum present, infectious disease consultation).

**Formatting:** Structure the detailed radiological report in HTML, using \`<b>\` tags to emphasize key infection findings, differential diagnoses, and clinical recommendations.

**Example of DESIRED output (Doctor Level Report - Osteomyelitis):**

\`\`\`html
<p><b>Radiological Report: Osteomyelitis Assessment</b></p>
<p><b>Findings:</b></p>
<p><b>Bone Destruction:</b>  Lytic destruction is noted in the tibial diaphysis, with cortical erosion and intramedullary involvement.</p>
<p><b>Periosteal Reaction:</b>  Irregular, thick periosteal reaction (lamellated and solid components) is present along the tibial diaphysis, consistent with active bone remodeling and infection.</p>
<p><b>Soft Tissue Swelling (MRI findings if applicable):</b>  Extensive soft tissue edema and inflammation are seen surrounding the tibia, with evidence of intramuscular abscess formation in the anterior compartment.</p>
<p><b>Sequestrum/Involucrum:</b>  A small sequestrum (devitalized bone fragment) is suspected within the lytic lesion, with early involucrum formation surrounding it, suggesting subacute to chronic osteomyelitis.</p>
<p><b>Radiological Impression:</b>  Radiological findings are highly suggestive of subacute to chronic osteomyelitis of the tibial diaphysis, with bone destruction, periosteal reaction, and soft tissue abscess.</p>
<p><b>Differential Diagnosis:</b></p>
<p>1.  Osteomyelitis (most likely diagnosis given radiological features)</p>
<p>2.  Less likely: Bone tumor with secondary infection (less typical radiological appearance for primary bone tumors, but cannot be entirely excluded without biopsy)</p>
<p>3.  Rarely:  Atypical inflammatory bone condition (e.g., chronic recurrent multifocal osteomyelitis - CRMO, consider if clinical context is atypical for bacterial infection)</p>
<p><b>Recommendations:</b>  Bone biopsy and aspiration are recommended to obtain specimens for Gram stain, bacterial and fungal cultures, and histopathology to confirm diagnosis and identify causative organism.  MRI with and without contrast is recommended to better delineate the extent of bone and soft tissue infection, and to assess for joint involvement or sinus tracts.  Infectious disease consultation is recommended for antibiotic management planning.  Surgical debridement may be necessary if abscess or sequestrum is confirmed or if antibiotic therapy alone is not effective.</p>
\`\`\`

**Example of UNDESIRED output (Avoid this type):**

\`\`\`html
<p>This is an HTML template for generating radiological reports on osteomyelitis assessment...</p>
<p>... (HTML code describing report template, not the report itself) ...</p>
\`\`\`

**Important: Your response MUST be a clinically detailed RADIOLOGICAL REPORT in HTML format as shown in the 'DESIRED output' example. Do NOT provide HTML code that is a template, describes report generation, or explains osteomyelitis radiology in general. The output should be a specific, image-based clinical analysis.**`
      }
    }

    // Initialize Gemini API - API Key is read from Deno Environment Variables
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase Client - for database interactions and storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Log task processing - for debugging and monitoring
    console.log(`Processing ${taskId} task with Gemini AI...`)

    // Gemini  API Endpoint - Model is explicitly set to 'gemini-2.0-flash-thinking-exp-01-21'
    const baseURL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-thinking-exp-01-21:generateContent"
    const url = `${baseURL}?key=${apiKey}`

    // Data URI to Base64 Conversion - Extracts base64 image data from Data URI format
    let base64Data = image
    if (image.includes('base64,')) {
      base64Data = image.split('base64,')[1]
    }

    // Prompt Selection - Chooses prompt based on task ID and user type (common/doctor)
    const userCategory = userType === 'doctor' ? 'doctor' : 'common'
    const promptText = taskPrompts[taskId]?.[userCategory] || `Analyze this medical image for ${taskTitle}.`

    // Formatting Instruction - Ensures Gemini uses HTML <b> tags in the response
    const formattingInstruction = "Make sure to format important information using HTML <b> tags for bold (not markdown asterisks)."

    // Gemini API Request Payload - Structured request body for Gemini API
    const payload = {
      contents: [
        {
          parts: [
            { text: promptText + " " + formattingInstruction },
            {
              inline_data: {
                mime_type: "image/jpeg", // Assuming JPEG images for now
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0, // Lower temperature for more deterministic and focused responses
        maxOutputTokens: 1048576, // Increased maxOutputTokens for potentially longer analysis results
      }
    }

    // Log API Request Model -  For transparency, logging which model is being called
    console.log(`Sending request to Gemini with model: gemini-2.0-flash-thinking-exp-01-21`);

    // Gemini API Call -  Fetch request to the Gemini API
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })

    // Gemini API Response Error Handling - Checks for HTTP errors from Gemini API
    if (!response.ok) {
      const errorText = await response.text()
      console.error("Gemini API error:", errorText)
      console.error("Gemini API full response:", response) // Log the full response for more details
      try {
        const errorJson = await response.json();
        console.error("Gemini API error JSON:", errorJson); // Try to log JSON error if available
      } catch (jsonError) {
        console.error("Failed to parse Gemini error JSON:", jsonError);
      }
      throw new Error(`Gemini API error: ${response.status} ${errorText}`)
    }

    // Parse Gemini API Response - Parses JSON response from Gemini API
    const data = await response.json()

    // Gemini API No Candidates Check - Checks if Gemini returned any valid candidates in the response
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No response generated by the model")
    }

    // Extract Analysis Text - Extracts the text analysis from Gemini's response
    let analysisText = data.candidates[0].content.parts[0].text;

    // Remove asterisks for bold if they are present, assuming Gemini might still use them sometimes.
    // Replace markdown bold (**) with HTML bold tags. This is a fallback in case Gemini uses markdown.
    analysisText = analysisText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    // Remove any remaining single asterisks that might be around words.
    analysisText = analysisText.replace(/\*(.*?)\*/g, '<b>$1</b>');
    // Remove any standalone asterisks that are not part of bold formatting.
    analysisText = analysisText.replace(/\*/g, '');


    // **IMPORTANT LOGGING FOR DEBUGGING TRUNCATION - PLEASE PROVIDE THESE LOGS**
    console.log("Full Gemini analysisText (before DB storage):", analysisText);

    // Initialize Storage Variables - Variables to store image URL and analysis ID
    let imageUrl = null
    let analysisId = null

    // Database Storage - Stores analysis results, image (optionally) in Supabase
    if (userId && analysisText) {
      try {
        // Image Storage in Supabase Storage (Conditional) - Stores image in Supabase Storage if image data is available
        if (image) {
          // Bucket Existence Check - Checks if the storage bucket exists, creates it if not
          const { data: buckets } = await supabase.storage.listBuckets()
          const bucketName = 'bone-analysis-images'

          if (!buckets?.find(b => b.name === bucketName)) {
            await supabase.storage.createBucket(bucketName, {
              public: false, // Bucket is private for security
              fileSizeLimit: 5242880 // 5MB file size limit
            })
          }

          // Unique File Name Generation - Creates a unique file name to avoid collisions
          const fileName = `${userId}/${taskId}/${Date.now()}.jpg`

          // Image Upload to Supabase Storage - Uploads the image using Deno-compatible method
          const base64ImageData = image.split('base64,')[1];
          const imageBuffer = Uint8Array.from(atob(base64ImageData), c => c.charCodeAt(0));


          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, imageBuffer, {  // Use imageBuffer (Uint8Array) here
              contentType: 'image/jpeg',
              upsert: true // Overwrites file if it already exists (for updates if needed)
            })

          // Image Upload Error Handling - Handles errors during image upload to Supabase Storage
          if (uploadError) {
            console.error("Error uploading image:", uploadError)
          } else if (uploadData) {
            // Public URL Retrieval - Gets the public URL of the uploaded image from Supabase Storage
            const { data: publicUrlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(fileName)

            imageUrl = publicUrlData?.publicUrl || null // Assigns public URL if available
          }
        }

        // Analysis Data Insertion to Supabase DB - Stores analysis metadata and results in 'analyses' table
        const { data: analysisData, error: insertError } = await supabase
          .from('analyses')
          .insert({
            user_id: userId,
            task_id: taskId,
            task_name: taskTitle,
            result_text: analysisText,
            image_url: imageUrl
          })
          .select() // Select data after insert to get the new analysis ID

        // Analysis Data Insertion Error Handling - Handles errors during analysis data insertion
        if (insertError) {
          console.error("Error storing analysis:", insertError)
        } else if (analysisData && analysisData.length > 0) {
          analysisId = analysisData[0].id // Extracts the newly created analysis ID
          console.log("Analysis stored successfully with ID:", analysisId)
        }
      } catch (storageError) {
        console.error("Error in storage process:", storageError) // Catches any errors during storage operations
      }
    }

    // Return Analysis Result - Returns the analysis text, analysis ID, and image URL in the HTTP response
    return new Response(
      JSON.stringify({
        analysis: analysisText,
        analysisId,
        imageUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("Error processing image:", error) // General error handler for the entire function
    return new Response(
      JSON.stringify({ error: `Failed to process the image: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
