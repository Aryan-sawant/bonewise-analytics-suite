# BoneWise Analytics Suite 🦴✨

**Revolutionizing Bone Health Diagnostics with Generative AI**

**Live Demo:** [**https://bonehealthaisuite.netlify.app/**](https://bonehealthaisuite.netlify.app/) 🚀

---

BoneWise Analytics Suite is an innovative platform designed to assist patients and doctors in analyzing bone-related medical images (X-ray, CT, MRI, DEXA, Biopsy) efficiently and accurately. Leveraging the power of Google's cutting-edge **Gemini 2.5 Pro** generative AI, this suite aims to:

*   💰 Make diagnostics more **cost-effective** for patients.
*   ⏱️ Help doctors make **quicker, informed decisions**.
*   🤝 Build **trust** by providing a reliable "second read" for cross-verification.

Previously limited by resource constraints (GPU exhaustion) when training traditional CNN models (like ResNet18) on large datasets, this project now harnesses the scalability and advanced reasoning capabilities of generative AI via API.

---

## ✨ Key Features

*   **Comprehensive Analysis:** Performs 8 distinct bone health assessments:
    *   🦴 **Bone Fracture Detection** (using AO/OTA Classification)
    *   🔬 **Bone Marrow Cell Classification**
    *   🦵 **Knee Joint Osteoarthritis** (using K-L Grading)
    *   📉 **Osteoporosis Stage & BMD Score**
    *   👶 **Bone Age Detection** (using GP Atlas / TW Method)
    *   🦴**Cervical Spine Fracture Detection** (using AO/OTA Classification)
    *   🦴**Bone Tumor/Cancer Detection**
    *   🦠 **Bone Infection Detection** (Osteomyelitis)
*   **Dual User Roles:** Provides tailored outputs:
    *   **Common Users (Patients):** Simplified explanations, recovery advice, basic nutrition plans.
    *   **Doctors (Clinicians):** Detailed classifications (AO/OTA, K-L codes), treatment suggestions, medication insights, specific rehab plans.
*   **Smart Image Handling:** Gracefully prompts users to upload relevant medical images if an unrelated image is provided.
*   **Interactive Experience:**
    *   🖼️ Image viewer with zoom/pan capabilities.
    *   📄 Download analysis reports as PDF.
    *   🤖 Context-aware **Chatbot** for follow-up questions regarding the analysis.
*   **User Dashboard:**
    *   📊 View and manage **Analysis History** (filter, export, share).
    *   ⚙️ Simple **Account Settings**.
*   **Specialist Finder:** Redirects common users to Google Maps to find relevant nearby specialists based on the analysis task.

---

## 🛠️ Technology Stack

*   **Frontend:** React, Vite, TypeScript
*   **UI:** Tailwind CSS, shadcn-ui
*   **Backend & Database:** Supabase (PostgreSQL, Auth, Storage)
*   **AI Engine:** Google Gemini 2.5 Pro API

---

## 🚀 Getting Started

Follow these steps to run the project locally:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Aryan-sawant/bonewise-analytics-suite.git
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd bonewise-analytics-suite
    ```
3.  **Install dependencies:**
    ```bash
    npm i
    ```
4.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open your browser and navigate to the port specified in your terminal.

---

## 📸 Screenshots / Demo

*   **Landing Page:**
    ![Landing Page Screenshot](https://github.com/Aryan-sawant/bonewise-analytics-suite/blob/main/Landing%20Page.png?raw=true)

*   **Analysis Result:**
    *(Replace URL_TO_YOUR_SCREENSHOT_2 with the actual URL for your analysis result screenshot)*
    ![Analysis Result Placeholder](URL_TO_YOUR_SCREENSHOT_2)

*(Feel free to add more screenshots showcasing other key features like the dashboard, task selection, chatbot, etc.)*

---

## 🤝 Contributing

Contributions are welcome! If you have suggestions for improvements or want to fix a bug, please feel free to:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/YourFeature` or `bugfix/YourBugfix`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/YourFeature`).
6.  Open a Pull Request.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). <!-- Make sure you have a LICENSE file -->

---

Made with ❤️ by Aryan Sawant
