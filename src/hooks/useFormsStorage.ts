import { useState, useEffect, useCallback } from 'react';
import { FormData, FormSubmission } from '@/types/form';

const FORMS_KEY = 'formbuilder_forms';
const SUBMISSIONS_KEY = 'formbuilder_submissions';

export function useFormsStorage() {
  const [forms, setForms] = useState<FormData[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedForms = localStorage.getItem(FORMS_KEY);
    const savedSubmissions = localStorage.getItem(SUBMISSIONS_KEY);
    
    if (savedForms) {
      setForms(JSON.parse(savedForms));
    }
    if (savedSubmissions) {
      setSubmissions(JSON.parse(savedSubmissions));
    }
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
    if (existingIndex >= 0) {
      updatedForms = forms.map((f, i) => 
        i === existingIndex ? { ...form, updatedAt: now } : f
      );
    } else {
      updatedForms = [...forms, { ...form, createdAt: now, updatedAt: now }];
    }
    
    saveForms(updatedForms);
    return form;
  }, [forms, saveForms]);

  // Delete a form
  const deleteForm = useCallback((formId: string) => {
    const updatedForms = forms.filter(f => f.id !== formId);
    saveForms(updatedForms);
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
    return updatedForms.find(f => f.id === formId);
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