import { useState } from 'react';
import { PaymentMethod, POLISH_BANKS } from '@/types/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Smartphone, Building2, ArrowRight, Check, Loader2 } from 'lucide-react';

interface PaymentSelectorProps {
  amount: number;
  onPaymentComplete: () => void;
}

export function PaymentSelector({ amount, onPaymentComplete }: PaymentSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [blikCode, setBlikCode] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19);
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setIsComplete(true);
    setTimeout(() => {
      onPaymentComplete();
    }, 1500);
  };

  const isPaymentReady = () => {
    if (selectedMethod === 'blik') {
      return blikCode.length === 6;
    }
    if (selectedMethod === 'card') {
      return cardNumber.replace(/\s/g, '').length === 16 && cardExpiry.length === 5 && cardCvv.length === 3;
    }
    if (selectedMethod === 'bank') {
      return selectedBank !== null;
    }
    return false;
  };

  if (isComplete) {
    return (
      <Card variant="form" className="max-w-md mx-auto animate-scale-in">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Płatność zakończona!</h2>
          <p className="text-muted-foreground">
            Twoja płatność na kwotę {amount.toFixed(2)} PLN została zrealizowana.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-slide-up">
      <Card variant="form">
        <CardHeader variant="form">
          <CardTitle className="flex items-center justify-between">
            <span>Wybierz metodę płatności</span>
            <span className="text-2xl font-bold">{amount.toFixed(2)} PLN</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4">
            {/* BLIK Option */}
            <button
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedMethod === 'blik'
                  ? 'border-blik bg-blik/5'
                  : 'border-border hover:border-blik/50'
              }`}
              onClick={() => setSelectedMethod('blik')}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blik/10 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-blik" />
                </div>
                <div>
                  <h3 className="font-semibold">BLIK</h3>
                  <p className="text-sm text-muted-foreground">Szybka płatność kodem z aplikacji bankowej</p>
                </div>
              </div>
            </button>

            {/* Card Option */}
            <button
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedMethod === 'card'
                  ? 'border-card-payment bg-card-payment/5'
                  : 'border-border hover:border-card-payment/50'
              }`}
              onClick={() => setSelectedMethod('card')}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-card-payment/10 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-card-payment" />
                </div>
                <div>
                  <h3 className="font-semibold">Karta płatnicza</h3>
                  <p className="text-sm text-muted-foreground">Visa, Mastercard, Maestro</p>
                </div>
              </div>
            </button>

            {/* Bank Transfer Option */}
            <button
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedMethod === 'bank'
                  ? 'border-bank bg-bank/5'
                  : 'border-border hover:border-bank/50'
              }`}
              onClick={() => setSelectedMethod('bank')}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-bank/10 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-bank" />
                </div>
                <div>
                  <h3 className="font-semibold">Przelew bankowy</h3>
                  <p className="text-sm text-muted-foreground">Szybki przelew z Twojego banku</p>
                </div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* BLIK Input */}
      {selectedMethod === 'blik' && (
        <Card variant="form" className="animate-slide-up">
          <CardContent className="pt-6">
            <Label className="text-base mb-3 block">Kod BLIK</Label>
            <Input
              value={blikCode}
              onChange={(e) => setBlikCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
              placeholder="_ _ _ _ _ _"
              className="text-center text-3xl tracking-[0.5em] font-mono h-16"
              maxLength={6}
            />
            <p className="text-sm text-muted-foreground mt-3 text-center">
              Wprowadź 6-cyfrowy kod z aplikacji bankowej
            </p>
          </CardContent>
        </Card>
      )}

      {/* Card Input */}
      {selectedMethod === 'card' && (
        <Card variant="form" className="animate-slide-up">
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label>Numer karty</Label>
              <Input
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="1234 5678 9012 3456"
                className="mt-1 font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data ważności</Label>
                <Input
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                  placeholder="MM/RR"
                  className="mt-1 font-mono"
                  maxLength={5}
                />
              </div>
              <div>
                <Label>CVV</Label>
                <Input
                  type="password"
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 3))}
                  placeholder="•••"
                  className="mt-1 font-mono"
                  maxLength={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bank Selection */}
      {selectedMethod === 'bank' && (
        <Card variant="form" className="animate-slide-up">
          <CardContent className="pt-6">
            <Label className="text-base mb-3 block">Wybierz swój bank</Label>
            <div className="grid grid-cols-2 gap-3">
              {POLISH_BANKS.map((bank) => (
                <button
                  key={bank.id}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedBank === bank.id
                      ? 'border-bank bg-bank/5'
                      : 'border-border hover:border-bank/30'
                  }`}
                  onClick={() => setSelectedBank(bank.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{bank.logo}</span>
                    <span className="font-medium text-sm">{bank.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pay Button */}
      {selectedMethod && (
        <Button
          size="xl"
          className="w-full animate-slide-up"
          variant={
            selectedMethod === 'blik'
              ? 'blik'
              : selectedMethod === 'card'
              ? 'cardPayment'
              : 'bank'
          }
          disabled={!isPaymentReady() || isProcessing}
          onClick={handlePayment}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Przetwarzanie...
            </>
          ) : (
            <>
              Zapłać {amount.toFixed(2)} PLN
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>
      )}
    </div>
  );
}
