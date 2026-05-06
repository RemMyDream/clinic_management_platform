import React, { useState, useEffect, FormEvent, PropsWithChildren, HTMLAttributes, OlHTMLAttributes, LiHTMLAttributes } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-toastify';
import { patientApi, chatApi } from '../services/api';

// Patient data structure
interface Patient {
    id: number;
    full_name: string;
    date_of_birth?: string;
    gender?: string;
    address?: string;
    phone_number?: string;
    emr_summary?: string;
    creator_id: number;
    assigned_staff_id?: number | null; // Changed from assigned_cadre_id
    created_at: string;
    updated_at: string;
}

// Chat message structure
interface ChatMessage {
    id: string; // Unique message ID
    sender: 'user' | 'ai';
    text: string;
}

// Custom Markdown renderers

// For <p>
type CustomParagraphProps = PropsWithChildren<{ node?: any } & Omit<HTMLAttributes<HTMLParagraphElement>, 'ref'>>;
const CustomParagraph: React.FC<CustomParagraphProps> = ({ children, node, style, ...rest }) => {
  return (
    <p {...rest} style={{ ...style, marginBottom: '0.5em' }}>
      {children}
    </p>
  );
};

// For <ul>
type CustomUlProps = PropsWithChildren<{ node?: any } & Omit<HTMLAttributes<HTMLUListElement>, 'ref'>>;
const CustomUl: React.FC<CustomUlProps> = ({ children, node, style, ...rest }) => {
  return (
    <ul {...rest} style={{ ...style, paddingLeft: '20px', marginTop: '0.5em', marginBottom: '0.5em' }}>
      {children}
    </ul>
  );
};

// For <ol>
type CustomOlProps = PropsWithChildren<{ node?: any } & Omit<OlHTMLAttributes<HTMLOListElement>, 'ref'>>;
const CustomOl: React.FC<CustomOlProps> = ({ children, node, style, ...rest }) => {
  return (
    <ol {...rest} style={{ ...style, paddingLeft: '20px', marginTop: '0.5em', marginBottom: '0.5em' }}>
      {children}
    </ol>
  );
};

// For <li>
type CustomLiProps = PropsWithChildren<{ node?: any } & Omit<LiHTMLAttributes<HTMLLIElement>, 'ref'>>;
const CustomLi: React.FC<CustomLiProps> = ({ children, node, style, ...rest }) => {
  return (
    <li {...rest} style={{ ...style, marginBottom: '0.25em' }}>
      {children}
    </li>
  );
};

const DashboardPage: React.FC = () => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loadingPatients, setLoadingPatients] = useState<boolean>(true);
    const [errorPatients, setErrorPatients] = useState<string | null>(null);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [loadingSelectedPatientDetails, setLoadingSelectedPatientDetails] = useState<boolean>(false);

    // Chat state
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [currentMessage, setCurrentMessage] = useState<string>('');
    const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
    const [errorChat, setErrorChat] = useState<string | null>(null);

    // Base font size
    const baseFontSize = '16px'; 
    const headingFontSize = '1.5em'; 
    const subHeadingFontSize = '1.25em';
    const itemFontSize = '1.1em';

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                setLoadingPatients(true);
                const res = await patientApi.getAll(0, 500);
                setPatients(res.data);
                setErrorPatients(null);
            } catch (err: any) {
                setErrorPatients(err.response?.data?.detail || 'Không thể tải danh sách bệnh nhân.');
            } finally {
                setLoadingPatients(false);
            }
        };
        fetchPatients();
    }, []);

    const handleLogout = () => {
        toast.success('Ban đã đăng xuất thành công.');
        setTimeout(() => {
            localStorage.removeItem('accessToken');
            window.location.href = '/login';
        }, 1000);
    };

    // Handle selecting a patient
    const handleSelectPatient = async (patient: Patient) => { 
        setLoadingSelectedPatientDetails(true);
        setSelectedPatient(null); // Clear previous patient for better UX
        setChatHistory([]); 
        setCurrentMessage('');
        setErrorChat(null);

        // Simulate delay for loading indicator
        // In a real app, fetch more patient-specific details here
        await new Promise(resolve => setTimeout(resolve, 300)); 

        setSelectedPatient(patient); // Set new patient after loading
        console.log("Selected patient:", patient);
        setLoadingSelectedPatientDetails(false);
    };

    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault(); // Prevent page reload
        if (!currentMessage.trim() || !selectedPatient) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString() + '-user', // Simple unique ID
            sender: 'user',
            text: currentMessage,
        };
        setChatHistory(prevHistory => [...prevHistory, userMessage]);
        setCurrentMessage(''); // Clear input field
        setIsSendingMessage(true);
        setErrorChat(null);

        try {
            const response = await chatApi.sendStaff(selectedPatient.id, userMessage.text);
            const aiMessage: ChatMessage = {
                id: Date.now().toString() + '-ai',
                sender: 'ai',
                text: response.data.reply,
            };
            setChatHistory(prevHistory => [...prevHistory, aiMessage]);
        } catch (err: any) {
            setErrorChat(err.response?.data?.detail || 'Không thể gửi tin nhắn.');
        } finally {
            setIsSendingMessage(false);
        }
    };

    if (loadingPatients) {
        return <div style={{ padding: '30px', fontSize: itemFontSize, color: '#333' }}>Loading patient list...</div>; 
    }

    return (
        <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 50px)', fontSize: baseFontSize, backgroundColor: '#f4f7f6' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px solid #cdd5de' }}>
                <h2 style={{ fontSize: headingFontSize, color: '#2c3e50', margin: 0 }}>Welcome Staff to Dashboard</h2> {/* Changed "cán bộ" to "Staff" */}
                <button 
                    onClick={handleLogout} 
                    style={{
                        padding: '12px 20px', 
                        fontSize: '1em',
                        cursor: 'pointer', 
                        backgroundColor: '#e74c3c', // Softer red
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '5px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                >
                    Logout
                </button>
            </header>

            {errorPatients && <p style={{ color: '#c0392b', fontSize: itemFontSize, margin: '0 0 20px 0' }}>Error fetching patient list: {errorPatients}</p>}

            <div style={{ display: 'flex', flexGrow: 1, gap: '25px', overflow: 'hidden' }}>
                <div style={{ width: '350px', borderRight: '1px solid #cdd5de', paddingRight: '25px', overflowY: 'auto', height: '100%', backgroundColor: '#ffffff', borderRadius: '5px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: subHeadingFontSize, color: '#34495e', marginBottom: '15px', paddingTop: '15px', paddingLeft: '15px' }}>Patients</h3>
                    {patients.length > 0 ? (
                        <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                            {patients.map((patient) => (
                                <li
                                    key={patient.id}
                                    onClick={() => handleSelectPatient(patient)}
                                    style={{
                                        padding: '15px 20px', 
                                        borderBottom: '1px solid #ecf0f1',
                                        cursor: 'pointer',
                                        backgroundColor: selectedPatient?.id === patient.id ? '#3498db' : 'transparent', // Highlight selected
                                        color: selectedPatient?.id === patient.id ? '#ffffff' : '#2c3e50',
                                        fontWeight: selectedPatient?.id === patient.id ? 'bold' : 'normal',
                                        fontSize: itemFontSize, 
                                        transition: 'background-color 0.2s ease-in-out, color 0.2s ease-in-out',
                                    }}
                                >
                                    {patient.full_name} (ID: {patient.id})
                                </li>
                            ))}
                        </ul>
                    ) : (
                        !loadingPatients && <p style={{ fontSize: itemFontSize, padding: '15px', color: '#7f8c8d' }}>No patients found.</p>
                    )}
                </div>

                <div style={{ flexGrow: 1, paddingLeft: '25px', display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#ffffff', borderRadius: '5px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    {loadingSelectedPatientDetails ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', height: '100%', color: '#34495e', fontSize: itemFontSize, paddingLeft: '20px' }}> 
                            <p style={{ textAlign: 'left' }}>Loading patient information...</p> 
                        </div>
                    ) : selectedPatient ? (
                        <>
                            <h3 style={{ fontSize: subHeadingFontSize, color: '#34495e', marginBottom: '10px' }}>Patient Information: {selectedPatient.full_name}</h3>
                            <p style={{ fontSize: '1em', color: '#555', marginBottom: '5px' }}><strong>Date of Birth:</strong> {selectedPatient.date_of_birth || 'N/A'}</p>
                            <p style={{ fontSize: '1em', color: '#555', marginBottom: '5px' }}><strong>EMR Summary:</strong></p>
                            <div style={{ maxHeight: '180px', overflowY: 'auto', backgroundColor: '#fdfdfe', border: '1px solid #e0e6ed', padding: '15px', borderRadius: '5px', marginBottom: '20px', fontSize: '1em', textAlign: 'left' }}> 
                                {selectedPatient.emr_summary && selectedPatient.emr_summary.trim().length > 0 ? (
                                    <ul style={{ listStyleType: 'disc', paddingLeft: '25px', margin: 0, color: '#333' }}>
                                        {selectedPatient.emr_summary.split('\n').map((item, index) => 
                                            item.trim() && <li key={index} style={{ marginBottom: '8px', lineHeight: '1.6' }}>{item.trim().replace(/^- /, '')}</li>
                                        )}
                                    </ul>
                                ) : (
                                    <p style={{ margin: 0, fontStyle: 'italic', color: '#7f8c8d' }}>No EMR summary available.</p>
                                )}
                            </div>
                            
                            <div style={{ borderTop: '1px solid #cdd5de', marginTop: 'auto', paddingTop: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <h4 style={{ fontSize: subHeadingFontSize, color: '#34495e', marginBottom: '15px' }}>Symptom Checker</h4>
                                <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '15px', padding: '15px', border: '1px solid #e0e6ed', borderRadius: '5px', backgroundColor: '#f4f7f6' }}>
                                    {chatHistory.map((msg) => (
                                        <div key={msg.id} style={{
                                            marginBottom: '15px',
                                            display: 'flex',
                                            justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                            ...(msg.sender === 'ai' && { marginLeft: '10px' }), // AI messages margin
                                            ...(msg.sender === 'user' && { marginRight: '10px' }), // User messages margin
                                        }}>
                                            <div style={{
                                                padding: '12px 18px', 
                                                borderRadius: msg.sender === 'user' ? '20px 8px 20px 20px' : '8px 20px 20px 20px',
                                                backgroundColor: msg.sender === 'user' ? '#2980b9' : '#e9ecef', // Message colors
                                                color: msg.sender === 'user' ? '#ffffff' : '#212529', 
                                                maxWidth: '80%',
                                                wordWrap: 'break-word',
                                                boxShadow: '0 2px 3px rgba(0,0,0,0.08)',
                                                lineHeight: '1.6',
                                                fontSize: '1em', 
                                                textAlign: 'left', 
                                            }}>
                                                {msg.sender === 'ai' ? (
                                                    <ReactMarkdown
                                                        components={{
                                                            p: CustomParagraph,
                                                            ul: CustomUl,
                                                            ol: CustomOl,
                                                            li: CustomLi,
                                                        }}
                                                    >{msg.text}</ReactMarkdown>
                                                ) : (
                                                    msg.text
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {isSendingMessage && <p style={{ textAlign: 'left', color: '#555', fontSize: '1em', fontStyle: 'italic', paddingLeft: '15px' }}><i>AI is replying...</i></p>} 
                                </div>
                                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                                    <input
                                        type="text"
                                        value={currentMessage}
                                        onChange={(e) => setCurrentMessage(e.target.value)}
                                        placeholder="Enter symptoms or message..."
                                        style={{ flexGrow: 1, padding: '12px 15px', borderRadius: '5px', border: '1px solid #bdc3c7', fontSize: '1em' }}
                                        disabled={isSendingMessage}
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={isSendingMessage || !currentMessage.trim()} 
                                        style={{
                                            padding: '12px 20px', 
                                            fontSize: '1em',
                                            cursor: 'pointer', 
                                            backgroundColor: '#27ae60', // Softer green
                                            color: 'white', 
                                            border: 'none', 
                                            borderRadius: '5px',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                            opacity: (isSendingMessage || !currentMessage.trim()) ? 0.7 : 1 // Indicate disabled state
                                        }}
                                    >
                                        {isSendingMessage ? 'Sending...' : 'Send'}
                                    </button>
                                </form>
                                {errorChat && <p style={{ color: '#c0392b', marginTop: '10px', fontSize: '1em' }}>{errorChat}</p>}
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', height: '100%', color: '#7f8c8d', fontSize: itemFontSize, paddingLeft: '20px' }}> 
                            <p style={{ textAlign: 'left' }}>Please select a patient to view details and start a chat.</p> 
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;