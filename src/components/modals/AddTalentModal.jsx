import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import Icon from '../shared/Icon';
import { addTalent } from '../../services/talentService';
import TalentProfileForm from '../forms/TalentProfileForm';

export default function AddTalentModal() {
  const { showAddTalent, setShowAddTalent, showToast } = useContext(AppContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  if (!showAddTalent) return null;

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const talentData = {
        ...formData,
        name: `${formData.first_name} ${formData.last_name}`.trim(),
        height_ft: formData.height_ft ? parseFloat(formData.height_ft) : null,
        weight_lbs: formData.weight_lbs ? parseFloat(formData.weight_lbs) : null,
        status: 'available',
        image_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.first_name)}+${encodeURIComponent(formData.last_name)}&background=e8eaff&color=1a237e&size=400&bold=true`,
        rating: 0,
        credits: 0
      };
      
      await addTalent(talentData);
      showToast(`Saved ${formData.first_name} ${formData.last_name} to database!`);
      setShowAddTalent(false);
    } catch (error) {
      console.error(error);
      setSubmitError(error.message || 'Failed to save talent');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-sm p-4 sm:p-6"
      onClick={() => setShowAddTalent(false)}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white z-10 flex-shrink-0">
          <div>
            <h2 className="text-lg font-extrabold text-navy-900 tracking-tight">Extended Talent Profile</h2>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Fill out casting dimensions and skills for accurate matching</p>
          </div>
          <button onClick={() => setShowAddTalent(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-400">
            <Icon name="close" size={16} color="currentColor" />
          </button>
        </div>

        {/* Embedded Form */}
        <TalentProfileForm 
          onSubmit={handleSubmit} 
          onCancel={() => setShowAddTalent(false)} 
          isSubmitting={isSubmitting} 
          errorMsg={submitError} 
        />
        
      </div>
    </div>
  );
}
