import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'ru' | 'en';

interface Translations {
  [key: string]: string;
}

const translations: Record<Language, Translations> = {
  ru: {
    // Header
    'header.title': 'FormBuilder',
    'header.subtitle': 'с платежами',
    'header.load': 'Загрузить',
    'header.clear': 'Очистить',
    'header.save': 'Сохранить',
    
    // Tabs
    'tabs.editor': 'Редактор',
    'tabs.preview': 'Предпросмотр',
    
    // Form Settings
    'settings.title': 'Настройки формы',
    'settings.formTitle': 'Заголовок формы',
    'settings.formTitlePlaceholder': 'Заголовок формы',
    'settings.description': 'Описание',
    'settings.descriptionPlaceholder': 'Описание формы (необязательно)',
    'settings.headerImage': 'Изображение заголовка',
    'settings.completionMessage': 'Сообщение после завершения',
    'settings.completionPlaceholder': 'Спасибо за заполнение формы!',
    
    // Field Types
    'field.text': 'Текст',
    'field.textarea': 'Длинный текст',
    'field.number': 'Число',
    'field.email': 'Email',
    'field.phone': 'Телефон',
    'field.select': 'Список',
    'field.radio': 'Одиночный',
    'field.checkbox': 'Множественный',
    'field.image': 'Изображение',
    'field.dynamicNumber': 'Динамические',
    'field.payment': 'Платёж',
    
    // Field Editor
    'editor.addField': 'Добавить поле',
    'editor.fieldLabel': 'Метка поля',
    'editor.placeholder': 'Подсказка',
    'editor.placeholderText': 'Текст подсказки',
    'editor.imageUrl': 'URL изображения',
    'editor.options': 'Варианты',
    'editor.optionLabel': 'Метка варианта',
    'editor.value': 'Значение',
    'editor.addOption': 'Добавить вариант',
    'editor.requiredField': 'Обязательное поле',
    'editor.dynamicInfo': 'Пользователь вводит число, после чего появляется соответствующее количество обязательных текстовых полей.',
    'editor.baseAmount': 'Базовая сумма (PLN)',
    'editor.fieldsForSum': 'Поля для расчёта суммы',
    'editor.multiplier': 'Множитель:',
    'editor.costPerField': 'Стоимость за поле:',
    'editor.addNumber': '+ Число',
    'editor.addList': '+ Список',
    'editor.addChoice': '+ Выбор',
    'editor.addDynamic': '+ Динам.',
    'editor.add': 'Добавить',
    'editor.fieldName': 'Название поля',
    
    // Form State
    'form.noFields': 'Нет полей в форме',
    'form.addFieldsHint': 'Добавьте поля с помощью кнопок выше',
    'form.fields': 'Полей:',
    'form.payment': 'Платёж:',
    'form.enabled': 'Включён',
    'form.disabled': 'Выключен',
    'form.saved': 'Форма сохранена!',
    'form.loaded': 'Форма загружена!',
    
    // Form Preview
    'preview.totalToPay': 'Сумма к оплате:',
    'preview.goToPayment': 'Перейти к оплате',
    'preview.submit': 'Отправить',
    'preview.selectOption': 'Выбрать вариант',
    'preview.enterNumber': 'Введите число',
    'preview.fillFields': 'Заполните поля ниже',
    'preview.field': 'Поле',
    'preview.select': 'Выбрать',
    'preview.perEach': 'за каждое',
    'preview.baseAmount': 'Базовая сумма:',
    
    // Completion
    'complete.editMessage': 'Редактировать сообщение',
    'complete.cancel': 'Отмена',
    'complete.save': 'Сохранить',
    
    // Payment
    'payment.selectMethod': 'Выберите способ оплаты',
    'payment.blik': 'BLIK',
    'payment.blikDesc': 'Быстрая оплата кодом из банковского приложения',
    'payment.card': 'Банковская карта',
    'payment.cardDesc': 'Visa, Mastercard, Maestro',
    'payment.bank': 'Банковский перевод',
    'payment.bankDesc': 'Быстрый перевод из вашего банка',
    'payment.blikCode': 'Код BLIK',
    'payment.enterBlikCode': 'Введите 6-значный код из банковского приложения',
    'payment.cardNumber': 'Номер карты',
    'payment.expiryDate': 'Срок действия',
    'payment.selectBank': 'Выберите ваш банк',
    'payment.pay': 'Оплатить',
    'payment.processing': 'Обработка...',
    'payment.complete': 'Оплата завершена!',
    'payment.completeDesc': 'Ваш платёж на сумму',
    'payment.wasProcessed': 'был обработан.',
  },
  en: {
    // Header
    'header.title': 'FormBuilder',
    'header.subtitle': 'with payments',
    'header.load': 'Load',
    'header.clear': 'Clear',
    'header.save': 'Save',
    
    // Tabs
    'tabs.editor': 'Editor',
    'tabs.preview': 'Preview',
    
    // Form Settings
    'settings.title': 'Form Settings',
    'settings.formTitle': 'Form Title',
    'settings.formTitlePlaceholder': 'Form title',
    'settings.description': 'Description',
    'settings.descriptionPlaceholder': 'Form description (optional)',
    'settings.headerImage': 'Header Image',
    'settings.completionMessage': 'Completion Message',
    'settings.completionPlaceholder': 'Thank you for filling out the form!',
    
    // Field Types
    'field.text': 'Text',
    'field.textarea': 'Long Text',
    'field.number': 'Number',
    'field.email': 'Email',
    'field.phone': 'Phone',
    'field.select': 'Dropdown',
    'field.radio': 'Single Choice',
    'field.checkbox': 'Multiple Choice',
    'field.image': 'Image',
    'field.dynamicNumber': 'Dynamic',
    'field.payment': 'Payment',
    
    // Field Editor
    'editor.addField': 'Add Field',
    'editor.fieldLabel': 'Field Label',
    'editor.placeholder': 'Placeholder',
    'editor.placeholderText': 'Placeholder text',
    'editor.imageUrl': 'Image URL',
    'editor.options': 'Options',
    'editor.optionLabel': 'Option label',
    'editor.value': 'Value',
    'editor.addOption': 'Add Option',
    'editor.requiredField': 'Required field',
    'editor.dynamicInfo': 'User enters a number, then that many required text fields appear.',
    'editor.baseAmount': 'Base Amount (PLN)',
    'editor.fieldsForSum': 'Fields for sum calculation',
    'editor.multiplier': 'Multiplier:',
    'editor.costPerField': 'Cost per field:',
    'editor.addNumber': '+ Number',
    'editor.addList': '+ List',
    'editor.addChoice': '+ Choice',
    'editor.addDynamic': '+ Dynamic',
    'editor.add': 'Add',
    'editor.fieldName': 'Field name',
    
    // Form State
    'form.noFields': 'No fields in the form',
    'form.addFieldsHint': 'Add fields using the buttons above',
    'form.fields': 'Fields:',
    'form.payment': 'Payment:',
    'form.enabled': 'Enabled',
    'form.disabled': 'Disabled',
    'form.saved': 'Form saved!',
    'form.loaded': 'Form loaded!',
    
    // Form Preview
    'preview.totalToPay': 'Total to pay:',
    'preview.goToPayment': 'Go to payment',
    'preview.submit': 'Submit',
    'preview.selectOption': 'Select option',
    'preview.enterNumber': 'Enter number',
    'preview.fillFields': 'Fill in the fields below',
    'preview.field': 'Field',
    'preview.select': 'Select',
    'preview.perEach': 'per each',
    'preview.baseAmount': 'Base amount:',
    
    // Completion
    'complete.editMessage': 'Edit message',
    'complete.cancel': 'Cancel',
    'complete.save': 'Save',
    
    // Payment
    'payment.selectMethod': 'Select payment method',
    'payment.blik': 'BLIK',
    'payment.blikDesc': 'Quick payment with code from banking app',
    'payment.card': 'Payment Card',
    'payment.cardDesc': 'Visa, Mastercard, Maestro',
    'payment.bank': 'Bank Transfer',
    'payment.bankDesc': 'Quick transfer from your bank',
    'payment.blikCode': 'BLIK Code',
    'payment.enterBlikCode': 'Enter 6-digit code from your banking app',
    'payment.cardNumber': 'Card Number',
    'payment.expiryDate': 'Expiry Date',
    'payment.selectBank': 'Select your bank',
    'payment.pay': 'Pay',
    'payment.processing': 'Processing...',
    'payment.complete': 'Payment complete!',
    'payment.completeDesc': 'Your payment of',
    'payment.wasProcessed': 'has been processed.',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('ru');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
