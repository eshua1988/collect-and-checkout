import { useState, useEffect, useCallback } from 'react';
import { FormData, FormSubmission } from '@/types/form';
import { cloudLoad, cloudSave, cloudDelete, cloudMigrateLocal } from '@/lib/cloudSync';

const TABLE = 'user_forms';
const SUB_TABLE = 'user_form_submissions';
const FORMS_KEY = 'formbuilder_forms';
const SUBMISSIONS_KEY = 'formbuilder_submissions';

export function useFormsStorage() {
  const [forms, setForms] = useState<FormData[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);

  // Load from cloud on mount + migrate local data
  useEffect(() => {
    // Forms
    cloudMigrateLocal<FormData>(TABLE, FORMS_KEY).then(() =>
      cloudLoad<FormData>(TABLE, FORMS_KEY).then(items => setForms(items))
    );
    // Submissions
    cloudMigrateLocal<FormSubmission & { id: string }>(SUB_TABLE, SUBMISSIONS_KEY).then(() =>
      cloudLoad<FormSubmission & { id: string }>(SUB_TABLE, SUBMISSIONS_KEY).then(items => setSubmissions(items as FormSubmission[]))
    );
  }, []);

  // Save forms to localStorage
  const saveForms = useCallback((newForms: FormData[]) => {
    localStorage.setItem(FORMS_KEY, JSON.stringify(newForms));
    setForms(newForms);
  }, []);

  // Save submissions to localStorage
  const saveSubmissions = useCallback((newSubmissions: FormSubmission[]) => {
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(newSubmissions));
    setSubmissions(newSubmissions);
  }, []);

  // Add or update a form
  const saveForm = useCallback((form: FormData) => {
    const now = Date.now();
    const existingIndex = forms.findIndex(f => f.id === form.id);
    
    let updatedForms: FormData[];
    const withTs = existingIndex >= 0
      ? { ...form, updatedAt: now }
      : { ...form, createdAt: now, updatedAt: now };
    
    if (existingIndex >= 0) {
      updatedForms = forms.map((f, i) => i === existingIndex ? withTs : f);
    } else {
      updatedForms = [...forms, withTs];
    }
    
    saveForms(updatedForms);
    cloudSave(TABLE, FORMS_KEY, withTs);
    return form;
  }, [forms, saveForms]);

  // Delete a form
  const deleteForm = useCallback((formId: string) => {
    const updatedForms = forms.filter(f => f.id !== formId);
    saveForms(updatedForms);
    cloudDelete(TABLE, FORMS_KEY, formId);
    // Also delete related submissions
    const updatedSubmissions = submissions.filter(s => s.formId !== formId);
    saveSubmissions(updatedSubmissions);
  }, [forms, submissions, saveForms, saveSubmissions]);

  // Get a form by ID
  const getForm = useCallback((formId: string) => {
    return forms.find(f => f.id === formId);
  }, [forms]);

  // Toggle publish state
  const togglePublish = useCallback((formId: string) => {
    const updatedForms = forms.map(f => 
      f.id === formId ? { ...f, published: !f.published, updatedAt: Date.now() } : f
    );
    saveForms(updatedForms);
    const updated = updatedForms.find(f => f.id === formId);
    if (updated) cloudSave(TABLE, FORMS_KEY, updated);
    return updated;
  }, [forms, saveForms]);

  // Add a submission
  const addSubmission = useCallback((submission: Omit<FormSubmission, 'id' | 'submittedAt'>) => {
    const newSubmission: FormSubmission = {
      ...submission,
      id: Math.random().toString(36).substring(2, 9),
      submittedAt: Date.now(),
    };
    const updatedSubmissions = [...submissions, newSubmission];
    saveSubmissions(updatedSubmissions);
    cloudSave(SUB_TABLE, SUBMISSIONS_KEY, { ...newSubmission, createdAt: newSubmission.submittedAt, updatedAt: newSubmission.submittedAt } as any);
    return newSubmission;
  }, [submissions, saveSubmissions]);

  // Get submissions for a form
  const getFormSubmissions = useCallback((formId: string) => {
    return submissions.filter(s => s.formId === formId);
  }, [submissions]);

  return {
    forms,
    submissions,
    saveForm,
    deleteForm,
    getForm,
    togglePublish,
    addSubmission,
    getFormSubmissions,
  };
}