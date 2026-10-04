import React, { useState } from 'react';
import { Resident } from '../types';
import {
  formatEmergencyContact,
  isValidPhoneNumber,
  getContactActionLinks,
} from '../utils/contactUtils';
import { ApiError } from '../services/api';
import {
  UserPlus,
  X,
  CheckCircle2,
  AlertCircle,
  Shield,
  Phone,
  Bed,
  Calendar,
  ChevronRight,
  ChevronLeft,
  User,
  Users,
  Plus,
  Check,
  Zap,
  BadgeCheck,
  FileText,
  HeartPulse,
  PhoneCall,
  Send,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';

interface AddResidentModalProps {
  onClose: () => void;
  onAddResident: (resident: Omit<Resident, 'id' | 'created_at'>) => Promise<void>;
}

export const AddResidentModal: React.FC<AddResidentModalProps> = ({ onClose, onAddResident }) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [icNumber, setIcNumber] = useState('');
  const [dob, setDob] = useState('1952-06-15');
  const [gender, setGender] = useState<'Male' | 'Female'>('Female');
  
  // Step 3: Structured Guardian Details
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('Son');
  const [customRelationship, setCustomRelationship] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');

  const relationshipOptions = [
    'Son',
    'Daughter',
    'Spouse',
    'Sibling (Brother/Sister)',
    'Grandchild',
    'Legal Guardian',
    'Niece / Nephew',
    'Close Relative',
    'Other (Specify)',
  ];

  const effectiveRelationship =
    guardianRelationship === 'Other (Specify)'
      ? customRelationship.trim() || 'Guardian'
      : guardianRelationship;

  const formattedEmergencyContact = formatEmergencyContact(
    guardianName,
    effectiveRelationship,
    guardianPhone
  );

  const guardianActionLinks = getContactActionLinks(guardianPhone);

  const [medicalHistory, setMedicalHistory] = useState('');
  const [roomNumber, setRoomNumber] = useState('R118');
  const [dietaryPreference, setDietaryPreference] = useState('Halal Low-Sodium');

  // Interactive Medical Condition Quick Tags
  const commonConditions = [
    'Hypertension',
    'Diabetes Mellitus',
    'Stroke / Vascular',
    'Osteoarthritis',
    'Cardiac Care / CAD',
    'Asthma / Respiratory',
    'Dementia / Cognitive',
    'Hyperlipidemia',
  ];

  // Available Rooms Mock
  const availableRooms = [
    { code: 'R101', type: 'Single Bed', status: 'Occupied' },
    { code: 'R102', type: 'Twin Sharing', status: 'Available' },
    { code: 'R105', type: 'Deluxe Suite', status: 'Available' },
    { code: 'R116', type: 'Twin Sharing', status: 'Occupied' },
    { code: 'R118', type: 'High Dependency Unit', status: 'Available' },
    { code: 'R120', type: 'Single Bed', status: 'Available' },
  ];

  // Toggle Condition Tag
  const handleToggleCondition = (condition: string) => {
    let currentTags = medicalHistory
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (currentTags.includes(condition)) {
      currentTags = currentTags.filter((t) => t !== condition);
    } else {
      currentTags.push(condition);
    }
    setMedicalHistory(currentTags.join(', '));
  };

  // Age Calculation Helper
  const calculateAge = (birthDateString: string) => {
    if (!birthDateString) return null;
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? age : null;
  };

  const computedAge = calculateAge(dob);

  // Autofill Sample Profile
  const handleAutofillSample = () => {
    setName('Hajah Rohani Binti Ahmad');
    setIcNumber('500418-08-5124');
    setDob('1950-04-18');
    setGender('Female');
    setRoomNumber('R118');
    setGuardianName('Encik Ahmad');
    setGuardianRelationship('Son');
    setCustomRelationship('');
    setGuardianPhone('012-9876543');
    setMedicalHistory('Hypertension, Diabetes Mellitus, Osteoarthritis');
    setDietaryPreference('Halal Soft-Diet Diabetic');
    setValidationError(null);
  };

  // Validate step 1 before proceeding
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!name.trim() || !icNumber.trim()) {
        setValidationError('Please enter both the Resident Full Name and IC / Passport Number to proceed to Step 2.');
        return;
      }
    }
    setValidationError(null);
    setCurrentStep((s) => Math.min(3, s + 1) as 1 | 2 | 3);
  };

  const handlePrevStep = () => {
    setValidationError(null);
    setCurrentStep((s) => Math.max(1, s - 1) as 1 | 2 | 3);
  };

  // Form Submission Handler with Strict Validation
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (currentStep < 3) {
      handleNextStep();
      return;
    }

    if (!name.trim() || !icNumber.trim()) {
      setValidationError('Please complete the required fields (Resident Name and IC Number).');
      setCurrentStep(1);
      return;
    }

    // Strict validation for Guardian details
    if (!guardianName.trim()) {
      setValidationError('Please enter Guardian / Next-of-Kin Full Name.');
      return;
    }

    if (!effectiveRelationship.trim()) {
      setValidationError('Please select or specify the Relationship to the resident.');
      return;
    }

    if (!guardianPhone.trim()) {
      setValidationError('Please enter Guardian Contact Phone Number.');
      return;
    }

    if (!isValidPhoneNumber(guardianPhone)) {
      setValidationError('Please enter a valid Phone Number (e.g. 012-9876543) for calls and Telegram alerts.');
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);

    try {
      await onAddResident({
        name: name.trim(),
        ic_number: icNumber.trim(),
        dob,
        gender,
        emergency_contact: formattedEmergencyContact,
        medical_history: medicalHistory.trim()
          ? `${medicalHistory.trim()} (Diet: ${dietaryPreference})`
          : `Regular Eldercare Care (Diet: ${dietaryPreference})`,
        room_number: roomNumber,
      });

      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        const firstError = Object.values(error.errors)[0]?.[0];
        setValidationError(firstError || error.message);
      } else {
        setValidationError(
          error instanceof Error
            ? error.message
            : 'Unable to register the resident. Please try again.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
        
        {/* Solid Header (No Gradient) */}
        <div className="bg-slate-900 text-white p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-500 p-2.5 rounded-2xl text-slate-950 font-black shadow-md shrink-0">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Admin Portal
                </span>
                <span className="text-slate-300 text-xs font-semibold">Pusat Jagaan Fitrah</span>
              </div>
              <h2 className="font-extrabold text-lg text-white mt-0.5">Register New Resident Profile</h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleAutofillSample}
              className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Autofill realistic sample profile"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Autofill Demo</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step Progression Bar with Solid Theme & Visual Progress Line */}
        <div className="bg-slate-100 border-b border-slate-200">
          
          {/* Progress Percentage Bar */}
          <div className="w-full bg-slate-200 h-1.5">
            <div
              className="bg-amber-500 h-1.5 transition-all duration-300 ease-out"
              style={{ width: currentStep === 1 ? '33.3%' : currentStep === 2 ? '66.6%' : '100%' }}
            />
          </div>

          <div className="px-6 py-3.5 flex items-center justify-between text-xs font-bold">
            
            {/* Step 1 Pill */}
            <button
              type="button"
              onClick={() => { setValidationError(null); setCurrentStep(1); }}
              className={`flex items-center space-x-2 cursor-pointer transition-colors ${
                currentStep === 1
                  ? 'text-slate-900 font-extrabold'
                  : currentStep > 1
                  ? 'text-emerald-700'
                  : 'text-slate-400'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full text-[11px] flex items-center justify-center font-mono transition-all ${
                  currentStep === 1
                    ? 'bg-slate-900 text-white shadow-sm'
                    : currentStep > 1
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-300 text-slate-600'
                }`}
              >
                {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
              </span>
              <span className="hidden sm:inline">1. Personal & Room</span>
              <span className="sm:hidden">1. Personal</span>
            </button>

            <div className="w-6 sm:w-10 h-0.5 bg-slate-300" />

            {/* Step 2 Pill */}
            <button
              type="button"
              onClick={() => {
                if (!name.trim() || !icNumber.trim()) {
                  setValidationError('Please enter Resident Name and IC Number before switching to Step 2.');
                  return;
                }
                setValidationError(null);
                setCurrentStep(2);
              }}
              className={`flex items-center space-x-2 cursor-pointer transition-colors ${
                currentStep === 2
                  ? 'text-slate-900 font-extrabold'
                  : currentStep > 2
                  ? 'text-emerald-700'
                  : 'text-slate-400'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full text-[11px] flex items-center justify-center font-mono transition-all ${
                  currentStep === 2
                    ? 'bg-slate-900 text-white shadow-sm'
                    : currentStep > 2
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-300 text-slate-600'
                }`}
              >
                {currentStep > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
              </span>
              <span className="hidden sm:inline">2. Medical History</span>
              <span className="sm:hidden">2. Medical</span>
            </button>

            <div className="w-6 sm:w-10 h-0.5 bg-slate-300" />

            {/* Step 3 Pill */}
            <button
              type="button"
              onClick={() => {
                if (!name.trim() || !icNumber.trim()) {
                  setValidationError('Please enter Resident Name and IC Number before switching steps.');
                  return;
                }
                setValidationError(null);
                setCurrentStep(3);
              }}
              className={`flex items-center space-x-2 cursor-pointer transition-colors ${
                currentStep === 3
                  ? 'text-slate-900 font-extrabold'
                  : 'text-slate-400'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full text-[11px] flex items-center justify-center font-mono transition-all ${
                  currentStep === 3
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-300 text-slate-600'
                }`}
              >
                3
              </span>
              <span className="hidden sm:inline">3. Emergency Guardian</span>
              <span className="sm:hidden">3. Guardian</span>
            </button>

          </div>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs font-bold flex items-center justify-between space-x-2 animate-fade-in">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{validationError}</span>
            </div>
            <button
              type="button"
              onClick={() => setValidationError(null)}
              className="text-rose-500 hover:text-rose-800 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
          
          {/* STEP 1: Personal Info & Room */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
                  <User className="w-4 h-4 text-amber-600" />
                  <span>Step 1: Primary Resident Identity</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded">
                  Required Fields (*)
                </span>
              </div>

              {/* Resident Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Resident Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="e.g. Hajah Rohani Binti Ahmad"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-bold"
                    required
                  />
                </div>
              </div>

              {/* IC Number & Room Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Malaysian IC / Passport <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 500418-08-5124"
                    value={icNumber}
                    onChange={(e) => {
                      setIcNumber(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Room Assignment <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Bed className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <select
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 font-mono font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                    >
                      {availableRooms.map((rm) => (
                        <option key={rm.code} value={rm.code}>
                          {rm.code} ({rm.type}) - {rm.status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* DOB & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Date of Birth
                    </label>
                    {computedAge !== null && (
                      <span className="text-[10px] bg-amber-100 text-amber-900 font-mono font-bold px-2 py-0.5 rounded-full border border-amber-300">
                        {computedAge} Years Old
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'Male' | 'Female')}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold cursor-pointer focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>
              </div>

            </div>
          )}

          {/* STEP 2: Medical History & Condition Quick Tags */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
                  <HeartPulse className="w-4 h-4 text-emerald-600" />
                  <span>Step 2: Clinical Care & Medical Diagnoses</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded">
                  Fitrah Eldercare Protocol
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Quick Select Common Eldercare Conditions
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold">Click tags to toggle</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {commonConditions.map((cond) => {
                    const isSelected = medicalHistory.includes(cond);
                    return (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => handleToggleCondition(cond)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center space-x-1 ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-emerald-900 shadow-2xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5 text-amber-300" /> : <Plus className="w-3.5 h-3.5 text-slate-400" />}
                        <span>{cond}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Medical Diagnoses, Prescriptions & Allergies
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Hypertension, Diabetes Mellitus, Penicillin Allergy..."
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Dietary Plan & Meal Care
                </label>
                <select
                  value={dietaryPreference}
                  onChange={(e) => setDietaryPreference(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold cursor-pointer focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="Halal Low-Sodium">Halal Low-Sodium (Hypertension Standard)</option>
                  <option value="Halal Soft-Diet Diabetic">Halal Soft-Diet Diabetic (Pureed/Puree)</option>
                  <option value="Halal High-Protein">Halal High-Protein Recovery Diet</option>
                  <option value="Regular Eldercare Meal Plan">Regular Eldercare Meal Plan</option>
                </select>
              </div>

            </div>
          )}

          {/* STEP 3: Emergency Guardian & Digital Pass Live Preview */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span>Step 3: Guardian Details & Digital Pass Preview</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded">
                  Final Verification
                </span>
              </div>

              {/* Validation alert banner */}
              {validationError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center space-x-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-semibold">{validationError}</span>
                </div>
              )}

              {/* 3 Structured Guardian Input Fields */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-600" />
                    Next-Of-Kin / Guardian Details
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    Name, Relation & Phone Required
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* 1. Guardian Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Guardian Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="e.g. Encik Ahmad Danial"
                        value={guardianName}
                        onChange={(e) => {
                          setGuardianName(e.target.value);
                          setValidationError(null);
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                        required
                      />
                    </div>
                  </div>

                  {/* 2. Relationship */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Relationship <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Users className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <select
                        value={guardianRelationship}
                        onChange={(e) => {
                          setGuardianRelationship(e.target.value);
                          setValidationError(null);
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 font-semibold cursor-pointer focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      >
                        {relationshipOptions.map((rel) => (
                          <option key={rel} value={rel}>
                            {rel}
                          </option>
                        ))}
                      </select>
                    </div>
                    {guardianRelationship === 'Other (Specify)' && (
                      <input
                        type="text"
                        placeholder="Specify relationship..."
                        value={customRelationship}
                        onChange={(e) => setCustomRelationship(e.target.value)}
                        className="mt-1.5 w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-medium"
                      />
                    )}
                  </div>

                  {/* 3. Phone Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Phone <span className="text-rose-500">*</span></span>
                      {guardianPhone && isValidPhoneNumber(guardianPhone) && (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Valid
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        placeholder="e.g. 013-8876543"
                        value={guardianPhone}
                        onChange={(e) => {
                          setGuardianPhone(e.target.value);
                          setValidationError(null);
                        }}
                        className={`w-full bg-white border rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 font-mono font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 ${
                          guardianPhone && !isValidPhoneNumber(guardianPhone)
                            ? 'border-rose-300 bg-rose-50/40'
                            : 'border-slate-300'
                        }`}
                        required
                      />
                    </div>
                  </div>

                </div>

                {/* Direct Action Live Testing Strip */}
                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="text-[11px] text-slate-600">
                    <span className="font-bold">Record: </span>
                    <span className="font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {formattedEmergencyContact}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={guardianActionLinks.telUrl}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                        guardianActionLinks.isValid
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-slate-200 text-slate-400 pointer-events-none'
                      }`}
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>Call</span>
                    </a>

                    <a
                      href={guardianActionLinks.telegramUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                        guardianActionLinks.isValid
                          ? 'bg-[#229ED9] text-white hover:bg-[#1b88bd]'
                          : 'bg-slate-200 text-slate-400 pointer-events-none'
                      }`}
                    >
                      <Send className="w-3 h-3" />
                      <span>Telegram</span>
                    </a>

                    <a
                      href={guardianActionLinks.whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                        guardianActionLinks.isValid
                          ? 'bg-[#25D366] text-white hover:bg-[#1eb755]'
                          : 'bg-slate-200 text-slate-400 pointer-events-none'
                      }`}
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>

              </div>

              {/* Digital Resident Pass Live Card Preview (Solid Dark Theme, No Gradient) */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                      Pusat Jagaan Fitrah • Digital Pass Badge
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-800 text-amber-300 px-2 py-0.5 rounded border border-slate-700 font-bold">
                    Room {roomNumber || 'Unassigned'}
                  </span>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center shrink-0 border border-amber-400">
                    {(name || 'R').charAt(0).toUpperCase()}
                  </div>
                  <div className="text-xs space-y-0.5">
                    <h4 className="font-extrabold text-sm text-white">{name || 'Resident Full Name'}</h4>
                    <p className="text-slate-400 font-mono text-[11px]">IC: {icNumber || '000000-00-0000'}</p>
                    <p className="text-slate-300 text-[11px] font-medium">
                      Guardian: <span className="text-amber-300 font-bold font-mono">{formattedEmergencyContact}</span>
                    </p>
                  </div>
                </div>

                {medicalHistory && (
                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                    <span className="font-bold text-amber-400 block text-[10px] uppercase">Care & Diagnoses:</span>
                    <span>{medicalHistory}</span>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl flex items-center space-x-1 cursor-pointer transition-colors border border-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Step</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors border border-slate-200"
              >
                Cancel
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md flex items-center space-x-2 cursor-pointer transition-all active:scale-95 border border-slate-800"
              >
                <span>Continue to Step {currentStep + 1}</span>
                <ChevronRight className="w-4 h-4 text-amber-400" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-800 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-lg flex items-center space-x-2 cursor-pointer disabled:cursor-not-allowed transition-all active:scale-95 border border-emerald-700"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
                <span>{isSubmitting ? 'Registering...' : 'Complete Enrollment'}</span>
              </button>
            )}
          </div>

        </form>

      </div>
    </div>
  );
};
