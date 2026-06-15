import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { UserRole } from '../../types/UserType';
import './ChatbotWidget.css';
import { chatApi, patientApi } from '../../services/api';

interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    timestamp: Date;
}

interface ChatbotWidgetProps {
    userRole?: UserRole | null;
    isAuthenticated?: boolean;
    position?: 'fixed' | 'inline';
    className?: string;
    placeholder?: string;
}

const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
    userRole = null,
    isAuthenticated = false,
    position = 'fixed',
    className = '',
    placeholder = 'Nhập câu hỏi của bạn...'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Doctor/Staff: patient ID selector
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    const [patientName, setPatientName] = useState<string>('');
    const [patientLookupError, setPatientLookupError] = useState<string>('');

    const isStaffRole = userRole === 'DOCTOR' || userRole === 'CLINIC_STAFF' || userRole === 'ADMIN';

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const getWelcomeMessage = useCallback(() => {
        if (!isAuthenticated) {
            return `Xin chào! Tôi là trợ lý AI của phòng khám. 🏥

Tôi có thể giúp bạn:
- **Thông tin phòng khám** (giờ làm việc, dịch vụ, địa chỉ)
- **Hướng dẫn đặt lịch khám**
- **Tư vấn triệu chứng cơ bản**
- **Câu hỏi thường gặp về sức khỏe**

Bạn có thể hỏi tôi bất cứ điều gì! 😊`;
        }

        switch (userRole) {
            case 'PATIENT':
                return `Xin chào! Tôi là trợ lý AI cá nhân của bạn tại Phòng khám. 👨‍⚕️

Tôi có thể giúp bạn:
- **Tư vấn triệu chứng và sức khỏe**
- **Hướng dẫn chuẩn bị khám bệnh**
- **Giải thích quy trình khám**
- **Thông tin sau khám**

Hãy đặt câu hỏi để tôi hỗ trợ bạn!`;

            case 'DOCTOR':
            case 'CLINIC_STAFF':
            case 'ADMIN':
                return `Xin chào! Tôi là trợ lý AI cho nhân viên y tế. 🩺

Tôi có thể hỗ trợ:
- **Tư vấn chẩn đoán ban đầu**
- **Thông tin y khoa**
- **Hướng dẫn quy trình**
- **Quản lý bệnh nhân**

Nhập ID bệnh nhân ở trên để tôi hỗ trợ bạn với hồ sơ bệnh nhân cụ thể!`;

            default:
                return `Xin chào! Tôi là trợ lý AI của phòng khám. 

Tôi có thể giúp bạn với các thông tin cơ bản về phòng khám và sức khỏe. Hãy đặt câu hỏi nhé!`;
        }
    }, [isAuthenticated, userRole]);

    // Load chat history from DB for authenticated users
    useEffect(() => {
        if (!isAuthenticated || historyLoaded) return;

        const loadHistory = async () => {
            try {
                const resp = await chatApi.getHistory(0, 50);
                const historyMessages: ChatMessage[] = resp.data
                    .reverse() // API returns newest-first, we need oldest-first
                    .map((item: { chat_id: number; role: string; text: string; timestamp: string }) => ({
                        id: `db-${item.chat_id}`,
                        sender: item.role === 'user' ? 'user' as const : 'ai' as const,
                        text: item.text,
                        timestamp: new Date(item.timestamp),
                    }));

                if (historyMessages.length > 0) {
                    // Prepend welcome message, then history
                    const welcome: ChatMessage = {
                        id: 'welcome',
                        sender: 'ai',
                        text: getWelcomeMessage(),
                        timestamp: new Date(historyMessages[0].timestamp.getTime() - 1000),
                    };
                    setMessages([welcome, ...historyMessages]);
                } else {
                    setMessages([{
                        id: 'welcome',
                        sender: 'ai',
                        text: getWelcomeMessage(),
                        timestamp: new Date(),
                    }]);
                }
            } catch {
                // If history fetch fails, just show welcome message
                setMessages([{
                    id: 'welcome',
                    sender: 'ai',
                    text: getWelcomeMessage(),
                    timestamp: new Date(),
                }]);
            }
            setHistoryLoaded(true);
        };

        loadHistory();
    }, [isAuthenticated, historyLoaded, getWelcomeMessage]);

    // Initial welcome message for unauthenticated users
    useEffect(() => {
        if (!isAuthenticated && messages.length === 0) {
            setMessages([{
                id: 'welcome',
                sender: 'ai',
                text: getWelcomeMessage(),
                timestamp: new Date(),
            }]);
        }
    }, [isAuthenticated, userRole, messages.length, getWelcomeMessage]);

    // Look up patient name when doctor enters patient ID
    useEffect(() => {
        if (!isStaffRole || !selectedPatientId.trim()) {
            setPatientName('');
            setPatientLookupError('');
            return;
        }

        const id = Number(selectedPatientId);
        if (isNaN(id) || id <= 0) {
            setPatientName('');
            setPatientLookupError('ID không hợp lệ');
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const resp = await patientApi.getById(id);
                const name = resp.data.patient_name || resp.data.full_name || `Patient #${id}`;
                setPatientName(name);
                setPatientLookupError('');
            } catch {
                setPatientName('');
                setPatientLookupError('Không tìm thấy');
            }
        }, 500); // debounce 500ms

        return () => clearTimeout(timer);
    }, [selectedPatientId, isStaffRole]);

    const sendMessage = async () => {
        if (!currentMessage.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString() + '-user',
            sender: 'user',
            text: currentMessage,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        const messageToSend = currentMessage;
        setCurrentMessage('');
        setIsLoading(true);
        setError(null);

        try {
            let response;

            if (isAuthenticated && userRole === 'PATIENT') {
                // Patient mode: conversation memory handled by backend
                response = await chatApi.sendPatient(messageToSend);
            } else if (isAuthenticated && isStaffRole && selectedPatientId.trim()) {
                // Doctor/Staff mode with patient context
                const patientId = Number(selectedPatientId);
                if (isNaN(patientId) || patientId <= 0) {
                    throw new Error('ID bệnh nhân không hợp lệ');
                }
                response = await chatApi.sendStaff(patientId, messageToSend);
            } else {
                // Public mode or staff without patient selected
                response = await chatApi.sendPublic(messageToSend);
            }

            const aiMessage: ChatMessage = {
                id: Date.now().toString() + '-ai',
                sender: 'ai',
                text: response.data.reply,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (err) {
            console.error('Error sending message:', err);
            let errorMessage = 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.';
            
            if (axios.isAxiosError(err) && err.response) {
                errorMessage = err.response.data.detail || errorMessage;
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }
            
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
        setError(null);
    };

    const clearChat = () => {
        setMessages([]);
        setHistoryLoaded(false);
        // Re-add welcome message
        const welcomeMessage: ChatMessage = {
            id: 'welcome-new',
            sender: 'ai',
            text: getWelcomeMessage(),
            timestamp: new Date()
        };
        setMessages([welcomeMessage]);
        setError(null);
    };

    // ── Shared message list renderer ──────────────────────────────────

    const renderMessages = () => (
        <>
            {messages.map((message) => (
                <div
                    key={message.id}
                    className={`chatbot-message ${message.sender === 'user' ? 'chatbot-message-user' : 'chatbot-message-ai'}`}
                >
                    <div className="chatbot-message-content">
                        {message.sender === 'ai' ? (
                            <ReactMarkdown>{message.text}</ReactMarkdown>
                        ) : (
                            message.text
                        )}
                    </div>
                    <div className="chatbot-message-time">
                        {message.timestamp.toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                </div>
            ))}
            {isLoading && (
                <div className="chatbot-message chatbot-message-ai">
                    <div className="chatbot-message-content chatbot-typing">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </>
    );

    // ── Patient selector for Doctor/Staff ──────────────────────────────

    const renderPatientSelector = () => {
        if (!isAuthenticated || !isStaffRole) return null;

        return (
            <div className="chatbot-patient-selector">
                <div className="chatbot-patient-input-row">
                    <label htmlFor="patient-id-input">🏥 ID Bệnh nhân:</label>
                    <input
                        id="patient-id-input"
                        type="number"
                        min="1"
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                        placeholder="Nhập ID..."
                        className="chatbot-patient-id-input"
                    />
                </div>
                {patientName && (
                    <div className="chatbot-patient-name">✅ {patientName}</div>
                )}
                {patientLookupError && (
                    <div className="chatbot-patient-error">❌ {patientLookupError}</div>
                )}
            </div>
        );
    };

    // ── Input area renderer ───────────────────────────────────────────

    const renderInput = () => (
        <div className="chatbot-input">
            <textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={isLoading}
                rows={1}
                className="chatbot-textarea"
            />
            <button
                onClick={sendMessage}
                disabled={isLoading || !currentMessage.trim()}
                className="chatbot-send-btn"
            >
                {isLoading ? '⏳' : '➤'}
            </button>
        </div>
    );

    if (position === 'fixed') {
        return (
            <>
                {/* Chat Widget Button */}
                <button
                    className={`chatbot-toggle ${isOpen ? 'chatbot-toggle-open' : ''}`}
                    onClick={toggleChat}
                    aria-label="Toggle Chat"
                >
                    {isOpen ? '✕' : '💬'}
                </button>

                {/* Chat Window */}
                {isOpen && (
                    <div className="chatbot-window">
                        <div className="chatbot-header">
                            <div className="chatbot-header-info">
                                <span className="chatbot-avatar">🤖</span>
                                <div>
                                    <h4>Trợ lý Phòng khám</h4>
                                    <span className="chatbot-status">Trực tuyến</span>
                                </div>
                            </div>
                            <div className="chatbot-header-actions">
                                <button
                                    onClick={clearChat}
                                    className="chatbot-action-btn"
                                    title="Xóa lịch sử chat"
                                >
                                    🗑️
                                </button>
                                <button
                                    onClick={toggleChat}
                                    className="chatbot-action-btn"
                                    title="Đóng chat"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {renderPatientSelector()}

                        <div className="chatbot-messages">
                            {renderMessages()}
                        </div>

                        {error && (
                            <div className="chatbot-error">
                                {error}
                            </div>
                        )}

                        {renderInput()}
                    </div>
                )}
            </>
        );
    }

    // Inline mode
    return (
        <div className={`chatbot-inline ${className}`}>
            {renderPatientSelector()}

            <div className="chatbot-messages">
                {renderMessages()}
            </div>

            {error && (
                <div className="chatbot-error">
                    {error}
                </div>
            )}

            {renderInput()}
        </div>
    );
};

export default ChatbotWidget;
