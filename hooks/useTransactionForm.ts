
import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { TransactionType, Frequency, Transaction } from '../types';

interface UseTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  editTransaction?: Transaction | null;
}

export const useTransactionForm = ({ isOpen, onClose, editTransaction }: UseTransactionFormProps) => {
  const { categories, wallets, addTransaction, updateTransaction, addRecurringRule, addCategory, deleteTransaction } = useStore();
  
  // Form State
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(''); 
  const [walletId, setWalletId] = useState('');
  const [transferToWalletId, setTransferToWalletId] = useState('');
  
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [isBusiness, setIsBusiness] = useState(true);
  const [autoPay, setAutoPay] = useState(true); 
  
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Initialization Logic
  useEffect(() => {
    if (isOpen) {
      if (editTransaction) {
        setType(editTransaction.type);
        setAmount(editTransaction.amount.toString());
        setDescription(editTransaction.description);
        setCategoryId(editTransaction.categoryId || '');
        setWalletId(editTransaction.walletId);
        setTransferToWalletId(editTransaction.transferToWalletId || '');
        setIsBusiness(editTransaction.isBusiness !== undefined ? editTransaction.isBusiness : true);
        setDate(new Date(editTransaction.date).toISOString().split('T')[0]);
        setIsRecurring(false);
      } else {
        setType('expense');
        setAmount('');
        setDescription('');
        setWalletId(wallets[0]?.id || '');
        setTransferToWalletId(wallets.length > 1 ? wallets[1].id : '');
        setIsBusiness(true);
        setIsRecurring(false);
        setAutoPay(true);
        setDate(new Date().toISOString().split('T')[0]);
      }
      setIsAddingCategory(false);
      setNewCatName('');
    }
  }, [isOpen, editTransaction, wallets]);

  // Category Auto-Select Logic
  useEffect(() => {
    if (!isOpen) return;
    if (editTransaction && editTransaction.type === type && editTransaction.categoryId) return;

    const availableCats = categories.filter(c => c.type === type);
    if (availableCats.length > 0) {
      const isValid = availableCats.some(c => c.id === categoryId);
      if (!isValid) setCategoryId(availableCats[0].id);
    } else {
      setCategoryId('');
    }
  }, [type, categories, isOpen, editTransaction, categoryId]);

  const handleQuickAddCategory = () => {
    if (!newCatName.trim()) return;
    addCategory({
      name: newCatName.trim(),
      type: type,
      icon: 'Tag',
      color: type === 'income' ? 'text-emerald-400' : 'text-slate-400'
    });
    setIsAddingCategory(false);
    setNewCatName('');
  };

  const handleDelete = () => {
    if (editTransaction && confirm('¿Anular esta transacción?')) {
      deleteTransaction(editTransaction.id);
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !walletId || !date) return;
    if (type !== 'transfer' && !categoryId) return;
    if (type === 'transfer' && !transferToWalletId) return;

    const numAmount = parseFloat(amount);
    let finalDesc = description;
    const now = new Date();
    const [y, m, d] = date.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d, now.getHours(), now.getMinutes());
    const finalDateIso = dateObj.toISOString();

    if (!finalDesc) {
      if (type === 'transfer') {
        const fromName = wallets.find(w => w.id === walletId)?.name;
        const toName = wallets.find(w => w.id === transferToWalletId)?.name;
        finalDesc = `Transferencia: ${fromName} -> ${toName}`;
      } else {
        finalDesc = categories.find(c => c.id === categoryId)?.name || 'Transacción';
      }
    }

    const baseTx = {
      amount: numAmount,
      description: finalDesc,
      categoryId: type === 'transfer' ? undefined : categoryId,
      walletId,
      transferToWalletId: type === 'transfer' ? transferToWalletId : undefined,
      type,
      isBusiness: type === 'transfer' ? false : isBusiness
    };

    if (editTransaction) {
      updateTransaction(editTransaction.id, {
        ...baseTx,
        date: finalDateIso,
      });
    } else {
      if (isRecurring) {
        addRecurringRule({
          ...baseTx,
          categoryId: baseTx.categoryId || '',
          nextDueDate: finalDateIso,
          frequency,
          autoPay,
          reminderDays: 2,
          originalDay: d // Use the day from the input date as anchor
        });
      } else {
        addTransaction({
          ...baseTx,
          date: finalDateIso,
        });
      }
    }
    onClose();
  };

  return {
    formState: {
      type, setType, amount, setAmount, description, setDescription,
      categoryId, setCategoryId, date, setDate, walletId, setWalletId,
      transferToWalletId, setTransferToWalletId, isRecurring, setIsRecurring,
      frequency, setFrequency, isBusiness, setIsBusiness, autoPay, setAutoPay,
      isAddingCategory, setIsAddingCategory, newCatName, setNewCatName,
    },
    lists: {
      wallets, categories, filteredCategories: categories.filter(c => c.type === type)
    },
    actions: { handleQuickAddCategory, handleDelete, handleSubmit }
  };
};
