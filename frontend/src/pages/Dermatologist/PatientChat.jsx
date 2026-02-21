// PatientChat.jsx

import { useState } from "react"
import { User, Send, ArrowLeft } from "lucide-react"
import { useParams, useNavigate } from "react-router-dom"
import ImageManagement from './ImageManagement'
import ClinicalNotes from './ClinicalNotes'
import TreatmentPlanning from "./TreatmentPlanning"
import FollowUpScheduling from "./FollowUpScheduling"

// ✅ Mock patient list
const mockPatients = {
  "1": { id: "1", name: "John Doe" },
  "2": { id: "2", name: "Sarah Smith" },
}

const mockPatientData = {
  medicalReport: {
    diagnosis: "Scalp Dandruff",
    severity: "Moderate",
    allergies: ["Dust", "Hair Products"],
    medications: ["Anti-dandruff shampoo", "Moisturizing scalp oil"],
  },
  treatmentNotes: [
    { id: 1, note: "Redness reduced", date: "2026-01-02" },
    { id: 2, note: "Scalp less itchy", date: "2026-01-05" },
  ],
  treatmentPlan: [
    "Use anti-dandruff shampoo every other day",
    "Apply scalp oil twice a week",
    "Avoid hair styling products for 1 week",
    "Follow-up in 7 days",
  ],
  appointments: {
    previous: [{ id: 1, date: "2025-12-20", reason: "Initial Checkup" }],
    upcoming: [{ id: 2, date: "2026-01-15", reason: "Follow-up Visit" }],
  },

  preVisitImage: {
    url: "data:image/jpeg;base64,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",
    date: "2025-12-15",
  },

  followUpImages: [
    {
      url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQGiGoaGaSSqA89iZv4GDBR8ccZPOs5hXwq-Q&s",
      date: "2026-01-02",
    },
    {
      url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLp7iHP-tlr8H6JdSnZ1BOtCGipKr30MzoFQ&s",
      date: "2026-01-05",
    },
    {
      url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1eJ_KCdZmi21gr9CFLBoT8h9CaL5z39rbkA&s",
      date: "2026-01-08",
    },
  ],
}
// -----------------------------
// PatientChat Component
// -----------------------------
const PatientChat = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Get patient info
  const patient = mockPatients[id] || { name: "Unknown Patient" };

  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState([
    { id: 1, sender: "patient", text: "Hi doctor, my rash is getting worse.", time: "10:00 AM" },
    { id: 2, sender: "dermatologist", text: "Please send me a photo.", time: "10:05 AM" },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [newFile, setNewFile] = useState(null);

  const sendMessage = () => {
    if (!newMessage && !newFile) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "dermatologist",
        text: newMessage,
        file: newFile,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setNewMessage("");
    setNewFile(null);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-white rounded-xl shadow-lg flex-1 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <User className="w-5 h-5 text-emerald-600" />
            </div>

            <div>
              <p className="font-semibold">{patient.name}</p>
              <p className="text-xs text-gray-500">Active Case</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-2 border-b text-xs overflow-x-auto">
          {[ "Report", "comparison", "notes", "plan", "appointments", "images"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg ${
                activeTab === tab ? "bg-emerald-600 text-white" : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
{/* Report Tab */}
{activeTab === "Report" && (
  <div className="space-y-6">
    {/* Reports Header */}
    <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Medical Reports</h2>

    {/* Hard-coded Eczema Reports */}
    <div className="space-y-4">
      {/* Report 1 */}
      <div className="p-4 border-l-4 border-emerald-500 bg-emerald-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
        <p className="text-sm text-gray-500 mb-1"><b>Date:</b> 2026-01-05</p>
        <p className="text-lg font-semibold text-gray-800 mb-1">Eczema Flare-up</p>
        <p><b>Severity:</b> Moderate</p>
        <p><b>Symptoms:</b> Redness, Itching, Dry patches</p>
        <p><b>Medications:</b> Hydrocortisone Cream, Moisturizer</p>
      </div>

      {/* Report 2 */}
      <div className="p-4 border-l-4 border-emerald-500 bg-emerald-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
        <p className="text-sm text-gray-500 mb-1"><b>Date:</b> 2025-12-15</p>
        <p className="text-lg font-semibold text-gray-800 mb-1">Eczema Management Check</p>
        <p><b>Severity:</b> Mild</p>
        <p><b>Symptoms:</b> Dry patches, Slight itching</p>
        <p><b>Medications:</b> Emollient Cream</p>
      </div>

      {/* Report 3 */}
      <div className="p-4 border-l-4 border-emerald-500 bg-emerald-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
        <p className="text-sm text-gray-500 mb-1"><b>Date:</b> 2025-11-30</p>
        <p className="text-lg font-semibold text-gray-800 mb-1">Eczema Flare-up</p>
        <p><b>Severity:</b> Severe</p>
        <p><b>Symptoms:</b> Redness, Crusting, Intense itching</p>
        <p><b>Medications:</b> Corticosteroid Ointment, Oral Antihistamines</p>
      </div>
    </div>

    {/* Upload New Report Button */}
    <div className="mt-6">
      <button
        className="w-full px-5 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
        onClick={() => alert("Open upload report dialog with date picker")}
      >
        Upload New Report
      </button>
    </div>
  </div>
)}



          {/* Comparison Tab */}
          {activeTab === "comparison" && <ImageManagement />}

          {/* Notes Tab */}
          {activeTab === "notes" && <ClinicalNotes />}

          {/* Plan Tab */}
          {activeTab === "plan" && <TreatmentPlanning />}

          {/* Appointments Tab */}
          {activeTab === "appointments" && <FollowUpScheduling />}

          {/* Images Tab */}
        {activeTab === "images" && (
  <div className="flex flex-col gap-4">
    {/* Pre-visit Image */}
    <div>
      <p className="text-sm font-semibold mb-1">Pre-Visit Image: {mockPatientData.preVisitImage.date}</p>
      <img
        src={mockPatientData.preVisitImage.url}
        alt="Pre-visit"
        className="w-full max-w-md rounded-lg border"
      />
    </div>

    {/* Follow-up Images */}
    <div>
      <p className="text-sm font-semibold mb-2">Follow-Up Images:</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {mockPatientData.followUpImages.map((img, i) => (
          <div key={i} className="flex flex-col items-center">
            <img
              src={img.url}
              alt={`Follow-up ${i + 1}`}
              className="w-full max-w-xs rounded-lg border"
            />
            <span className="text-xs text-gray-500 mt-1">{img.date}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
)}

        </div>
      </div>
    </div>
  );
};

export default PatientChat;
