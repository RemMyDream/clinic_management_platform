## **4.2 Class Specification Design**

### **4.2.1. Backend Models**

#### **4.2.1.1. User**

| Field | Data Type | Nullable | Constraint | Description |
| :---- | :---- | :---- | :---- | :---- |
| user_id | INT | No | PK | Unique identifier |
| email | VARCHAR | No | UNIQUE | Login email |
| full_name | VARCHAR | No |  | Full name |
| hashed_password | VARCHAR | No |  | Password hashed |
| role | VARCHAR | No | CHECK | User role |

#### **4.2.1.2. Patient**

| Field | Data Type | Nullable | Constraint | Description |
| :---- | :---- | :---- | :---- | :---- |
| patient_id | INT | No | PK | Identifier |
| user_id | INT | No | FK | Link to user |
| date_of_birth | DATE | No |  | Birthdate |
| gender | VARCHAR | No |  | Gender |
| address | VARCHAR | Yes |  | Address |
| phone | VARCHAR | Yes |  | Phone |

#### **4.2.1.3. Doctor**

| Field | Data Type | Nullable | Constraint | Description |
| :---- | :---- | :---- | :---- | :---- |
| doctor_id | INT | No | PK | Identifier |
| user_id | INT | No | FK | User link |
| specialization | VARCHAR | No |  | Specialty |
| description | TEXT | Yes |  | Description |
| hospital_id | INT | No | FK | Hospital link |

#### **4.2.1.4. Staff**

| Field | Data Type | Nullable | Constraint | Description |
| :---- | :---- | :---- | :---- | :---- |
| staff_id | INT | No | PK | Identifier |
| user_id | INT | No | FK | User link |
| position | VARCHAR | No |  | Position |

#### **4.2.1.5. Hospital**

| Field | Data Type | Nullable | Constraint | Description |
| :---- | :---- | :---- | :---- | :---- |
| hospital_id | INT | No | PK | Identifier |
| name | VARCHAR | No |  | Hospital name |
| address | VARCHAR | No |  | Address |

#### **4.2.1.6. Appointment**

| Field | Data Type | Nullable | Constraint | Description |
| :---- | :---- | :---- | :---- | :---- |
| appointment_id | INT | No | PK | Identifier |
| patient_id | INT | No | FK | Patient link |
| doctor_id | INT | No | FK | Doctor link |
| service | VARCHAR | No |  | Service |
| appointment_date | DATE | No |  | Date |
| appointment_time | TIME | No |  | Time |
| status | VARCHAR | No | CHECK | Status |

#### **4.2.1.7. MedicalReport**

| Field | Data Type | Nullable | Constraint | Description |
| :---- | :---- | :---- | :---- | :---- |
| report_id | INT | No | PK | Identifier |
| patient_id | INT | No | FK | Patient link |
| doctor_id | INT | No | FK | Doctor link |
| appointment_id | INT | Yes | FK | Appointment link |
| notes | TEXT | Yes |  | Notes |
| diagnosis | VARCHAR | Yes |  | Diagnosis |
| created_at | DATETIME | No |  | Created time |

#### **4.2.1.8. Prescription**

| Field | Data Type | Nullable | Constraint | Description |
| :---- | :---- | :---- | :---- | :---- |
| prescription_id | INT | No | PK | Identifier |
| report_id | INT | No | FK | Medical report |
| medication_name | VARCHAR | No |  | Medicine |
| dosage | VARCHAR | No |  | Dosage |
| quantity | INT | No |  | Quantity |

#### **4.2.1.9. ChatMessage**

| Field | Data Type | Nullable | Constraint | Description |
| :---- | :---- | :---- | :---- | :---- |
| message_id | INT | No | PK | Identifier |
| user_id | INT | No | FK | User link |
| content | TEXT | No |  | Content |
| role | VARCHAR | No | CHECK | Role |
| timestamp | DATETIME | No |  | Time sent |

#### **4.2.1.10. OTCMedicationRecord**

| Field | Data Type | Nullable | Constraint | Description |
| :---- | :---- | :---- | :---- | :---- |
| otc_id | INT | No | PK | Identifier |
| patient_id | INT | No | FK | Patient link |
| staff_id | INT | No | FK | Staff link |
| medication_name | VARCHAR | No |  | Medicine |
| quantity | INT | No |  | Quantity |
| created_at | DATETIME | No |  | Created time |

### **4.2.2. View Package (Components & Pages)**

#### **4.2.2.1. Sidebar**

| Field | Type | Description |
| :---- | :---- | :---- |
| navigate() | function | Navigate to selected page |

#### **4.2.2.2. Navbar**

| Field | Type | Description |
| :---- | :---- | :---- |
| showUser() | function | Display logged-in user's info |

#### **4.2.2.3. AppointmentCard**

| Field | Type | Description |
| :---- | :---- | :---- |
| renderInfo() | function | Show appointment details |

#### **4.2.2.4. AppointmentList**

| Field | Type | Description |
| :---- | :---- | :---- |
| renderList() | function | Render list of appointments |

#### **4.2.2.5. AppointmentForm**

| Field | Type | Description |
| :---- | :---- | :---- |
| handleSubmit() | function | Submit appointment form |

#### **4.2.2.6. MedicalRecordForm**

| Field | Type | Description |
| :---- | :---- | :---- |
| handleSubmit() | function | Submit medical record form |

#### **4.2.2.7. ChatBox**

| Field | Type | Description |
| :---- | :---- | :---- |
| handleSend() | function | Send chat message |

#### **4.2.2.8. ChatMessageItem**

| Field | Type | Description |
| :---- | :---- | :---- |
| render() | function | Render chat message block |

#### **4.2.2.9. ProfileForm**

| Field | Type | Description |
| :---- | :---- | :---- |
| saveProfile() | function | Save profile changes |

#### **4.2.2.10. LoadingSpinner**

| Field | Type | Description |
| :---- | :---- | :---- |
|  | component | Displays loading animation |

#### **4.2.2.11. LoginPage**

| Field | Type | Description |
| :---- | :---- | :---- |
| handleLogin() | function | Login user |

#### **4.2.2.12. RegisterPage**

| Field | Type | Description |
| :---- | :---- | :---- |
| handleRegister() | function | Register new user |

#### **4.2.2.13. DashboardPage**

| Field | Type | Description |
| :---- | :---- | :---- |
| loadDashboard() | function | Load dashboard data |
| loadAppointments() | function | Load appointments |

#### **4.2.2.14. PatientProfilePage**

| Field | Type | Description |
| :---- | :---- | :---- |
| loadProfile() | function | Load profile |
| saveProfile() | function | Save profile |

#### **4.2.2.15. DoctorSchedulePage**

| Field | Type | Description |
| :---- | :---- | :---- |
| loadAppointments() | function | Load schedule |

#### **4.2.2.16. AppointmentPage**

| Field | Type | Description |
| :---- | :---- | :---- |
| submitAppointment() | function | Submit new appointment |

#### **4.2.2.17. AppointmentDetailPage**

| Field | Type | Description |
| :---- | :---- | :---- |
| loadDetail() | function | Load detail |

#### **4.2.2.18. MedicalRecordPage**

| Field | Type | Description |
| :---- | :---- | :---- |
| loadRecords() | function | Load list of records |

#### **4.2.2.19. MedicalRecordDetailPage**

| Field | Type | Description |
| :---- | :---- | :---- |
| loadRecord() | function | Load single record |

#### **4.2.2.20. ChatbotPage**

| Field | Type | Description |
| :---- | :---- | :---- |
| loadHistory() | function | Load chat history |
| sendMessage() | function | Send chat message |

### **4.2.3. Control Package (Services & Hooks)**

#### **4.2.3.1. AuthService**

| Field | Type | Description |
| :---- | :---- | :---- |
| login() | API call | User login |
| register() | API call | Register user |
| logout() | function | Logout user |

#### **4.2.3.2. UserService**

| Field | Type | Description |
| :---- | :---- | :---- |
| getUserInfo() | API call | Fetch user data |
| updateProfile() | API call | Update profile |

#### **4.2.3.3. AppointmentService**

| Field | Type | Description |
| :---- | :---- | :---- |
| book() | API call | Create appointment |
| getAll() | API call | Get appointments |
| getById() | API call | Get detail |
| update() | API call | Update appointment |

#### **4.2.3.4. MedicalRecordService**

| Field | Type | Description |
| :---- | :---- | :---- |
| getRecords() | API call | Fetch all records |
| getRecordById() | API call | Fetch detail |
| createRecord() | API call | Create record |

#### **4.2.3.5. ChatService**

| Field | Type | Description |
| :---- | :---- | :---- |
| sendMessage() | API call | Send chat |
| getHistory() | API call | Load history |

#### **4.2.3.6. useAuth**

| Field | Type | Description |
| :---- | :---- | :---- |
| user | object | Current user |
| login() | function | Login |
| logout() | function | Logout |

#### **4.2.3.7. useAppointments**

| Field | Type | Description |
| :---- | :---- | :---- |
| appointments | array | Appointment list |
| loadAppointments() | function | Load list |

#### **4.2.3.8. useMedicalRecords**

| Field | Type | Description |
| :---- | :---- | :---- |
| records | array | Record list |
| loadRecords() | function | Load records |

#### **4.2.3.9. useChat**

| Field | Type | Description |
| :---- | :---- | :---- |
| messages | array | Chat messages |
| sendMessage() | function | Send a message |

#### **4.2.3.10. useProfile**

| Field | Type | Description |
| :---- | :---- | :---- |
| profile | object | Profile |
| saveProfile() | function | Save profile |

### **4.2.4. Types**

#### **4.2.4.1. UserType**

| Field | Type | Description |
| :---- | :---- | :---- |
| user_id | number | ID |
| email | string | Email |
| full_name | string | Full name |
| role | string | Role |

#### **4.2.4.2. PatientType**

| Field | Type | Description |
| :---- | :---- | :---- |
| patient_id | number | ID |
| gender | string | Gender |
| address | string | Address |
| phone | string | Phone |

#### **4.2.4.3. DoctorType**

| Field | Type | Description |
| :---- | :---- | :---- |
| doctor_id | number | ID |
| specialization | string | Specialty |
| description | string | Description |

#### **4.2.4.4. AppointmentType**

| Field | Type | Description |
| :---- | :---- | :---- |
| appointment_id | number | ID |
| service | string | Service |
| appointment_date | string | Date |
| appointment_time | string | Time |
| status | string | Status |

#### **4.2.4.5. MedicalRecordType**

| Field | Type | Description |
| :---- | :---- | :---- |
| record_id | number | ID |
| notes | string | Notes |
| diagnosis | string | Diagnosis |

#### **4.2.4.6. ChatMessageType**

| Field | Type | Description |
| :---- | :---- | :---- |
| message_id | number | ID |
| content | string | Content |
| role | string | Role |
| timestamp | string | Timestamp |